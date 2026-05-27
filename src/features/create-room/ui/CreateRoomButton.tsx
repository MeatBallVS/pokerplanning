import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import { isGarageDeck } from "@/shared/config/deckPresentation";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { classNames } from "@/shared/lib/classNames";
import { DeckCard } from "@/shared/ui/DeckCard/DeckCard";

interface CreateRoomButtonProps {
  className?: string;
  label?: string;
  onCreated?: () => void | Promise<void>;
  size?: "compact" | "default";
}

const initialForm = {
  deck_preset_code: "fibonacci",
  description: "",
  name: "",
};

export const CreateRoomButton = ({
  className = "",
  label = "Создать комнату",
  onCreated,
  size = "default",
}: CreateRoomButtonProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const decksQuery = useQuery({
    queryKey: ["deck-presets"],
    queryFn: () => planningPokerApi.listDeckPresets(),
    staleTime: 60_000,
  });

  const availableDecks = useMemo(() => decksQuery.data ?? [], [decksQuery.data]);

  const createRoomMutation = useMutation({
    mutationFn: () =>
      planningPokerApi.createRoom({
        deck_preset_code: form.deck_preset_code,
        description: form.description.trim(),
        name: form.name.trim(),
      }),
    onSuccess: async (snapshot) => {
      toast.success("Комната создана.");
      setIsOpen(false);
      setForm(initialForm);
      await onCreated?.();
      navigate(`/room/${snapshot.room.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось создать комнату."));
    },
  });

  return (
    <>
      <button
        className={classNames(
          "studio-button inline-flex items-center gap-2 rounded-full font-semibold transition disabled:opacity-60",
          {},
          [size === "compact" ? "px-4 py-2.5 text-sm" : "px-5 py-3", className],
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="studio-card max-h-[calc(100vh-4rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] p-5 sm:p-6"
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.18 }}
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
                    Новая комната
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                    Создайте новую сессию оценки
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-soft)]">
                    Настройте название, описание и колоду. Комната сразу будет
                    готова к работе и приглашениям.
                  </p>
                </div>

                <button
                  aria-label="Закрыть создание комнаты"
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--color-text-soft)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Закрыть
                </button>
              </div>

              <form
                className="mt-6 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  createRoomMutation.mutate();
                }}
              >
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-soft)]">
                      Название комнаты
                    </span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                      name="name"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Например, Sprint 24 estimation"
                      value={form.name}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-soft)]">
                      Описание
                    </span>
                    <textarea
                      className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                      name="description"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder="Что оценивает команда и в каком контексте"
                      value={form.description}
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-3 text-sm font-medium text-[var(--color-text-soft)]">
                    Колода
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableDecks.map((deck) => {
                      const active = form.deck_preset_code === deck.code;

                      return (
                        <button
                          className={[
                            "min-w-0 rounded-3xl border p-4 text-left transition",
                            active
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 text-white shadow-sm"
                              : "border-white/10 bg-white/5 text-[var(--color-text-soft)] hover:border-white/20 hover:bg-white/8",
                          ].join(" ")}
                          key={deck.id}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, deck_preset_code: deck.code }))
                          }
                          type="button"
                        >
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <div className="min-w-0 break-words font-medium">{deck.name}</div>
                            {active && (
                              <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-[#181916]">
                                Выбрано
                              </span>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[var(--color-text-muted)]">
                            {deck.description}
                          </p>
                          <div
                            className={[
                              "mt-3 gap-2",
                              isGarageDeck(deck.code)
                                ? "grid grid-cols-2 sm:grid-cols-4"
                                : "flex flex-wrap",
                            ].join(" ")}
                          >
                            {deck.cards.slice(0, isGarageDeck(deck.code) ? 4 : 6).map((card) =>
                              isGarageDeck(deck.code) ? (
                                <DeckCard
                                  card={card}
                                  deckCode={deck.code}
                                  key={card}
                                  size="compact"
                                />
                              ) : (
                                <span
                                  className="rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-[var(--color-text-soft)]"
                                  key={card}
                                >
                                  {card}
                                </span>
                              ),
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm leading-6 text-[var(--color-text-muted)]">
                    Комната создаётся сразу с invite-ссылкой и готова к работе.
                  </div>

                  <button
                    className="studio-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!form.name.trim() || createRoomMutation.isPending}
                    type="submit"
                  >
                    {createRoomMutation.isPending ? "Создаем..." : "Создать комнату"}
                    {!createRoomMutation.isPending && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
