import axios from "axios";
import { API_URL } from "../config/env";
import { LOCAL_STORAGE_KEYS } from "../constants";

export const baseApi = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

baseApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

baseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    }

    return Promise.reject(error);
  },
);
