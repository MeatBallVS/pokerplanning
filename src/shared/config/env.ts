const apiUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

export const API_URL = apiUrl.replace("localhost:800/api", "localhost:8000/api");

const apiOrigin = new URL(API_URL);
const wsProtocol = apiOrigin.protocol === "https:" ? "wss:" : "ws:";

export const WS_API_URL = `${wsProtocol}//${apiOrigin.host}${apiOrigin.pathname.replace(/\/$/, "")}`;
