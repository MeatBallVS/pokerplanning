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
          "inline-flex items-center gap-2 rounded-full bg-indigo-600 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60",
          {},
          [size === "compact" ? "px-4 py-2.5 text-sm" : "px-5 py-3", className],
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_32px_90px_rgba(15,23,42,0.22)]"
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
                    New room
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Создайте новую сессию оценки
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Настройте название, описание и колоду сразу, чтобы комната была готова к
                    работе без лишних шагов.
                  </p>
                </div>

                <button
                  aria-label="Закрыть создание комнаты"
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
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
                    <span className="text-sm font-medium text-slate-700">Название комнаты</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
                      name="name"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Например, Sprint 24 estimation"
                      value={form.name}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Описание</span>
                    <textarea
                      className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
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
                  <div className="mb-3 text-sm font-medium text-slate-700">Колода</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableDecks.map((deck) => {
                      const active = form.deck_preset_code === deck.code;

                      return (
                        <button
                          className={[
                            "rounded-3xl border p-4 text-left transition",
                            active
                              ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
                              : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-indigo-200 hover:bg-white",
                          ].join(" ")}
                          key={deck.id}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, deck_preset_code: deck.code }))
                          }
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium">{deck.name}</div>
                            {active && (
                              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">
                                Выбрано
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{deck.description}</p>
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
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600"
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

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Комната создается сразу с invite-ссылкой и готова к работе.
                  </div>

                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
