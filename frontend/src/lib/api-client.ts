import axios from "axios";

import { getAccessToken } from "./auth-tokens";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!token) return config;

  config.headers = config.headers ?? {};
  (config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`;

  return config;
});
