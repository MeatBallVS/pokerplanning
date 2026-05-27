import { Activity, CheckCircle2, FolderKanban, Radio, UsersRound } from "lucide-react";
import type { RoomSnapshotResponse } from "@/shared/api/planningPokerApi";
import { isGarageDeck } from "@/shared/config/deckPresentation";
import { DeckCard } from "@/shared/ui/DeckCard/DeckCard";

interface PokerTableProps {
  snapshot: RoomSnapshotResponse;
}

export const PokerTable = ({ snapshot }: PokerTableProps) => {
  const activeTask = snapshot.tasks.find((task) => task.id === snapshot.room.current_task_id);
  const onlineCount = snapshot.participants.filter((participant) => participant.is_online).length;
  const votedCount = snapshot.participants.filter((participant) => participant.has_voted).length;
  const estimatedCount = snapshot.tasks.filter((task) => Boolean(task.estimate_value)).length;

  return (
    <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_300px]">
        <div className="min-w-0 rounded-[28px] border border-[var(--color-border)] bg-white/5 p-5 shadow-inner shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Текущая задача
              </div>
              <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
                {activeTask?.title ?? "Задача пока не выбрана"}
              </h2>
            </div>

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {snapshot.active_round ? "Раунд идет" : "Готово к старту"}
            </div>
          </div>

          <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-[var(--color-text-soft)]">
            {activeTask?.description ||
              snapshot.room.description ||
              "Выберите активную задачу, чтобы участники могли сразу перейти к голосованию без лишних шагов."}
          </p>

          <div className="poker-metrics-grid mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: UsersRound,
                label: "Участников",
                value: snapshot.participants.length.toString(),
              },
              {
                icon: Radio,
                label: "Онлайн сейчас",
                value: onlineCount.toString(),
              },
              {
                icon: CheckCircle2,
                label: "Оценено задач",
                value: estimatedCount.toString(),
              },
            ].map((item) => (
              <div className="poker-metric-card rounded-3xl border border-white/10 bg-white/6 p-4 shadow-sm" key={item.label}>
                <div className="poker-metric-label flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
                  <item.icon className="poker-metric-icon h-4 w-4 text-indigo-600" />
                  <span>{item.label}</span>
                </div>
                <div className="poker-metric-value mt-3 text-2xl font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-[var(--color-border)] bg-white/6 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Предпросмотр колоды</div>
                <div className="text-sm text-[var(--color-text-soft)]">{snapshot.room.deck.name}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Отправлено голосов: {votedCount}
              </div>
            </div>

            <div
              className={[
                "mt-4 grid gap-3",
                isGarageDeck(snapshot.room.deck.code)
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-4",
              ].join(" ")}
            >
              {snapshot.room.deck.cards
                .slice(0, isGarageDeck(snapshot.room.deck.code) ? 10 : 8)
                .map((card, index) => (
                  <DeckCard
                    card={card}
                    deckCode={snapshot.room.deck.code}
                    key={`${card}-${index}`}
                    selected={index === 3}
                    size="preview"
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-[var(--color-border)] bg-white/5 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
              <FolderKanban className="h-4 w-4 text-indigo-600" />
              Срез бэклога
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{snapshot.tasks.length}</div>
            <div className="mt-1 text-sm text-[var(--color-text-soft)]">задач в комнате</div>
          </div>

          <div className="rounded-[28px] border border-[var(--color-border)] bg-white/5 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
              <Activity className="h-4 w-4 text-indigo-600" />
              Активные участники
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.participants.slice(0, 5).map((participant) => (
                <div className="flex items-center justify-between gap-3" key={participant.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: participant.avatar_color }}
                    >
                      {participant.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">{participant.name}</div>
                      <div className="text-xs text-[var(--color-text-soft)]">
                        {participant.role === "owner" ? "Ведущий" : "Участник"}
                      </div>
                    </div>
                  </div>

                  <div
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      participant.is_online
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {participant.is_online ? "Online" : "Offline"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
