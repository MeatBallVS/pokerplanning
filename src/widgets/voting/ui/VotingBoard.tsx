import { useState } from "react";
import { Vote } from "lucide-react";
import { toast } from "sonner";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import type { RoomSnapshotResponse } from "@/shared/api/planningPokerApi";
import { CardSelector } from "./CardSelector";
import { VoteResults } from "./VoteResults";
import { VotingControls } from "./VotingControls";

interface VotingBoardProps {
  onSnapshotChange: (snapshot: RoomSnapshotResponse) => void;
  snapshot: RoomSnapshotResponse;
}

const roundStatusLabels: Record<string, string> = {
  finalized: "Завершен",
  revealed: "Карты открыты",
  voting: "Идет голосование",
};

export const VotingBoard = ({ onSnapshotChange, snapshot }: VotingBoardProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRound = snapshot.active_round;

  const runAction = async (action: () => Promise<RoomSnapshotResponse | void>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await action();
      if (result) {
        onSnapshotChange(result);
      } else {
        onSnapshotChange(await planningPokerApi.getRoom(snapshot.room.id));
      }
    } catch {
      const message = "Действие не выполнено. Проверьте права и состояние раунда.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <Vote className="h-4 w-4 text-indigo-600" />
            Доска голосования
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Голосование
          </h2>
          <div className="mt-2 text-sm text-slate-500">Колода: {snapshot.room.deck.name}</div>
        </div>

        <div
          className={[
            "rounded-full px-3 py-1 text-xs font-medium",
            activeRound
              ? "bg-emerald-50 text-emerald-700"
              : "border border-[var(--color-border)] bg-white text-slate-600",
          ].join(" ")}
        >
          {activeRound
            ? roundStatusLabels[activeRound.status] ?? activeRound.status
            : "Раунд не начат"}
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-500">
        Выберите карту, чтобы отправить свою оценку. Пока reveal не выполнен, голоса
        команды остаются скрытыми.
      </p>

      <CardSelector
        cards={snapshot.room.deck.cards}
        deckCode={snapshot.room.deck.code}
        disabled={loading || !activeRound}
        onSelect={(value) =>
          activeRound &&
          runAction(() => planningPokerApi.submitVote(snapshot.room.id, activeRound.id, value))
        }
        selectedValue={activeRound?.self_vote_value}
      />

      <VoteResults round={activeRound} />

      <VotingControls
        canReset={Boolean(activeRound)}
        canReveal={Boolean(activeRound?.can_reveal)}
        disabled={loading}
        hasRound={Boolean(activeRound)}
        onReset={() =>
          activeRound &&
          runAction(() => planningPokerApi.resetRound(snapshot.room.id, activeRound.id))
        }
        onReveal={() =>
          activeRound &&
          runAction(() => planningPokerApi.revealRound(snapshot.room.id, activeRound.id))
        }
        onStart={() =>
          runAction(() => planningPokerApi.startRound(snapshot.room.id, snapshot.room.current_task_id))
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
};
