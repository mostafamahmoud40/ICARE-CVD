"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
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
  MapPinIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProcedureOrderRow } from "./ProcedureOrderRow"
import { ProcedureDetailPanel } from "./ProcedureDetailPanel"
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

/* ---------- Mock Schedule Data ---------- */

type ScheduledOperation = {
  id: string
  time?: string
  startTime: string
  endTime: string
  endTimeActual?: string
  endTimeExpected?: string
  patientName: string
  patientId: string
  age: number
  gender: "M" | "F"
  procedureName: string
  riskScore: string
  location: string
  riskTags: string[]
  duration: string
  status: "completed" | "pending" | "in-progress"
  priority: "normal" | "urgent" | "emergency"
  teamStatus: string
  notes?: string
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
  onUploadAttachment: (orderId: string, requirementId: string, file: File) => void
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
  isNotifying: boolean
  isTogglingRequirement: boolean
  isUploadingAttachment: boolean
  isLoading: boolean
  isError: boolean
  viewMode: ViewMode
}

/* ---------- Empty Detail Placeholder ---------- */

function DetailPlaceholder() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
        <ClipboardPlusIcon className="size-6 text-[#9CA3AF] sm:size-7" />
      </div>
      <p className="text-[11px] text-muted-foreground sm:text-[12px]">Select a procedure order</p>
      <p className="mt-1 text-[9px] text-muted-foreground sm:text-[10px]">
        Click any card to view its requirements checklist.
      </p>
    </div>
  )
}


/* ---------- Schedule View Component ---------- */

