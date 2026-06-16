"use client"

import Link from "next/link"
import { type ReactNode, useSyncExternalStore } from "react"
import {
  ArrowLeftIcon,
  BellIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
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

export type AssistantSettingsSectionId = SectionId

export function useAssistantSettingsSection(): SectionId {
  return useSyncExternalStore(subscribeHash, getHashSection, () => "security")
}

function setSettingsSection(id: SectionId) {
  window.location.hash = id
}

export function AssistantSettingsPageContainer({ children }: { children: ReactNode }) {
  const active = useAssistantSettingsSection()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-account" className="text-[10px] font-medium sm:text-[11px]">
                      Account
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Settings
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Security, notifications, and display preferences for your workspace.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 w-fit gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
            >
              <Link href="/assistant-account">
                <ArrowLeftIcon className="size-3.5" aria-hidden />
                Back to account
              </Link>
            </Button>
          </div>

          <nav
            aria-label="Settings sections"
            className="mt-4 flex gap-2 overflow-x-auto pb-0.5"
            role="tablist"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`settings-panel-${id}`}
                  id={`settings-tab-${id}`}
                  onClick={() => setSettingsSection(id)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold transition-colors sm:px-4 sm:text-[12px]",
                    isActive
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-[#E8F0EE] hover:text-[#1A1F1E]",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 account-custom-scrollbar">
        <div className="w-full space-y-5 pb-6 pt-4 sm:space-y-6">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
