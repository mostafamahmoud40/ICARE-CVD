"use client"

import { useState, useMemo } from "react"
import type {
  Medication,
  MedicationStats,
  MedicationTypeFilter,
} from "./medications.types"
import { cn } from "@/lib/utils"
import {
  CheckCircle2Icon,
  ClockIcon,
  PillIcon,
  SearchIcon,
  SkipForwardIcon,
  XIcon,
  CheckIcon,
  EyeIcon,
  TimerIcon,
} from "lucide-react"
import {
  MedicationTypeBadge,
  TimeOfDayBadge,
  TYPE_LABELS,
} from "./patientMedications.shared"
import { StatCell } from "@/app/(assistant)/assistant-queue/shared/StatCell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function isOverdue(nextDoseAt?: string, status?: string): boolean {
  if (!nextDoseAt || status !== "active") return false
  return new Date(nextDoseAt) < new Date()
}

function MedicationDots({ history }: { history: boolean[] }) {
  return (
    <div className="flex items-center gap-1">
      {history.map((taken, i) => (
        <div
          key={i}
          title={taken ? "Taken" : "Missed"}
          className={cn(
            "size-2.5 rounded-full border",
            taken ? "border-emerald-600 bg-emerald-500" : "border-rose-200 bg-rose-50",
          )}
        />
      ))}
    </div>
  )
}

function adherencePctFromHistory(history: boolean[] | undefined, fallback: number) {
  if (!history?.length) return fallback
  const taken = history.filter(Boolean).length
  return Math.round((taken / history.length) * 100)
}

type PatientMedicationRowProps = {
  medication: Medication
  onMarkTaken: (id: string) => void
  onMarkSkipped: (id: string) => void
  onViewDetails: () => void
}

