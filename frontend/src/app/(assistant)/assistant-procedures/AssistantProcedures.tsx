"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardPlusIcon,
  ClockIcon,
  FileIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon,
  MapPinIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { AssistantProceduresOperations } from "./AssistantProceduresOperations"
import { AssistantProceduresHistory } from "./AssistantProceduresHistory"
import type { ProcedureConsentSavePayload } from "./ProcedureConsentDialog"
import type { ScheduledOperation } from "./assistantProceduresHistory.mock"
import { fetchAssistantProcedureSchedule } from "./assistantProcedures.api"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type {
  ProcedureFilter,
  ProcedureOrder,
  ProcedureStats,
} from "./assistantProcedures.types"

/* ---------- Date Utilities ---------- */

function getDaysOfWeek(startDate: Date = new Date()): { date: Date; dayName: string; dayNum: number }[] {
  const days = []
  const start = new Date(startDate)
  start.setDate(start.getDate() - 3)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 0; i < 14; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      date: d,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
    })
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/* ---------- Types ---------- */

export type ViewMode = "current" | "operations" | "history"

type AssistantProceduresProps = {
  orders: ProcedureOrder[]
  stats: ProcedureStats
  filter: ProcedureFilter
  setFilter: (f: ProcedureFilter) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  selectedOrder: ProcedureOrder | null
  selectOrder: (id: string) => void
  clearSelection: () => void
  onToggleRequirement: (orderId: string, requirementId: string, isDone: boolean) => void
  onUploadAttachment: (orderId: string, requirementId: string, file: File) => Promise<void>
  onAddRequirement: (
    orderId: string,
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onEditRequirement: (
    orderId: string,
    requirementId: string,
    title: string,
    description: string | null,
    allowsAttachment: boolean,
    dueAt: string | null,
  ) => void
  onDeleteRequirement: (orderId: string, requirementId: string) => void
  onNotifyPatient: (orderId: string) => Promise<void>
  onSaveConsent: (orderId: string, payload: ProcedureConsentSavePayload) => Promise<void>
  isNotifying: boolean
  isSavingConsent: boolean
  isTogglingRequirement: boolean
  isUploadingAttachment: boolean
  isLoading: boolean
  isError: boolean
  viewMode: ViewMode
}

const STATUS_CFG = {
  completed: { dot: "bg-[#1A5345]", badge: "bg-[#1A5345] text-white shadow-sm", border: "border-l-[#1A5345]", label: "Completed" },
  "in-progress": { dot: "bg-amber-600", badge: "bg-amber-600 text-white shadow-sm", border: "border-l-amber-600", label: "In progress" },
  pending: { dot: "bg-[#6B7870]", badge: "bg-[#6B7870] text-white shadow-sm", border: "border-l-[#6B7870]", label: "Scheduled" },
}

const PRIORITY_CFG = {
  normal: { badge: "bg-[#E8F0EE] text-[#1A5345]", label: "Normal" },
  urgent: { badge: "bg-amber-600 text-white shadow-sm", label: "Urgent" },
  emergency: { badge: "bg-red-600 text-white shadow-sm", label: "Emergency" },
}

function ScheduleView() {
  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list")
  const dateKey = formatDateKey(selectedDate)

  const scheduleQuery = useQuery({
    queryKey: ["assistant-procedures-schedule", dateKey],
    queryFn: () => fetchAssistantProcedureSchedule(dateKey),
    staleTime: 30_000,
  })

  const scheduledOperations = scheduleQuery.data ?? []

  const days = useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() + weekOffset * 14)
    return getDaysOfWeek(base)
  }, [weekOffset, today])

  const stats = useMemo(() => ({
    total: scheduledOperations.length,
    done: scheduledOperations.filter((o) => o.status === "completed").length,
    active: scheduledOperations.filter((o) => o.status === "in-progress").length,
    pending: scheduledOperations.filter((o) => o.status === "pending").length,
  }), [scheduledOperations])

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5]">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white/50 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
        {/* Top row: title + nav */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-[#1A5345]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A5345]">
                Operating schedule
              </p>
            </div>
            <h2 className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[26px]">
              {formattedDate}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-[#E8E6E0]/80 bg-white p-1 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="size-8 border-0 bg-transparent text-muted-foreground transition-all hover:bg-slate-50 hover:text-[#1A5345]"
                aria-label="Previous two weeks"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setWeekOffset(0); setSelectedDate(today) }}
                className="h-8 rounded-lg px-4 text-[12px] font-bold text-[#1A1F1E] transition-all hover:bg-slate-50 hover:text-[#1A5345]"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="size-8 border-0 bg-transparent text-muted-foreground transition-all hover:bg-slate-50 hover:text-[#1A5345]"
                aria-label="Next two weeks"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Day pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide sm:gap-2.5">
          {days.map((day) => {
            const isSelected = isSameDay(day.date, selectedDate)
            const isToday = isSameDay(day.date, today)
            return (
              <button
                key={day.date.toISOString()}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "relative flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border py-3 transition-all duration-300 sm:min-w-[60px]",
                  isSelected
                    ? "border-[#1A5345] bg-[#1A5345] text-white shadow-lg shadow-[#1A5345]/15 scale-[1.05] z-10"
                    : "border-[#E8E6E0]/80 bg-white text-[#6B7870] hover:shadow-md",
                )}
              >
                {isToday && !isSelected && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#1A5345]" />
                )}
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isSelected ? "text-white/70" : "text-muted-foreground/60",
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-[18px] font-bold leading-none",
                  isSelected ? "text-white" : isToday ? "text-[#1A5345]" : "text-[#1A1F1E]",
                )}>
                  {day.dayNum}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom row: view toggle + stats */}
        <div className="mt-4 flex flex-col items-stretch justify-between gap-4 border-t border-[#E8E6E0]/40 pt-5 sm:flex-row sm:items-center">
          {/* View toggle (Segmented control style) */}
          <div className="flex w-fit items-center rounded-xl bg-[#F4F3ED] p-1 shadow-inner">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[12px] font-bold transition-all",
                viewMode === "list" 
                  ? "bg-white text-[#1A5345] shadow-sm" 
                  : "text-muted-foreground hover:text-[#1A1F1E]"
              )}
            >
              <ListIcon className="size-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-[12px] font-bold transition-all",
                viewMode === "timeline" 
                  ? "bg-white text-[#1A5345] shadow-sm" 
                  : "text-muted-foreground hover:text-[#1A1F1E]"
              )}
            >
              <LayoutGridIcon className="size-4" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Stats summary cards */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Total", value: stats.total, color: "text-[#1A1F1E]", bg: "bg-white", icon: ActivityIcon },
              { label: "Done", value: stats.done, color: "text-emerald-600", bg: "bg-emerald-50/40", icon: CheckCircle2Icon },
              { label: "Active", value: stats.active, color: "text-amber-600", bg: "bg-amber-50/40", icon: ClockIcon },
              { label: "Pending", value: stats.pending, color: "text-blue-600", bg: "bg-blue-50/40", icon: HistoryIcon },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-[#E8E6E0]/60 px-3 py-1.5 shadow-sm transition-shadow hover:shadow-md",
                  s.bg
                )}
              >
                <s.icon className={cn("size-3.5", s.color)} />
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-[14px] font-bold tabular-nums", s.color)}>{s.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/70">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="w-full">
          {scheduleQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2Icon className="size-8 animate-spin text-[#1A5345]" aria-hidden />
            </div>
          ) : viewMode === "list" ? (
            <ScheduleListView scheduledOperations={scheduledOperations} />
          ) : (
            <ScheduleTimelineView scheduledOperations={scheduledOperations} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Schedule List View ---------- */

function ScheduleListView({ scheduledOperations }: { scheduledOperations: ScheduledOperation[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-6 lg:gap-6">
      {scheduledOperations.map((op) => {
        const sc = STATUS_CFG[op.status]
        const pc = PRIORITY_CFG[op.priority]
        const endLabel = op.endTimeActual ?? op.endTimeExpected ?? op.endTime
        return (
          <div
            key={op.id}
            className={cn(
              "group relative overflow-hidden rounded-[24px] border border-[#E8E6E0]/70 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#1A5345]/20",
              op.status === "in-progress" && "ring-1 ring-amber-500/20 bg-amber-50/[0.02]",
            )}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* 1. Time & Status Indicator */}
              <div className="flex shrink-0 flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-1.5 sm:w-[100px]">
                <div className="flex flex-col">
                  <span className="font-serif text-[26px] font-bold leading-none text-[#1A1F1E] sm:text-[30px]">
                    {op.startTime}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
                    Until {endLabel}
                  </span>
                </div>
                <div className={cn("size-2 rounded-full", sc.dot, op.status === 'in-progress' && "animate-pulse")} />
              </div>

              {/* 2. Divider (Desktop only) */}
              <div className="hidden h-12 w-px bg-[#E8E6E0]/60 sm:block" />

              {/* 3. Patient Info */}
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F5F5F3] p-0.5">
                  <PatientAvatar
                    name={op.patientName}
                    avatarUrl={op.patientAvatarUrl}
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-serif text-[17px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
                      {op.patientName}
                    </h3>
                    <span className="text-[11px] font-bold text-muted-foreground/60 tabular-nums">
                      #{op.patientId}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    {op.age}y · {op.gender === "M" ? "Male" : "Female"}
                  </p>
                </div>
              </div>

              {/* 4. Procedure & Location */}
              <div className="flex flex-[1.2] flex-col gap-2 min-w-0 border-t border-[#F4F3ED] pt-4 sm:border-t-0 sm:pt-0">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="size-4 text-[#1A5345]" />
                  <span className="truncate text-[15px] font-bold text-[#1A5345]">
                    {op.procedureName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7870]">
                    <MapPinIcon className="size-3.5 text-muted-foreground/60" />
                    <span>{op.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7870]">
                    <ClockIcon className="size-3.5 text-muted-foreground/60" />
                    <span>{op.duration}</span>
                  </div>
                </div>
              </div>

              {/* 5. Badges & Actions */}
              <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-[#F4F3ED] pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <div className="flex items-center gap-2">
                  {op.priority !== "normal" && (
                    <span className={cn("rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", pc.badge)}>
                      {pc.label}
                    </span>
                  )}
                  <span className={cn("rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", sc.badge)}>
                    {sc.label}
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#133F34] hover:shadow-md"
                >
                  View Detail
                </Button>
              </div>
            </div>

            {/* Subtle Team Status overlay (only if needed/important) */}
            <div className="mt-4 flex items-center gap-2 border-t border-[#F4F3ED]/60 pt-3">
              <div className={cn("size-1.5 rounded-full", sc.dot)} />
              <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight">
                Staff Status: {op.teamStatus}
              </span>
              {op.notes && (
                <>
                  <span className="text-[#D4D1C9]">|</span>
                  <span className="text-[11px] font-medium text-amber-700 italic">
                    Note: {op.notes}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}

      {scheduledOperations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-3xl border-2 border-dashed border-[#E8E6E0] bg-white shadow-sm">
            <CalendarDaysIcon className="size-10 text-muted-foreground/40" strokeWidth={1} />
          </div>
          <h3 className="font-serif text-[20px] font-bold text-[#1A1F1E]">No scheduled operations</h3>
          <p className="mt-1 text-[14px] font-medium text-muted-foreground">Select a different date to view the operating schedule.</p>
        </div>
      )}
    </div>
  )
}

/* ---------- Schedule Timeline View ---------- */

function ScheduleTimelineView({ scheduledOperations }: { scheduledOperations: ScheduledOperation[] }) {
  const rooms = [
    { name: "Cardiac OR-1", wing: "Main Wing", icon: "🏥" },
    { name: "Cardiac OR-2", wing: "Main Wing", icon: "🏥" },
    { name: "Hybrid Lab", wing: "Specialist Unit", icon: "🔬" },
    { name: "Cath Lab", wing: "Interventional", icon: "🫀" }
  ]
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)

  const getOpStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm"
      case "in-progress":
        return "bg-amber-50 border-amber-200 text-amber-800 shadow-md ring-1 ring-amber-500/20"
      default:
        return "bg-white border-[#E8E6E0] text-[#6B7870] shadow-sm"
    }
  }

  return (
    <div className="mx-6 my-8 flex flex-1 flex-col overflow-hidden rounded-[32px] border border-[#E8E6E0]/80 bg-white shadow-2xl">
      {/* Hour header */}
      <div className="sticky top-0 z-30 flex border-b border-[#E8E6E0]/80 bg-[#FAFAF8]/95 backdrop-blur-md">
        <div className="w-40 shrink-0 border-r border-[#E8E6E0]/80 px-6 py-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1A5345]">Facility Unit</span>
        </div>
        <div className="flex flex-1">
          {hours.map((hour) => (
            <div key={hour} className="flex-1 border-r border-[#E8E6E0]/40 py-4 text-center">
              <span className="text-[10px] font-bold text-[#6B7870] uppercase">{hour}:00</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room rows */}
      <div className="flex-1 divide-y divide-[#E8E6E0]/60 overflow-y-auto">
        {rooms.map((room) => (
          <div key={room.name} className="flex min-h-[140px] group/row hover:bg-[#F9F8F5]/30 transition-colors">
            <div className="w-40 shrink-0 border-r border-[#E8E6E0]/60 bg-[#FAFAF8]/40 px-6 py-6 transition-colors group-hover/row:bg-[#F4F3ED]/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm" aria-hidden>{room.icon}</span>
                <p className="text-[14px] font-bold text-[#1A1F1E] leading-tight">{room.name}</p>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{room.wing}</p>
            </div>
            <div className="relative flex flex-1 bg-[linear-gradient(to_right,#E8E6E0_1px,transparent_1px)] bg-[size:calc(100%/15)_100%]">
              {scheduledOperations
                .filter((op) => op.location === room.name)
                .map((op) => {
                  const startH = parseInt(op.startTime.split(":")[0])
                  const startM = parseInt(op.startTime.split(":")[1])
                  const endH = parseInt((op.endTimeActual ?? op.endTimeExpected ?? op.endTime).split(":")[0])
                  const endM = parseInt((op.endTimeActual ?? op.endTimeExpected ?? op.endTime).split(":")[1])
                  
                  const startPos = (startH - 7 + startM / 60) * (100 / 15)
                  const endPos = (endH - 7 + endM / 60) * (100 / 15)
                  const width = endPos - startPos

                  return (
                    <div
                      key={op.id}
                      className={cn(
                        "absolute inset-y-4 rounded-2xl border px-3.5 py-3 transition-shadow duration-300 hover:z-20 hover:shadow-lg cursor-pointer overflow-hidden",
                        getOpStyle(op.status),
                      )}
                      style={{ left: `${startPos}%`, width: `${width}%`, minWidth: 120 }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-2.5 mb-auto">
                          <div className="size-8 shrink-0 overflow-hidden rounded-full border border-black/5 shadow-sm">
                            <PatientAvatar
                              name={op.patientName}
                              avatarUrl={op.patientAvatarUrl}
                              sizes="32px"
                              initialsClassName="text-[9px]"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-serif text-[12px] font-bold leading-tight">{op.patientName}</p>
                            <p className="truncate text-[10px] opacity-70 font-bold uppercase tracking-tight">{op.procedureName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/5">
                           <div className="flex items-center gap-1.5 opacity-70">
                            <ClockIcon className="size-3" />
                            <span className="text-[10px] font-bold tabular-nums">
                              {op.startTime}–{op.endTimeActual ?? op.endTimeExpected ?? op.endTime}
                            </span>
                          </div>
                          {op.status === 'in-progress' && (
                            <span className="flex size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export function AssistantProcedures({
  orders,
  stats,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  selectedOrder,
  selectOrder,
  clearSelection,
  onToggleRequirement,
  onUploadAttachment,
  onAddRequirement,
  onEditRequirement,
  onDeleteRequirement,
  onNotifyPatient,
  onSaveConsent,
  isNotifying,
  isSavingConsent,
  isTogglingRequirement,
  isUploadingAttachment,
  isLoading,
  isError,
  viewMode,
}: AssistantProceduresProps) {
  const { t } = useAssistantPageTranslations("procedures")

  if (isLoading) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[11px] text-muted-foreground sm:text-[12px]">{t("loading")}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">

      {/* Error banner */}
      {isError && (
        <div className="mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-600 sm:mx-4 sm:mt-4 sm:text-[12px]">
          <AlertTriangleIcon className="size-4 shrink-0 text-red-400" />
          {t("errorBanner")}
        </div>
      )}

      {viewMode === "operations" ? (
        <AssistantProceduresOperations
          orders={orders}
          stats={stats}
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOrder={selectedOrder}
          selectOrder={selectOrder}
          clearSelection={clearSelection}
          onToggleRequirement={onToggleRequirement}
          onUploadAttachment={onUploadAttachment}
          onAddRequirement={onAddRequirement}
          onEditRequirement={onEditRequirement}
          onDeleteRequirement={onDeleteRequirement}
          onNotifyPatient={onNotifyPatient}
          onSaveConsent={onSaveConsent}
          isNotifying={isNotifying}
          isSavingConsent={isSavingConsent}
          isTogglingRequirement={isTogglingRequirement}
          isUploadingAttachment={isUploadingAttachment}
        />
      ) : viewMode === "current" ? (
        /* Current Schedule View */
        <ScheduleView />
      ) : (
        /* History Records View */
        <AssistantProceduresHistory />
      )}
    </main>
  )
}
