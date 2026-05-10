from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DeckPreset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "deck_presets"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cards: Mapped[list[str]] = mapped_column(JSON, nullable=False)

    rooms = relationship("Room", back_populates="deck_preset")
