import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-0 pb-10">{children}</main>
    </div>
  );
};
