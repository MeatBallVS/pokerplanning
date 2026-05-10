import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import RoomRole, enum_values


class RoomParticipant(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "room_participants"
    __table_args__ = (UniqueConstraint("room_id", "user_id", name="uq_room_user"),)

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role: Mapped[RoomRole] = mapped_column(
        Enum(RoomRole, name="room_role", values_callable=enum_values),
        nullable=False,
    )
    seat_index: Mapped[int] = mapped_column(nullable=False, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    room = relationship("Room", back_populates="participants")
    user = relationship("User", back_populates="participants")
    votes = relationship("Vote", back_populates="participant")