function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list")

  const days = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 14)
    return getDaysOfWeek(base)
  }, [weekOffset])

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  // Enhanced mock data matching the reference
  const scheduledOperations: ScheduledOperation[] = [
    {
      id: "op-1",
      startTime: "07:30",
      endTime: "09:45",
      endTimeActual: "09:45",
      patientName: "Khaled Mostafa",
      patientId: "CARD-00471",
      age: 63,
      gender: "M",
      procedureName: "CABG — Triple Vessel",
      riskScore: "EuroSCORE II: 4.2%",
      location: "Cardiac OR-1",
      riskTags: ["Shah Scale: Mid"],
      duration: "2h 15m",
      status: "completed",
      priority: "normal",
      teamStatus: "Started Early",
    },
    {
      id: "op-2",
      startTime: "10:00",
      endTime: "11:30",
      endTimeActual: "11:30",
      patientName: "Sarah Ahmed Najar",
      patientId: "CARD-00389",
      age: 58,
      gender: "F",
      procedureName: "TAVI — Aortic Valve Replacement",
      riskScore: "EuroSCORE II: 3.1%",
      location: "Hybrid Lab",
      riskTags: ["Shah Scale: Low"],
      duration: "1h 30m",
      status: "completed",
      priority: "normal",
      teamStatus: "On Schedule",
    },
    {
      id: "op-3",
      startTime: "13:00",
      endTime: "16:00",
      endTimeExpected: "16:00",
      patientName: "Mohammed Eid",
      patientId: "CARD-00512",
      age: 71,
      gender: "M",
      procedureName: "MVR — Mitral Valve Repair",
      riskScore: "EuroSCORE II: 6.8%",
      location: "Cardiac OR-2",
      riskTags: ["Shah Scale: High"],
      duration: "3h",
      status: "in-progress",
      priority: "urgent",
      teamStatus: "Running Late",
      notes: "Extra hour added",
    },
    {
      id: "op-4",
      startTime: "16:30",
      endTime: "18:00",
      endTimeExpected: "18:00",
      patientName: "Fatima Ali Hussein",
      patientId: "CARD-00445",
      age: 55,
      gender: "F",
      procedureName: "ICD — Defibrillator Implant",
      riskScore: "EuroSCORE II: 1.9%",
      location: "Cardiac OR-1",
      riskTags: ["Shah Scale: Low"],
      duration: "1h 30m",
      status: "pending",
      priority: "normal",
      teamStatus: "Room Ready",
    },
    {
      id: "op-5",
      startTime: "18:30",
      endTime: "21:30",
      endTimeExpected: "21:30",
      patientName: "Omar Samy Darwish",
      patientId: "CARD-00601",
      age: 67,
      gender: "M",
      procedureName: "CABG + AVR — Combined",
      riskScore: "EuroSCORE II: 8.3%",
      location: "Cardiac OR-2",
      riskTags: ["Shah Scale: High"],
      duration: "3h",
      status: "pending",
      priority: "emergency",
      teamStatus: "Extra Time Needed",
    },
  ]

  const statusConfig = {
    completed: { 
      color: "text-[#1A5345]", 
      bg: "bg-[#E8F0EE]", 
      label: "Completed" 
    },
    "in-progress": { 
      color: "text-[#B8860B]", 
      bg: "bg-[#FFF8E7]", 
      label: "In Progress" 
    },
    pending: { 
      color: "text-[#6B7870]", 
      bg: "bg-[#F5F5F3]", 
      label: "Scheduled" 
    },
  }

  const priorityConfig = {
    normal: { color: "text-[#1A5345]", bg: "bg-[#E8F0EE]", label: "Normal" },
    urgent: { color: "text-[#B8860B]", bg: "bg-[#FFF8E7]", label: "Urgent" },
    emergency: { color: "text-[#9B2C2C]", bg: "bg-[#FED7D7]", label: "Emergency" },
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5]">
      {/* Date Selector Header */}
      <div className="shrink-0 border-b border-[#E8E6E0] bg-white px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#102F27]">
            {formatDateDisplay(selectedDate)}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex size-7 items-center justify-center rounded-lg text-[#6B7870] transition-colors hover:bg-[#E8F0EE]"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg px-2 py-1 text-[10px] font-medium text-[#1A5345] transition-colors hover:bg-[#E8F0EE]"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex size-7 items-center justify-center rounded-lg text-[#6B7870] transition-colors hover:bg-[#E8F0EE]"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Days Row - square boxes */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => {
            const isSelected = isSameDay(day.date, selectedDate)
            return (
              <button
                key={day.date.toISOString()}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "flex aspect-square w-14 shrink-0 flex-col items-center justify-center rounded-xl border transition-all",
                  isSelected
                    ? "bg-[#E8F0EE] border-[#E8F0EE] text-[#1A5345] shadow-sm"
                    : "bg-white border-[#E8E6E0] text-[#6B7870] hover:bg-[#E8F0EE] hover:border-[#E8F0EE]",
                )}
              >
                <span className={cn("text-[9px] font-medium uppercase tracking-wide", isSelected ? "text-[#6B7870]" : "")}>
                  {day.dayName}
                </span>
                <span className={cn("text-[18px] font-semibold leading-tight", isSelected ? "text-[#1A5345]" : "text-[#102F27]")}>
                  {day.dayNum}
                </span>
              </button>
            )
          })}
        </div>

        {/* View Toggle + Summary Stats */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors",
                viewMode === "list"
                  ? "bg-white text-[#1A5345] shadow-sm"
                  : "text-[#6B7870] hover:text-[#1A5345]"
              )}
            >
              <ListIcon className="size-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors",
                viewMode === "timeline"
                  ? "bg-white text-[#1A5345] shadow-sm"
                  : "text-[#6B7870] hover:text-[#1A5345]"
              )}
            >
              <LayoutGridIcon className="size-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white px-3 py-2">
              <span className="text-[16px] font-bold text-[#1A5345]">5</span>
              <span className="text-[9px] text-[#6B7870]">Total</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white px-3 py-2">
              <span className="text-[16px] font-bold text-[#4F6D64]">2</span>
              <span className="text-[9px] text-[#6B7870]">Done</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white px-3 py-2">
              <span className="text-[16px] font-bold text-[#B8860B]">1</span>
              <span className="text-[9px] text-[#6B7870]">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "list" ? (
          <ScheduleListView scheduledOperations={scheduledOperations} statusConfig={statusConfig} />
        ) : (
          <ScheduleTimelineView scheduledOperations={scheduledOperations} />
        )}
      </div>
    </div>
  )
}

/* ---------- Schedule List View Component ---------- */

