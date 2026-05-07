import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  Menu,
  MoonStar,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { CreateRoomButton } from "@/features/create-room";
import { useTheme } from "@/app/providers/theme/useTheme";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

const navItems = [
  { label: "Все комнаты", to: "/rooms" },
  { label: "Мои комнаты", to: "/rooms/owned" },
  { label: "Участвую", to: "/rooms/participating" },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
      : "text-slate-600 hover:bg-white hover:text-slate-950",
  ].join(" ");

export const AppHeader = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color:var(--color-surface-elevated)]/88 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="h-5 w-5" />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-950">Planning Poker</div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Realtime estimation workspace
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink className={linkClassName} key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <CreateRoomButton
                label="Новая комната"
                onCreated={() => void invalidateRooms()}
                size="compact"
              />

              <NavLink
                className="hidden items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/90 px-2.5 py-1.5 shadow-sm transition hover:border-indigo-200 sm:flex"
                to="/profile"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: user?.avatar_color ?? "#4f46e5" }}
                >
                  {initials || <UserRound className="h-4 w-4" />}
                </span>
                <span className="max-w-32 truncate text-sm font-medium text-slate-700">
                  {user?.name ?? "Профиль"}
                </span>
              </NavLink>

              <button
                className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
                onClick={handleLogout}
                type="button"
              >
                Выйти
              </button>
            </div>

            <button
              aria-label="Переключить тему"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/90 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
              onClick={toggleTheme}
              type="button"
            >
              {theme === "dark" ? <SunMedium className="h-4.5 w-4.5" /> : <MoonStar className="h-4.5 w-4.5" />}
            </button>

            <button
              aria-label={isMobileMenuOpen ? "Закрыть навигацию" : "Открыть навигацию"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/90 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 md:hidden"
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
              className="mt-4 space-y-4 rounded-[28px] border border-[var(--color-border)] bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:hidden"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: user?.avatar_color ?? "#4f46e5" }}
                >
                  {initials || <UserRound className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{user?.name ?? "Профиль"}</div>
                  <div className="truncate text-sm text-slate-500">
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
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                          : "bg-slate-50 text-slate-700",
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
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
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
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-slate-700"
                  onClick={handleLogout}
                  type="button"
                >
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
