import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LogOut, Menu, Sparkles, UserRound, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { CreateRoomButton } from "@/features/create-room";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

const navItems = [
  { label: "Все комнаты", to: "/rooms" },
  { label: "Мои", to: "/rooms/owned" },
  { label: "Участвую", to: "/rooms/participating" },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-white text-[#181916]"
      : "text-[var(--color-text-soft)] hover:bg-white/10 hover:text-white",
  ].join(" ");

export const AppHeader = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => planningPokerApi.me(),
    staleTime: 60_000,
  });

  const initials = useMemo(() => {
    if (!user?.name) {
      return "PP";
    }

    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  const invalidateRooms = () => queryClient.invalidateQueries({ queryKey: ["rooms"] });

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    queryClient.clear();
    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#181916]/82 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[var(--color-primary)]">
              <LayoutGrid className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-base font-bold tracking-normal text-white sm:text-lg">
                Planning Poker
              </div>
              <div className="hidden items-center gap-2 text-xs text-[var(--color-text-muted)] sm:flex">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                <span className="truncate">Живые комнаты, задачи и оценки</span>
              </div>
            </div>
          </div>

          <nav className="hidden min-w-0 items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink className={linkClassName} key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <CreateRoomButton
                label="Новая"
                onCreated={() => void invalidateRooms()}
                size="compact"
              />

              <NavLink
                className="flex max-w-[180px] items-center gap-3 rounded-full border border-white/10 bg-white/8 px-2 py-1.5 transition hover:bg-white/12"
                to="/profile"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#181916]"
                  style={{ backgroundColor: user?.avatar_color ?? "#d8ff73" }}
                >
                  {initials || <UserRound className="h-4 w-4" />}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-white">
                  {user?.name ?? "Профиль"}
                </span>
              </NavLink>

              <button
                aria-label="Выйти"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-[var(--color-text-soft)] transition hover:bg-white/12 hover:text-white"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>

            <button
              aria-label={isMobileMenuOpen ? "Закрыть навигацию" : "Открыть навигацию"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white transition hover:bg-white/12 md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              type="button"
            >
              {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="studio-card mt-4 space-y-4 rounded-[24px] p-4 md:hidden"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/20 px-3 py-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#181916]"
                  style={{ backgroundColor: user?.avatar_color ?? "#d8ff73" }}
                >
                  {initials || <UserRound className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{user?.name ?? "Профиль"}</div>
                  <div className="truncate text-sm text-[var(--color-text-muted)]">
                    {user?.email ?? "Управление аккаунтом"}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "rounded-2xl px-4 py-3 text-sm font-medium transition",
                        isActive
                          ? "bg-white text-[#181916]"
                          : "bg-white/6 text-[var(--color-text-soft)]",
                      ].join(" ")
                    }
                    key={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}

                <NavLink
                  className="rounded-2xl bg-white/6 px-4 py-3 text-sm font-medium text-[var(--color-text-soft)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                  to="/profile"
                >
                  Профиль
                </NavLink>
              </div>

              <div className="grid gap-2">
                <CreateRoomButton
                  className="w-full justify-center"
                  label="Новая комната"
                  onCreated={() => void invalidateRooms()}
                  size="compact"
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
