from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models import User
from app.schemas.room import (
    DeckPresetResponse,
    InvitationCreateRequest,
    InvitationLinkResponse,
    RoomCreateRequest,
    RoomListItemResponse,
    RoomSnapshotResponse,
    RoomUpdateRequest,
    TaskCreateRequest,
    TaskResponse,
    TaskSelectionRequest,
    TaskUpdateRequest,
    TransferOwnerRequest,
)
from app.services.room_service import RoomService
from app.services.room_state_service import RoomStateService
from app.websocket.manager import room_connection_manager

router = APIRouter(prefix="/rooms", tags=["rooms"])
invitation_router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.get("/deck-presets", response_model=list[DeckPresetResponse])
def list_decks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[DeckPresetResponse]:
    return RoomService(db).list_decks()


@router.get("", response_model=list[RoomListItemResponse])
def list_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[RoomListItemResponse]:
    return RoomService(db).list_rooms_for_user(current_user)


@router.post("", response_model=RoomSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    room, participant, _ = RoomService(db).create_room(payload, current_user)
    return RoomStateService(db).build_snapshot(room.id, viewer_participant_id=participant.id)


@router.get("/{room_id}", response_model=RoomSnapshotResponse)
def get_room(room_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> RoomSnapshotResponse:
    _, participant = RoomService(db).require_room_access(room_id, current_user)
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.patch("/{room_id}", response_model=RoomSnapshotResponse)
async def update_room(
    room_id: UUID,
    payload: RoomUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    service = RoomService(db)
    service.update_room(room_id, payload, current_user)
    participant = service.require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "room.updated", {"reason": "room_updated"})
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    RoomService(db).delete_room(room_id, current_user)


@router.post("/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(
    room_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    service = RoomService(db)
    room, participant = service.require_room_access(room_id, current_user)
    should_broadcast = not (participant.role.value == "owner" and len(room.participants) <= 1)
    service.leave_room(room_id, current_user)
    if should_broadcast:
        await room_connection_manager.broadcast_snapshot(room_id, "room.updated", {"reason": "participant_left"})


@router.post("/{room_id}/transfer-owner", response_model=RoomSnapshotResponse)
async def transfer_owner(
    room_id: UUID,
    payload: TransferOwnerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    service = RoomService(db)
    service.transfer_owner(room_id, payload.participant_id, current_user)
    participant = service.require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "room.updated", {"reason": "owner_transferred"})
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.post("/{room_id}/invite-links", response_model=InvitationLinkResponse, status_code=status.HTTP_201_CREATED)
def create_invite_link(
    room_id: UUID,
    payload: InvitationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvitationLinkResponse:
    return RoomService(db).create_invitation(room_id, payload, current_user)


@invitation_router.post("/{token}/join", response_model=RoomSnapshotResponse)
async def join_room_by_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    room, participant = RoomService(db).join_by_invitation(token, current_user)
    await room_connection_manager.broadcast_snapshot(room.id, "room.updated", {"reason": "participant_joined"})
    return RoomStateService(db).build_snapshot(
        room.id,
        online_participant_ids=room_connection_manager.online_participant_ids(room.id),
        viewer_participant_id=participant.id,
    )


@router.delete("/{room_id}/participants/{participant_id}", response_model=RoomSnapshotResponse)
async def remove_participant(
    room_id: UUID,
    participant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomSnapshotResponse:
    service = RoomService(db)
    service.remove_participant(room_id, participant_id, current_user)
    participant = service.require_room_access(room_id, current_user)[1]
    await room_connection_manager.broadcast_snapshot(room_id, "room.updated", {"reason": "participant_removed"})
    return RoomStateService(db).build_snapshot(
        room_id,
        online_participant_ids=room_connection_manager.online_participant_ids(room_id),
        viewer_participant_id=participant.id,
    )


@router.post("/{room_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    room_id: UUID,
    payload: TaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    task = RoomService(db).create_task(room_id, payload, current_user)
    await room_connection_manager.broadcast_snapshot(room_id, "task.updated", {"reason": "task_created"})
    return TaskResponse.model_validate(task)


@router.patch("/{room_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    room_id: UUID,
    task_id: UUID,
    payload: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    task = RoomService(db).update_task(room_id, task_id, payload, current_user)
    await room_connection_manager.broadcast_snapshot(room_id, "task.updated", {"reason": "task_updated"})
    return TaskResponse.model_validate(task)


@router.delete("/{room_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    room_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    RoomService(db).delete_task(room_id, task_id, current_user)
    await room_connection_manager.broadcast_snapshot(room_id, "task.updated", {"reason": "task_deleted"})


@router.post("/{room_id}/tasks/select", status_code=status.HTTP_204_NO_CONTENT)
async def select_task(
    room_id: UUID,
    payload: TaskSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    RoomService(db).select_task(room_id, payload.task_id, current_user)
    await room_connection_manager.broadcast_snapshot(room_id, "task.updated", {"reason": "task_selected"})
