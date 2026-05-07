import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, TriangleAlert } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

export const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  const authToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  useEffect(() => {
    if (!token || !authToken) {
      return;
    }

    let isMounted = true;

    planningPokerApi
      .joinInvitation(token)
      .then((snapshot) => {
        if (isMounted) {
          navigate(`/room/${snapshot.room.id}`, { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось присоединиться к комнате по приглашению.");
          setJoining(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authToken, navigate, token]);

  if (!token) {
    return <Navigate replace to="/rooms" />;
  }

  if (!authToken) {
    return <Navigate replace to={`/login?invite=${token}`} />;
  }

  if (joining) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
            <LoaderCircle className="h-7 w-7 animate-spin" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
            Подключаем вас к комнате
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Проверяем invite-ссылку, добавляем вас в состав участников и готовим room screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
          <TriangleAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
          Приглашение недоступно
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {error ?? "Ссылка приглашения больше не работает или у вас нет доступа."}
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
            to="/rooms"
          >
            Перейти к списку комнат
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">
          Если ссылка пришла только что, возможно invite уже был деактивирован или истек.
        </p>
      </div>
    </div>
  );
};

export default InvitePage;
