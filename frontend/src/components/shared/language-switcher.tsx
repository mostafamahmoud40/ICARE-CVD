"use client"

import { useEffect, useState } from "react"
import { CheckIcon, GlobeIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type UiLanguage = "en" | "ar"

const STORAGE_KEY = "icare-ui-language"

const LANGUAGES: { code: UiLanguage; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
]

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [language, setLanguage] = useState<UiLanguage>("en")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "en" || stored === "ar") {
      setLanguage(stored)
    }
  }, [])

  const selectLanguage = (code: UiLanguage) => {
    setLanguage(code)
    localStorage.setItem(STORAGE_KEY, code)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl border-0 bg-transparent px-2.5 text-[#6B7870] shadow-none outline-none transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345] focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-[#F9F8F5] data-[state=open]:text-[#1A5345]",
            className,
          )}
          aria-label="Language"
        >
          <GlobeIcon className="size-[18px]" strokeWidth={2} aria-hidden />
          <span className="text-[12px] font-semibold uppercase">{language}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 rounded-xl border-[#E8E6E0]/60 bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[#374151] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]"
            onSelect={() => selectLanguage(lang.code)}
          >
            <span>
              {lang.nativeLabel}
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                ({lang.label})
              </span>
            </span>
            {language === lang.code ? (
              <CheckIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
