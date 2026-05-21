"use client"

import { type ReactNode, useSyncExternalStore } from "react"
import { BellIcon, Settings2Icon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="flex w-full max-w-5xl flex-col gap-6 p-4 sm:gap-10 sm:p-6 lg:mx-auto lg:p-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-[#1A5345]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A5345]">System Control</span>
          </div>
          <h1 className="font-serif text-[32px] font-bold tracking-tight text-[#102F27] sm:text-[40px] lg:text-[44px]">
            Portal Settings
          </h1>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#1A5345] to-[#0A3D2E] shadow-xl shadow-[#1A5345]/20 ring-4 ring-white/50">
              <Settings2Icon className="size-6 text-white" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="max-w-md text-[14px] font-medium leading-relaxed text-[#6B7870] sm:text-[15px]">
                Manage your security protocols, notification channels, and personalized display preferences.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1A5345]">
                <div className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Preferences synced across 2 devices
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav
        aria-label="Settings sections"
        className="sticky top-4 z-20 -mx-1 flex gap-1.5 overflow-x-auto rounded-2xl border border-[#E8E6E0]/60 bg-white/70 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:mx-0 sm:p-2"
      >
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                "inline-flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-all duration-300 sm:px-6 sm:text-[14px]",
                isActive
                  ? "bg-[#1A5345] text-white shadow-lg shadow-[#1A5345]/20"
                  : "text-[#6B7870] hover:bg-[#E8F0EE] hover:text-[#1A5345]",
              )}
            >
              <Icon className={cn("size-4 shrink-0 transition-transform duration-300", isActive && "scale-110")} aria-hidden />
              <span className="whitespace-nowrap tracking-tight">{label}</span>
            </a>
          )
        })}
      </nav>

      <div className="flex flex-col gap-10 sm:gap-14">{children}</div>
    </div>
  )
}
