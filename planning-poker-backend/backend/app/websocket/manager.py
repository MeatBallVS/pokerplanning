import asyncio
from collections import defaultdict
from uuid import UUID

from fastapi.encoders import jsonable_encoder
from fastapi.websockets import WebSocket

from app.db.session import SessionLocal
from app.services.room_state_service import RoomStateService


class RoomConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[UUID, dict[UUID, set[WebSocket]]] = defaultdict(lambda: defaultdict(set))
        self._lock = asyncio.Lock()

    async def connect(self, room_id: UUID, participant_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[room_id][participant_id].add(websocket)

    async def disconnect(self, room_id: UUID, participant_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            participant_sockets = self._connections.get(room_id, {}).get(participant_id)
            if participant_sockets is None:
                return
            participant_sockets.discard(websocket)
            if not participant_sockets:
                self._connections[room_id].pop(participant_id, None)
            if not self._connections[room_id]:
                self._connections.pop(room_id, None)

    def online_participant_ids(self, room_id: UUID) -> set[UUID]:
        return set(self._connections.get(room_id, {}).keys())

    async def send_event(self, websocket: WebSocket, event_type: str, payload: dict) -> None:
        await websocket.send_json(jsonable_encoder({"type": event_type, "payload": payload}))

    async def send_snapshot(
        self,
        websocket: WebSocket,
        room_id: UUID,
        participant_id: UUID,
        event_type: str = "room.snapshot",
        extra: dict | None = None,
    ):
        with SessionLocal() as db:
            snapshot = RoomStateService(db).build_snapshot(
                room_id=room_id,
                online_participant_ids=self.online_participant_ids(room_id),
                viewer_participant_id=participant_id,
            )
        payload = {"snapshot": snapshot.model_dump(mode="json")}
        if extra:
            payload.update(extra)
        await self.send_event(websocket, event_type, payload)

    async def broadcast_snapshot(self, room_id: UUID, event_type: str, extra: dict | None = None) -> None:
        with SessionLocal() as db:
            state_service = RoomStateService(db)
            for participant_id, participant_sockets in self._connections.get(room_id, {}).items():
                snapshot = state_service.build_snapshot(
                    room_id=room_id,
                    online_participant_ids=self.online_participant_ids(room_id),
                    viewer_participant_id=participant_id,
                )
                payload = {"snapshot": snapshot.model_dump(mode="json")}
                if extra:
                    payload.update(extra)
                for socket in participant_sockets:
                    await self.send_event(socket, event_type, payload)


room_connection_manager = RoomConnectionManager()
