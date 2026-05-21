"use client"

import { useMemo, useState } from "react"
import type { ElementType } from "react"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FilterIcon,
  HistoryIcon,
  RotateCcwIcon,
  SearchIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { QueuePatient } from "../assistantQueue.types"
import { AiSmartAlertsPopover } from "./AiSmartAlertsPopover"
import { PastVisitsStatsSummary } from "./PastVisitsStatsSummary"
import { VisitRow } from "./VisitRow"
import { exportPastVisitsCsv } from "./pastVisits.export"
import {
  filterPastVisits,
  groupPastVisitsByDate,
  shouldGroupByDate,
  STATUS_SECTION_META,
  type PastVisitsStatusFilter,
  type PastVisitsTimeFilter,
} from "./pastVisits.helpers"

type PastVisitsPanelProps = {
  patients: QueuePatient[]
  onSelectPatient: (id: string) => void
  onMarkArrived?: (id: string) => void
}

function DateGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
        <CalendarDaysIcon className="size-3.5 text-[#1A5345]" />
      </div>
      <h3 className="text-[13px] font-bold text-[#102F27]">{label}</h3>
      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#1A5345] ring-1 ring-[#E5EEEA]">
        {count}
      </span>
    </div>
  )
}

function StatusSection({
  title,
  className,
  icon: Icon,
  patients,
  onSelectPatient,
  onMarkArrived,
}: {
  title: string
  className: string
  icon: ElementType
  patients: QueuePatient[]
  onSelectPatient: (id: string) => void
  onMarkArrived?: (id: string) => void
}) {
  if (patients.length === 0) return null
  return (
    <section className="space-y-3">
      <h4 className={cn("flex items-center gap-2 text-[12px] font-semibold", className)}>
        <Icon className="size-3.5" />
        {title} ({patients.length})
      </h4>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {patients.map((p) => (
          <VisitRow
            key={p.queueEntryId}
            patient={p}
            onSelect={onSelectPatient}
            onMarkArrived={onMarkArrived}
          />
        ))}
      </div>
    </section>
  )
}

export function PastVisitsPanel({
  patients,
  onSelectPatient,
  onMarkArrived,
}: PastVisitsPanelProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PastVisitsStatusFilter>("all")
  const [timeFilter, setTimeFilter] = useState<PastVisitsTimeFilter>("today")
  const [doctorFilter, setDoctorFilter] = useState("all")

  const doctors = useMemo(
    () => Array.from(new Set(patients.map((p) => p.assignedDoctor))).sort(),
    [patients],
  )

  const filteredPatients = useMemo(
    () =>
      filterPastVisits(patients, {
        search,
        statusFilter,
        timeFilter,
        doctorFilter,
      }),
    [patients, search, statusFilter, timeFilter, doctorFilter],
  )

  const filteredStats = useMemo(
    () => ({
      total: filteredPatients.length,
      completed: filteredPatients.filter((p) => p.status === "completed").length,
      noShow: filteredPatients.filter((p) => p.status === "no-show").length,
      cancelled: filteredPatients.filter((p) => p.status === "cancelled").length,
    }),
    [filteredPatients],
  )

  const groupByDate = shouldGroupByDate(timeFilter)
  const dateGroups = useMemo(
    () => (groupByDate ? groupPastVisitsByDate(filteredPatients) : []),
    [groupByDate, filteredPatients],
  )

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    timeFilter !== "today" ||
    doctorFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setTimeFilter("today")
    setDoctorFilter("all")
  }

  const handleExport = () => {
    exportPastVisitsCsv(filteredPatients)
    showIcareSuccessToast("Export started", `${filteredPatients.length} visits saved as CSV`)
  }

  const renderByStatus = (list: QueuePatient[]) => (
    <div className="space-y-6">
      <StatusSection
        title={STATUS_SECTION_META.completed.title}
        className={STATUS_SECTION_META.completed.className}
        icon={CheckCircle2Icon}
        patients={list.filter((p) => p.status === "completed")}
        onSelectPatient={onSelectPatient}
        onMarkArrived={onMarkArrived}
      />
      <StatusSection
        title={STATUS_SECTION_META["no-show"].title}
        className={STATUS_SECTION_META["no-show"].className}
        icon={XCircleIcon}
        patients={list.filter((p) => p.status === "no-show")}
        onSelectPatient={onSelectPatient}
        onMarkArrived={onMarkArrived}
      />
      <StatusSection
        title={STATUS_SECTION_META.cancelled.title}
        className={STATUS_SECTION_META.cancelled.className}
        icon={XIcon}
        patients={list.filter((p) => p.status === "cancelled")}
        onSelectPatient={onSelectPatient}
        onMarkArrived={onMarkArrived}
      />
    </div>
  )

  if (patients.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
          <HistoryIcon className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">No past visits yet</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Completed, no-show, and cancelled visits will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F9F8F5] p-4 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-[#1A1F1E]">Past Visits</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {filteredStats.total} shown
            {hasFilters ? ` · ${patients.length} total` : ""}
            {" · "}
            {filteredStats.completed} completed · {filteredStats.noShow} no show
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredStats.completed > 0 && <AiSmartAlertsPopover />}
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredPatients.length === 0}
            className="flex size-10 items-center justify-center rounded-xl border border-[#E5EEEA] bg-white text-[#1A5345] transition-all hover:border-[#1A5345]/20 hover:bg-[#E8F0EE] disabled:opacity-50"
            title="Export CSV"
          >
            <FileTextIcon className="size-4" />
          </button>
        </div>
      </div>

      <PastVisitsStatsSummary
        total={filteredStats.total}
        completed={filteredStats.completed}
        noShow={filteredStats.noShow}
        cancelled={filteredStats.cancelled}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            type="search"
            placeholder="Search patient, doctor, condition, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg border-[#E8E6E0] bg-white pl-9 text-[13px]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
              aria-label="Clear search"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as PastVisitsTimeFilter)}>
          <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E6E0] bg-white sm:w-[140px]">
            <CalendarDaysIcon className="mr-1 size-3.5 text-[#6B7870]" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E6E0] bg-white sm:w-[180px]">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {doctors.map((doc) => (
              <SelectItem key={doc} value={doc}>
                {doc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PastVisitsStatusFilter)}>
          <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E6E0] bg-white sm:w-[130px]">
            <FilterIcon className="mr-1 size-3.5 text-[#6B7870]" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no-show">No show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md p-1.5 text-[#6B7870] transition-colors hover:bg-black/[0.04] hover:text-[#1A5345]"
            title="Clear filters"
            aria-label="Clear filters"
          >
            <RotateCcwIcon className="size-4" />
          </button>
        )}
      </div>

      {hasFilters && (
        <p className="mb-4 text-[12px] text-muted-foreground">
          Showing {filteredPatients.length} of {patients.length} visits
        </p>
      )}

      {filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0] bg-white py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
            <SearchIcon className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-[#6B7870]">No visits match your filters</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-[#1A5345] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#0F3D32]"
          >
            Clear filters
          </button>
        </div>
      ) : groupByDate ? (
        <div className="space-y-8">
          {dateGroups.map((group) => (
            <section key={group.key}>
              <DateGroupHeader label={group.label} count={group.patients.length} />
              {renderByStatus(group.patients)}
            </section>
          ))}
        </div>
      ) : (
        renderByStatus(filteredPatients)
      )}
    </div>
  )
}
