"use client"

import type { Medication, MedicationStats } from "./medications.types"
import { cn } from "@/lib/utils"
import { AlertCircleIcon, LeafIcon, ZapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const RING_SIZE = 72
const STROKE_WIDTH = 6
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const LOW_SUPPLY_THRESHOLD_DAYS = 14

type AdherenceStatus = {
  label: string
  percentClass: string
  boxClass: string
  barClass: string
}

function getAdherenceStatus(pct: number): AdherenceStatus {
  const safe = Math.min(100, Math.max(0, pct))
  if (safe >= 85) {
    return {
      label: "On track",
      percentClass: "text-emerald-600",
      boxClass: "border-emerald-200/80 bg-emerald-50/90",
      barClass: "bg-emerald-500",
    }
  }
  if (safe >= 65) {
    return {
      label: "Moderate",
      percentClass: "text-amber-600",
      boxClass: "border-amber-200/80 bg-amber-50/90",
      barClass: "bg-amber-500",
    }
  }
  return {
    label: "Needs attention",
    percentClass: "text-rose-600",
    boxClass: "border-rose-200/80 bg-rose-50/90",
    barClass: "bg-rose-500",
  }
}

function dailyProgressMessage(completed: number, total: number): string {
  if (total <= 0) return "No doses scheduled for today."
  if (completed >= total) return "All doses done — excellent work today!"
  const ratio = completed / total
  if (ratio >= 0.8) return "You're doing great today."
  if (ratio >= 0.5) return "You're making steady progress."
  if (completed > 0) return "Good start — keep it going."
  return "Your doses are ready when you are."
}

type RenewalAlert = {
  medicationName: string
  daysRemaining: number
}

function pickRenewalAlert(medications: Medication[]): RenewalAlert | null {
  const active = medications.filter((m) => m.status === "active")
  if (active.length === 0) return null

  const fromSupply = active
    .filter((m) => m.supplyDaysRemaining != null)
    .sort((a, b) => (a.supplyDaysRemaining ?? 999) - (b.supplyDaysRemaining ?? 999))

  const supplyCandidate = fromSupply[0]
  if (
    supplyCandidate?.supplyDaysRemaining != null &&
    supplyCandidate.supplyDaysRemaining <= LOW_SUPPLY_THRESHOLD_DAYS
  ) {
    return {
      medicationName: supplyCandidate.name,
      daysRemaining: supplyCandidate.supplyDaysRemaining,
    }
  }

  const fromRefillDue = active
    .filter((m) => m.nextRefillDue)
    .map((m) => ({
      medicationName: m.name,
      daysRemaining: Math.ceil(
        (new Date(m.nextRefillDue!).getTime() - Date.now()) / 86_400_000,
      ),
    }))
    .filter((x) => x.daysRemaining <= LOW_SUPPLY_THRESHOLD_DAYS)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  if (fromRefillDue.length > 0) {
    return fromRefillDue[0]
  }

  // Demo placeholder until refill/supply is wired from the API
  return {
    medicationName: active[0].name,
    daysRemaining: 5,
  }
}

type MedicationDailyProgressCardProps = {
  stats: MedicationStats
  medications?: Medication[]
  className?: string
}

export function MedicationDailyProgressCard({
  stats,
  medications = [],
  className,
}: MedicationDailyProgressCardProps) {
  const { takenToday, dueToday, adherencePercent, totalActive } = stats
  const safeTotal = Math.max(dueToday, 0)
  const completed = Math.min(Math.max(takenToday, 0), safeTotal || takenToday)
  const progressPct =
    safeTotal > 0 ? Math.round((completed / safeTotal) * 100) : completed > 0 ? 100 : 0
  const dashOffset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE
  const renewalAlert = pickRenewalAlert(medications)
  const adherenceStatus = getAdherenceStatus(adherencePercent)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-gradient-to-br from-[#FFFCFA] via-white to-[#E8F0EE]/55 shadow-sm sm:rounded-3xl">
        <div
          className="pointer-events-none absolute -right-6 top-0 size-36 rounded-full bg-[#D4E5E0]/30 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-center gap-4 p-4 sm:gap-5 sm:p-5 md:px-6">
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex size-[80px] items-center justify-center rounded-full bg-white/90 shadow-[0_2px_16px_-4px_rgba(26,83,69,0.12)] ring-1 ring-[#E8E6E0]/60">
              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="-rotate-90"
                aria-hidden
              >
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="#E8E6E0"
                  strokeWidth={STROKE_WIDTH}
                />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="#1A5345"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-label={`${progressPct}% of today's doses completed`}
              >
                <div className="relative">
                  <LeafIcon className="size-5 text-[#1A5345]" strokeWidth={2} aria-hidden />
                  <ZapIcon
                    className="absolute -bottom-0.5 -right-1 size-3 fill-[#1A5345] text-[#1A5345]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-[140px] flex-1">
            <h2 className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
              Daily Progress
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[12px] font-medium text-muted-foreground sm:text-[13px]">
              {dailyProgressMessage(completed, safeTotal)}
            </p>
          </div>

          <div className="hidden h-10 w-px shrink-0 bg-[#E8E6E0]/80 sm:block" aria-hidden />

          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-serif text-[32px] font-bold leading-none tabular-nums text-[#1A5345] sm:text-[36px]">
              {completed}
            </span>
            <span className="text-[13px] font-semibold text-[#1A1F1E]/75 sm:text-[14px]">
              {safeTotal > 0 ? (
                <>
                  of <span className="tabular-nums">{safeTotal}</span>
                </>
              ) : (
                "today"
              )}
            </span>
          </div>

          <div className="hidden h-10 w-px shrink-0 bg-[#E8E6E0]/80 md:block" aria-hidden />

          <div
            className={cn(
              "flex min-w-[148px] shrink-0 flex-col gap-2 rounded-xl border px-3.5 py-2.5 sm:min-w-[160px] sm:px-4 sm:py-3",
              adherenceStatus.boxClass,
            )}
            aria-label={`7-day adherence ${adherencePercent}%, ${adherenceStatus.label}`}
          >
            <div className="flex items-end justify-between gap-2">
              <span
                className={cn(
                  "font-serif text-[28px] font-bold leading-none tabular-nums sm:text-[32px]",
                  adherenceStatus.percentClass,
                )}
              >
                {adherencePercent}%
              </span>
              <span
                className={cn(
                  "mb-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
                  adherenceStatus.percentClass,
                  adherencePercent >= 85
                    ? "bg-emerald-100/80"
                    : adherencePercent >= 65
                      ? "bg-amber-100/80"
                      : "bg-rose-100/80",
                )}
              >
                {adherenceStatus.label}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#1A1F1E]/75 sm:text-[12px]">7-day adherence</p>
                {totalActive > 0 ? (
                  <p className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                    <span className="tabular-nums font-bold text-[#1A1F1E]/70">{totalActive}</span> active
                  </p>
                ) : null}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", adherenceStatus.barClass)}
                  style={{ width: `${Math.min(100, Math.max(0, adherencePercent))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {renewalAlert ? (
        <div
          role="alert"
          className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#CC5533]/20 bg-white px-4 py-3 shadow-sm sm:rounded-3xl sm:px-5 sm:py-3.5 md:px-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#CC5533]/10 text-[#CC5533] ring-1 ring-[#CC5533]/15">
              <AlertCircleIcon className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#CC5533]">
                Supply running low
              </p>
              <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#1A1F1E] sm:text-[14px]">
                <span className="font-bold">{renewalAlert.medicationName}</span>
                <span className="text-muted-foreground"> — </span>
                <span className="font-semibold text-[#CC5533]">
                  {renewalAlert.daysRemaining === 1
                    ? "1 day remaining"
                    : `${renewalAlert.daysRemaining} days remaining`}
                </span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-xl border-[#CC5533]/30 bg-[#FFF8F3] px-4 text-[12px] font-bold text-[#CC5533] shadow-none hover:bg-[#CC5533]/10 hover:text-[#A84428]"
          >
            Request renewal
          </Button>
        </div>
      ) : null}
    </div>
  )
}
