import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Copy, FolderKanban, Sparkles, Trash2, UsersRound } from "lucide-react";
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
    subtitle: "Все доступные пространства оценки: свои, активные и те, куда вас пригласили.",
    empty: "У вас пока нет доступных комнат.",
  },
  owned: {
    title: "Мои комнаты",
    subtitle: "Комнаты, где вы управляете участниками, задачами, invite-ссылками и голосованием.",
    empty: "Вы ещё не создали ни одной комнаты.",
  },
  participating: {
    title: "Где я участвую",
    subtitle: "Комнаты, куда вас пригласили коллеги и где можно сразу включиться в оценку.",
    empty: "Вы пока не участвуете ни в одной чужой комнате.",
  },
};

const previewCards = ["1", "2", "3", "5", "8", "13", "?"];

const RoomCardSkeleton = () => (
  <div className="studio-card min-h-[170px] animate-pulse rounded-[24px] p-5">
    <div className="h-5 w-44 rounded-full bg-white/10" />
    <div className="mt-4 h-4 w-3/4 rounded-full bg-white/10" />
    <div className="mt-6 flex gap-2">
      <div className="h-10 w-24 rounded-full bg-white/10" />
      <div className="h-10 w-28 rounded-full bg-white/10" />
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
    const confirmed = window.confirm(
      `Удалить комнату "${room.name}"? Это действие нельзя отменить.`,
    );

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
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="studio-frame p-5 sm:p-6 lg:p-8">
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--color-primary-strong)]">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">Home screen / poker planning</span>
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-normal text-white sm:text-5xl lg:text-6xl">
              {meta.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-soft)] sm:text-lg">
              {meta.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CreateRoomButton onCreated={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })} />
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/12"
                to="/profile"
              >
                Профиль
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Всего комнат", value: stats.all.toString() },
                { label: "Ведёте сами", value: stats.owned.toString() },
                { label: "Участвуете", value: stats.participating.toString() },
              ].map((item) => (
                <div className="studio-card-quiet min-w-0 rounded-2xl p-4" key={item.label}>
                  <div className="truncate text-sm text-[var(--color-text-muted)]">{item.label}</div>
                  <div className="mt-2 truncate text-2xl font-bold text-white">
                    {roomsQuery.isLoading ? "-" : item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-card min-w-0 rounded-[26px] p-4 sm:p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Active round
                </div>
                <div className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                  Оценка восстановления комнаты после reconnect
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[#181916]">
                Live
              </span>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {previewCards.map((card, index) => (
                <div
                  className={[
                    "flex aspect-[3/4] min-h-14 items-center justify-center rounded-2xl border text-base font-bold",
                    index === 3
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[#181916]"
                      : "border-white/10 bg-black/20 text-white",
                  ].join(" ")}
                  key={card}
                >
                  {card}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-2 text-sm font-medium text-white">
                  <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <span className="line-clamp-2">Участники видят голоса в реальном времени</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-2 text-sm font-medium text-white">
                  <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <span className="line-clamp-2">Backlog, reveal и экспорт оценок в одном месте</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {roomsQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        ) : roomsQuery.isError ? (
          <div className="rounded-[24px] border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-100">
            Не удалось загрузить комнаты. Проверьте соединение с backend.
          </div>
        ) : !filteredRooms.length ? (
          <div className="studio-card rounded-[26px] px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/14 text-[var(--color-primary)]">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{meta.empty}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-soft)]">
              Создайте первую комнату, подключите команду по invite-ссылке и начните оценку задач.
            </p>
            <div className="mt-6 flex justify-center">
              <CreateRoomButton onCreated={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredRooms.map((room) => (
              <article className="studio-card min-w-0 rounded-[24px] p-5" key={room.id}>
                <div className="flex min-w-0 flex-col gap-5">
                  <div className="min-w-0 space-y-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Link
                        className="min-w-0 max-w-full break-anywhere text-2xl font-semibold tracking-normal text-white transition hover:text-[var(--color-primary-strong)]"
                        to={`/room/${room.id}`}
                      >
                        {room.name}
                      </Link>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
                        {room.viewer_role === "owner" ? "Владелец" : "Участник"}
                      </span>
                    </div>

                    <p className="line-clamp-3 max-w-3xl break-words text-sm leading-6 text-[var(--color-text-soft)]">
                      {room.description || "Описание комнаты пока не добавлено."}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-[var(--color-text-soft)]">
                        {room.participants_count} участников
                      </div>
                      <div className="max-w-full rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-[var(--color-text-soft)]">
                        <span className="line-clamp-2">
                          {room.active_task_title
                            ? `Активная задача: ${room.active_task_title}`
                            : "Активная задача не выбрана"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <JoinRoomButton roomId={room.id} />

                    {room.invite_link && room.viewer_role === "owner" && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12"
                        onClick={() => void handleCopyInvite(room)}
                        type="button"
                      >
                        <Copy className="h-4 w-4" />
                        Пригласить
                      </button>
                    )}

                    {room.viewer_role === "owner" && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/16 disabled:opacity-60"
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