function PatientMedicationRow({
  medication,
  onMarkTaken,
  onMarkSkipped,
  onViewDetails,
}: PatientMedicationRowProps) {
  const overdue = isOverdue(medication.nextDoseAt, medication.status)
  const isPaused = medication.status === "paused"
  const isDiscontinued = medication.status === "discontinued"
  const isActive = medication.status === "active"
  const takenToday =
    !!medication.lastTakenAt &&
    new Date(medication.lastTakenAt).toDateString() === new Date().toDateString()
  const adherenceHistory = medication.adherenceHistory ?? [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]
  const adherencePct = adherencePctFromHistory(
    medication.adherenceHistory,
    medication.adherencePercent,
  )

  const scheduleLine = [
    medication.frequency,
    takenToday && medication.lastTakenAt
      ? `Taken at ${formatTimeOnly(medication.lastTakenAt)}`
      : overdue
        ? "Missed dose — due now"
        : medication.nextDoseAt
          ? `Next dose ${formatTimeOnly(medication.nextDoseAt)}`
          : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <tr className="group transition-colors hover:bg-[#F9F8F5]/30">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onViewDetails}
          className="text-left transition-colors"
        >
          <p className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345]">
            {medication.name}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {medication.dose}
          </p>
        </button>
        <MedicationTypeBadge type={medication.type} className="mt-2" />
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[220px] text-[13px] font-medium leading-relaxed text-[#1A1F1E]/80">
          {scheduleLine}
        </p>
        {medication.instructions ? (
          <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-muted-foreground line-clamp-2">
            {medication.instructions}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          {medication.timeOfDay.map((tod) => (
            <TimeOfDayBadge key={tod} timeOfDay={tod} />
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex max-w-[148px] flex-col gap-1.5">
          <MedicationDots history={adherenceHistory} />
          <div className="flex items-center gap-2">
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
              <div
                className={cn(
                  "h-full rounded-full bg-emerald-500",
                  adherencePct < 85 && "bg-amber-500",
                  adherencePct < 65 && "bg-rose-500",
                )}
                style={{ width: `${adherencePct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground">
              {adherencePct}%
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isActive && !takenToday && overdue && (
            <span className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
              Overdue
            </span>
          )}
          {isPaused && (
            <span className="inline-flex h-8 items-center rounded-lg bg-amber-50 px-2.5 text-[10px] font-bold text-amber-700">
              Paused
            </span>
          )}
          {isDiscontinued && (
            <span className="inline-flex h-8 items-center rounded-lg bg-[#F4F3ED] px-2.5 text-[10px] font-bold text-muted-foreground">
              Discontinued
            </span>
          )}

          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isActive && takenToday && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled
                    className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-100"
                    aria-label="Taken today"
                  >
                    <CheckCircle2Icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px] font-semibold">
                  Taken today
                </TooltipContent>
              </Tooltip>
            )}

            {isActive && !takenToday && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 rounded-lg",
                      overdue
                        ? "bg-[#1A5345] text-white hover:bg-[#133F34] hover:text-white"
                        : "text-[#1A5345] hover:bg-[#1A5345]/10",
                    )}
                    onClick={() => onMarkTaken(medication.id)}
                    aria-label={`Mark ${medication.name} as taken`}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px] font-semibold">
                  Mark as taken
                </TooltipContent>
              </Tooltip>
            )}

            {isActive && !takenToday && !overdue && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A5345]"
                    onClick={() => onMarkSkipped(medication.id)}
                    aria-label={`Skip dose for ${medication.name}`}
                  >
                    <SkipForwardIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px] font-semibold">
                  Skip dose
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-[#1A5345] hover:bg-[#1A5345]/5"
                  onClick={onViewDetails}
                  aria-label={`View details for ${medication.name}`}
                >
                  <EyeIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] font-semibold">
                View details
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </td>
    </tr>
  )
}

type MedicationListProps = {
  medications: Medication[]
  stats: MedicationStats
  onMarkTaken: (id: string) => void
  onMarkSkipped: (id: string) => void
  onSelectMedication: (medication: Medication) => void
  className?: string
}

export function MedicationList({
  medications,
  stats,
  onMarkTaken,
  onMarkSkipped,
  onSelectMedication,
  className,
}: MedicationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<MedicationTypeFilter>("all")

  const filteredMedications = useMemo(() => {
    let filtered = medications

    if (typeFilter !== "all") {
      filtered = filtered.filter((m) => m.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.dose.toLowerCase().includes(q) ||
          (TYPE_LABELS[m.type] ?? "").toLowerCase().includes(q) ||
          m.prescribedBy.toLowerCase().includes(q),
      )
    }

    // Sort: active + overdue first, then active, then paused, then discontinued
    return filtered.sort((a, b) => {
      const order = { active: 0, paused: 1, discontinued: 2 }
      const aOrder = order[a.status] ?? 1
      const bOrder = order[b.status] ?? 1
      if (aOrder !== bOrder) return aOrder - bOrder
      // Within active, overdue first
      const aOverdue = isOverdue(a.nextDoseAt, a.status)
      const bOverdue = isOverdue(b.nextDoseAt, b.status)
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [medications, typeFilter, searchQuery])

  // Collect available types from current medications
  const availableTypes = useMemo(() => {
    const types = new Set(medications.map((m) => m.type))
    return Array.from(types)
  }, [medications])

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", className)}>
      {/* Header — matches AssistantQueue */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1A5345] shadow-sm">
              <PillIcon className="size-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
                My Medications
              </h1>
              <p className="text-[12px] font-medium text-muted-foreground">
                {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-[#E8E6E0] bg-[#F9F8F5] p-4 sm:p-5 md:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell
            icon={PillIcon}
            iconBg="bg-[#E8F0EE]"
            iconColor="text-[#1A5345]"
            value={stats.totalActive}
            label="active medications"
          />
          <StatCell
            icon={CheckCircle2Icon}
            iconBg="bg-[#D4E5E0]"
            iconColor="text-[#0F3D32]"
            value={stats.takenToday}
            label={`taken today · of ${stats.dueToday} doses`}
          />
          <StatCell
            icon={ClockIcon}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            value={Math.max(0, stats.dueToday - stats.takenToday)}
            label="doses remaining"
          />
          <StatCell
            icon={TimerIcon}
            iconBg="bg-[#E0E8E4]"
            iconColor="text-[#4F6D64]"
            value={`${stats.adherencePercent}%`}
            label="7-day adherence"
          />
        </div>
      </div>

      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 sm:py-4 md:px-8">
          <div className="relative w-full sm:w-[min(100%,320px)] lg:w-[360px]">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, dose, or doctor..."
              className="h-9 rounded-xl border-[#E8E6E0] bg-white pl-9 text-[13px] shadow-sm focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20 sm:h-10 sm:rounded-2xl sm:pl-10 sm:text-[14px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1A5345]"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <div className="no-scrollbar w-full overflow-x-auto sm:ml-auto sm:w-auto">
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="flex min-w-max gap-1.5">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors",
                  typeFilter === "all"
                    ? "bg-[#1A5345] text-white shadow-sm"
                    : "border border-[#E8E6E0]/80 bg-white text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]",
                )}
              >
                All
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors",
                    typeFilter === type
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "border border-[#E8E6E0]/80 bg-white text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]",
                  )}
                >
                  {TYPE_LABELS[type] ?? type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#F9F8F5] px-5 pb-8 pt-6 sm:px-6 md:px-8">
        <section className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PillIcon className="size-5 text-[#1A5345]" aria-hidden />
              <h2 className="text-[18px] font-bold text-[#1A1F1E]">Your medications</h2>
            </div>
            <Badge
              variant="outline"
              className="rounded-lg border-[#E8E6E0] bg-[#F9F8F5] px-2.5 py-0.5 text-[11px] font-bold text-[#1A5345]"
            >
              {filteredMedications.length} total
            </Badge>
          </div>

          {filteredMedications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E6E0] bg-white py-12 text-center sm:py-16">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F4F3ED]">
                <PillIcon className="size-7 text-muted-foreground/50" strokeWidth={1.75} />
              </div>
              <p className="text-[15px] font-bold text-[#1A1F1E]">No medications found</p>
              <p className="mt-1 max-w-xs text-[13px] font-medium text-muted-foreground">
                {searchQuery
                  ? "No medications match your search."
                  : "Try another category filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
              <TooltipProvider delay={200}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                    <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                      <th className="py-4 pl-4 pr-4">Drug name</th>
                      <th className="px-4 py-4">Schedule</th>
                      <th className="px-4 py-4">7-day adherence</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E0]/40">
                    {filteredMedications.map((med) => (
                      <PatientMedicationRow
                        key={med.id}
                        medication={med}
                        onMarkTaken={onMarkTaken}
                        onMarkSkipped={onMarkSkipped}
                        onViewDetails={() => onSelectMedication(med)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              </TooltipProvider>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
