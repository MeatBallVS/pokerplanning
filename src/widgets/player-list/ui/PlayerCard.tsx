import { Crown, ShieldCheck, UserMinus } from "lucide-react";
import type { ParticipantResponse } from "@/shared/api/planningPokerApi";
import { PlayerStatus } from "./PlayerStatus";

interface PlayerCardProps {
  canManage: boolean;
  canTransferOwner?: boolean;
  isCurrentUser: boolean;
  isRemoving: boolean;
  isTransferringOwner?: boolean;
  onMakeOwner?: (participantId: string) => void;
  onRemove?: (participantId: string) => void;
  participant: ParticipantResponse;
}

const roleLabels = {
  member: "Участник",
  owner: "Ведущий",
};

export const PlayerCard = ({
  canManage,
  canTransferOwner = false,
  isCurrentUser,
  isRemoving,
  isTransferringOwner = false,
  onMakeOwner,
  onRemove,
  participant,
}: PlayerCardProps) => {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: participant.avatar_color }}
          >
            {participant.name.slice(0, 1).toUpperCase()}
          </span>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {participant.name}
              {isCurrentUser ? " (вы)" : ""}
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                {roleLabels[participant.role]}
              </span>
              {participant.role === "owner" && <Crown className="h-4 w-4 text-amber-500" />}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <PlayerStatus isOnline={participant.is_online} voted={participant.has_voted} />
        </div>
      </div>

      {(canManage && participant.role !== "owner" && onRemove) ||
      (canTransferOwner && participant.role !== "owner" && onMakeOwner) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {canTransferOwner && onMakeOwner && (
            <button
              className="inline-flex min-w-[150px] max-w-full flex-1 items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-medium leading-tight text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
              disabled={isTransferringOwner}
              onClick={() => onMakeOwner(participant.id)}
              type="button"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="button-label">
                {isTransferringOwner ? "Передаем..." : "Назначить ведущим"}
              </span>
            </button>
          )}

          {canManage && onRemove && (
            <button
              className="inline-flex min-w-[120px] max-w-full flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium leading-tight text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              disabled={isRemoving}
              onClick={() => onRemove(participant.id)}
              type="button"
            >
              <UserMinus className="h-4 w-4" />
              <span className="button-label">{isRemoving ? "Удаляем..." : "Удалить"}</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
