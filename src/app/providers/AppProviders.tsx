import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { StoreProvider } from "./store/StoreProvider";
import { ThemeProvider } from "./theme/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <StoreProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            closeButton
            position="top-right"
            richColors
            toastOptions={{
              className: "app-toast",
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </StoreProvider>
  );
};
