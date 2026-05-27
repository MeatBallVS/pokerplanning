import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Link2,
  LogOut,
  Radio,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PlayerList } from "@/widgets/player-list";
import { PokerTable } from "@/widgets/poker-table";
import { VotingBoard } from "@/widgets/voting";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import type { RoomSnapshotResponse, TaskResponse } from "@/shared/api/planningPokerApi";
import { isGarageDeck } from "@/shared/config/deckPresentation";
import { formatDate } from "@/shared/lib/formatDate";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useRoomSocket } from "@/shared/lib/useRoomSocket";

const taskStatusLabels: Record<string, string> = {
  active: "Активна",
  backlog: "В бэклоге",
  estimated: "Оценена",
};

const socketLabels = {
  connected: "В сети",
  connecting: "Подключаемся",
  disconnected: "Отключено",
  error: "Ошибка",
  idle: "Ожидание",
  reconnecting: "Переподключаемся",
} as const;

export const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [snapshot, setSnapshot] = useState<RoomSnapshotResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "" });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState({ title: "", description: "" });

  const roomQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ["room", id],
    queryFn: () => planningPokerApi.getRoom(id!),
  });

  const applySnapshot = useCallback(
    (nextSnapshot: RoomSnapshotResponse) => {
      setSnapshot(nextSnapshot);
      queryClient.setQueryData(["room", id], nextSnapshot);
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    [id, queryClient],
  );

  useEffect(() => {
    if (roomQuery.data) {
      applySnapshot(roomQuery.data);
    }
  }, [applySnapshot, roomQuery.data]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setRoomForm({
      name: snapshot.room.name,
      description: snapshot.room.description,
    });
  }, [snapshot]);

  const { lastError: socketError, status: socketStatus } = useRoomSocket({
    enabled: Boolean(id && roomQuery.isSuccess),
    onSnapshot: applySnapshot,
    roomId: id,
  });

  const selfParticipant = useMemo(
    () =>
      snapshot?.participants.find(
        (participant) => participant.id === snapshot.self_participant_id,
      ) ?? null,
    [snapshot],
  );

  const isOwner = selfParticipant?.role === "owner";

  const refreshRoom = useCallback(async () => {
    if (!id) {
      return;
    }

    const freshSnapshot = await planningPokerApi.getRoom(id);
    applySnapshot(freshSnapshot);
  }, [applySnapshot, id]);

  const deleteRoomMutation = useMutation({
    mutationFn: () => planningPokerApi.deleteRoom(id!),
    onSuccess: () => {
      toast.success("Комната удалена.");
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/rooms/owned", { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось удалить комнату."));
      setPendingAction(null);
    },
  });

  const leaveRoomMutation = useMutation({
    mutationFn: () => planningPokerApi.leaveRoom(id!),
    onSuccess: () => {
      toast.success("Вы покинули комнату.");
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/rooms", { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось покинуть комнату."));
      setPendingAction(null);
    },
  });

  const handleRoomChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRoomForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleTaskCreateChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setTaskForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleTaskEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEditingTaskForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const startEditingTask = (task: TaskResponse) => {
    setEditingTaskId(task.id);
    setEditingTaskForm({
      title: task.title,
      description: task.description,
    });
  };

  const handleRoomUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setPendingAction("room-update");

    try {
      const updatedSnapshot = await planningPokerApi.updateRoom(id, {
        name: roomForm.name,
        description: roomForm.description,
      });
      applySnapshot(updatedSnapshot);
      toast.success("Настройки комнаты сохранены.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось сохранить настройки комнаты."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!snapshot) {
      return;
    }

    const confirmed = window.confirm(`Удалить комнату "${snapshot.room.name}"?`);
    if (!confirmed) {
      return;
    }

    setPendingAction("room-delete");
    deleteRoomMutation.mutate();
  };

  const handleLeaveRoom = async () => {
    if (!snapshot) {
      return;
    }

    const ownerWithMembers = isOwner && snapshot.participants.length > 1;
    if (ownerWithMembers) {
      toast.info("Сначала передайте роль ведущего другому участнику.");
      return;
    }

    const confirmed = window.confirm("Покинуть комнату?");
    if (!confirmed) {
      return;
    }

    setPendingAction("room-leave");
    leaveRoomMutation.mutate();
  };

  const handleCopyInvite = async () => {
    if (!snapshot?.room.invite_link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot.room.invite_link);
      toast.success("Ссылка приглашения скопирована.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось скопировать ссылку приглашения."));
    }
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !taskForm.title.trim()) {
      return;
    }

    setPendingAction("task-create");

    try {
      await planningPokerApi.createTask(id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
      });
      setTaskForm({ title: "", description: "" });
      await refreshRoom();
      toast.success("Задача добавлена.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось добавить задачу."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveTask = async (taskId: string) => {
    if (!id || !editingTaskForm.title.trim()) {
      return;
    }

    setPendingAction(`task-save:${taskId}`);

    try {
      await planningPokerApi.updateTask(id, taskId, {
        title: editingTaskForm.title.trim(),
        description: editingTaskForm.description.trim(),
      });
      setEditingTaskId(null);
      await refreshRoom();
      toast.success("Задача обновлена.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить задачу."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("Удалить задачу?");
    if (!confirmed) {
      return;
    }

    setPendingAction(`task-delete:${taskId}`);

    try {
      await planningPokerApi.deleteTask(id, taskId);
      await refreshRoom();
      toast.success("Задача удалена.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Не удалось удалить задачу. Возможно, у нее уже есть история голосований.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleSelectTask = async (taskId: string) => {
    if (!id) {
      return;
    }

    setPendingAction(`task-select:${taskId}`);

    try {
      await planningPokerApi.selectTask(id, taskId);
      await refreshRoom();
      toast.success("Активная задача изменена.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось выбрать активную задачу."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("Удалить участника из комнаты?");
    if (!confirmed) {
      return;
    }

    setPendingAction(`participant:${participantId}`);

    try {
      const updatedSnapshot = await planningPokerApi.removeParticipant(id, participantId);
      applySnapshot(updatedSnapshot);
      toast.success("Участник удален из комнаты.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Не удалось удалить участника. Возможно, у него уже есть история голосований.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleTransferOwner = async (participantId: string) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm("Передать роль ведущего этому участнику?");
    if (!confirmed) {
      return;
    }

    setPendingAction(`owner:${participantId}`);

    try {
      const updatedSnapshot = await planningPokerApi.transferOwner(id, {
        participant_id: participantId,
      });
      applySnapshot(updatedSnapshot);
      toast.success("Роль ведущего передана.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось передать роль ведущего."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleExportHistory = () => {
    if (!snapshot?.history.length) {
      toast.info("История оценок пока пуста.");
      return;
    }

    const header = [
      "task_title",
      "result_value",
      "average_score",
      "consensus",
      "votes_count",
      "created_at",
    ];
    const rows = snapshot.history.map((item) => [
      item.task_title,
      item.result_value,
      item.average_score ?? "",
      item.consensus ? "yes" : "no",
      item.votes_count,
      new Date(item.created_at).toISOString(),
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${snapshot.room.slug}-history.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("История экспортирована в CSV.");
  };

  if (!id) {
    return <Navigate replace to="/rooms" />;
  }

  if (roomQuery.isLoading || !snapshot) {
    return (
      <div className="grid gap-6 px-5 py-6 sm:px-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {[1, 2, 3].map((column) => (
          <div
            className="animate-pulse rounded-[30px] border border-[var(--color-border)] bg-white/90 p-5 shadow-sm"
            key={column}
          >
            <div className="h-6 w-40 rounded-full bg-slate-100" />
            <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-100" />
            <div className="mt-6 grid gap-3">
              <div className="h-24 rounded-[24px] bg-slate-100" />
              <div className="h-24 rounded-[24px] bg-slate-100" />
              <div className="h-24 rounded-[24px] bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (roomQuery.isError) {
    return (
      <div className="px-5 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Не удалось открыть комнату. Проверьте доступ или backend.
        </div>
      </div>
    );
  }

  const garageDeck = isGarageDeck(snapshot.room.deck.code);

  return (
    <div className="room-dashboard space-y-6 px-5 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[34px] border border-[var(--color-border)] bg-[color:var(--color-surface-elevated)] p-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)] lg:p-8">
        <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-4">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
              to="/rooms"
            >
              <ArrowLeft className="h-4 w-4" />К списку комнат
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-anywhere text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {snapshot.room.name}
                </h1>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                  {selfParticipant?.role === "owner" ? "Ведущий" : "Участник"}
                </span>
                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                    socketStatus === "connected"
                      ? "bg-emerald-50 text-emerald-700"
                      : socketStatus === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {socketLabels[socketStatus]}
                </span>
              </div>

              <p className="mt-4 max-w-3xl break-words text-base leading-7 text-slate-600">
                {snapshot.room.description || "Описание комнаты пока не добавлено."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="room-summary-chip rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-slate-600">
                Колода: {snapshot.room.deck.name}
              </div>
              <div className="room-summary-chip rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-slate-600">
                Участников: {snapshot.participants.length}
              </div>
              <div className="room-summary-chip rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-slate-600">
                История оценок: {snapshot.history.length}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:max-w-[420px] xl:justify-end">
            {snapshot.room.invite_link && (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                onClick={() => void handleCopyInvite()}
                type="button"
              >
                <Link2 className="h-4 w-4" />
                Пригласить
              </button>
            )}

            <button
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              onClick={handleExportHistory}
              type="button"
            >
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
              disabled={pendingAction === "room-leave"}
              onClick={() => void handleLeaveRoom()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Покинуть
            </button>

            {isOwner && (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                disabled={pendingAction === "room-delete"}
                onClick={() => void handleDeleteRoom()}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Удалить комнату
              </button>
            )}
          </div>
        </div>

        {socketError && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {socketError}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(300px,360px)]">
        <div className="space-y-6">
          <PlayerList
            canManage={isOwner}
            canTransferOwner={isOwner}
            currentParticipantId={snapshot.self_participant_id}
            onMakeOwner={handleTransferOwner}
            onRemoveParticipant={handleRemoveParticipant}
            participants={snapshot.participants}
            removingParticipantId={
              pendingAction?.startsWith("participant:") ? pendingAction.split(":")[1] : null
            }
            transferringParticipantId={
              pendingAction?.startsWith("owner:") ? pendingAction.split(":")[1] : null
            }
          />

          <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">История оценок</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Последние зафиксированные результаты по задачам комнаты.
            </p>

            <div className="mt-4 space-y-3">
              {snapshot.history.length ? (
                snapshot.history.slice(0, 6).map((item) => (
                  <div
                    className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="break-words font-medium text-slate-900">{item.task_title}</div>
                        <div className="mt-1 text-sm text-slate-500">{formatDate(item.created_at)}</div>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700">
                        {item.result_value}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-slate-50 p-4 text-sm text-slate-500">
                  История оценок появится после первого сохраненного reveal.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <PokerTable snapshot={snapshot} />

          <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">Управление задачами</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {isOwner
                  ? "Добавляйте задачи, переключайте активную и держите весь workflow комнаты в одном месте."
                  : "Здесь виден актуальный бэклог комнаты и прогресс по задачам."}
              </p>
            </div>

            {isOwner && (
              <form className="mt-5 grid gap-3 rounded-[24px] bg-slate-50 p-4" onSubmit={handleCreateTask}>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400"
                  name="title"
                  onChange={handleTaskCreateChange}
                  placeholder="Название новой задачи"
                  value={taskForm.title}
                />
                <textarea
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400"
                  name="description"
                  onChange={handleTaskCreateChange}
                  placeholder="Описание задачи"
                  value={taskForm.description}
                />
                <button
                  className="w-fit rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60"
                  disabled={pendingAction === "task-create"}
                  type="submit"
                >
                  {pendingAction === "task-create" ? "Добавляем..." : "Добавить задачу"}
                </button>
              </form>
            )}

            <div className="mt-4 space-y-3">
              {snapshot.tasks.length ? (
                snapshot.tasks.map((task) => (
                  <div className="rounded-[24px] border border-[var(--color-border)] p-4" key={task.id}>
                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                          name="title"
                          onChange={handleTaskEditChange}
                          value={editingTaskForm.title}
                        />
                        <textarea
                          className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                          name="description"
                          onChange={handleTaskEditChange}
                          value={editingTaskForm.description}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                            disabled={pendingAction === `task-save:${task.id}`}
                            onClick={() => void handleSaveTask(task.id)}
                            type="button"
                          >
                            Сохранить
                          </button>
                          <button
                            className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                            onClick={() => setEditingTaskId(null)}
                            type="button"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="break-words font-medium text-slate-950">{task.title}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              {taskStatusLabels[task.status] ?? task.status}
                              {task.estimate_value ? ` | ${task.estimate_value}` : ""}
                            </div>
                            {task.description && (
                              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {isOwner && (
                            <div className="flex flex-wrap gap-2 xl:shrink-0">
                              {snapshot.room.current_task_id !== task.id && (
                                <button
                                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                                  disabled={pendingAction === `task-select:${task.id}`}
                                  onClick={() => void handleSelectTask(task.id)}
                                  type="button"
                                >
                                  Сделать активной
                                </button>
                              )}
                              <button
                                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-slate-700"
                                onClick={() => startEditingTask(task)}
                                type="button"
                              >
                                Редактировать
                              </button>
                              <button
                                className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                                disabled={pendingAction === `task-delete:${task.id}`}
                                onClick={() => void handleDeleteTask(task.id)}
                                type="button"
                              >
                                Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-slate-50 p-4 text-sm text-slate-500">
                  {isOwner
                    ? "Задач пока нет. Добавьте первую задачу, чтобы начать оценку."
                    : "В этой комнате пока нет задач."}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className={garageDeck ? "space-y-6 xl:col-span-3" : "space-y-6"}>
          <VotingBoard onSnapshotChange={applySnapshot} snapshot={snapshot} />

          {isOwner && (
            <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-950">Администрирование комнаты</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Меняйте базовые настройки комнаты и управляйте жизненным циклом сессии.
                  </p>
                </div>
              </div>

              <form className="mt-5 space-y-3" onSubmit={handleRoomUpdate}>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Название комнаты</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                    name="name"
                    onChange={handleRoomChange}
                    value={roomForm.name}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Описание</span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                    name="description"
                    onChange={handleRoomChange}
                    value={roomForm.description}
                  />
                </label>

                <button
                  className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60"
                  disabled={pendingAction === "room-update"}
                  type="submit"
                >
                  {pendingAction === "room-update" ? "Сохраняем..." : "Сохранить настройки"}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
