import type { RoundStateResponse } from "@/shared/api/planningPokerApi";

interface Props {
  round: RoundStateResponse | null;
}

const statusLabels: Record<string, string> = {
  voting: "Идет голосование",
  revealed: "Карты открыты",
  finalized: "Раунд завершен",
};

export const VoteResults = ({ round }: Props) => {
  if (!round) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-slate-50 p-4 text-sm leading-6 text-slate-500">
        Раунд еще не запущен. Нажмите «Начать раунд», чтобы активировать карты и собрать оценки
        всей команды в одном потоке.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[24px] bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            label: "Голоса",
            value: `${round.votes_submitted}/${round.total_participants}`,
          },
          {
            label: "Статус",
            value: statusLabels[round.status] ?? round.status,
          },
          {
            label: "Среднее",
            value: round.average_score !== null ? String(round.average_score) : "—",
          },
          {
            label: "Результат",
            value: round.suggested_result ?? "Скрыт до reveal",
          },
        ].map((item) => (
          <div className="rounded-2xl bg-white p-4 shadow-sm" key={item.label}>
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">{item.value}</div>
          </div>
        ))}
      </div>

      {!!Object.keys(round.distribution).length && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="text-sm font-medium text-slate-700">Распределение голосов</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(round.distribution).map(([value, count]) => (
              <span
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                key={value}
              >
                {value}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
