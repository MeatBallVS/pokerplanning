from uuid import UUID

import jwt
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.services.room_service import RoomService
from app.websocket.manager import room_connection_manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws/rooms/{room_id}")
async def room_websocket(websocket: WebSocket, room_id: UUID) -> None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Требуется токен авторизации")
        return

    try:
        payload = decode_access_token(token)
        user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError, jwt.PyJWTError):
        await websocket.close(code=4401, reason="Некорректный токен доступа")
        return

    db: Session = SessionLocal()
    participant = None
    try:
        participant = RoomService(db).touch_presence(room_id, user_id)
        await room_connection_manager.connect(room_id, participant.id, websocket)
        await room_connection_manager.send_snapshot(websocket, room_id, participant.id)
        await room_connection_manager.broadcast_snapshot(room_id, "presence.changed")

        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")

            if message_type == "presence.ping":
                RoomService(db).touch_presence(room_id, user_id)
            elif message_type == "room.sync_request":
                await room_connection_manager.send_snapshot(websocket, room_id, participant.id, "room.snapshot")
            else:
                await room_connection_manager.send_event(
                    websocket,
                    "error",
                    {"message": "Неподдерживаемое websocket-событие"},
                )
    except HTTPException as exc:
        await websocket.close(code=4403, reason=str(exc.detail))
    except WebSocketDisconnect:
        if participant is not None:
            await room_connection_manager.disconnect(room_id, participant.id, websocket)
            await room_connection_manager.broadcast_snapshot(room_id, "presence.changed")
    finally:
        db.close()
