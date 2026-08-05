export const locales = ["en", "ar"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const LOCALE_COOKIE = "NEXT_LOCALE"

export const LEGACY_LOCALE_STORAGE_KEY = "icare-ui-language"

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ar"
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}
