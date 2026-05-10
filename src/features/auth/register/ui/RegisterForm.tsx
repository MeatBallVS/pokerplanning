import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useRegister } from "../model/useRegister";

export const RegisterForm = () => {
  const { error, register, loading } = useRegister();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await register(form);
    const inviteToken = searchParams.get("invite");
    navigate(inviteToken ? `/invite/${inviteToken}` : "/rooms");
  };

  return (
    <form
      className="w-full max-w-md space-y-5 rounded-[32px] border border-slate-200 bg-white/92 p-7 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur"
      onSubmit={handleRegister}
    >
      <div className="space-y-2 text-center">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
          Пространство команды
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Регистрация</h1>
        <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">
          Создайте пользователя и сразу переходите к комнатам, задачам и приглашениям
          команды.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] shadow-inner shadow-slate-100 outline-none transition focus:border-indigo-400 focus:bg-white"
          name="name"
          onChange={handleChange}
          placeholder="Имя"
          value={form.name}
        />

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
          minLength={8}
          name="password"
          onChange={handleChange}
          placeholder="Пароль от 8 символов"
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
        {loading ? "Создаем..." : "Зарегистрироваться"}
      </button>

      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        После регистрации вы сразу попадете в рабочую зону и сможете создать первую
        комнату.
      </div>

      <Link
        className="block text-center text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
        to="/login"
      >
        Уже есть аккаунт
      </Link>
    </form>
  );
};
