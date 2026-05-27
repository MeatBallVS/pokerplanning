import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLogin } from "../model/useLogin";

const demoCredentials = {
  email: "anna.demo@example.com",
  password: "DemoPass123!",
};

export const LoginForm = () => {
  const { error, login, loading } = useLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(demoCredentials);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(form);
    const inviteToken = searchParams.get("invite");
    navigate(inviteToken ? `/invite/${inviteToken}` : "/rooms");
  };

  return (
    <form
      className="studio-card w-full max-w-md space-y-5 rounded-[28px] p-5 sm:p-6"
      onSubmit={handleLogin}
    >
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
          С возвращением
        </div>
        <h1 className="text-3xl font-bold tracking-normal text-white">Вход</h1>
        <p className="max-w-sm text-sm leading-6 text-[var(--color-text-soft)]">
          Демо-аккаунт уже подставлен. Нажмите вход и проверьте комнаты,
          голосование и историю оценок.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          name="email"
          onChange={handleChange}
          placeholder="Email"
          type="email"
          value={form.email}
        />

        <input
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          name="password"
          onChange={handleChange}
          placeholder="Пароль"
          type="password"
          value={form.password}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </div>
      )}

      <button
        className="studio-button w-full rounded-full px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Входим..." : "Войти"}
      </button>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-[var(--color-text-soft)]">
        Для ручной проверки: anna.demo@example.com / DemoPass123!
      </div>

      <Link
        className="block text-center text-sm font-medium text-[var(--color-primary-strong)] transition hover:text-white"
        to="/register"
      >
        Создать аккаунт
      </Link>
    </form>
  );
};
