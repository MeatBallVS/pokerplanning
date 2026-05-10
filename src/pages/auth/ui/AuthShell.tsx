import type { PropsWithChildren } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

interface AuthShellProps extends PropsWithChildren {
  mode: "login" | "register";
}

const bulletPoints = [
  "Быстрое создание комнаты и приглашение команды по ссылке",
  "Живое голосование, reveal и история оценок в одном окне",
  "Понятный room UI для ежедневной работы, а не для демонстрации",
];

const previewVotes = [
  { label: "Anna", value: "5" },
  { label: "Max", value: "3" },
  { label: "Sara", value: "8" },
  { label: "Den", value: "5" },
];

export const AuthShell = ({ children, mode }: AuthShellProps) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-slate-950">
              Planning Poker
            </div>
            <div className="text-sm text-slate-500">Командная оценка без лишнего шума</div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm md:flex">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Комнаты, задачи и голосование в реальном времени
          </div>
        </header>

        <main className="flex flex-1 items-start lg:items-center">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_430px] xl:gap-14">
            <section className="flex min-w-0 flex-col justify-center py-4 lg:py-10">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                {mode === "login"
                  ? "Команда уже ждет вас в комнате"
                  : "Подключайте команду за пару минут"}
              </div>

              <div className="mt-6 max-w-2xl">
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Planning Poker для команд, которым нужен чистый и быстрый процесс оценки
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  Мы держим фокус на комнате, текущей задаче и реальном голосовании, чтобы
                  обсуждение не терялось в интерфейсе, а оценка двигалась быстро.
                </p>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {bulletPoints.map((item) => (
                  <div
                    className="rounded-[24px] border border-slate-200 bg-white/88 p-4 text-sm leading-6 text-slate-600 shadow-sm"
                    key={item}
                  >
                    <CheckCircle2 className="mb-3 h-4 w-4 text-indigo-600" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 hidden max-w-3xl rounded-[32px] border border-slate-200 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:block">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      Комната оценки спринта
                    </div>
                    <div className="text-sm text-slate-500">Предпросмотр рабочего экрана</div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Активный раунд
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Участники
                    </div>
                    <div className="mt-4 space-y-3">
                      {previewVotes.map((vote, index) => (
                        <div className="flex items-center justify-between gap-3" key={vote.label}>
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                              style={{
                                backgroundColor: ["#3b82f6", "#8b5cf6", "#0ea5e9", "#22c55e"][index],
                              }}
                            >
                              {vote.label[0]}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-slate-900">
                                {vote.label}
                              </div>
                              <div className="text-xs text-slate-500">Онлайн</div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">
                            {vote.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Текущая задача
                        </div>
                        <div className="mt-2 break-words text-lg font-semibold text-slate-950">
                          Упростить восстановление комнаты после потери соединения
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>

                    <div className="mt-8 grid grid-cols-4 gap-3">
                      {["1", "2", "3", "5", "8", "13", "21", "?"].map((card, index) => (
                        <div
                          className={[
                            "flex h-16 items-center justify-center rounded-2xl border text-base font-semibold transition",
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
                  </div>
                </div>
              </div>
            </section>

            <section className="flex items-center justify-center py-4 lg:py-10">{children}</section>
          </div>
        </main>
      </div>
    </div>
  );
};
