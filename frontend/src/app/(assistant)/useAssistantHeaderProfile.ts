"use client"

import { useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import type { AuthUser } from "@/lib/auth-tokens"

import {
  getAssistantHeaderProfileSnapshot,
  subscribeAssistantHeaderProfile,
} from "./assistantHeaderProfile.cache"
import { fetchAssistantAccount } from "./assistant-account/assistantAccount.api"

/** Title-case when the stored name is ALL CAPS; otherwise leave as-is. */
export function formatAssistantDisplayLabel(
  raw: string | null | undefined,
  fallback: string,
): string {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return fallback
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0) + word.slice(1).toLowerCase() : word))
      .join(" ")
  }
  return trimmed
}

export function useAssistantHeaderProfile(user: AuthUser | null) {
  const cachedProfile = useSyncExternalStore(
    subscribeAssistantHeaderProfile,
    getAssistantHeaderProfileSnapshot,
    () => null,
  )

  const accountQuery = useQuery({
    queryKey: ["assistant", "account"],
    queryFn: fetchAssistantAccount,
    staleTime: 5 * 60 * 1000,
  })

  const profile = accountQuery.data?.profile ?? cachedProfile
  const displayName = formatAssistantDisplayLabel(
    profile?.fullName ?? user?.name,
    "Assistant",
  )
  const displayEmail = profile?.email ?? user?.email ?? "assistant@icare.com"
  const avatarUrl = profile?.avatarUrl ?? null

  return {
    profile,
    displayName,
    displayEmail,
    avatarUrl,
  }
}
