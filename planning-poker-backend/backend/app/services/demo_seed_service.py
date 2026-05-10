from collections import Counter
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import DeckPreset, InvitationLink, Room, RoomParticipant, Task, User, Vote, VotingResult, VotingRound
from app.models.enums import RoomRole, RoomStatus, TaskStatus, VotingRoundStatus

ANNA_DEMO_EMAIL = "anna.demo@example.com"
MAXIM_DEMO_EMAIL = "maxim.demo@example.com"
SOFIA_DEMO_EMAIL = "sofia.demo@example.com"
TIMUR_DEMO_EMAIL = "timur.demo@example.com"
DIANA_DEMO_EMAIL = "diana.demo@example.com"
AMIR_DEMO_EMAIL = "amir.demo@example.com"
OLGA_DEMO_EMAIL = "olga.demo@example.com"
ROMAN_DEMO_EMAIL = "roman.demo@example.com"

DEMO_USERS = [
    {"email": ANNA_DEMO_EMAIL, "legacy_emails": ["anna.demo@planning.local"], "name": "Анна Павлова", "avatar_color": "#52B6FF"},
    {"email": MAXIM_DEMO_EMAIL, "legacy_emails": ["maxim.demo@planning.local"], "name": "Максим Орлов", "avatar_color": "#55D6BE"},
    {"email": SOFIA_DEMO_EMAIL, "legacy_emails": ["sofia.demo@planning.local"], "name": "София Ильина", "avatar_color": "#F8A45B"},
    {"email": TIMUR_DEMO_EMAIL, "legacy_emails": ["timur.demo@planning.local"], "name": "Тимур Сулейменов", "avatar_color": "#F774A3"},
    {"email": DIANA_DEMO_EMAIL, "legacy_emails": ["diana.demo@planning.local"], "name": "Диана Коваль", "avatar_color": "#B88CFF"},
    {"email": AMIR_DEMO_EMAIL, "legacy_emails": ["amir.demo@planning.local"], "name": "Амир Жанатов", "avatar_color": "#8FD14F"},
    {"email": OLGA_DEMO_EMAIL, "legacy_emails": ["olga.demo@planning.local"], "name": "Ольга Белова", "avatar_color": "#4FD1C5"},
    {"email": ROMAN_DEMO_EMAIL, "legacy_emails": ["roman.demo@planning.local"], "name": "Роман Яковлев", "avatar_color": "#F6C453"},
]


def _average_score(values: list[str]) -> float | None:
    numeric_values = [float(value) for value in values if value.isdigit()]
    if not numeric_values:
        return None
    return round(sum(numeric_values) / len(numeric_values), 1)


