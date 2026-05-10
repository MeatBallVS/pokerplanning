import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import RoomStatus, enum_values


class Room(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "rooms"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[RoomStatus] = mapped_column(
        Enum(RoomStatus, name="room_status", values_callable=enum_values),
        nullable=False,
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deck_preset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deck_presets.id"),
        nullable=False,
    )
    current_task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id"),
        nullable=True,
    )

    owner = relationship("User", back_populates="owned_rooms")
    deck_preset = relationship("DeckPreset", back_populates="rooms")
    current_task = relationship("Task", foreign_keys=[current_task_id], post_update=True)
    participants = relationship("RoomParticipant", back_populates="room", cascade="all, delete-orphan")
    invitation_links = relationship("InvitationLink", back_populates="room", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="room", cascade="all, delete-orphan", foreign_keys="Task.room_id")
    voting_rounds = relationship("VotingRound", back_populates="room", cascade="all, delete-orphan")
