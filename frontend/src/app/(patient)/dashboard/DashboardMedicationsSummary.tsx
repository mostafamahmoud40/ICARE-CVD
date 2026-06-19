"use client"

import Link from "next/link"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  PillIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Medication } from "./dashboard.types"

const RING_SIZE = 48
const STROKE = 4
const RADIUS = (RING_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

function adherencePctFromHistory(history: boolean[]) {
  if (!history.length) return 100
  const taken = history.filter(Boolean).length
  return Math.round((taken / history.length) * 100)
}

function overallAdherence(medications: Medication[]) {
  if (!medications.length) return 100
  const sum = medications.reduce((acc, med) => acc + adherencePctFromHistory(med.adherenceHistory), 0)
  return Math.round(sum / medications.length)
}

function adherenceTone(pct: number) {
  if (pct >= 85) return { label: "On track", text: "text-emerald-600", bar: "bg-emerald-500" }
  if (pct >= 65) return { label: "Moderate", text: "text-amber-600", bar: "bg-amber-500" }
  return { label: "Needs attention", text: "text-rose-600", bar: "bg-rose-500" }
}

function doseStatusLabel(med: Medication) {
  if (med.status === "missed") {
    return med.dueAt ? `Missed — was due at ${formatTime(med.dueAt)}` : "Missed dose"
  }
  if (med.status === "taken" && med.lastTakenAt) {
    return `Taken at ${formatTime(med.lastTakenAt)}`
  }
  return med.dueAt ? `Due at ${formatTime(med.dueAt)}` : `Due ${med.timeOfDay.toLowerCase()}`
}

function sortActionableMeds(medications: Medication[]) {
  return medications
    .filter((med) => med.status !== "taken")
    .sort((a, b) => {
      if (a.status === "missed" && b.status !== "missed") return -1
      if (b.status === "missed" && a.status !== "missed") return 1
      const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
}

const SUMMARY_TILE_CLASS =
  "rounded-xl bg-white shadow-[0_1px_6px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.1)]"

const DOSE_ROW_CLASS =
  "group flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-[0_1px_6px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-[#FAFAF8] hover:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.12)]"

function StatusChip({ status }: { status: Medication["status"] }) {
  if (status === "missed") {
    return (
      <span className="shrink-0 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
        Missed
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-lg bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
      Due
    </span>
  )
}

function ActionableDoseRow({ med }: { med: Medication }) {
  const isMissed = med.status === "missed"

  return (
    <Link href="/medications" className={DOSE_ROW_CLASS}>
      {isMissed ? (
        <AlertCircleIcon className="size-4 shrink-0 text-rose-600" aria-hidden />
      ) : (
        <ClockIcon className="size-4 shrink-0 text-sky-600" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-serif text-[14px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
            {med.name}
          </p>
          <StatusChip status={med.status} />
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[#6B7870]">
          {med.dosage} · {med.frequency}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{doseStatusLabel(med)}</p>
      </div>
      <ArrowRightIcon
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#1A5345]"
        aria-hidden
      />
    </Link>
  )
}

function ProgressRing({ progressPct }: { progressPct: number }) {
  const dashOffset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE

  return (
    <div
      className="relative flex size-12 shrink-0 items-center justify-center"
      aria-label={`${progressPct}% of today's doses completed`}
    >
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
          strokeWidth={STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1A5345"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-serif text-[12px] font-bold tabular-nums text-[#1A5345]">
        {progressPct}%
      </span>
    </div>
  )
}

function TodayProgressCard({
  progressPct,
  takenToday,
  totalToday,
}: {
  progressPct: number
  takenToday: number
  totalToday: number
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 px-3 py-2.5", SUMMARY_TILE_CLASS)}>
      <ProgressRing progressPct={progressPct} />
      <div className="min-w-0">
        <p className="font-serif text-[14px] font-bold leading-tight text-[#1A1F1E]">Today&apos;s progress</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[#6B7870]">
          {takenToday}/{totalToday} doses
        </p>
      </div>
    </div>
  )
}

function AdherenceCard({
  adherence,
  adherenceMeta,
}: {
  adherence: number
  adherenceMeta: ReturnType<typeof adherenceTone>
}) {
  return (
    <div className={cn("flex min-w-0 flex-col px-3 py-2.5", SUMMARY_TILE_CLASS)}>
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[11px] font-bold text-[#6B7870]">7-day adherence</p>
        <span className={cn("shrink-0 text-[10px] font-bold", adherenceMeta.text)}>
          {adherenceMeta.label}
        </span>
      </div>
      <p
        className={cn(
          "mt-1.5 font-serif text-[22px] font-bold leading-none tabular-nums",
          adherenceMeta.text,
        )}
      >
        {adherence}%
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8E6E0]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", adherenceMeta.bar)}
          style={{ width: `${adherence}%` }}
        />
      </div>
    </div>
  )
}

function StatusCounts({
  takenToday,
  dueToday,
  missedToday,
}: {
  takenToday: number
  dueToday: number
  missedToday: number
}) {
  const items = [
    { label: "Taken", value: takenToday, valueClass: "text-emerald-600" },
    { label: "Due", value: dueToday, valueClass: "text-sky-600" },
    { label: "Missed", value: missedToday, valueClass: "text-rose-600" },
  ] as const

  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("px-2 py-2.5 text-center", SUMMARY_TILE_CLASS)}
        >
          <p className={cn("font-serif text-[18px] font-bold leading-none tabular-nums", item.valueClass)}>
            {item.value}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#6B7870]">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

type DashboardMedicationsSummaryProps = {
  medications: Medication[]
  compact?: boolean
}

export function DashboardMedicationsSummary({
  medications,
  compact = false,
}: DashboardMedicationsSummaryProps) {
  const takenToday = medications.filter((med) => med.status === "taken").length
  const dueToday = medications.filter((med) => med.status === "due").length
  const missedToday = medications.filter((med) => med.status === "missed").length
  const totalToday = medications.length
  const progressPct = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0
  const adherence = overallAdherence(medications)
  const adherenceMeta = adherenceTone(adherence)
  const actionable = sortActionableMeds(medications)
  const preview = actionable.slice(0, compact ? 2 : 3)
  const remaining = actionable.length - preview.length

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#E8E6E0]/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <PillIcon className="size-5 shrink-0 text-[#2E8B68]" aria-hidden />
          <h2 className="font-serif text-[17px] font-bold text-[#1A1F1E] sm:text-[18px]">Medications</h2>
          <span className="rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[11px] font-bold text-[#1A5345]">
            {takenToday} / {totalToday} taken today
          </span>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 self-start rounded-lg border-0 bg-transparent px-0 text-[12px] font-bold text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#133F34] sm:self-center sm:px-2 sm:hover:bg-[#1A5345]/5"
        >
          <Link href="/medications">
            View all
            <ArrowRightIcon className="ml-1 size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid w-full max-w-md grid-cols-2 gap-2.5">
          <TodayProgressCard
            progressPct={progressPct}
            takenToday={takenToday}
            totalToday={totalToday}
          />
          <AdherenceCard adherence={adherence} adherenceMeta={adherenceMeta} />
        </div>

        <StatusCounts
          takenToday={takenToday}
          dueToday={dueToday}
          missedToday={missedToday}
        />

        {preview.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-[13px] font-bold text-[#1A5345]">Coming up today</h3>
            <div className="space-y-2">
              {preview.map((med) => (
                <ActionableDoseRow key={med.id} med={med} />
              ))}
            </div>
            {remaining > 0 ? (
              <p className="px-0.5 text-[12px] font-medium text-muted-foreground">
                + {remaining} more on the medications page
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-3 text-[13px] font-medium text-[#1A5345] shadow-[0_1px_6px_-2px_rgba(0,0,0,0.08)]">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" aria-hidden />
            All doses complete for today — great work!
          </div>
        )}
      </div>
    </section>
  )
}
