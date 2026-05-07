import { useState } from "react";
import { planningPokerApi } from "@/shared/api/planningPokerApi";
import type { RegisterRequest } from "@/shared/api/planningPokerApi";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await planningPokerApi.register(data);
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.access_token);
      return response;
    } catch {
      setError("Не удалось зарегистрироваться. Попробуйте другой email.");
      throw new Error("Register failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    register,
    loading,
  };
};
