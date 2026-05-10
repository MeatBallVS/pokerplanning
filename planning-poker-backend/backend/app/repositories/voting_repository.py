from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import RoomParticipant, Vote, VotingResult, VotingRound
from app.models.enums import VotingRoundStatus


class VotingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_round(self, room_id: UUID) -> VotingRound | None:
        return self.db.scalar(
            select(VotingRound)
            .where(
                VotingRound.room_id == room_id,
                VotingRound.status.in_([VotingRoundStatus.VOTING, VotingRoundStatus.REVEALED]),
            )
            .options(
                selectinload(VotingRound.votes).selectinload(Vote.participant).selectinload(RoomParticipant.user),
                selectinload(VotingRound.task),
                selectinload(VotingRound.result),
            )
            .order_by(VotingRound.started_at.desc())
        )

    def get_round(self, room_id: UUID, round_id: UUID) -> VotingRound | None:
        return self.db.scalar(
            select(VotingRound)
            .where(VotingRound.room_id == room_id, VotingRound.id == round_id)
            .options(
                selectinload(VotingRound.votes).selectinload(Vote.participant).selectinload(RoomParticipant.user),
                selectinload(VotingRound.task),
                selectinload(VotingRound.result),
            )
        )

    def get_next_round_index(self, task_id: UUID) -> int:
        current_value = self.db.scalar(select(func.max(VotingRound.round_index)).where(VotingRound.task_id == task_id))
        return int(current_value or 0) + 1

    def create_round(self, **data) -> VotingRound:
        voting_round = VotingRound(**data)
        self.db.add(voting_round)
        self.db.flush()
        return voting_round

    def get_vote(self, round_id: UUID, participant_id: UUID) -> Vote | None:
        return self.db.scalar(select(Vote).where(Vote.round_id == round_id, Vote.participant_id == participant_id))

    def upsert_vote(self, round_id: UUID, participant_id: UUID, value: str) -> Vote:
        vote = self.get_vote(round_id, participant_id)
        if vote is None:
            vote = Vote(round_id=round_id, participant_id=participant_id, value=value)
            self.db.add(vote)
        else:
            vote.value = value
            self.db.add(vote)
        self.db.flush()
        return vote

    def create_result(self, **data) -> VotingResult:
        result = VotingResult(**data)
        self.db.add(result)
        self.db.flush()
        return result
