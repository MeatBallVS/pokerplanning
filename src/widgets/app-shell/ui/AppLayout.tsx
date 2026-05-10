import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppHeader />
      <main className="mx-auto max-w-[1440px] px-0 pb-12">{children}</main>
    </div>
  );
};
