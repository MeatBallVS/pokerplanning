import type { ParticipantResponse } from "@/shared/api/planningPokerApi";
import { PlayerCard } from "./PlayerCard";

interface PlayerListProps {
  canManage?: boolean;
  canTransferOwner?: boolean;
  currentParticipantId?: string | null;
  onMakeOwner?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  participants: ParticipantResponse[];
  removingParticipantId?: string | null;
  transferringParticipantId?: string | null;
}

export const PlayerList = ({
  canManage = false,
  canTransferOwner = false,
  currentParticipantId,
  onMakeOwner,
  onRemoveParticipant,
  participants,
  removingParticipantId,
  transferringParticipantId,
}: PlayerListProps) => {
  return (
    <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Участники</h2>
        <p className="text-sm leading-6 text-slate-500">
          Онлайн-статусы, отправленные голоса и быстрые действия управления.
        </p>
      </div>

      <div className="space-y-3">
        {participants.map((participant) => (
          <PlayerCard
            canManage={canManage}
            canTransferOwner={canTransferOwner}
            isCurrentUser={participant.id === currentParticipantId}
            isRemoving={removingParticipantId === participant.id}
            isTransferringOwner={transferringParticipantId === participant.id}
            key={participant.id}
            onMakeOwner={onMakeOwner}
            onRemove={onRemoveParticipant}
            participant={participant}
          />
        ))}
      </div>
    </section>
  );
};
