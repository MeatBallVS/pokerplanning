import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.enums import VotingRoundStatus, enum_values


class VotingRound(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "voting_rounds"

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    started_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    round_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[VotingRoundStatus] = mapped_column(
        Enum(VotingRoundStatus, name="voting_round_status", values_callable=enum_values),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revealed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    room = relationship("Room", back_populates="voting_rounds")
    task = relationship("Task", back_populates="rounds")
    started_by = relationship("User", back_populates="started_rounds")
    votes = relationship("Vote", back_populates="round", cascade="all, delete-orphan")
    result = relationship("VotingResult", back_populates="round", uselist=False, cascade="all, delete-orphan")
