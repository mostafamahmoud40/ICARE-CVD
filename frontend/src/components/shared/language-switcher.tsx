"use client"

import { useEffect, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { CheckIcon, GlobeIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { isLocale, LEGACY_LOCALE_STORAGE_KEY, type Locale, locales } from "@/i18n/config"
import { setClientLocale } from "@/i18n/set-client-locale"

type LanguageSwitcherProps = {
  className?: string
}

const LANGUAGE_META: Record<Locale, { nativeLabel: string; labelKey: "english" | "arabic" }> = {
  en: { nativeLabel: "English", labelKey: "english" },
  ar: { nativeLabel: "العربية", labelKey: "arabic" },
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("common.language")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)
      if (isLocale(stored) && stored !== locale) {
        setClientLocale(stored)
        startTransition(() => {
          router.refresh()
        })
      }
    } catch {
      // ignore
    }
    // Migrate legacy localStorage preference once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectLanguage = (code: Locale) => {
    if (code === locale) return
    setClientLocale(code)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl border-0 bg-transparent px-2.5 text-[#6B7870] shadow-none outline-none transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345] focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-[#F9F8F5] data-[state=open]:text-[#1A5345] disabled:opacity-60",
            className,
          )}
          aria-label={t("label")}
        >
          <GlobeIcon className="size-[18px]" strokeWidth={2} aria-hidden />
          <span className="text-[12px] font-semibold uppercase">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 rounded-xl border-[#E8E6E0]/60 bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      >
        {locales.map((code) => {
          const meta = LANGUAGE_META[code]
          return (
            <DropdownMenuItem
              key={code}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[#374151] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]"
              onSelect={() => selectLanguage(code)}
            >
              <span>
                {meta.nativeLabel}
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                  ({t(meta.labelKey)})
                </span>
              </span>
              {locale === code ? (
                <CheckIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
