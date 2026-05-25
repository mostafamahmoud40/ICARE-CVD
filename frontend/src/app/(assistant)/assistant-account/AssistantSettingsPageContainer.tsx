"use client"

import { type ReactNode, useSyncExternalStore } from "react"
import { BellIcon, Settings2Icon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { assistantAccountScrollbarCss } from "./assistantAccount.shared"

const SECTIONS = [
  { id: "security" as const, label: "Security", icon: ShieldCheckIcon },
  { id: "notifications" as const, label: "Notifications", icon: BellIcon },
  { id: "preferences" as const, label: "Preferences", icon: SlidersHorizontalIcon },
]

type SectionId = (typeof SECTIONS)[number]["id"]

function readHash(): SectionId | "" {
  if (typeof window === "undefined") return ""
  const raw = window.location.hash.replace(/^#/, "")
  if (raw === "security" || raw === "notifications" || raw === "preferences") return raw
  return ""
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function getHashSection(): SectionId {
  const h = readHash()
  return h || "security"
}

export function AssistantSettingsPageContainer({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(subscribeHash, getHashSection, () => "security")

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="min-w-0 space-y-0.5">
            <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
              Settings
            </h1>
            <p className="max-w-2xl text-[13px] font-medium text-muted-foreground sm:text-[14px]">
              Security, notification channels, and display preferences for your assistant workspace.
            </p>
          </div>

          <nav
            aria-label="Settings sections"
            className="flex gap-1.5 overflow-x-auto rounded-2xl border border-[#E8E6E0]/70 bg-[#F9F8F5] p-1.5"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-colors sm:px-5 sm:text-[13px]",
                    isActive
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E]",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 account-custom-scrollbar">
        <div className="mx-auto w-full max-w-3xl space-y-8 py-4 sm:space-y-10 sm:py-6">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
