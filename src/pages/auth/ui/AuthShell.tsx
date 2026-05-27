import type { PropsWithChildren } from "react";
import { CheckCircle2, Clock3, Radio, Sparkles, UsersRound } from "lucide-react";

interface AuthShellProps extends PropsWithChildren {
  mode: "login" | "register";
}

const quickStats = [
  { label: "Комнаты", value: "Live" },
  { label: "Reveal", value: "1 click" },
  { label: "История", value: "CSV" },
];

const previewVotes = [
  { label: "Anna", status: "готова", value: "5" },
  { label: "Max", status: "готов", value: "3" },
  { label: "Sara", status: "думает", value: "?" },
];

export const AuthShell = ({ children, mode }: AuthShellProps) => {
  return (
    <div className="studio-page min-h-screen px-4 py-6 text-[var(--color-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1180px] flex-col justify-between gap-6">
        <header className="flex items-center justify-between gap-4 px-1 text-xs text-[var(--color-text-soft)] sm:text-sm">
          <span className="min-w-0 truncate">Planning poker</span>
          <span className="min-w-0 truncate">Team estimation screen</span>
        </header>

        <main className="studio-frame mx-auto grid w-full gap-0 lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="relative flex min-w-0 flex-col justify-between gap-8 p-5 sm:p-7 lg:p-10">
            <nav className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-bold text-white">
                  PP
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">Planning Poker</div>
                  <div className="truncate text-xs text-[var(--color-text-muted)]">
                    оценка задач в реальном времени
                  </div>
                </div>
              </div>

              <div className="hidden min-w-0 items-center gap-6 text-xs text-[var(--color-text-soft)] md:flex">
                <span>Комнаты</span>
                <span>Голосование</span>
                <span>История</span>
              </div>
            </nav>

            <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-end">
              <div className="min-w-0">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--color-primary-strong)]">
                  <Radio className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {mode === "login" ? "Команда уже ждёт вас" : "Новая команда за пару минут"}
                  </span>
                </div>

                <h1 className="mt-8 max-w-[680px] text-balance text-4xl font-bold leading-[1.05] tracking-normal text-white sm:text-5xl lg:text-6xl">
                  Покер планирования без хаоса в созвоне
                </h1>
                <p className="mt-5 max-w-[560px] text-base leading-7 text-[var(--color-text-soft)] sm:text-lg">
                  Создавайте комнату, добавляйте задачи, приглашайте участников по ссылке и
                  раскрывайте оценки в одном спокойном рабочем экране.
                </p>

                <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-3">
                  {quickStats.map((stat) => (
                    <div className="studio-card-quiet min-w-0 rounded-2xl p-4" key={stat.label}>
                      <div className="truncate text-xs text-[var(--color-text-muted)]">
                        {stat.label}
                      </div>
                      <div className="mt-2 truncate text-lg font-semibold text-white">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="studio-card hidden min-w-0 rounded-3xl p-4 xl:block">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      Sprint room
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">
                      Realtime voting
                    </div>
                  </div>
                  <Clock3 className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                </div>

                <div className="mt-5 space-y-3">
                  {previewVotes.map((vote, index) => (
                    <div
                      className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-black/18 p-3"
                      key={vote.label}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#181916]"
                          style={{
                            backgroundColor: ["#d8ff73", "#f3d58a", "#a8d8ff"][index],
                          }}
                        >
                          {vote.label[0]}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">
                            {vote.label}
                          </div>
                          <div className="truncate text-xs text-[var(--color-text-muted)]">
                            {vote.status}
                          </div>
                        </div>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-sm font-semibold text-white">
                        {vote.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-[var(--color-primary)]/12 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary-strong)]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Reveal готов</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-soft)]">
                    Карты скрыты до раскрытия, история оценок сохраняется по задачам.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                без наложений
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <UsersRound className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                читаемый UI
              </span>
            </div>
          </section>

          <aside className="min-w-0 border-t border-white/10 bg-black/16 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex h-full min-w-0 items-center justify-center">{children}</div>
          </aside>
        </main>

        <footer className="px-1 text-xs text-[var(--color-text-soft)]">Animation ready</footer>
      </div>
    </div>
  );
};
