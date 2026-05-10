import re
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Room, RoomParticipant, User
from app.models.enums import RoomRole, RoomStatus, TaskStatus
from app.repositories.room_repository import RoomRepository
from app.repositories.voting_repository import VotingRepository
from app.schemas.room import (
    DeckPresetResponse,
    InvitationCreateRequest,
    InvitationLinkResponse,
    RoomCreateRequest,
    RoomListItemResponse,
    RoomUpdateRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
)


class RoomService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.rooms = RoomRepository(db)
        self.voting = VotingRepository(db)

    def list_decks(self) -> list[DeckPresetResponse]:
        return [DeckPresetResponse.model_validate(deck) for deck in self.rooms.list_decks()]

    def _slugify(self, value: str) -> str:
        normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
        base = normalized or "team-room"
        return f"{base}-{secrets.token_hex(3)}"

    def _build_invitation_response(self, invitation) -> InvitationLinkResponse:
        return InvitationLinkResponse(
            id=invitation.id,
            token=invitation.token,
            url=f"{self.settings.frontend_url.rstrip('/')}/invite/{invitation.token}",
            expires_at=invitation.expires_at,
            is_active=invitation.is_active,
            created_at=invitation.created_at,
        )

    def require_room_access(self, room_id: UUID, user: User) -> tuple[Room, RoomParticipant]:
        room = self.rooms.get_room_for_user(room_id, user.id)
        if room is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")

        participant = self.rooms.get_participant(room_id, user.id)
        if participant is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Вы не состоите в этой комнате")

        return room, participant

    def require_owner(self, room_id: UUID, user: User) -> tuple[Room, RoomParticipant]:
        room, participant = self.require_room_access(room_id, user)
        if participant.role != RoomRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только ведущий может выполнять это действие",
            )
        return room, participant

    def create_room(self, payload: RoomCreateRequest, user: User):
        deck = self.rooms.get_deck_by_code(payload.deck_preset_code)
        if deck is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Колода не найдена")

        room = self.rooms.create_room(
            name=payload.name.strip(),
            slug=self._slugify(payload.name),
            description=payload.description.strip(),
            status=RoomStatus.ACTIVE,
            owner_id=user.id,
            deck_preset_id=deck.id,
        )
        participant = self.rooms.create_participant(
            room_id=room.id,
            user_id=user.id,
            role=RoomRole.OWNER,
            seat_index=0,
        )
        invitation = self.rooms.create_invitation(
            room_id=room.id,
            created_by_id=user.id,
            token=secrets.token_urlsafe(24),
            is_active=True,
            expires_at=datetime.now(UTC) + timedelta(hours=72),
        )
        self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(room)
        self.db.refresh(participant)
        return room, participant, self._build_invitation_response(invitation)

    def list_rooms_for_user(self, user: User) -> list[RoomListItemResponse]:
        rooms = self.rooms.list_rooms_for_user(user.id)
        result: list[RoomListItemResponse] = []
        for room in rooms:
            invitation = next(
                (
                    link
                    for link in sorted(room.invitation_links, key=lambda item: item.created_at, reverse=True)
                    if link.is_active
                ),
                None,
            )
            viewer_participant = next(
                (participant for participant in room.participants if participant.user_id == user.id),
                None,
            )
            result.append(
                RoomListItemResponse(
                    id=room.id,
                    name=room.name,
                    slug=room.slug,
                    description=room.description,
                    invite_link=f"{self.settings.frontend_url.rstrip('/')}/invite/{invitation.token}" if invitation else None,
                    participants_count=len(room.participants),
                    active_task_title=room.current_task.title if room.current_task else None,
                    last_activity_at=room.updated_at,
                    created_at=room.created_at,
                    owner_id=room.owner_id,
                    viewer_role=viewer_participant.role if viewer_participant else RoomRole.MEMBER,
                )
            )
        return result

    def update_room(self, room_id: UUID, payload: RoomUpdateRequest, user: User) -> Room:
        room, _ = self.require_owner(room_id, user)

        if payload.name is not None:
            room.name = payload.name.strip()

        if payload.description is not None:
            room.description = payload.description.strip()

        self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(room)
        return room

    def delete_room(self, room_id: UUID, user: User) -> None:
        room, _ = self.require_owner(room_id, user)
        room.current_task_id = None
        self.rooms.save_room(room)
        self.rooms.delete_room(room)
        self.db.commit()

    def transfer_owner(self, room_id: UUID, participant_id: UUID, user: User) -> Room:
        room, owner_participant = self.require_owner(room_id, user)
        new_owner = self.rooms.get_participant_by_id(room_id, participant_id)

        if new_owner is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Участник не найден")

        if new_owner.id == owner_participant.id or new_owner.role == RoomRole.OWNER:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Этого участника нельзя назначить ведущим")

        owner_participant.role = RoomRole.MEMBER
        new_owner.role = RoomRole.OWNER
        room.owner_id = new_owner.user_id

        self.db.add(owner_participant)
        self.db.add(new_owner)
        self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(room)
        return room

    def leave_room(self, room_id: UUID, user: User) -> None:
        room, participant = self.require_room_access(room_id, user)

        if participant.role == RoomRole.OWNER:
            other_participants = [item for item in room.participants if item.id != participant.id]
            if other_participants:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Сначала передайте роль ведущего другому участнику",
                )

            room.current_task_id = None
            self.rooms.save_room(room)
            self.rooms.delete_room(room)
            self.db.commit()
            return

        if self.voting.get_active_round(room_id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Нельзя покинуть комнату во время активного раунда",
            )

        if self.rooms.participant_has_votes(participant.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Нельзя покинуть комнату, если у вас уже есть история голосований",
            )

        self.rooms.delete_participant(participant)
        self.rooms.touch_room(room)
        self.db.commit()

    def create_invitation(self, room_id: UUID, payload: InvitationCreateRequest, user: User) -> InvitationLinkResponse:
        self.require_owner(room_id, user)
        invitation = self.rooms.create_invitation(
            room_id=room_id,
            created_by_id=user.id,
            token=secrets.token_urlsafe(24),
            is_active=True,
            expires_at=datetime.now(UTC) + timedelta(hours=payload.expires_in_hours) if payload.expires_in_hours else None,
        )
        room = self.rooms.get_room(room_id)
        if room is not None:
            self.rooms.touch_room(room)
        self.db.commit()
        return self._build_invitation_response(invitation)

    def join_by_invitation(self, token: str, user: User) -> tuple[Room, RoomParticipant]:
        invitation = self.rooms.get_invitation_by_token(token)
        if invitation is None or not invitation.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Приглашение не найдено")
        if invitation.expires_at and invitation.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Срок действия приглашения истек")

        room = invitation.room
        participant = self.rooms.get_participant(room.id, user.id)
        if participant is None:
            seat_index = self.rooms.get_participant_count(room.id)
            participant = self.rooms.create_participant(
                room_id=room.id,
                user_id=user.id,
                role=RoomRole.MEMBER,
                seat_index=seat_index,
            )
        self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(participant)
        return room, participant

    def remove_participant(self, room_id: UUID, participant_id: UUID, user: User) -> None:
        room, owner_participant = self.require_owner(room_id, user)
        participant = self.rooms.get_participant_by_id(room_id, participant_id)
        if participant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Участник не найден")
        if participant.id == owner_participant.id or participant.role == RoomRole.OWNER:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Нельзя удалить ведущего комнаты")
        if self.voting.get_active_round(room_id) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Нельзя удалить участника во время активного раунда")
        if self.rooms.participant_has_votes(participant.id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Нельзя удалить участника с историей голосований")

        self.rooms.delete_participant(participant)
        self.rooms.touch_room(room)
        self.db.commit()

    def create_task(self, room_id: UUID, payload: TaskCreateRequest, user: User):
        room, _ = self.require_owner(room_id, user)
        position = payload.position if payload.position is not None else self.rooms.get_next_task_position(room_id)
        task = self.rooms.create_task(
            room_id=room.id,
            created_by_id=user.id,
            title=payload.title.strip(),
            description=payload.description.strip(),
            position=position,
            status=TaskStatus.BACKLOG,
        )
        self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update_task(self, room_id: UUID, task_id: UUID, payload: TaskUpdateRequest, user: User):
        _, _ = self.require_owner(room_id, user)
        task = self.rooms.get_task(room_id, task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")

        for field in ("title", "description", "position"):
            value = getattr(payload, field)
            if value is not None:
                setattr(task, field, value.strip() if isinstance(value, str) else value)

        self.db.add(task)
        room = self.rooms.get_room(room_id)
        if room is not None:
            self.rooms.touch_room(room)
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete_task(self, room_id: UUID, task_id: UUID, user: User) -> None:
        room, _ = self.require_owner(room_id, user)
        task = self.rooms.get_task(room_id, task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
        if self.voting.get_active_round(room_id) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Нельзя удалить задачу во время активного раунда")
        if self.rooms.task_has_rounds(task_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="У задачи уже есть история оценок, поэтому удалить ее нельзя",
            )

        if room.current_task_id == task.id:
            room.current_task_id = None
        self.db.delete(task)
        self.rooms.touch_room(room)
        self.db.commit()

    def select_task(self, room_id: UUID, task_id: UUID, user: User) -> None:
        room, _ = self.require_owner(room_id, user)
        task = self.rooms.get_task(room_id, task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена")
        if self.voting.get_active_round(room_id) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Нельзя менять активную задачу во время раунда")
        self.rooms.reset_active_task_flags(room, task_id)
        self.db.commit()

    def touch_presence(self, room_id: UUID, user_id: UUID) -> RoomParticipant:
        participant = self.rooms.get_participant(room_id, user_id)
        if participant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Участник не найден")
        participant = self.rooms.touch_participant(participant)
        self.db.commit()
        self.db.refresh(participant)
        return participant
