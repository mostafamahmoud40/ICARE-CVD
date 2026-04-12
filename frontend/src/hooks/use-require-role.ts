"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import {
  clearAuthTokens,
  getAccessToken,
  getAuthUser,
  setAuthTokens,
  type AuthUser,
} from "@/lib/auth-tokens";

type Role = "admin" | "patient" | "assistant" | "doctor";

export function useRequireRole(role: Role) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = getAccessToken();
    const user = getAuthUser();

    if (!token || !user || user.role !== role) {
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
      .catch((error: any) => {
        if (error.response?.status === 401) {
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

  const user: AuthUser | null = mounted ? getAuthUser() : null;

  return { logout, user, mounted };
}
