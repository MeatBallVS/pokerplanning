import { useState } from "react";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import type { LoginRequest } from "@/shared/api/planningPokerApi";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await planningPokerApi.login(data);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.access_token);
      return response;
    } catch {
      setError("Не удалось войти. Проверьте email и пароль.");
      throw new Error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    login,
    loading,
  };
};
