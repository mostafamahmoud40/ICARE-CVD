"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import axios from "axios";
import { apiClient } from "@/lib/api-client";
import {
  clearAuthTokens,
  getAccessToken,
  getAuthUser,
  getAuthUserSnapshot,
  setAuthTokens,
  subscribeAuthUser,
  type AuthUser,
} from "@/lib/auth-tokens";

type Role = "admin" | "patient" | "assistant" | "doctor";

export function useRequireRole(role: Role) {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeAuthUser, getAuthUserSnapshot, () => null);

  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getAuthUser();

    if (!token || !storedUser || storedUser.role !== role) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    apiClient
      .get<AuthUser>("/auth/me")
      .then((res) => {
        if (res.data.role !== role) {
          toast.error("Access denied: wrong role");
          clearAuthTokens();
          router.replace("/login");
          return;
        }
        setAuthTokens({ accessToken: token, user: res.data });
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error("Authentication failed. Please log in again.");
        }
        clearAuthTokens();
        router.replace("/login");
      });
  }, [role, router]);

  const logout = useCallback(() => {
    clearAuthTokens();
    router.replace("/login");
  }, [router]);

  return { logout, user, mounted: user !== null };
}
