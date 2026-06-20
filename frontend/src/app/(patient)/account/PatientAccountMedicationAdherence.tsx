"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { ArrowRightIcon, PillIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useMedications } from "../medications/useMedications"
import type { DoseLog } from "../medications/medications.types"

function adherenceTone(pct: number) {
  if (pct >= 85) return { key: "onTrack" as const, text: "text-emerald-600", bar: "bg-emerald-500" }
  if (pct >= 65) return { key: "moderate" as const, text: "text-amber-600", bar: "bg-amber-500" }
  return { key: "needsAttention" as const, text: "text-rose-600", bar: "bg-rose-500" }
}

function buildLast7DayDots(doseLogs: DoseLog[]) {
  const dots: Array<"full" | "partial" | "missed" | "empty"> = []

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayLogs = doseLogs.filter((log) => {
      const takenAt = new Date(log.takenAt)
      return takenAt >= dayStart && takenAt < dayEnd
    })

    if (dayLogs.length === 0) {
      dots.push("empty")
      continue
    }

    const taken = dayLogs.filter((log) => !log.skipped).length
    if (taken === dayLogs.length) dots.push("full")
    else if (taken === 0) dots.push("missed")
    else dots.push("partial")
  }

  return dots
}

const dotStyles = {
  full: "bg-emerald-500",
  partial: "bg-amber-400",
  missed: "bg-rose-50 border border-rose-200",
  empty: "bg-[#E8E6E0]",
} as const

export function PatientAccountMedicationAdherence() {
  const t = useTranslations("patient.account.medicationAdherence")
  const { data, isLoading } = useMedications()

  const { stats, doseLog, medications } = data
  const activeCount = useMemo(
    () => medications.filter((med) => med.status === "active").length,
    [medications],
  )
  const adherenceMeta = adherenceTone(stats.adherencePercent)
  const weekDots = useMemo(() => buildLast7DayDots(doseLog), [doseLog])

  const todayProgressPct =
    stats.dueToday > 0
      ? Math.round((Math.min(stats.takenToday, stats.dueToday) / stats.dueToday) * 100)
      : stats.takenToday > 0
        ? 100
        : 0

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-2xl" />
  }

  if (activeCount === 0) {
    return (
      <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <PillIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#1A1F1E]">{t("title")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("noMedications")}</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-3 h-8 gap-1.5 rounded-lg border-[#E8E6E0] text-[12px] font-semibold text-[#1A5345]"
            >
              <Link href="/medications">
                {t("viewMedications")}
                <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PillIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
              {t("title")}
            </p>
            <p className={cn("mt-1 font-serif text-[32px] font-bold leading-none tabular-nums", adherenceMeta.text)}>
              {stats.adherencePercent}%
            </p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold", adherenceMeta.text)}>
          {t(`status.${adherenceMeta.key}`)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        {weekDots.map((dot, index) => (
          <div
            key={index}
            className={cn("size-2.5 rounded-full", dotStyles[dot])}
            title={t(`weekDays.${index}`)}
          />
        ))}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8E6E0]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", adherenceMeta.bar)}
          style={{ width: `${stats.adherencePercent}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/60 px-3 py-2.5">
        <div>
          <p className="text-[11px] font-bold text-[#6B7870]">{t("todayProgress")}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-[#1A1F1E]">
            {t("doses", { taken: stats.takenToday, total: stats.dueToday })}
          </p>
        </div>
        <p className="font-serif text-[18px] font-bold tabular-nums text-[#1A5345]">{todayProgressPct}%</p>
      </div>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mt-3 h-8 w-full gap-1.5 rounded-lg text-[12px] font-semibold text-[#1A5345] hover:bg-[#F4F3EF]"
      >
        <Link href="/medications">
          {t("viewMedications")}
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
