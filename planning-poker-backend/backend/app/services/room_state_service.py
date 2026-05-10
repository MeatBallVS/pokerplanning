from collections import Counter
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models import Room, RoomParticipant, Vote, VotingResult, VotingRound
from app.models.enums import VotingRoundStatus
from app.schemas.room import (
    DeckPresetResponse,
    HistoryItemResponse,
    ParticipantResponse,
    RoomMetaResponse,
    RoomSnapshotResponse,
    RoundStateResponse,
    RoundVoteResponse,
    TaskResponse,
)


class RoomStateService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def _get_room(self, room_id: UUID) -> Room:
        room = self.db.scalar(
            select(Room)
            .where(Room.id == room_id)
            .execution_options(populate_existing=True)
            .options(
                selectinload(Room.deck_preset),
                selectinload(Room.participants).selectinload(RoomParticipant.user),
                selectinload(Room.tasks),
                selectinload(Room.current_task),
                selectinload(Room.invitation_links),
                selectinload(Room.voting_rounds)
                .selectinload(VotingRound.votes)
                .selectinload(Vote.participant)
                .selectinload(RoomParticipant.user),
                selectinload(Room.voting_rounds).selectinload(VotingRound.task),
                selectinload(Room.voting_rounds).selectinload(VotingRound.result),
            )
        )
        if room is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")
        return room

    def _analyze_round(self, voting_round: VotingRound) -> tuple[dict[str, int], float | None, bool, str | None]:
        values = [vote.value for vote in voting_round.votes]
        if not values:
            return {}, None, False, None

        distribution = dict(Counter(values))
        numeric_votes = [float(value) for value in values if value.isdigit()]
        average_score = round(sum(numeric_votes) / len(numeric_votes), 1) if numeric_votes else None
        consensus = len(set(values)) == 1

        suggested_result: str | None
        if consensus:
            suggested_result = values[0]
        elif average_score is not None:
            numeric_deck = sorted({int(value) for value in values if value.isdigit()})
            suggested_result = str(min(numeric_deck, key=lambda value: abs(value - average_score))) if numeric_deck else None
        else:
            suggested_result = max(distribution.items(), key=lambda item: item[1])[0]

        return distribution, average_score, consensus, suggested_result

    def build_snapshot(
        self,
        room_id: UUID,
        online_participant_ids: set[UUID] | None = None,
        viewer_participant_id: UUID | None = None,
    ) -> RoomSnapshotResponse:
        online_participant_ids = online_participant_ids or set()
        room = self._get_room(room_id)

        active_invitation = next(
            (invitation for invitation in sorted(room.invitation_links, key=lambda item: item.created_at, reverse=True) if invitation.is_active),
            None,
        )
        invite_link = (
            f"{self.settings.frontend_url.rstrip('/')}/invite/{active_invitation.token}" if active_invitation else None
        )

        active_round = next(
            (
                voting_round
                for voting_round in sorted(room.voting_rounds, key=lambda item: item.started_at, reverse=True)
                if voting_round.status in {VotingRoundStatus.VOTING, VotingRoundStatus.REVEALED}
            ),
            None,
        )

        distribution: dict[str, int] = {}
        average_score: float | None = None
        consensus = False
        suggested_result: str | None = None
        if active_round is not None:
            distribution, average_score, consensus, suggested_result = self._analyze_round(active_round)

        vote_by_participant_id = {
            vote.participant_id: vote
            for vote in (active_round.votes if active_round is not None else [])
        }

        participants = [
            ParticipantResponse(
                id=participant.id,
                user_id=participant.user_id,
                name=participant.user.name,
                email=participant.user.email,
                avatar_color=participant.user.avatar_color,
                role=participant.role,
                seat_index=participant.seat_index,
                joined_at=participant.joined_at,
                last_seen_at=participant.last_seen_at,
                is_online=participant.id in online_participant_ids,
                has_voted=participant.id in vote_by_participant_id,
            )
            for participant in sorted(room.participants, key=lambda item: item.seat_index)
        ]

        round_state = None
        if active_round is not None:
            round_state = RoundStateResponse(
                id=active_round.id,
                task_id=active_round.task_id,
                round_index=active_round.round_index,
                status=active_round.status,
                started_at=active_round.started_at,
                revealed_at=active_round.revealed_at,
                closed_at=active_round.closed_at,
                votes_submitted=len(active_round.votes),
                total_participants=len(room.participants),
                can_reveal=len(active_round.votes) > 0,
                suggested_result=suggested_result,
                average_score=average_score,
                consensus=consensus,
                distribution=distribution if active_round.status == VotingRoundStatus.REVEALED else {},
                self_vote_value=vote_by_participant_id.get(viewer_participant_id).value
                if viewer_participant_id in vote_by_participant_id
                else None,
                votes=[
                    RoundVoteResponse(
                        participant_id=participant.id,
                        user_id=participant.user_id,
                        value=vote_by_participant_id.get(participant.id).value
                        if active_round.status == VotingRoundStatus.REVEALED and participant.id in vote_by_participant_id
                        else None,
                        has_voted=participant.id in vote_by_participant_id,
                    )
                    for participant in sorted(room.participants, key=lambda item: item.seat_index)
                ],
            )

        history_items: list[HistoryItemResponse] = []
        finalized_rounds = [
            round_item
            for round_item in room.voting_rounds
            if round_item.result is not None and round_item.status == VotingRoundStatus.FINALIZED
        ]
        for round_item in sorted(finalized_rounds, key=lambda item: item.result.created_at, reverse=True)[:20]:
            result: VotingResult = round_item.result
            history_items.append(
                HistoryItemResponse(
                    id=result.id,
                    round_id=round_item.id,
                    task_id=result.task_id,
                    task_title=round_item.task.title,
                    result_value=result.result_value,
                    average_score=result.average_score,
                    consensus=result.consensus,
                    votes_count=result.votes_count,
                    distribution=result.distribution,
                    created_at=result.created_at,
                )
            )

        return RoomSnapshotResponse(
            room=RoomMetaResponse(
                id=room.id,
                name=room.name,
                slug=room.slug,
                description=room.description,
                status=room.status.value,
                owner_id=room.owner_id,
                current_task_id=room.current_task_id,
                invite_link=invite_link,
                created_at=room.created_at,
                updated_at=room.updated_at,
                deck=DeckPresetResponse.model_validate(room.deck_preset),
            ),
            self_participant_id=viewer_participant_id,
            participants=participants,
            tasks=[
                TaskResponse.model_validate(task)
                for task in sorted(room.tasks, key=lambda item: (item.position, item.created_at))
            ],
            active_round=round_state,
            history=history_items,
        )
