from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models import User
from app.schemas.room import FinalizeRoundRequest, RoundStartRequest, RoomSnapshotResponse, VoteSubmitRequest
from app.services.room_service import RoomService
from app.services.room_state_service import RoomStateService
from app.services.voting_service import VotingService
from app.websocket.manager import room_connection_manager

router = APIRouter(prefix="/rooms/{room_id}/rounds", tags=["voting"])


@router.post("/start", response_model=RoomSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def start_round(
    room_id: UUID,
    payload: RoundStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    VotingService(db).start_round(room_id, payload.task_id, current_user)
    participant = RoomService(db).require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "round.started")
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.post("/{round_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def submit_vote(
    room_id: UUID,
    round_id: UUID,
    payload: VoteSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    VotingService(db).submit_vote(room_id, round_id, payload.value, current_user)
    await room_connection_manager.broadcast_snapshot(room_id, "vote.submitted")


@router.post("/{round_id}/reveal", response_model=RoomSnapshotResponse)
async def reveal_round(
    room_id: UUID,
    round_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    VotingService(db).reveal_round(room_id, round_id, current_user)
    participant = RoomService(db).require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "round.revealed")
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.post("/{round_id}/reset", response_model=RoomSnapshotResponse)
async def reset_round(
    room_id: UUID,
    round_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    VotingService(db).reset_round(room_id, round_id, current_user)
    participant = RoomService(db).require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "round.reset")
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.post("/{round_id}/finalize", response_model=RoomSnapshotResponse)
async def finalize_round(
    room_id: UUID,
    round_id: UUID,
    payload: FinalizeRoundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    VotingService(db).finalize_round(room_id, round_id, payload.result_value, current_user)
    participant = RoomService(db).require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "round.finalized")
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )
