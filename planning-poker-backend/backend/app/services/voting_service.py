from collections import Counter
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Task, User, VotingRound
from app.models.enums import TaskStatus, VotingRoundStatus
from app.repositories.room_repository import RoomRepository
from app.repositories.voting_repository import VotingRepository


class VotingService:
    def __init__(self, db: Session):
        self.db = db
        self.rooms = RoomRepository(db)
        self.voting = VotingRepository(db)

    def _ensure_owner(self, room_id: UUID, user: User):
        participant = self.rooms.get_participant(room_id, user.id)
        if participant is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к комнате")
        if participant.role.value != "owner":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Это действие доступно только владельцу комнаты")
        return participant

    def _resolve_task(self, room_id: UUID, task_id: UUID | None) -> Task:
        room = self.rooms.get_room(room_id)
        if room is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")
        resolved_task_id = task_id or room.current_task_id
        if resolved_task_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Сначала выберите активную задачу")
        task = self.rooms.get_task(room_id, resolved_task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
        if room.current_task_id != task.id:
            self.rooms.reset_active_task_flags(room, task.id)
        return task

    def start_round(self, room_id: UUID, task_id: UUID | None, user: User) -> VotingRound:
        self._ensure_owner(room_id, user)
        existing_round = self.voting.get_active_round(room_id)
        if existing_round is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="В комнате уже есть активный раунд")

        task = self._resolve_task(room_id, task_id)
        room = self.rooms.get_room(room_id)
        if room is not None:
            self.rooms.touch_room(room)
        round_index = self.voting.get_next_round_index(task.id)
        voting_round = self.voting.create_round(
            room_id=room_id,
            task_id=task.id,
            started_by_id=user.id,
            round_index=round_index,
            status=VotingRoundStatus.VOTING,
            started_at=datetime.now(UTC),
            revealed_at=None,
            closed_at=None,
        )
        self.db.commit()
        self.db.refresh(voting_round)
        return voting_round

    def submit_vote(self, room_id: UUID, round_id: UUID, value: str, user: User) -> None:
        room = self.rooms.get_room(room_id)
        if room is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")
        voting_round = self.voting.get_round(room_id, round_id)
        if voting_round is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Раунд не найден")
        if voting_round.status != VotingRoundStatus.VOTING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Голосование в этом раунде уже закрыто")

        if value not in room.deck_preset.cards:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Такой карты нет в выбранной колоде")

        participant = self.rooms.get_participant(room_id, user.id)
        if participant is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к комнате")

        self.voting.upsert_vote(round_id=round_id, participant_id=participant.id, value=value)
        self.rooms.touch_room(room)
        self.db.commit()

    def reveal_round(self, room_id: UUID, round_id: UUID, user: User) -> VotingRound:
        self._ensure_owner(room_id, user)
        voting_round = self.voting.get_round(room_id, round_id)
        if voting_round is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Раунд не найден")
        if voting_round.status != VotingRoundStatus.VOTING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Этот раунд нельзя раскрыть")
        if not voting_round.votes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Для раскрытия нужен хотя бы один голос")

        voting_round.status = VotingRoundStatus.REVEALED
        voting_round.revealed_at = datetime.now(UTC)
        self.db.add(voting_round)
        room = self.rooms.get_room(room_id)
        if room is not None:
            self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(voting_round)
        return voting_round

    def reset_round(self, room_id: UUID, round_id: UUID, user: User) -> VotingRound:
        self._ensure_owner(room_id, user)
        voting_round = self.voting.get_round(room_id, round_id)
        if voting_round is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Раунд не найден")
        if voting_round.status not in {VotingRoundStatus.VOTING, VotingRoundStatus.REVEALED}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Этот раунд нельзя сбросить")

        voting_round.status = VotingRoundStatus.CANCELLED
        voting_round.closed_at = datetime.now(UTC)
        self.db.add(voting_round)

        fresh_round = self.voting.create_round(
            room_id=voting_round.room_id,
            task_id=voting_round.task_id,
            started_by_id=user.id,
            round_index=self.voting.get_next_round_index(voting_round.task_id),
            status=VotingRoundStatus.VOTING,
            started_at=datetime.now(UTC),
            revealed_at=None,
            closed_at=None,
        )
        room = self.rooms.get_room(room_id)
        if room is not None:
            self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(fresh_round)
        return fresh_round

    def _analyze_votes(self, voting_round: VotingRound) -> tuple[dict[str, int], float | None, bool, str | None]:
        values = [vote.value for vote in voting_round.votes]
        distribution = dict(Counter(values))
        if not values:
            return distribution, None, False, None

        numeric_votes = [float(value) for value in values if value.isdigit()]
        average_score = round(sum(numeric_votes) / len(numeric_votes), 1) if numeric_votes else None
        consensus = len(set(values)) == 1
        if consensus:
            suggested = values[0]
        elif average_score is not None:
            allowed_numeric = sorted(int(card) for card in {vote.value for vote in voting_round.votes if vote.value.isdigit()})
            suggested = str(min(allowed_numeric, key=lambda candidate: abs(candidate - average_score))) if allowed_numeric else None
        else:
            suggested = max(distribution.items(), key=lambda item: item[1])[0]
        return distribution, average_score, consensus, suggested

    def finalize_round(self, room_id: UUID, round_id: UUID, result_value: str | None, user: User) -> None:
        self._ensure_owner(room_id, user)
        voting_round = self.voting.get_round(room_id, round_id)
        if voting_round is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Раунд не найден")
        if voting_round.status != VotingRoundStatus.REVEALED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Сначала раскройте карты, затем сохраняйте результат")
        if voting_round.result is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Результат этого раунда уже сохранён")

        room = self.rooms.get_room(room_id)
        if room is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")

        distribution, average_score, consensus, suggested = self._analyze_votes(voting_round)
        final_value = result_value or suggested
        if final_value is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось определить итоговый результат")
        if final_value not in room.deck_preset.cards:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Итоговая оценка отсутствует в выбранной колоде")

        self.voting.create_result(
            round_id=voting_round.id,
            task_id=voting_round.task_id,
            finalized_by_id=user.id,
            result_value=final_value,
            average_score=average_score,
            consensus=consensus,
            votes_count=len(voting_round.votes),
            distribution=distribution,
        )

        task = self.rooms.get_task(room_id, voting_round.task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
        task.estimate_value = final_value
        task.estimated_at = datetime.now(UTC)
        task.status = TaskStatus.ESTIMATED
        self.db.add(task)

        voting_round.status = VotingRoundStatus.FINALIZED
        voting_round.closed_at = datetime.now(UTC)
        self.db.add(voting_round)
        self.rooms.touch_room(room)
        self.db.commit()
