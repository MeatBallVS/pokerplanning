import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class VotingResult(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "voting_results"
    __table_args__ = (UniqueConstraint("round_id", name="uq_result_round"),)

    round_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voting_rounds.id"), nullable=False)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    finalized_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    result_value: Mapped[str] = mapped_column(String(32), nullable=False)
    average_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    consensus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    votes_count: Mapped[int] = mapped_column(Integer, nullable=False)
    distribution: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False, default=dict)

    round = relationship("VotingRound", back_populates="result")
    task = relationship("Task", back_populates="results")
    finalized_by = relationship("User", back_populates="finalized_results")
