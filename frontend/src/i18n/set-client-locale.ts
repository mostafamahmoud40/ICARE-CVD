"use client"

import { LEGACY_LOCALE_STORAGE_KEY, LOCALE_COOKIE, type Locale } from "./config"

export function setClientLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`
  try {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}
