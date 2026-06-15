"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MessageSquareTextIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ActivityEntry } from "./assistantAccount.types"
import {
  ACTIVITY_PERIOD_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  countActivitiesByType,
  filterActivities,
  groupActivitiesByDate,
  type ActivityPeriodFilter,
  type ActivityTypeFilter,
} from "./assistantAccount.activity"
import { ActivityTimeline } from "./ActivityTimeline"
import { ActivityDetailDialog } from "./ActivityDetailDialog"
import { accountPageCardClassName, assistantAccountScrollbarCss } from "./assistantAccount.shared"

export function AssistantActivityLogPage({ activities }: { activities: ActivityEntry[] }) {
  const [period, setPeriod] = useState<ActivityPeriodFilter>("month")
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(null)

  const filtered = useMemo(
    () => filterActivities(activities, period, typeFilter, search),
    [activities, period, typeFilter, search],
  )

  const counts = useMemo(() => countActivitiesByType(filtered), [filtered])
  const grouped = useMemo(() => groupActivitiesByDate(filtered), [filtered])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <ActivityDetailDialog
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
      />
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="mb-0.5 flex items-center gap-2">
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
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Activity log
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquareTextIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px]">
                  Activity log
                </h1>
              </div>
              <p className="max-w-2xl text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Everything you have done in the clinic — filter by week, month, year, or browse the full
                history.
              </p>
            </div>

            <Link
              href="/assistant-account"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden />
              Back to account
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav
              aria-label="Activity period"
              className="flex gap-1.5 overflow-x-auto rounded-2xl border border-[#E8E6E0]/70 bg-[#F9F8F5] p-1.5"
            >
              {ACTIVITY_PERIOD_OPTIONS.map((option) => {
                const isActive = period === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPeriod(option.key)}
                    className={cn(
                      "inline-flex min-h-9 shrink-0 flex-col items-start rounded-xl px-3.5 py-1.5 text-left transition-colors sm:min-h-10 sm:px-4",
                      isActive
                        ? "bg-[#1A5345] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E]",
                    )}
                  >
                    <span className="whitespace-nowrap text-[12px] font-bold sm:text-[13px]">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isActive ? "text-white/75" : "text-[#6B7870]",
                      )}
                    >
                      {option.shortLabel}
                    </span>
                  </button>
                )
              })}
            </nav>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              {[
                { label: "Total", value: counts.total },
                { label: "Patients", value: counts.patient },
                { label: "Appointments", value: counts.appointment },
                { label: "Queue", value: counts.queue },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-[88px] flex-col items-center justify-center rounded-xl border border-[#E8E6E0]/70 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-[16px] font-bold leading-none tabular-nums text-[#1A5345]">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                type="search"
                placeholder="Search actions, patients, or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-lg border-[#E8E6E0] bg-white pl-9 text-[13px]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#6B7870]"
                  aria-label="Clear search"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-[#E8E6E0] bg-white p-1 shadow-sm">
              {ACTIVITY_TYPE_OPTIONS.map((option) => {
                const isActive = typeFilter === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTypeFilter(option.key)}
                    className={cn(
                      "whitespace-nowrap rounded-xl px-3 py-2 text-[12px] font-bold transition-all",
                      isActive
                        ? "bg-[#E8F0EE] text-[#1A5345] shadow-sm"
                        : "text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 account-custom-scrollbar">
        <div className="mx-auto w-full max-w-3xl space-y-5 py-4 sm:space-y-6 sm:py-6">
          {grouped.length === 0 ? (
            <Card className={accountPageCardClassName}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-2 text-center">
                  <CalendarDaysIcon className="size-8 text-[#B8D4CB]" aria-hidden />
                  <p className="text-[14px] font-bold text-[#1A1F1E]">No activity in this period</p>
                  <p className="max-w-sm text-[12px] font-medium text-[#6B7870]">
                    Try a wider date range or clear your search and type filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            grouped.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h2 className="text-[13px] font-bold text-[#1A1F1E]">{group.label}</h2>
                  <span className="rounded-md bg-[#E8F0EE] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#1A5345]">
                    {group.entries.length}
                  </span>
                </div>
                <Card className={accountPageCardClassName}>
                  <CardContent className="p-5 sm:p-6">
                    <ActivityTimeline entries={group.entries} onSelect={setSelectedEntry} />
                  </CardContent>
                </Card>
              </section>
            ))
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
