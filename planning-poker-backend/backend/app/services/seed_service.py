from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DeckPreset

DEFAULT_DECKS = [
    {
        "code": "fibonacci",
        "name": "Фибоначчи",
        "description": "Классическая колода для команд, которым нужна привычная числовая шкала сложности.",
        "cards": ["1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "break"],
    },
    {
        "code": "tshirt",
        "name": "Футболки",
        "description": "Категориальная колода для быстрой грубой оценки, когда точные числа не так важны.",
        "cards": ["XS", "S", "M", "L", "XL", "XXL", "?", "break"],
    },
    {
        "code": "emoji",
        "name": "Emoji",
        "description": "Легкая эмоциональная колода для быстрых фасилитационных сессий и неформальных команд.",
        "cards": ["😴", "🤔", "🙂", "👍", "🔥", "🚀", "?", "break"],
    },
    {
        "code": "garage",
        "name": "Уровень сложности",
        "description": "От «Из говна и палок» до «Человек-цех»: образная шкала для инженерных и продуктовых команд.",
        "cards": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    },
]


def seed_default_decks(db: Session) -> None:
    existing_decks = {deck.code: deck for deck in db.scalars(select(DeckPreset)).all()}
    for deck in DEFAULT_DECKS:
        existing = existing_decks.get(deck["code"])
        if existing is None:
            db.add(DeckPreset(**deck))
            continue

        existing.name = deck["name"]
        existing.description = deck["description"]
        existing.cards = deck["cards"]
        db.add(existing)
    db.commit()
