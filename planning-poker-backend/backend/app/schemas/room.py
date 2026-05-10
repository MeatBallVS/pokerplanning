from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RoomRole, TaskStatus, VotingRoundStatus


class DeckPresetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    code: str
    description: str
    cards: list[str]


class RoomCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str = Field(default="", max_length=1000)
    deck_preset_code: str = Field(default="fibonacci", min_length=2, max_length=64)


class RoomUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class InvitationCreateRequest(BaseModel):
    expires_in_hours: int | None = Field(default=72, ge=1, le=24 * 30)


class InvitationLinkResponse(BaseModel):
    id: UUID
    token: str
    url: str
    expires_at: datetime | None
    is_active: bool
    created_at: datetime


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    description: str = Field(default="", max_length=2000)
    position: int | None = Field(default=None, ge=0)


class TaskUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=2000)
    position: int | None = Field(default=None, ge=0)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    position: int
    status: TaskStatus
    estimate_value: str | None
    estimated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TaskSelectionRequest(BaseModel):
    task_id: UUID


class TransferOwnerRequest(BaseModel):
    participant_id: UUID


class ParticipantResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    email: str
    avatar_color: str
    role: RoomRole
    seat_index: int
    joined_at: datetime
    last_seen_at: datetime
    is_online: bool
    has_voted: bool


class RoundVoteResponse(BaseModel):
    participant_id: UUID
    user_id: UUID
    value: str | None
    has_voted: bool


class RoundStateResponse(BaseModel):
    id: UUID
    task_id: UUID
    round_index: int
    status: VotingRoundStatus
    started_at: datetime
    revealed_at: datetime | None
    closed_at: datetime | None
    votes_submitted: int
    total_participants: int
    can_reveal: bool
    suggested_result: str | None
    average_score: float | None
    consensus: bool
    distribution: dict[str, int]
    self_vote_value: str | None
    votes: list[RoundVoteResponse]


class HistoryItemResponse(BaseModel):
    id: UUID
    round_id: UUID
    task_id: UUID
    task_title: str
    result_value: str
    average_score: float | None
    consensus: bool
    votes_count: int
    distribution: dict[str, int]
    created_at: datetime


class RoomMetaResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str
    status: str
    owner_id: UUID
    current_task_id: UUID | None
    invite_link: str | None
    created_at: datetime
    updated_at: datetime
    deck: DeckPresetResponse


class RoomSnapshotResponse(BaseModel):
    room: RoomMetaResponse
    self_participant_id: UUID | None
    participants: list[ParticipantResponse]
    tasks: list[TaskResponse]
    active_round: RoundStateResponse | None
    history: list[HistoryItemResponse]


class RoomListItemResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str
    invite_link: str | None
    participants_count: int
    active_task_title: str | None
    last_activity_at: datetime
    created_at: datetime
    owner_id: UUID
    viewer_role: RoomRole


class RoundStartRequest(BaseModel):
    task_id: UUID | None = None


class VoteSubmitRequest(BaseModel):
    value: str = Field(min_length=1, max_length=32)


class FinalizeRoundRequest(BaseModel):
    result_value: str | None = Field(default=None, max_length=32)
