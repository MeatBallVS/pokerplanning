import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Vote(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("round_id", "participant_id", name="uq_round_participant"),)

    round_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voting_rounds.id"), nullable=False)
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("room_participants.id"),
        nullable=False,
    )
    value: Mapped[str] = mapped_column(String(32), nullable=False)

    round = relationship("VotingRound", back_populates="votes")
    participant = relationship("RoomParticipant", back_populates="votes")
