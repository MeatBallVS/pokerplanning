import { baseApi } from "./baseApi";

export type RoomRole = "owner" | "member";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar_color: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

export interface UpdateProfileRequest {
  email?: string;
  name?: string;
  password?: string;
}

export interface DeckPresetResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  cards: string[];
}

export interface RoomListItemResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  invite_link: string | null;
  participants_count: number;
  active_task_title: string | null;
  last_activity_at: string;
  created_at: string;
  owner_id: string;
  viewer_role: RoomRole;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  position: number;
  status: string;
  estimate_value: string | null;
  estimated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantResponse {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_color: string;
  role: RoomRole;
  seat_index: number;
  joined_at: string;
  last_seen_at: string;
  is_online: boolean;
  has_voted: boolean;
}

export interface RoundVoteResponse {
  participant_id: string;
  user_id: string;
  value: string | null;
  has_voted: boolean;
}

export interface RoundStateResponse {
  id: string;
  task_id: string;
  round_index: number;
  status: string;
  started_at: string;
  revealed_at: string | null;
  closed_at: string | null;
  votes_submitted: number;
  total_participants: number;
  can_reveal: boolean;
  suggested_result: string | null;
  average_score: number | null;
  consensus: boolean;
  distribution: Record<string, number>;
  self_vote_value: string | null;
  votes: RoundVoteResponse[];
}

export interface RoomMetaResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  owner_id: string;
  current_task_id: string | null;
  invite_link: string | null;
  created_at: string;
  updated_at: string;
  deck: DeckPresetResponse;
}

export interface HistoryItemResponse {
  id: string;
  round_id: string;
  task_id: string;
  task_title: string;
  result_value: string;
  average_score: number | null;
  consensus: boolean;
  votes_count: number;
  distribution: Record<string, number>;
  created_at: string;
}

export interface RoomSnapshotResponse {
  room: RoomMetaResponse;
  self_participant_id: string | null;
  participants: ParticipantResponse[];
  tasks: TaskResponse[];
  active_round: RoundStateResponse | null;
  history: HistoryItemResponse[];
}

export interface RoomCreateRequest {
  name: string;
  description?: string;
  deck_preset_code?: string;
}

export interface RoomUpdateRequest {
  name?: string;
  description?: string;
}

export interface TransferOwnerRequest {
  participant_id: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  position?: number;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  position?: number;
}

export const planningPokerApi = {
  async login(payload: LoginRequest) {
    const response = await baseApi.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterRequest) {
    const response = await baseApi.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  async me() {
    const response = await baseApi.get<UserResponse>("/auth/me");
    return response.data;
  },

  async updateProfile(payload: UpdateProfileRequest) {
    const response = await baseApi.patch<UserResponse>("/auth/me", payload);
    return response.data;
  },

  async listDeckPresets() {
    const response = await baseApi.get<DeckPresetResponse[]>("/rooms/deck-presets");
    return response.data;
  },

  async listRooms() {
    const response = await baseApi.get<RoomListItemResponse[]>("/rooms");
    return response.data;
  },

  async createRoom(payload: RoomCreateRequest) {
    const response = await baseApi.post<RoomSnapshotResponse>("/rooms", payload);
    return response.data;
  },

  async joinInvitation(token: string) {
    const response = await baseApi.post<RoomSnapshotResponse>(`/invitations/${token}/join`);
    return response.data;
  },

  async getRoom(roomId: string) {
    const response = await baseApi.get<RoomSnapshotResponse>(`/rooms/${roomId}`);
    return response.data;
  },

  async updateRoom(roomId: string, payload: RoomUpdateRequest) {
    const response = await baseApi.patch<RoomSnapshotResponse>(`/rooms/${roomId}`, payload);
    return response.data;
  },

  async deleteRoom(roomId: string) {
    await baseApi.delete(`/rooms/${roomId}`);
  },

  async removeParticipant(roomId: string, participantId: string) {
    const response = await baseApi.delete<RoomSnapshotResponse>(
      `/rooms/${roomId}/participants/${participantId}`,
    );
    return response.data;
  },

  async leaveRoom(roomId: string) {
    await baseApi.post(`/rooms/${roomId}/leave`);
  },

  async transferOwner(roomId: string, payload: TransferOwnerRequest) {
    const response = await baseApi.post<RoomSnapshotResponse>(
      `/rooms/${roomId}/transfer-owner`,
      payload,
    );
    return response.data;
  },

  async createTask(roomId: string, payload: TaskCreateRequest) {
    const response = await baseApi.post<TaskResponse>(`/rooms/${roomId}/tasks`, payload);
    return response.data;
  },

  async updateTask(roomId: string, taskId: string, payload: TaskUpdateRequest) {
    const response = await baseApi.patch<TaskResponse>(`/rooms/${roomId}/tasks/${taskId}`, payload);
    return response.data;
  },

  async deleteTask(roomId: string, taskId: string) {
    await baseApi.delete(`/rooms/${roomId}/tasks/${taskId}`);
  },

  async selectTask(roomId: string, taskId: string) {
    await baseApi.post(`/rooms/${roomId}/tasks/select`, { task_id: taskId });
  },

  async startRound(roomId: string, taskId: string | null) {
    const response = await baseApi.post<RoomSnapshotResponse>(
      `/rooms/${roomId}/rounds/start`,
      { task_id: taskId },
    );
    return response.data;
  },

  async submitVote(roomId: string, roundId: string, value: string) {
    await baseApi.post(`/rooms/${roomId}/rounds/${roundId}/vote`, { value });
  },

  async revealRound(roomId: string, roundId: string) {
    const response = await baseApi.post<RoomSnapshotResponse>(
      `/rooms/${roomId}/rounds/${roundId}/reveal`,
    );
    return response.data;
  },

  async resetRound(roomId: string, roundId: string) {
    const response = await baseApi.post<RoomSnapshotResponse>(
      `/rooms/${roomId}/rounds/${roundId}/reset`,
    );
    return response.data;
  },
};
