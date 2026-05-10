from enum import Enum


def enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class RoomRole(str, Enum):
    OWNER = "owner"
    MEMBER = "member"


class RoomStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    ACTIVE = "active"
    ESTIMATED = "estimated"


class VotingRoundStatus(str, Enum):
    VOTING = "voting"
    REVEALED = "revealed"
    CANCELLED = "cancelled"
    FINALIZED = "finalized"
