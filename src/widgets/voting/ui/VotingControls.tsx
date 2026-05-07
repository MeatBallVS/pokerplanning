import { Eye, Play, RotateCcw } from "lucide-react";

interface Props {
  canReveal: boolean;
  canReset: boolean;
  disabled?: boolean;
  hasRound: boolean;
  onReset: () => void;
  onReveal: () => void;
  onStart: () => void;
}

export const VotingControls = ({
  canReveal,
  canReset,
  disabled,
  hasRound,
  onReveal,
  onReset,
  onStart,
}: Props) => {
  return (
    <div className="flex flex-wrap gap-3">
      {!hasRound && (
        <button
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60"
          disabled={disabled}
          onClick={onStart}
          type="button"
        >
          <Play className="h-4 w-4" />
          Начать раунд
        </button>
      )}

      <button
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
        disabled={disabled || !canReveal}
        onClick={onReveal}
        type="button"
      >
        <Eye className="h-4 w-4" />
        Открыть карты
      </button>

      <button
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
        disabled={disabled || !canReset}
        onClick={onReset}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        Сбросить
      </button>
    </div>
  );
};
