from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(32), nullable=False)

    owned_rooms = relationship("Room", back_populates="owner")
    participants = relationship("RoomParticipant", back_populates="user")
    created_tasks = relationship("Task", back_populates="created_by")
    started_rounds = relationship("VotingRound", back_populates="started_by")
    finalized_results = relationship("VotingResult", back_populates="finalized_by")
