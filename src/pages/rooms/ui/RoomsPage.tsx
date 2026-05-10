import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Copy,
  FolderKanban,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CreateRoomButton } from "@/features/create-room";
import { JoinRoomButton } from "@/features/join-room";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import type { RoomListItemResponse } from "@/shared/api/planningPokerApi";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

export type RoomsScope = "all" | "owned" | "participating";

interface RoomsPageProps {
  scope: RoomsScope;
}

const scopeMeta: Record<RoomsScope, { empty: string; title: string; subtitle: string }> = {
  all: {
    title: "Комнаты вашей команды",
    subtitle:
      "Все доступные комнаты в одном списке: свои, активные и те, куда вас пригласили.",
    empty: "У вас пока нет доступных комнат.",
  },
  owned: {
    title: "Мои комнаты",
    subtitle:
      "Здесь живут комнаты, где вы управляете составом, задачами, инвайтами и голосованием.",
    empty: "Вы еще не создали ни одной комнаты.",
  },
  participating: {
    title: "Где я участвую",
    subtitle:
      "Комнаты, в которые вас пригласили коллеги и где вы можете сразу включиться в оценку.",
    empty: "Вы пока не участвуете ни в одной чужой комнате.",
  },
};

const heroPreviewCards = ["1", "2", "3", "5", "8", "13", "21", "?"];

const RoomCardSkeleton = () => (
  <div className="animate-pulse rounded-[28px] border border-[var(--color-border)] bg-white/90 p-5 shadow-sm">
    <div className="h-5 w-40 rounded-full bg-slate-100" />
    <div className="mt-3 h-4 w-3/4 rounded-full bg-slate-100" />
    <div className="mt-6 flex gap-2">
      <div className="h-9 w-24 rounded-full bg-slate-100" />
      <div className="h-9 w-28 rounded-full bg-slate-100" />
    </div>
  </div>
);

export const RoomsPage = ({ scope }: RoomsPageProps) => {
  const queryClient = useQueryClient();
  const meta = scopeMeta[scope];

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => planningPokerApi.listRooms(),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => planningPokerApi.deleteRoom(roomId),
    onSuccess: () => {
      toast.success("Комната удалена.");
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось удалить комнату."));
    },
  });

  const filteredRooms = useMemo(() => {
    const rooms = roomsQuery.data ?? [];

    if (scope === "owned") {
      return rooms.filter((room) => room.viewer_role === "owner");
    }

    if (scope === "participating") {
      return rooms.filter((room) => room.viewer_role === "member");
    }

    return rooms;
  }, [roomsQuery.data, scope]);

  const stats = useMemo(() => {
    const rooms = roomsQuery.data ?? [];

    return {
      all: rooms.length,
      owned: rooms.filter((room) => room.viewer_role === "owner").length,
      participating: rooms.filter((room) => room.viewer_role === "member").length,
    };
  }, [roomsQuery.data]);

  const handleDeleteRoom = async (room: RoomListItemResponse) => {
    const confirmed = window.confirm(`Удалить комнату "${room.name}"? Это действие необратимо.`);

    if (!confirmed) {
      return;
    }

    deleteRoomMutation.mutate(room.id);
  };

  const handleCopyInvite = async (room: RoomListItemResponse) => {
    if (!room.invite_link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(room.invite_link);
      toast.success("Ссылка приглашения скопирована.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось скопировать ссылку приглашения."));
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[color:var(--color-surface-elevated)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.08)] 2xl:grid-cols-[minmax(0,1fr)_420px] xl:p-8">
        <div className="flex min-w-0 flex-col justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Живые комнаты, задачи и оценки
            </div>

            <h1 className="mt-5 max-w-xl text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl 2xl:text-5xl">
              {meta.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {meta.subtitle}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <CreateRoomButton onCreated={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })} />
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              to="/profile"
            >
              Профиль
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Всего комнат", value: stats.all.toString() },
              { label: "Ведете сами", value: stats.owned.toString() },
              { label: "Участвуете", value: stats.participating.toString() },
            ].map((item) => (
              <div
                className="rounded-3xl border border-[var(--color-border)] bg-white/85 p-4 shadow-sm"
                key={item.label}
              >
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {roomsQuery.isLoading ? "-" : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[30px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7ff_100%)] p-4 shadow-inner shadow-white sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Пример room screen</div>
              <div className="break-words text-sm leading-5 text-slate-500">
                Чистая доска, живые голоса и быстрые действия
              </div>
            </div>
            <div className="hidden shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:inline-flex">
              Sprint board
            </div>
          </div>

          <div className="mt-5 min-w-0 rounded-[26px] border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Текущая задача
                </div>
                <div className="mt-2 break-words text-base font-semibold text-slate-950 sm:text-lg">
                  Improve reconnect after connection loss
                </div>
              </div>

              <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Live
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroPreviewCards.map((card, index) => (
                <div
                  className={[
                    "flex h-14 items-center justify-center rounded-2xl border text-base font-semibold transition sm:h-16",
                    index === 3
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "border-indigo-200 bg-white text-indigo-700",
                  ].join(" ")}
                  key={card}
                >
                  {card}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-2 text-sm font-medium text-slate-700">
                  <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="break-words">6 участников в комнате</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-2 text-sm font-medium text-slate-700">
                  <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="break-words">14 задач в бэклоге</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {roomsQuery.isLoading ? (
          <div className="grid gap-4">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        ) : roomsQuery.isError ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Не удалось загрузить комнаты. Проверьте соединение с backend.
          </div>
        ) : !filteredRooms.length ? (
          <div className="rounded-[28px] border border-dashed border-[var(--color-border-strong)] bg-white/80 px-6 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">{meta.empty}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Создайте первую комнату, подключите команду по invite-ссылке и сразу
              начните оценку задач.
            </p>
            <div className="mt-6 flex justify-center">
              <CreateRoomButton onCreated={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRooms.map((room) => (
              <article
                className="min-w-0 rounded-[28px] border border-[var(--color-border)] bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                key={room.id}
              >
                <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="break-anywhere text-2xl font-semibold tracking-tight text-slate-950 transition hover:text-indigo-700"
                        to={`/room/${room.id}`}
                      >
                        {room.name}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        {room.viewer_role === "owner" ? "Владелец" : "Участник"}
                      </span>
                    </div>

                    <p className="max-w-3xl break-words text-sm leading-6 text-slate-500">
                      {room.description || "Описание комнаты пока не добавлено."}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-full border border-[var(--color-border)] bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                        {room.participants_count} участников
                      </div>
                      <div className="rounded-full border border-[var(--color-border)] bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                        {room.active_task_title
                          ? `Активная задача: ${room.active_task_title}`
                          : "Активная задача не выбрана"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                    <JoinRoomButton roomId={room.id} />

                    {room.invite_link && room.viewer_role === "owner" && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                        onClick={() => void handleCopyInvite(room)}
                        type="button"
                      >
                        <Copy className="h-4 w-4" />
                        Пригласить
                      </button>
                    )}

                    {room.viewer_role === "owner" && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        disabled={deleteRoomMutation.isPending}
                        onClick={() => void handleDeleteRoom(room)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
