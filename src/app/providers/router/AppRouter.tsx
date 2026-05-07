import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routeConfig } from "./routeConfig";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

const isAuth = () => {
  return Boolean(localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center px-5 py-10">
            <div className="w-full max-w-lg animate-pulse rounded-[30px] border border-[var(--color-border)] bg-white/90 p-6 shadow-sm">
              <div className="h-6 w-40 rounded-full bg-slate-100" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-100" />
              <div className="mt-6 grid gap-3">
                <div className="h-20 rounded-[24px] bg-slate-100" />
                <div className="h-20 rounded-[24px] bg-slate-100" />
                <div className="h-20 rounded-[24px] bg-slate-100" />
              </div>
            </div>
          </div>
        }
      >
        <Routes>
          {routeConfig.map((route) => {
            const element =
              route.authOnly && !isAuth() ? <Navigate replace to="/login" /> : route.element;

            return <Route element={element} key={route.path} path={route.path} />;
          })}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