def _get_user(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def _get_room(db: Session, slug: str) -> Room | None:
    return db.scalar(select(Room).where(Room.slug == slug))


def _get_deck(db: Session, code: str) -> DeckPreset:
    deck = db.scalar(select(DeckPreset).where(DeckPreset.code == code))
    if deck is None:
        raise RuntimeError(f"Не найдена колода {code!r} для demo-данных")
    return deck


def _upsert_demo_users(db: Session, password: str) -> dict[str, User]:
    users: dict[str, User] = {}
    password_hash = hash_password(password)
    for payload in DEMO_USERS:
        user = _get_user(db, payload["email"])
        if user is None:
            for legacy_email in payload.get("legacy_emails", []):
                user = _get_user(db, legacy_email)
                if user is not None:
                    user.email = payload["email"]
                    break
        if user is None:
            user = User(
                email=payload["email"],
                name=payload["name"],
                password_hash=password_hash,
                avatar_color=payload["avatar_color"],
            )
        else:
            user.name = payload["name"]
            user.password_hash = password_hash
            user.avatar_color = payload["avatar_color"]
        db.add(user)
        db.flush()
        users[user.email] = user
    return users


def _create_room(
    db: Session,
    *,
    name: str,
    slug: str,
    description: str,
    owner: User,
    deck: DeckPreset,
    created_at: datetime,
) -> Room:
    room = Room(
        name=name,
        slug=slug,
        description=description,
        status=RoomStatus.ACTIVE,
        owner_id=owner.id,
        deck_preset_id=deck.id,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(room)
    db.flush()
    return room


def _create_participants(
    db: Session,
    *,
    room: Room,
    users: list[User],
    owner_id,
    joined_at: datetime,
) -> dict[str, RoomParticipant]:
    participants: dict[str, RoomParticipant] = {}
    for seat_index, user in enumerate(users):
        participant = RoomParticipant(
            room_id=room.id,
            user_id=user.id,
            role=RoomRole.OWNER if user.id == owner_id else RoomRole.MEMBER,
            seat_index=seat_index,
            joined_at=joined_at + timedelta(minutes=seat_index * 4),
            last_seen_at=joined_at + timedelta(minutes=seat_index * 4),
        )
        db.add(participant)
        db.flush()
        participants[user.email] = participant
    return participants


def _create_task(
    db: Session,
    *,
    room: Room,
    creator: User,
    title: str,
    description: str,
    position: int,
    status: TaskStatus,
    created_at: datetime,
    estimate_value: str | None = None,
    estimated_at: datetime | None = None,
) -> Task:
    task = Task(
        room_id=room.id,
        created_by_id=creator.id,
        title=title,
        description=description,
        position=position,
        status=status,
        estimate_value=estimate_value,
        estimated_at=estimated_at,
        created_at=created_at,
        updated_at=estimated_at or created_at,
    )
    db.add(task)
    db.flush()
    return task


def _create_invitation(
    db: Session,
    *,
    room: Room,
    owner: User,
    token: str,
    created_at: datetime,
) -> InvitationLink:
    invitation = InvitationLink(
        room_id=room.id,
        created_by_id=owner.id,
        token=token,
        is_active=True,
        expires_at=created_at + timedelta(days=365),
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(invitation)
    db.flush()
    return invitation


def _create_votes(
    db: Session,
    *,
    voting_round: VotingRound,
    participants: dict[str, RoomParticipant],
    values_by_email: dict[str, str],
    voted_at: datetime,
) -> list[str]:
    values: list[str] = []
    for index, (email, value) in enumerate(values_by_email.items()):
        vote_time = voted_at + timedelta(seconds=index * 35)
        vote = Vote(
            round_id=voting_round.id,
            participant_id=participants[email].id,
            value=value,
            created_at=vote_time,
            updated_at=vote_time,
        )
        db.add(vote)
        values.append(value)
    db.flush()
    return values


def _create_finalized_round(
    db: Session,
    *,
    room: Room,
    task: Task,
    started_by: User,
    finalized_by: User,
    participants: dict[str, RoomParticipant],
    votes_by_email: dict[str, str],
    result_value: str,
    started_at: datetime,
    revealed_at: datetime,
    closed_at: datetime,
    round_index: int = 1,
) -> None:
    voting_round = VotingRound(
        room_id=room.id,
        task_id=task.id,
        started_by_id=started_by.id,
        round_index=round_index,
        status=VotingRoundStatus.FINALIZED,
        started_at=started_at,
        revealed_at=revealed_at,
        closed_at=closed_at,
    )
    db.add(voting_round)
    db.flush()

    values = _create_votes(
        db,
        voting_round=voting_round,
        participants=participants,
        values_by_email=votes_by_email,
        voted_at=started_at + timedelta(minutes=6),
    )
    result = VotingResult(
        round_id=voting_round.id,
        task_id=task.id,
        finalized_by_id=finalized_by.id,
        result_value=result_value,
        average_score=_average_score(values),
        consensus=len(set(values)) == 1,
        votes_count=len(values),
        distribution=dict(Counter(values)),
        created_at=closed_at,
        updated_at=closed_at,
    )
    db.add(result)
    db.flush()


def _create_open_round(
    db: Session,
    *,
    room: Room,
    task: Task,
    started_by: User,
    participants: dict[str, RoomParticipant],
    votes_by_email: dict[str, str],
    started_at: datetime,
    status: VotingRoundStatus,
    revealed_at: datetime | None = None,
    round_index: int = 1,
) -> None:
    voting_round = VotingRound(
        room_id=room.id,
        task_id=task.id,
        started_by_id=started_by.id,
        round_index=round_index,
        status=status,
        started_at=started_at,
        revealed_at=revealed_at,
        closed_at=None,
    )
    db.add(voting_round)
    db.flush()
    _create_votes(
        db,
        voting_round=voting_round,
        participants=participants,
        values_by_email=votes_by_email,
        voted_at=started_at + timedelta(minutes=4),
    )


def _seed_showcase_room(db: Session, users: dict[str, User], now: datetime) -> None:
    if _get_room(db, "demo-showcase-platform") is not None:
        return

    deck = _get_deck(db, "fibonacci")
    owner = users[ANNA_DEMO_EMAIL]
    room = _create_room(
        db,
        name="Демо: Платформа командной оценки",
        slug="demo-showcase-platform",
        description="Большая showcase-комната с восемью участниками, историей оценок и активным раундом, чтобы можно было проверить позиционирование игроков и композицию стола.",
        owner=owner,
        deck=deck,
        created_at=now - timedelta(days=9),
    )
    room_users = [
        users[ANNA_DEMO_EMAIL],
        users[MAXIM_DEMO_EMAIL],
        users[SOFIA_DEMO_EMAIL],
        users[TIMUR_DEMO_EMAIL],
        users[DIANA_DEMO_EMAIL],
        users[AMIR_DEMO_EMAIL],
        users[OLGA_DEMO_EMAIL],
        users[ROMAN_DEMO_EMAIL],
    ]
    participants = _create_participants(
        db,
        room=room,
        users=room_users,
        owner_id=owner.id,
        joined_at=now - timedelta(days=8, hours=18),
    )
    _create_invitation(
        db,
        room=room,
        owner=owner,
        token="demo-showcase-platform-invite",
        created_at=now - timedelta(days=8),
    )

    task_1 = _create_task(
        db,
        room=room,
        creator=owner,
        title="Единая панель ролей и прав доступа",
        description="Собрать обзор ролей, политик доступа и ограничений для руководителей команд и владельцев пространства.",
        position=0,
        status=TaskStatus.ESTIMATED,
        estimate_value="13",
        estimated_at=now - timedelta(days=6, hours=18),
        created_at=now - timedelta(days=7),
    )
    task_2 = _create_task(
        db,
        room=room,
        creator=owner,
        title="Realtime-слой синхронизации комнаты",
        description="Сделать стабильную fan-out модель для присутствия, голосов и восстановлений после reconnect.",
        position=1,
        status=TaskStatus.ESTIMATED,
        estimate_value="8",
        estimated_at=now - timedelta(days=4, hours=6),
        created_at=now - timedelta(days=5),
    )
    task_3 = _create_task(
        db,
        room=room,
        creator=owner,
        title="Анимация переворота карт и reveal-сцена",
        description="Продумать финальную сцену раскрытия карт и понятную визуальную обратную связь после reveal.",
        position=2,
        status=TaskStatus.ESTIMATED,
        estimate_value="5",
        estimated_at=now - timedelta(days=2, hours=18),
        created_at=now - timedelta(days=3),
    )
    active_task = _create_task(
        db,
        room=room,
        creator=owner,
        title="Устойчивое присутствие участников за столом",
        description="Проверить, как интерфейс переживает refresh, reconnect и несколько открытых сессий разных пользователей.",
        position=3,
        status=TaskStatus.ACTIVE,
        created_at=now - timedelta(hours=8),
    )
    _create_task(
        db,
        room=room,
        creator=owner,
        title="История оценок по эпикам",
        description="Добавить сводку завершённых раундов и фильтрацию по потокам работы команды.",
        position=4,
        status=TaskStatus.BACKLOG,
        created_at=now - timedelta(hours=6),
    )
    _create_task(
        db,
        room=room,
        creator=owner,
        title="Связка backlog с roadmap-контекстом",
        description="Связать оценки задач с контекстом релизов, эпиков и приоритетов квартала.",
        position=5,
        status=TaskStatus.BACKLOG,
        created_at=now - timedelta(hours=5),
    )

    room.current_task_id = active_task.id
    room.updated_at = now - timedelta(minutes=12)
    db.add(room)
    db.flush()

    _create_finalized_round(
        db,
        room=room,
        task=task_1,
        started_by=owner,
        finalized_by=owner,
        participants=participants,
        votes_by_email={
            ANNA_DEMO_EMAIL: "13",
            MAXIM_DEMO_EMAIL: "13",
            SOFIA_DEMO_EMAIL: "8",
            TIMUR_DEMO_EMAIL: "13",
            DIANA_DEMO_EMAIL: "21",
            AMIR_DEMO_EMAIL: "13",
        },
        result_value="13",
        started_at=now - timedelta(days=6, hours=20),
        revealed_at=now - timedelta(days=6, hours=19, minutes=48),
        closed_at=now - timedelta(days=6, hours=19, minutes=32),
    )
    _create_finalized_round(
        db,
        room=room,
        task=task_2,
        started_by=owner,
        finalized_by=users[MAXIM_DEMO_EMAIL],
        participants=participants,
        votes_by_email={
            ANNA_DEMO_EMAIL: "8",
            MAXIM_DEMO_EMAIL: "8",
            SOFIA_DEMO_EMAIL: "5",
            TIMUR_DEMO_EMAIL: "8",
            DIANA_DEMO_EMAIL: "8",
            AMIR_DEMO_EMAIL: "13",
            OLGA_DEMO_EMAIL: "8",
        },
        result_value="8",
        started_at=now - timedelta(days=4, hours=9),
        revealed_at=now - timedelta(days=4, hours=8, minutes=42),
        closed_at=now - timedelta(days=4, hours=8, minutes=21),
    )
    _create_finalized_round(
        db,
        room=room,
        task=task_3,
        started_by=owner,
        finalized_by=users[SOFIA_DEMO_EMAIL],
        participants=participants,
        votes_by_email={
            ANNA_DEMO_EMAIL: "5",
            MAXIM_DEMO_EMAIL: "5",
            SOFIA_DEMO_EMAIL: "5",
            TIMUR_DEMO_EMAIL: "3",
            DIANA_DEMO_EMAIL: "5",
            AMIR_DEMO_EMAIL: "8",
        },
        result_value="5",
        started_at=now - timedelta(days=2, hours=22),
        revealed_at=now - timedelta(days=2, hours=21, minutes=44),
        closed_at=now - timedelta(days=2, hours=21, minutes=18),
    )
    _create_open_round(
        db,
        room=room,
        task=active_task,
        started_by=owner,
        participants=participants,
        votes_by_email={
            ANNA_DEMO_EMAIL: "5",
            MAXIM_DEMO_EMAIL: "8",
            TIMUR_DEMO_EMAIL: "5",
            DIANA_DEMO_EMAIL: "3",
            OLGA_DEMO_EMAIL: "5",
        },
        started_at=now - timedelta(minutes=18),
        status=VotingRoundStatus.VOTING,
    )


def _seed_discovery_room(db: Session, users: dict[str, User], now: datetime) -> None:
    if _get_room(db, "demo-discovery-lab") is not None:
        return

    deck = _get_deck(db, "tshirt")
    owner = users[DIANA_DEMO_EMAIL]
    room = _create_room(
        db,
        name="Демо: Discovery Lab",
        slug="demo-discovery-lab",
        description="Вторая демонстрационная комната с T-Shirt колодой и уже раскрытым раундом, чтобы оценить состояние после reveal и сценарий финализации.",
        owner=owner,
        deck=deck,
        created_at=now - timedelta(days=4),
    )
    room_users = [
        users[DIANA_DEMO_EMAIL],
        users[AMIR_DEMO_EMAIL],
        users[OLGA_DEMO_EMAIL],
        users[ROMAN_DEMO_EMAIL],
        users[ANNA_DEMO_EMAIL],
    ]
    participants = _create_participants(
        db,
        room=room,
        users=room_users,
        owner_id=owner.id,
        joined_at=now - timedelta(days=3, hours=12),
    )
    _create_invitation(
        db,
        room=room,
        owner=owner,
        token="demo-discovery-lab-invite",
        created_at=now - timedelta(days=3, hours=10),
    )

    task_1 = _create_task(
        db,
        room=room,
        creator=owner,
        title="Поток пользовательских интервью",
        description="Определить объём цикла интервью и сопутствующий объём синтеза выводов.",
        position=0,
        status=TaskStatus.ESTIMATED,
        estimate_value="M",
        estimated_at=now - timedelta(days=2, hours=3),
        created_at=now - timedelta(days=3),
    )
    active_task = _create_task(
        db,
        room=room,
        creator=owner,
        title="Набор критериев для discovery-синтеза",
        description="Оценить объём шаблонов, интервью-гайдов и требований к итоговому артефакту.",
        position=1,
        status=TaskStatus.ACTIVE,
        created_at=now - timedelta(hours=9),
    )
    _create_task(
        db,
        room=room,
        creator=owner,
        title="Каталог гипотез команды",
        description="Подготовить структуру гипотез, тегов и ожидаемых сигналов для последующей проверки.",
        position=2,
        status=TaskStatus.BACKLOG,
        created_at=now - timedelta(hours=7),
    )
    _create_task(
        db,
        room=room,
        creator=owner,
        title="Шаблон weekly research update",
        description="Собрать шаблон регулярного исследования для прозрачного обмена прогрессом между командами.",
        position=3,
        status=TaskStatus.BACKLOG,
        created_at=now - timedelta(hours=6),
    )

    room.current_task_id = active_task.id
    room.updated_at = now - timedelta(minutes=28)
    db.add(room)
    db.flush()

    _create_finalized_round(
        db,
        room=room,
        task=task_1,
        started_by=owner,
        finalized_by=owner,
        participants=participants,
        votes_by_email={
            DIANA_DEMO_EMAIL: "M",
            AMIR_DEMO_EMAIL: "M",
            OLGA_DEMO_EMAIL: "S",
            ROMAN_DEMO_EMAIL: "M",
        },
        result_value="M",
        started_at=now - timedelta(days=2, hours=5),
        revealed_at=now - timedelta(days=2, hours=4, minutes=36),
        closed_at=now - timedelta(days=2, hours=4, minutes=8),
    )
    _create_open_round(
        db,
        room=room,
        task=active_task,
        started_by=owner,
        participants=participants,
        votes_by_email={
            DIANA_DEMO_EMAIL: "M",
            AMIR_DEMO_EMAIL: "L",
            OLGA_DEMO_EMAIL: "M",
            ROMAN_DEMO_EMAIL: "S",
            ANNA_DEMO_EMAIL: "M",
        },
        started_at=now - timedelta(minutes=44),
        status=VotingRoundStatus.REVEALED,
        revealed_at=now - timedelta(minutes=19),
    )


def seed_demo_data(db: Session) -> None:
    settings = get_settings()
    if not settings.seed_demo_data:
        return

    users = _upsert_demo_users(db, settings.demo_user_password)
    now = datetime.now(UTC)
    _seed_showcase_room(db, users, now)
    _seed_discovery_room(db, users, now)
    db.commit()
