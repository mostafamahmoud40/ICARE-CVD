import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import {
  defaultLocale,
  isLocale,
  LEGACY_LOCALE_STORAGE_KEY,
  LOCALE_COOKIE,
  type Locale,
} from "./config"

async function resolveLocale(): Promise<Locale> {
  const store = await cookies()
  const fromCookie = store.get(LOCALE_COOKIE)?.value ?? store.get(LEGACY_LOCALE_STORAGE_KEY)?.value
  if (isLocale(fromCookie)) return fromCookie
  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
