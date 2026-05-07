import axios from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Что-то пошло не так. Попробуйте еще раз.",
) => {
  if (axios.isAxiosError(error)) {
    const detail =
      typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;

    return detail ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
