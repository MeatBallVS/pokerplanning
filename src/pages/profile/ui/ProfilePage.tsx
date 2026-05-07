import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import { formatDate } from "@/shared/lib/formatDate";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [hasTyped, setHasTyped] = useState(false);

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => planningPokerApi.me(),
    staleTime: 60_000,
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => planningPokerApi.listRooms(),
    staleTime: 30_000,
  });

  const initials = useMemo(() => {
    if (!userQuery.data?.name) {
      return "PP";
    }

    return userQuery.data.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [userQuery.data]);

  const stats = useMemo(() => {
    const rooms = roomsQuery.data ?? [];

    return {
      all: rooms.length,
      owned: rooms.filter((room) => room.viewer_role === "owner").length,
      participating: rooms.filter((room) => room.viewer_role === "member").length,
    };
  }, [roomsQuery.data]);

  const resolvedForm = useMemo(() => {
    if (!userQuery.data) {
      return form;
    }

    return hasTyped
      ? form
      : {
          email: userQuery.data.email,
          name: userQuery.data.name,
          password: "",
        };
  }, [form, hasTyped, userQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      planningPokerApi.updateProfile({
        email: resolvedForm.email,
        name: resolvedForm.name,
        password: resolvedForm.password || undefined,
      }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["me"], updatedUser);
      setHasTyped(false);
      setForm({
        email: updatedUser.email,
        name: updatedUser.name,
        password: "",
      });
      toast.success("Профиль обновлен.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Не удалось сохранить профиль."));
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const base =
      hasTyped || !userQuery.data
        ? form
        : {
            email: userQuery.data.email,
            name: userQuery.data.name,
            password: "",
          };

    setHasTyped(true);
    setForm({ ...base, [name]: value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfileMutation.mutate();
  };

  if (userQuery.isLoading) {
    return (
      <div className="grid gap-6 px-5 py-6 sm:px-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="animate-pulse space-y-6">
          <div className="rounded-[30px] border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-slate-100" />
            <div className="mt-5 h-6 w-40 rounded-full bg-slate-100" />
            <div className="mt-3 h-4 w-52 rounded-full bg-slate-100" />
          </div>
          <div className="rounded-[30px] border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
            <div className="h-5 w-32 rounded-full bg-slate-100" />
            <div className="mt-5 grid gap-3">
              <div className="h-20 rounded-3xl bg-slate-100" />
              <div className="h-20 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="animate-pulse rounded-[30px] border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
          <div className="h-7 w-56 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-80 rounded-full bg-slate-100" />
          <div className="mt-8 grid gap-4">
            <div className="h-24 rounded-[24px] bg-slate-100" />
            <div className="h-24 rounded-[24px] bg-slate-100" />
            <div className="h-24 rounded-[24px] bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Не удалось загрузить профиль. Проверьте доступ к backend и повторите попытку.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 px-5 py-6 sm:px-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4">
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-lg"
              style={{ backgroundColor: userQuery.data.avatar_color ?? "#4f46e5" }}
            >
              {initials}
            </span>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {userQuery.data.name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4 text-indigo-600" />
                {userQuery.data.email}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Аккаунт создан {formatDate(userQuery.data.created_at)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
                to="/rooms/owned"
              >
                Мои комнаты
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                to="/rooms"
              >
                Все комнаты
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Workspace summary</h2>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Всего комнат", value: stats.all.toString() },
              { label: "Ведете сами", value: stats.owned.toString() },
              { label: "Участвуете", value: stats.participating.toString() },
            ].map((item) => (
              <div
                className="rounded-3xl border border-[var(--color-border)] bg-slate-50 px-4 py-4"
                key={item.label}
              >
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {roomsQuery.isLoading ? "—" : item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Безопасность аккаунта</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Обновляйте пароль только при необходимости и используйте уникальную комбинацию
                длиной от 8 символов.
              </p>
            </div>
          </div>
        </section>
      </div>

      <form
        className="space-y-6 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)]"
        onSubmit={handleSubmit}
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <UserRound className="h-4 w-4 text-indigo-600" />
            Account settings
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Профиль пользователя
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Здесь можно обновить имя, email и задать новый пароль. Изменения сразу отражаются
            в header и внутри комнат.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Имя</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
              name="name"
              onChange={handleChange}
              value={resolvedForm.name}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white"
              name="email"
              onChange={handleChange}
              type="email"
              value={resolvedForm.email}
            />
          </label>
        </div>

        <label className="grid gap-2 rounded-[24px] bg-slate-50 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            Новый пароль
          </span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400"
            minLength={8}
            name="password"
            onChange={handleChange}
            placeholder="Оставьте пустым, если менять пароль не нужно"
            type="password"
            value={resolvedForm.password}
          />
          <p className="text-xs leading-5 text-slate-500">
            Пароль не сохраняется в поле после успешного обновления.
          </p>
        </label>

        {updateProfileMutation.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(updateProfileMutation.error, "Не удалось сохранить профиль.")}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">Изменения применяются сразу</div>
            <div className="mt-1 text-sm text-slate-500">
              Данные используются в списках участников, invite-flow и навигации.
            </div>
          </div>

          <button
            className="rounded-full bg-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60"
            disabled={updateProfileMutation.isPending}
            type="submit"
          >
            {updateProfileMutation.isPending ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
};
