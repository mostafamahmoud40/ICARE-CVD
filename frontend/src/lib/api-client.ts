import axios from "axios";

import { getAccessToken } from "./auth-tokens";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!token) return config;

  config.headers = config.headers ?? {};
  // Axios types vary across versions; set Authorization safely.
  (config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`;

  return config;
});
