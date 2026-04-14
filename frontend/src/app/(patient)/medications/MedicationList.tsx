"use client"

import { useState, useMemo } from "react"
import type {
  Medication,
  MedicationStats,
  MedicationTypeFilter,
  TimeOfDay,
} from "./medications.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  PillIcon,
  SearchIcon,
  SkipForwardIcon,
  SunriseIcon,
  SunIcon,
  SunsetIcon,
  MoonIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const TYPE_LABELS: Record<string, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

const TIME_ICONS: Record<TimeOfDay, React.ElementType> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function isOverdue(nextDoseAt?: string, status?: string): boolean {
  if (!nextDoseAt || status !== "active") return false
  return new Date(nextDoseAt) < new Date()
}

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: number | string
  sub: string
  accent: string
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className={cn("flex size-9 items-center justify-center rounded-lg", accent)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-[#102F27]">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground/70">{sub}</p>
      </div>
    </div>
  )
}

type MedicationCardProps = {
  medication: Medication
  onMarkTaken: (id: string) => void
  onMarkSkipped: (id: string) => void
  onClick: () => void
}

function getTimeIcon(timeOfDay: TimeOfDay) {
  switch (timeOfDay) {
    case "morning":
      return SunriseIcon
    case "afternoon":
      return SunIcon
    case "evening":
      return MoonIcon
  }
}

function getMedCardStyles(overdue: boolean, status: Medication["status"], lastTakenAt?: string) {
  if (status === "discontinued") {
    return {
      borderColor: "border-[#E5EEEA]",
      iconBg: "bg-[#EEF2EF]",
      iconColor: "text-[#738678]",
      statusBadge: "bg-[#EEF2EF] text-[#738678]",
    }
  }
  if (status === "paused") {
    return {
      borderColor: "border-[#E5EEEA]",
      iconBg: "bg-[#F6EFE4]",
      iconColor: "text-[#9A6B2F]",
      statusBadge: "bg-[#F6EFE4] text-[#9A6B2F]",
    }
  }
  if (lastTakenAt && !overdue) {
    // Taken today
    return {
      borderColor: "border-[#1A5345]",
      iconBg: "bg-[#1A5345]",
      iconColor: "text-white",
      statusBadge: "bg-[#E8F0EE] text-[#1A5345]",
    }
  }
  if (overdue) {
    return {
      borderColor: "border-[#C94B4B]",
      iconBg: "bg-[#C94B4B]/10",
      iconColor: "text-[#C94B4B]",
      statusBadge: "bg-[#FFE5E5] text-[#C94B4B]",
    }
  }
  // Due
  return {
    borderColor: "border-[#3577DA]",
    iconBg: "bg-[#3577DA]/10",
    iconColor: "text-[#3577DA]",
    statusBadge: "bg-[#E8F2FF] text-[#3577DA]",
  }
}

