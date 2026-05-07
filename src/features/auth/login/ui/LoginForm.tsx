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
      className="w-full max-w-md space-y-5 rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur"
      onSubmit={handleLogin}
    >
      <div className="space-y-2 text-center">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
          Welcome back
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Вход</h1>
        <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">
          Можно использовать демо-пользователя из backend seed.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] shadow-inner shadow-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white"
          name="email"
          onChange={handleChange}
          placeholder="Email"
          type="email"
          value={form.email}
        />

        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] shadow-inner shadow-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white"
          name="password"
          onChange={handleChange}
          placeholder="Пароль"
          type="password"
          value={form.password}
        />
      </div>

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <button
        className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Входим..." : "Войти"}
      </button>

      <Link className="block text-center text-sm font-medium text-indigo-600 transition hover:text-indigo-500" to="/register">
        Создать аккаунт
      </Link>
    </form>
  );
};
