import { useEffect, useRef, useState } from "react";
import { WS_API_URL } from "@/shared/config/env";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";
import type { RoomSnapshotResponse } from "@/shared/api/planningPokerApi";

type RoomSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

interface UseRoomSocketOptions {
  enabled?: boolean;
  onSnapshot: (snapshot: RoomSnapshotResponse) => void;
  roomId?: string;
}

const PRESENCE_PING_INTERVAL = 15_000;
const MAX_RECONNECT_DELAY = 10_000;

const getRoomSocketUrl = (roomId: string, token: string) =>
  `${WS_API_URL}/ws/rooms/${roomId}?token=${encodeURIComponent(token)}`;

export const useRoomSocket = ({
  enabled = true,
  onSnapshot,
  roomId,
}: UseRoomSocketOptions) => {
  const [status, setStatus] = useState<RoomSocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const snapshotHandlerRef = useRef(onSnapshot);

  useEffect(() => {
    snapshotHandlerRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

    if (!enabled || !roomId || !token) {
      return;
    }

    let socket: WebSocket | null = null;
    let closedByEffect = false;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;
    let reconnectAttempt = 0;

    const cleanupTimers = () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (pingTimer) {
        window.clearInterval(pingTimer);
      }
    };

    const scheduleReconnect = () => {
      if (closedByEffect) {
        return;
      }

      reconnectAttempt += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY);
      setStatus("reconnecting");
      reconnectTimer = window.setTimeout(connect, delay);
    };

    const connect = () => {
      cleanupTimers();
      setStatus(reconnectAttempt === 0 ? "connecting" : "reconnecting");
      setLastError(null);

      socket = new WebSocket(getRoomSocketUrl(roomId, token));

      socket.onopen = () => {
        reconnectAttempt = 0;
        setStatus("connected");
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "presence.ping" }));
          }
        }, PRESENCE_PING_INTERVAL);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as {
            payload?: { snapshot?: RoomSnapshotResponse };
            type?: string;
          };

          if (message.payload?.snapshot) {
            snapshotHandlerRef.current(message.payload.snapshot);
          }
        } catch {
          setLastError("Не удалось обработать обновление комнаты.");
        }
      };

      socket.onerror = () => {
        setLastError("Потеряли соединение с комнатой. Пробуем переподключиться.");
      };

      socket.onclose = (event) => {
        cleanupTimers();

        if (closedByEffect) {
          setStatus("disconnected");
          return;
        }

        if (event.code === 4401 || event.code === 4403) {
          setStatus("error");
          setLastError("Доступ к realtime-обновлениям недоступен для текущей сессии.");
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      cleanupTimers();

      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close();
      }
    };
  }, [enabled, roomId]);

  const resolvedStatus =
    !enabled || !roomId
      ? "idle"
      : !localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
        ? "disconnected"
        : status;

  return {
    lastError,
    status: resolvedStatus,
  };
};