function MedicationCard({
  medication,
  onMarkTaken,
  onMarkSkipped,
  onClick,
}: MedicationCardProps) {
  const overdue = isOverdue(medication.nextDoseAt, medication.status)
  const isPaused = medication.status === "paused"
  const isDiscontinued = medication.status === "discontinued"
  const isActive = medication.status === "active"
  const takenToday = medication.lastTakenAt && new Date(medication.lastTakenAt).toDateString() === new Date().toDateString()

  const styles = getMedCardStyles(overdue, medication.status, takenToday ? medication.lastTakenAt : undefined)
  const adherence = medication.adherenceHistory || [true, true, true, true, true, true, true]

  return (
    <div className={`rounded-xl border bg-white p-4 transition-all hover:shadow-sm ${styles.borderColor}`}>
      <div className="flex items-start gap-4">
        {/* Left: Status Icon */}
        <button
          onClick={onClick}
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}
        >
          {takenToday ? (
            <CheckIcon className="size-5" />
          ) : overdue ? (
            <AlertCircleIcon className="size-5" />
          ) : (
            <PillIcon className="size-5" />
          )}
        </button>

        {/* Middle: Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClick}
              className="font-semibold text-[#102F27] text-base hover:underline"
            >
              {medication.name} <span className="text-muted-foreground font-normal">{medication.dose}</span>
            </button>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${styles.statusBadge}`}>
              {TYPE_LABELS[medication.type] ?? medication.type}
            </span>
          </div>

          {/* Time info */}
          <div className="mt-1 text-sm text-muted-foreground">
            {takenToday && medication.lastTakenAt ? (
              <span>Taken at {formatTimeOnly(medication.lastTakenAt)}</span>
            ) : overdue ? (
              <span className="text-[#C94B4B]">Missed dose &mdash; Due now</span>
            ) : medication.nextDoseAt ? (
              <span>Next dose at {formatTimeOnly(medication.nextDoseAt)}</span>
            ) : (
              <span>{medication.frequency}</span>
            )}
            {medication.duration && (
              <span className="ml-2 rounded-full bg-[#F0F7F5] px-1.5 py-0.5 text-[11px] text-[#1A5345]">
                {medication.duration}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-[#E7EFEB]" />

          {/* Last 7 days adherence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Last 7 days:</span>
              <div className="flex gap-0.5">
                {adherence.map((taken, idx) => (
                  <div
                    key={idx}
                    className={`size-2.5 rounded-full ${
                      taken ? "bg-[#1A5345]" : "bg-[#C94B4B]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Time Badge & Action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Time of day badges */}
          <div className="flex flex-wrap justify-end gap-1">
            {medication.timeOfDay.map((tod) => {
              const Icon = getTimeIcon(tod)
              return (
                <span
                  key={tod}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 ${styles.statusBadge}`}
                >
                  <Icon className="size-3" />
                  {tod.charAt(0).toUpperCase() + tod.slice(1)}
                </span>
              )
            })}
          </div>

          {/* Action buttons */}
          {isActive && (
            <>
              {takenToday ? (
                <span className="rounded-lg border border-[#1A5345]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#1A5345]">
                  Taken today
                </span>
              ) : overdue ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-[#C94B4B] font-medium">Overdue</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 gap-1 bg-[#1A5345] px-2 text-[11px] hover:bg-[#0F3D32]"
                      onClick={() => onMarkTaken(medication.id)}
                    >
                      <CheckIcon className="size-3" />
                      Take
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 gap-1 bg-[#1A5345] px-2 text-[11px] hover:bg-[#0F3D32]"
                    onClick={() => onMarkTaken(medication.id)}
                  >
                    <CheckIcon className="size-3" />
                    Take
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[11px]"
                    onClick={() => onMarkSkipped(medication.id)}
                  >
                    <SkipForwardIcon className="size-3" />
                    Skip
                  </Button>
                </div>
              )}
            </>
          )}
          {isPaused && (
            <span className="rounded-lg bg-[#F6EFE4] px-2.5 py-1 text-[11px] font-medium text-[#9A6B2F]">
              Paused
            </span>
          )}
          {isDiscontinued && (
            <span className="rounded-lg bg-[#EEF2EF] px-2.5 py-1 text-[11px] font-medium text-[#738678]">
              Discontinued
            </span>
          )}
        </div>
      </div>
    </div>
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
    <div className={cn("w-full space-y-4", className)}>
      {/* Header */}
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1A5345]">
              <PillIcon className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1F1E]">My Medications</h2>
              <p className="text-[11px] text-[#6B7870]">
                {stats.totalActive} active &middot; {stats.takenToday}/{stats.dueToday} taken today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                stats.adherencePercent >= 80
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : stats.adherencePercent >= 50
                    ? "bg-[#F6EFE4] text-[#9A6B2F]"
                    : "bg-red-50 text-red-500",
              )}
            >
              {stats.adherencePercent}% adherence
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={<PillIcon className="size-4 text-[#1A5345]" />}
            label="Active"
            value={stats.totalActive}
            sub="medications"
            accent="bg-[#E8F0EE]"
          />
          <StatCard
            icon={<CheckCircle2Icon className="size-4 text-emerald-500" />}
            label="Taken Today"
            value={stats.takenToday}
            sub={`of ${stats.dueToday} doses`}
            accent="bg-emerald-50"
          />
          <StatCard
            icon={<ClockIcon className="size-4 text-[#C26D2A]" />}
            label="Remaining"
            value={Math.max(0, stats.dueToday - stats.takenToday)}
            sub="doses left"
            accent="bg-[#F9F2E8]"
          />
          <StatCard
            icon={<AlertTriangleIcon className="size-4 text-amber-500" />}
            label="Adherence"
            value={`${stats.adherencePercent}%`}
            sub="last 7 days"
            accent="bg-amber-50"
          />
        </div>

        {/* Search + Type Filter */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-80 lg:w-96">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, dose, or doctor..."
              className="h-8 border-[#E8E6E0] bg-white pl-9 text-[13px] placeholder:text-[#9CA3AF]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <div className="no-scrollbar w-full overflow-x-auto md:ml-auto md:w-auto">
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="flex min-w-max gap-1">
              <button
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  typeFilter === "all"
                    ? "bg-[#1A5345] text-white"
                    : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                )}
              >
                All
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    typeFilter === type
                      ? "bg-[#1A5345] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                  )}
                >
                  {TYPE_LABELS[type] ?? type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Medication Cards */}
      <div className="space-y-3 px-4">
        {filteredMedications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
              <PillIcon className="size-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[14px] text-[#6B7870]">
              {searchQuery
                ? "No medications match your search."
                : "No medications found for this filter."}
            </p>
          </div>
        ) : (
          filteredMedications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onMarkTaken={onMarkTaken}
              onMarkSkipped={onMarkSkipped}
              onClick={() => onSelectMedication(med)}
            />
          ))
        )}
      </div>
    </div>
  )
}
