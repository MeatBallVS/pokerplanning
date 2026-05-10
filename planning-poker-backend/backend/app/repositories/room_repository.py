from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import DeckPreset, InvitationLink, Room, RoomParticipant, Task, Vote, VotingRound
from app.models.enums import TaskStatus


class RoomRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_decks(self) -> list[DeckPreset]:
        return list(self.db.scalars(select(DeckPreset).order_by(DeckPreset.name)).all())

    def get_deck_by_code(self, code: str) -> DeckPreset | None:
        return self.db.scalar(select(DeckPreset).where(DeckPreset.code == code))

    def get_room(self, room_id: UUID) -> Room | None:
        return self.db.scalar(
            select(Room)
            .where(Room.id == room_id)
            .execution_options(populate_existing=True)
            .options(
                selectinload(Room.deck_preset),
                selectinload(Room.current_task),
                selectinload(Room.participants).selectinload(RoomParticipant.user),
                selectinload(Room.tasks),
                selectinload(Room.invitation_links),
            )
        )

    def get_room_for_user(self, room_id: UUID, user_id: UUID) -> Room | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        participant_user_ids = {participant.user_id for participant in room.participants}
        return room if user_id in participant_user_ids else None

    def list_rooms_for_user(self, user_id: UUID) -> list[Room]:
        return list(
            self.db.scalars(
                select(Room)
                .join(RoomParticipant, RoomParticipant.room_id == Room.id)
                .where(RoomParticipant.user_id == user_id)
                .options(
                    selectinload(Room.current_task),
                    selectinload(Room.participants),
                    selectinload(Room.invitation_links),
                )
                .order_by(Room.updated_at.desc())
            ).all()
        )

    def create_room(self, **data) -> Room:
        room = Room(**data)
        self.db.add(room)
        self.db.flush()
        return room

    def save_room(self, room: Room) -> Room:
        self.db.add(room)
        self.db.flush()
        return room

    def delete_room(self, room: Room) -> None:
        self.db.delete(room)
        self.db.flush()

    def create_participant(self, **data) -> RoomParticipant:
        participant = RoomParticipant(**data)
        self.db.add(participant)
        self.db.flush()
        return participant

    def get_participant(self, room_id: UUID, user_id: UUID) -> RoomParticipant | None:
        return self.db.scalar(
            select(RoomParticipant)
            .where(RoomParticipant.room_id == room_id, RoomParticipant.user_id == user_id)
            .options(selectinload(RoomParticipant.user))
        )

    def get_participant_by_id(self, room_id: UUID, participant_id: UUID) -> RoomParticipant | None:
        return self.db.scalar(
            select(RoomParticipant)
            .where(RoomParticipant.room_id == room_id, RoomParticipant.id == participant_id)
            .options(selectinload(RoomParticipant.user))
        )

    def delete_participant(self, participant: RoomParticipant) -> None:
        self.db.delete(participant)
        self.db.flush()

    def participant_has_votes(self, participant_id: UUID) -> bool:
        votes_count = self.db.scalar(select(func.count(Vote.id)).where(Vote.participant_id == participant_id)) or 0
        return bool(votes_count)

    def get_participant_count(self, room_id: UUID) -> int:
        return int(
            self.db.scalar(select(func.count(RoomParticipant.id)).where(RoomParticipant.room_id == room_id)) or 0
        )

    def touch_participant(self, participant: RoomParticipant) -> RoomParticipant:
        participant.last_seen_at = datetime.now(UTC)
        self.db.add(participant)
        self.db.flush()
        return participant

    def touch_room(self, room: Room) -> Room:
        room.updated_at = datetime.now(UTC)
        self.db.flush()
        return room

    def get_task(self, room_id: UUID, task_id: UUID) -> Task | None:
        return self.db.scalar(select(Task).where(Task.room_id == room_id, Task.id == task_id))

    def get_next_task_position(self, room_id: UUID) -> int:
        highest_position = self.db.scalar(select(func.max(Task.position)).where(Task.room_id == room_id))
        return int(highest_position if highest_position is not None else -1) + 1

    def create_task(self, **data) -> Task:
        task = Task(**data)
        self.db.add(task)
        self.db.flush()
        return task

    def list_tasks(self, room_id: UUID) -> list[Task]:
        return list(
            self.db.scalars(select(Task).where(Task.room_id == room_id).order_by(Task.position, Task.created_at)).all()
        )

    def task_has_rounds(self, task_id: UUID) -> bool:
        return bool(self.db.scalar(select(func.count(VotingRound.id)).where(VotingRound.task_id == task_id)))

    def create_invitation(self, **data) -> InvitationLink:
        invitation = InvitationLink(**data)
        self.db.add(invitation)
        self.db.flush()
        return invitation

    def get_latest_active_invitation(self, room_id: UUID) -> InvitationLink | None:
        return self.db.scalar(
            select(InvitationLink)
            .where(InvitationLink.room_id == room_id, InvitationLink.is_active.is_(True))
            .order_by(InvitationLink.created_at.desc())
        )

    def get_invitation_by_token(self, token: str) -> InvitationLink | None:
        return self.db.scalar(
            select(InvitationLink)
            .where(InvitationLink.token == token)
            .options(selectinload(InvitationLink.room).selectinload(Room.participants))
        )

    def reset_active_task_flags(self, room: Room, selected_task_id: UUID) -> None:
        for task in room.tasks:
            if task.id == selected_task_id:
                task.status = TaskStatus.ACTIVE
            elif task.status == TaskStatus.ACTIVE:
                task.status = TaskStatus.BACKLOG
            self.db.add(task)
        room.current_task_id = selected_task_id
        self.touch_room(room)

