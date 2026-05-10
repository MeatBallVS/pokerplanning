import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TaskStatus, enum_values


class Task(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tasks"

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status", values_callable=enum_values),
        nullable=False,
    )
    estimate_value: Mapped[str | None] = mapped_column(String(32), nullable=True)
    estimated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    room = relationship("Room", back_populates="tasks", foreign_keys=[room_id])
    created_by = relationship("User", back_populates="created_tasks")
    rounds = relationship("VotingRound", back_populates="task")
    results = relationship("VotingResult", back_populates="task")