function ScheduleListView({
  scheduledOperations,
  statusConfig,
}: {
  scheduledOperations: ScheduledOperation[]
  statusConfig: Record<string, { color: string; bg: string; label: string }>
}) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Table Header */}
      <div className="sticky top-0 z-10 grid grid-cols-[100px_1fr_1.2fr_140px_80px_100px] gap-3 border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7870]">
        <div>Time</div>
        <div>Patient</div>
        <div>Procedure</div>
        <div>Location / Risk</div>
        <div>Duration</div>
        <div>Status</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[#E8E6E0]">
        {scheduledOperations.map((op) => (
          <div
            key={op.id}
            className={cn(
              "grid grid-cols-[100px_1fr_1.2fr_140px_80px_100px] gap-3 px-4 py-4 transition-colors hover:bg-white",
              op.status === "in-progress" && "bg-[#EEF5F3]"
            )}
          >
            {/* Time Column */}
            <div className="flex flex-col">
              <div className="text-[16px] font-bold text-[#1A5345]">{op.startTime}</div>
              <div className="text-[11px] text-[#9CA3AF]">
                {op.endTimeActual || op.endTimeExpected || op.endTime}
              </div>
            </div>

            {/* Patient Column */}
            <div>
              <div className="text-[13px] font-semibold text-[#102F27]">{op.patientName}</div>
              <div className="text-[10px] text-[#6B7870]">
                #{op.patientId} • {op.age}y • {op.gender}
              </div>
            </div>

            {/* Procedure Column */}
            <div>
              <div className="text-[13px] font-medium text-[#1A5345]">{op.procedureName}</div>
              <div className="text-[10px] text-[#9CA3AF]">{op.riskScore}</div>
            </div>

            {/* Location / Risk Column */}
            <div>
              <div className="text-[11px] font-medium text-[#6B7870]">{op.location}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {op.riskTags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium bg-[#E8F0EE] text-[#1A5345]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Duration Column */}
            <div>
              <div className="text-[12px] font-medium text-[#102F27]">{op.duration}</div>
              <div className="text-[10px] text-[#9CA3AF]">{op.teamStatus}</div>
              {op.notes && <div className="text-[9px] text-[#B8860B]">{op.notes}</div>}
            </div>

            {/* Status Column */}
            <div>
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold",
                statusConfig[op.status].bg,
                statusConfig[op.status].color,
              )}>
                {statusConfig[op.status].label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {scheduledOperations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#E8F0EE]">
            <CalendarDaysIcon className="size-7 text-[#9CA3AF]" />
          </div>
          <p className="text-[12px] font-medium text-[#6B7870]">No scheduled operations</p>
          <p className="text-[10px] text-muted-foreground">Select a different date to view schedule</p>
        </div>
      )}
    </div>
  )
}

/* ---------- Schedule Timeline View Component ---------- */

function ScheduleTimelineView({ scheduledOperations }: { scheduledOperations: ScheduledOperation[] }) {
  // Group operations by room/location
  const rooms = ["Cardiac OR-1", "Cardiac OR-2", "Hybrid Lab", "Cath Lab"]
  const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7 AM to 9 PM

  const getOperationForRoomAndTime = (room: string, hour: number) => {
    return scheduledOperations.find((op) => {
      if (op.location !== room) return false
      const startHour = parseInt(op.startTime.split(":")[0])
      const endHour = parseInt((op.endTimeActual || op.endTimeExpected || op.endTime).split(":")[0])
      return startHour <= hour && hour < endHour
    })
  }

  const getOpStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#E8F0EE] border-[#1A5345]/20 text-[#1A5345]"
      case "in-progress":
        return "bg-[#FFF8E7] border-[#B8860B]/20 text-[#B8860B]"
      default:
        return "bg-[#F5F5F3] border-[#6B7870]/20 text-[#6B7870]"
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Timeline Header - Hours */}
      <div className="sticky top-0 z-10 flex border-b border-[#E8E6E0] bg-[#FAFAF8]">
        <div className="w-28 shrink-0 border-r border-[#E8E6E0] px-3 py-2 text-[10px] font-semibold text-[#6B7870]">
          Room
        </div>
        <div className="flex flex-1">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-1 border-r border-[#E8E6E0] px-1 py-2 text-center text-[9px] font-medium text-[#6B7870]"
            >
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Body - Rooms */}
      <div className="flex-1 divide-y divide-[#E8E6E0]">
        {rooms.map((room) => (
          <div key={room} className="flex min-h-[80px]">
            {/* Room Label */}
            <div className="w-28 shrink-0 border-r border-[#E8E6E0] bg-white px-3 py-3">
              <div className="text-[11px] font-semibold text-[#102F27]">{room}</div>
            </div>

            {/* Time Slots */}
            <div className="relative flex flex-1">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 border-r border-[#E8E6E0] bg-white"
                />
              ))}

              {/* Operations in this room */}
              {scheduledOperations
                .filter((op) => op.location === room)
                .map((op) => {
                  const startHour = parseInt(op.startTime.split(":")[0])
                  const endHour = parseInt((op.endTimeActual || op.endTimeExpected || op.endTime).split(":")[0])
                  const startOffset = (startHour - 7) * (100 / 15) // percentage
                  const width = (endHour - startHour) * (100 / 15) // percentage

                  return (
                    <div
                      key={op.id}
                      className={cn(
                        "absolute top-2 bottom-2 rounded-lg border px-2 py-1.5 text-[9px] font-medium shadow-sm",
                        getOpStyle(op.status)
                      )}
                      style={{
                        left: `${startOffset}%`,
                        width: `${width}%`,
                        minWidth: "60px",
                      }}
                    >
                      <div className="truncate font-semibold">{op.patientName}</div>
                      <div className="truncate opacity-80">{op.procedureName}</div>
                      <div className="mt-0.5 text-[8px] opacity-60">
                        {op.startTime} - {op.endTimeActual || op.endTimeExpected || op.endTime}
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

/* ---------- History View ---------- */

function HistoryView() {
  const [dateFilter, setDateFilter] = useState<"7days" | "30days" | "3months" | "all">("30days")
  const [searchTerm, setSearchTerm] = useState("")

  // Mock completed operations history
  const historyOperations: ScheduledOperation[] = [
    {
      id: "hist-1",
      startTime: "07:30",
      endTime: "09:45",
      endTimeActual: "09:45",
      patientName: "Khaled Mostafa",
      patientId: "CARD-00471",
      age: 63,
      gender: "M",
      procedureName: "CABG — Triple Vessel",
      riskScore: "EuroSCORE II: 4.2%",
      location: "Cardiac OR-1",
      riskTags: ["Shah Scale: Mid"],
      duration: "2h 15m",
      status: "completed",
      priority: "urgent",
      teamStatus: "Started Early",
      notes: "Successful outcome",
    },
    {
      id: "hist-2",
      startTime: "10:00",
      endTime: "11:30",
      endTimeActual: "11:30",
      patientName: "Sarah Ahmed Najar",
      patientId: "CARD-00389",
      age: 58,
      gender: "F",
      procedureName: "TAVI — Aortic Valve Replacement",
      riskScore: "EuroSCORE II: 3.1%",
      location: "Hybrid Lab",
      riskTags: ["Shah Scale: Low"],
      duration: "1h 30m",
      status: "completed",
      priority: "normal",
      teamStatus: "On Schedule",
      notes: "No complications",
    },
    {
      id: "hist-3",
      startTime: "14:00",
      endTime: "16:30",
      endTimeActual: "16:15",
      patientName: "Ahmed Hassan Ibrahim",
      patientId: "CARD-00234",
      age: 71,
      gender: "M",
      procedureName: "PCI — Left Main Stenting",
      riskScore: "EuroSCORE II: 5.5%",
      location: "Cath Lab",
      riskTags: ["Shah Scale: High"],
      duration: "2h 15m",
      status: "completed",
      priority: "emergency",
      teamStatus: "Completed Early",
    },
    {
      id: "hist-4",
      startTime: "09:00",
      endTime: "12:00",
      endTimeActual: "12:30",
      patientName: "Nadia Mahmoud",
      patientId: "CARD-00156",
      age: 55,
      gender: "F",
      procedureName: "MVR — Mitral Valve Repair",
      riskScore: "EuroSCORE II: 6.2%",
      location: "Cardiac OR-2",
      riskTags: ["Shah Scale: Mid"],
      duration: "3h 30m",
      status: "completed",
      priority: "urgent",
      teamStatus: "Ran Late",
      notes: "Complex anatomy",
    },
    {
      id: "hist-5",
      startTime: "08:00",
      endTime: "10:00",
      endTimeActual: "09:45",
      patientName: "Youssef Kamal",
      patientId: "CARD-00567",
      age: 48,
      gender: "M",
      procedureName: "Pacemaker Implantation",
      riskScore: "EuroSCORE II: 1.8%",
      location: "Cardiac OR-1",
      riskTags: ["Shah Scale: Low"],
      duration: "1h 45m",
      status: "completed",
      priority: "normal",
      teamStatus: "On Schedule",
    },
    {
      id: "hist-6",
      startTime: "11:00",
      endTime: "14:00",
      endTimeActual: "13:30",
      patientName: "Laila Farouk",
      patientId: "CARD-00678",
      age: 62,
      gender: "F",
      procedureName: "AVR — Aortic Valve Replacement",
      riskScore: "EuroSCORE II: 7.1%",
      location: "Cardiac OR-2",
      riskTags: ["Shah Scale: High"],
      duration: "2h 30m",
      status: "completed",
      priority: "urgent",
      teamStatus: "Completed Early",
    },
  ]

  // Filter by search term
  const filteredOperations = historyOperations.filter(
    (op) =>
      op.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const totalCompleted = historyOperations.length
  const totalDuration = historyOperations.reduce((acc, op) => {
    const hours = parseInt(op.duration.split("h")[0]) || 0
    return acc + hours
  }, 0)
  const emergencyCount = historyOperations.filter((op) => op.priority === "emergency").length
  const avgRiskScore = "4.3%"

  const statusConfig = {
    completed: {
      color: "text-[#1A5345]",
      bg: "bg-[#E8F0EE]",
      label: "Completed",
    },
  }

  const priorityConfig = {
    normal: { color: "text-[#1A5345]", bg: "bg-[#E8F0EE]", label: "Normal" },
    urgent: { color: "text-[#B8860B]", bg: "bg-[#FFF8E7]", label: "Urgent" },
    emergency: { color: "text-[#9B2C2C]", bg: "bg-[#FED7D7]", label: "Emergency" },
  }

  const filterOptions = [
    { key: "7days" as const, label: "Last 7 Days" },
    { key: "30days" as const, label: "Last 30 Days" },
    { key: "3months" as const, label: "Last 3 Months" },
    { key: "all" as const, label: "All Time" },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F9F8F5]">
      {/* Header with filter and search */}
      <div className="shrink-0 border-b border-[#E8E6E0] bg-white px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#102F27]">Completed Procedures</h2>
          <span className="text-[11px] text-[#6B7870]">{filteredOperations.length} records</span>
        </div>

        {/* Date filter buttons */}
        <div className="mb-3 flex gap-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateFilter(opt.key)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
                dateFilter === opt.key
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : "bg-white text-[#6B7870] hover:bg-[#E8F0EE]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, procedure, or ID..."
            className="h-8 border-[#E8E6E0] bg-[#FAFAF8] pl-8 text-[11px] placeholder:text-[#9CA3AF]"
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white py-3">
            <span className="text-[20px] font-bold text-[#1A5345]">{totalCompleted}</span>
            <span className="text-[10px] text-[#6B7870]">Completed</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white py-3">
            <span className="text-[20px] font-bold text-[#B8860B]">{totalDuration}h</span>
            <span className="text-[10px] text-[#6B7870]">Total Hours</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white py-3">
            <span className="text-[20px] font-bold text-[#9B2C2C]">{emergencyCount}</span>
            <span className="text-[10px] text-[#6B7870]">Emergency</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E8E6E0] bg-white py-3">
            <span className="text-[20px] font-bold text-[#4F6D64]">{avgRiskScore}</span>
            <span className="text-[10px] text-[#6B7870]">Avg Risk</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="flex-1 overflow-auto">
        {/* Table Header */}
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_1.2fr_140px_100px_120px] gap-3 border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7870]">
          <div>Patient</div>
          <div>Procedure</div>
          <div>Location / Risk</div>
          <div>Duration</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#E8E6E0]">
          {filteredOperations.map((op) => (
            <div
              key={op.id}
              className="grid grid-cols-[1fr_1.2fr_140px_100px_120px] gap-3 px-4 py-4 transition-colors hover:bg-white"
            >
              {/* Patient Column */}
              <div>
                <div className="text-[13px] font-semibold text-[#102F27]">{op.patientName}</div>
                <div className="text-[10px] text-[#6B7870]">
                  #{op.patientId} • {op.age}y • {op.gender}
                </div>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium",
                      priorityConfig[op.priority].bg,
                      priorityConfig[op.priority].color,
                    )}
                  >
                    {priorityConfig[op.priority].label}
                  </span>
                </div>
              </div>

              {/* Procedure Column */}
              <div>
                <div className="text-[13px] font-medium text-[#1A5345]">{op.procedureName}</div>
                <div className="text-[10px] text-[#9CA3AF]">{op.riskScore}</div>
              </div>

              {/* Location / Risk Column */}
              <div>
                <div className="text-[11px] font-medium text-[#6B7870]">{op.location}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {op.riskTags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium bg-[#E8F0EE] text-[#1A5345]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Duration Column */}
              <div>
                <div className="text-[12px] font-medium text-[#102F27]">{op.duration}</div>
                <div className="text-[10px] text-[#9CA3AF]">{op.teamStatus}</div>
                {op.notes && <div className="text-[9px] text-[#B8860B]">{op.notes}</div>}
              </div>

              {/* Actions Column */}
              <div className="flex items-center gap-1.5">
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#E8F0EE] px-2 py-1.5 text-[9px] font-medium text-[#1A5345] transition-colors hover:bg-[#D4EDE6]"
                  title="View Details"
                >
                  <FileTextIcon className="size-3" />
                  <span className="hidden sm:inline">Details</span>
                </button>
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#F5F5F3] px-2 py-1.5 text-[9px] font-medium text-[#6B7870] transition-colors hover:bg-[#E8E6E0]"
                  title="View Report"
                >
                  <FileIcon className="size-3" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOperations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#E8F0EE]">
              <HistoryIcon className="size-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[12px] font-medium text-[#6B7870]">No completed procedures found</p>
            <p className="text-[10px] text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Main Component ---------- */

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
  isNotifying,
  isTogglingRequirement,
  isUploadingAttachment,
  isLoading,
  isError,
  viewMode,
}: AssistantProceduresProps) {

  if (isLoading) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[11px] text-muted-foreground sm:text-[12px]">Loading procedures...</p>
        </div>
      </main>
    )
  }

  const FILTER_TABS = [
    { key: "all" as const, shortLabel: "All", count: stats.total },
    { key: "pending" as const, shortLabel: "Pending", count: stats.pending },
    { key: "in-progress" as const, shortLabel: "Active", count: stats.inProgress },
    { key: "completed" as const, shortLabel: "Done", count: stats.completed },
  ] as const

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">

      {/* Error banner */}
      {isError && (
        <div className="mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-600 sm:mx-4 sm:mt-4 sm:text-[12px]">
          <AlertTriangleIcon className="size-4 shrink-0 text-red-400" />
          Could not reach the procedures service. Data will appear once the backend is available.
        </div>
      )}

      {viewMode === "operations" ? (
        /* Doctor Operations View - procedure requests from doctors */
        <div className="flex min-h-0 flex-1">
          {/* Left: fixed-width order list */}
          <div
            className={cn(
              "flex flex-col border-r border-[#E8E6E0] bg-[#FAFAF8]",
              "w-full md:w-[300px] md:shrink-0",
              selectedOrder && "hidden md:flex",
            )}
          >
            {/* Search + filter header */}
            <div className="shrink-0 space-y-2 border-b border-[#E8E6E0] p-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="h-8 border-[#E8E6E0] bg-white pl-8 text-[11px] placeholder:text-[#9CA3AF]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
                    aria-label="Clear search"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1 text-[9px] font-medium transition-colors",
                      filter === tab.key
                        ? "bg-[#1A5345] text-white"
                        : "bg-white text-[#4F6D64] hover:bg-[#E8F0EE]",
                    )}
                  >
                    {tab.shortLabel}{" "}
                    <span className={filter === tab.key ? "opacity-60" : "text-muted-foreground"}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable row list — spacing matches assistant queue */}
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <ProcedureOrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      onSelect={() => selectOrder(order.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardPlusIcon className="mb-2 size-8 text-[#9CA3AF]" />
                  <p className="text-[11px] text-muted-foreground">No procedure orders found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          <div
            className={cn(
              "flex flex-col overflow-hidden bg-white",
              selectedOrder ? "flex flex-1" : "hidden md:flex md:flex-1",
            )}
          >
            {selectedOrder ? (
              <ProcedureDetailPanel
                order={selectedOrder}
                onBack={clearSelection}
                onToggleRequirement={(requirementId, isDone) =>
                  onToggleRequirement(selectedOrder.id, requirementId, isDone)
                }
                onUploadAttachment={(requirementId, file) =>
                  onUploadAttachment(selectedOrder.id, requirementId, file)
                }
                onAddRequirement={(title, description, allowsAttachment, dueAt) =>
                  onAddRequirement(selectedOrder.id, title, description, allowsAttachment, dueAt)
                }
                onEditRequirement={(requirementId, title, description, allowsAttachment, dueAt) =>
                  onEditRequirement(selectedOrder.id, requirementId, title, description, allowsAttachment, dueAt)
                }
                onDeleteRequirement={(requirementId) =>
                  onDeleteRequirement(selectedOrder.id, requirementId)
                }
                onNotifyPatient={() => onNotifyPatient(selectedOrder.id)}
                isNotifying={isNotifying}
                isTogglingRequirement={isTogglingRequirement}
                isUploadingAttachment={isUploadingAttachment}
              />
            ) : (
              <DetailPlaceholder />
            )}
          </div>
        </div>
      ) : viewMode === "current" ? (
        /* Current Schedule View */
        <ScheduleView />
      ) : (
        /* History Records View */
        <HistoryView />
      )}
    </main>
  )
}
