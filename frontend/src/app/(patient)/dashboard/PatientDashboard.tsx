"use client"

import * as React from "react"
import Link from "next/link"
import type { PatientDashboardData, Vital, Appointment, Medication } from "./dashboard.types"

import {
  AdherencePill,
  MedicationDots,
  MedicationSnapshotCard,
} from "@/app/(assistant)/assistant-medications/assistantMedications.shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  GaugeIcon,
  HeartPulseIcon,
  MessageCircleIcon,
  PillIcon,
  StethoscopeIcon,
  TrendingDownIcon,
} from "lucide-react"

const weeklyVitalsData = [
  { date: "2026-04-01", heartRate: 72, bloodPressure: 118 },
  { date: "2026-04-02", heartRate: 75, bloodPressure: 120 },
  { date: "2026-04-03", heartRate: 78, bloodPressure: 119 },
  { date: "2026-04-04", heartRate: 74, bloodPressure: 118 },
  { date: "2026-04-05", heartRate: 76, bloodPressure: 117 },
  { date: "2026-04-06", heartRate: 78, bloodPressure: 118 },
  { date: "2026-04-07", heartRate: 77, bloodPressure: 119 },
]

const monthlyVitalsData = [
  { date: "2026-03-08", heartRate: 74, bloodPressure: 120 },
  { date: "2026-03-15", heartRate: 76, bloodPressure: 119 },
  { date: "2026-03-22", heartRate: 73, bloodPressure: 118 },
  { date: "2026-03-29", heartRate: 75, bloodPressure: 120 },
  { date: "2026-04-05", heartRate: 76, bloodPressure: 117 },
  { date: "2026-04-06", heartRate: 78, bloodPressure: 118 },
]

const vitalsRangeOptions = [
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
] as const

const vitalsChartConfig = {
  heartRate: { label: "Heart Rate", color: "#1A5345" },
  bloodPressure: { label: "BP Systolic", color: "#E89042" },
} satisfies ChartConfig

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
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

function todayStatusLabel(med: Medication) {
  if (med.status === "taken" && med.lastTakenAt) {
    return `Taken at ${formatTime(med.lastTakenAt)}`
  }
  if (med.status === "missed") {
    return `Missed — due at ${med.dueAt ? formatTime(med.dueAt) : "scheduled time"}`
  }
  return `Due at ${med.dueAt ? formatTime(med.dueAt) : "scheduled time"}`
}

function todayStatusBadgeClass(status: Medication["status"]) {
  switch (status) {
    case "taken":
      return "border-0 bg-emerald-500 text-white hover:bg-emerald-500"
    case "due":
      return "border-0 bg-sky-500 text-white hover:bg-sky-500"
    case "missed":
      return "border-0 bg-rose-500 text-white hover:bg-rose-500"
  }
}

function computeHealthScore(medications: Medication[]) {
  if (!medications.length) return 94
  const scores = medications.map((m) => {
    if (!m.adherenceHistory.length) return 100
    const taken = m.adherenceHistory.filter(Boolean).length
    return (taken / m.adherenceHistory.length) * 100
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function daysUntil(iso: string) {
  const target = new Date(iso)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000))
}

function SectionHeader({
  title,
  dotClassName,
  badge,
}: {
  title: string
  dotClassName: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dotClassName)} />
        <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">{title}</h2>
      </div>
      {badge}
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
}: {
  label: string
  value: React.ReactNode
  hint: React.ReactNode
  icon: React.ElementType
  iconClassName: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <Icon className={cn("absolute right-4 top-4 size-5", iconClassName)} aria-hidden />
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">{value}</h3>
      <div className="mt-3 text-[11px] font-medium text-muted-foreground">{hint}</div>
    </div>
  )
}

function VitalCard({ vital }: { vital: Vital }) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        <ActivityIcon className="size-4 text-[#1A5345]" aria-hidden />
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          {vital.label}
        </p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-[28px] font-bold leading-none text-[#1A1F1E]">
          {vital.value}
        </span>
        {vital.unit ? (
          <span className="text-[13px] font-medium text-muted-foreground">{vital.unit}</span>
        ) : null}
      </div>
      {vital.reference ? (
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">Ref: {vital.reference}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(vital.lastMeasuredAt)}</p>
    </div>
  )
}

function AppointmentRow({ appt, isNext = false }: { appt: Appointment; isNext?: boolean }) {
  const statusStyle =
    appt.status === "confirmed"
      ? "bg-[#E8F0EE] text-[#1A5345]"
      : appt.status === "completed"
        ? "bg-[#EEF2EF] text-[#5B6D63]"
        : "bg-[#F6EFE4] text-[#9A6B2F]"

  return (
    <div
      className={cn(
        "group rounded-xl border border-[#E8E6E0]/60 bg-white p-4 transition-all hover:shadow-md",
        isNext && "ring-1 ring-[#1A5345]/20",
      )}
    >
      <div className="flex items-start gap-3">
        <CalendarClockIcon
          className={cn("size-5 shrink-0", isNext ? "text-[#1A5345]" : "text-[#CC5533]")}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                "truncate text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]",
                isNext && "text-[#1A5345]",
              )}
            >
              {appt.department}
            </h4>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold capitalize",
                statusStyle,
              )}
            >
              {appt.status}
            </span>
            {isNext ? (
              <span className="shrink-0 rounded-md bg-[#CC5533]/10 px-2 py-0.5 text-[10px] font-bold text-[#CC5533]">
                Next visit
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            {formatDateTime(appt.scheduledAt)}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#6B7870]">{appt.clinician}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{appt.location}</p>
        </div>
      </div>
    </div>
  )
}

function DashboardMedicationRow({ med }: { med: Medication }) {
  const adherencePct = adherencePctFromHistory(med.adherenceHistory)

  return (
    <tr className="group transition-colors hover:bg-[#F9F8F5]/30">
      <td className="px-5 py-4">
        <p className="text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
          {med.name}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{med.dosage}</p>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[220px] text-[13px] font-medium leading-relaxed text-[#1A1F1E]/80">
          {med.frequency}
        </p>
        <p className="mt-1 text-[12px] font-medium text-muted-foreground">{todayStatusLabel(med)}</p>
        <Badge
          variant="default"
          className={cn("mt-2 rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize", todayStatusBadgeClass(med.status))}
        >
          {med.timeOfDay} · {med.status}
        </Badge>
      </td>
      <td className="px-5 py-4">
        <div className="flex max-w-[148px] flex-col gap-1.5">
          <MedicationDots history={med.adherenceHistory} />
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
        {med.status === "taken" ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1A5345]">
            <CheckCircle2Icon className="size-4" aria-hidden />
            Taken
          </span>
        ) : med.status === "missed" ? (
          <span className="text-[12px] font-bold text-rose-600">Missed</span>
        ) : (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg border-0 bg-transparent px-3 text-[12px] font-bold text-[#1A5345] shadow-none hover:bg-[#1A5345]/5"
          >
            <Link href="/medications">Mark taken</Link>
          </Button>
        )}
      </td>
    </tr>
  )
}

function PatientDashboardContent({ data }: { data: PatientDashboardData }) {
  const [activeVitalsRange, setActiveVitalsRange] =
    React.useState<(typeof vitalsRangeOptions)[number]["key"]>("1W")

  const chartData = activeVitalsRange === "1W" ? weeklyVitalsData : monthlyVitalsData

  const avgHeartRate = Math.round(
    chartData.reduce((sum, d) => sum + d.heartRate, 0) / chartData.length,
  )
  const avgBP = Math.round(
    chartData.reduce((sum, d) => sum + d.bloodPressure, 0) / chartData.length,
  )

  const healthScore = computeHealthScore(data.medications)
  const medsTaken = data.medications.filter((m) => m.status === "taken").length
  const medsTotal = data.medications.length
  const medsDue = Math.max(0, medsTotal - medsTaken)
  const medsProgress = medsTotal > 0 ? Math.round((medsTaken / medsTotal) * 100) : 0
  const overallAdherence =
    medsTotal > 0
      ? Math.round(
          data.medications.reduce((sum, m) => sum + adherencePctFromHistory(m.adherenceHistory), 0) /
            medsTotal,
        )
      : 100
  const nextFollowUpDays = daysUntil(data.careSummary.nextFollowUpAt)

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Health Score"
          value={healthScore}
          hint={
            <span className="text-emerald-700">
              <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500" />
              Based on 7-day medication adherence
            </span>
          }
          icon={HeartPulseIcon}
          iconClassName="text-[#1A5345]"
        />
        <StatCard
          label="Upcoming Visits"
          value={data.upcomingAppointments.length}
          hint="Scheduled appointments on your calendar"
          icon={CalendarClockIcon}
          iconClassName="text-[#CC5533]"
        />
        <StatCard
          label="Medications Today"
          value={
            <>
              {medsTaken}
              <span className="ml-1 font-sans text-[16px] font-medium text-muted-foreground">
                / {medsTotal}
              </span>
            </>
          }
          hint={`${medsProgress}% of today's doses completed`}
          icon={PillIcon}
          iconClassName="text-[#2E8B68]"
        />
        <StatCard
          label="Vitals Recorded"
          value={data.vitals.length}
          hint={`Last updated ${formatDateTime(data.lastVitalsAt)}`}
          icon={ActivityIcon}
          iconClassName="text-[#3C57D0]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionHeader
            title="Your Vital Signs"
            dotClassName="bg-[#1A5345]"
            badge={
              <span className="rounded-lg bg-[#E8F0EE] px-2.5 py-0.5 text-[11px] font-bold text-[#1A5345]">
                Latest readings
              </span>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {data.vitals.map((vital) => (
              <VitalCard key={vital.id} vital={vital} />
            ))}
          </div>

          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Vitals Trends</h3>
                <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                  Heart rate and blood pressure over time
                </p>
              </div>
              <div className="inline-flex rounded-full border border-[#D6E6DF] bg-[#F8FCFA] p-1">
                {vitalsRangeOptions.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setActiveVitalsRange(range.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
                      activeVitalsRange === range.key
                        ? "bg-[#1A5345] text-white"
                        : "text-[#4F6D64] hover:bg-[#E8F0EE]",
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-3.5">
                <HeartPulseIcon className="size-6 shrink-0 text-[#1A5345]" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Heart Rate
                  </p>
                  <p className="font-serif text-[24px] font-bold text-[#1A1F1E]">
                    {avgHeartRate}{" "}
                    <span className="font-sans text-[13px] font-medium text-muted-foreground">bpm</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-3.5">
                <GaugeIcon className="size-6 shrink-0 text-[#CC5533]" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Blood Pressure
                  </p>
                  <p className="font-serif text-[24px] font-bold text-[#1A1F1E]">
                    {avgBP}{" "}
                    <span className="font-sans text-[13px] font-medium text-muted-foreground">mmHg</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingDownIcon className="size-3" aria-hidden />
                    Stable trend
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-3">
              <ChartContainer config={vitalsChartConfig} className="h-56 w-full">
                <RechartsPrimitive.LineChart accessibilityLayer data={chartData}>
                  <RechartsPrimitive.CartesianGrid vertical={false} stroke="#E7EFEB" />
                  <RechartsPrimitive.XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                    }
                  />
                  <RechartsPrimitive.YAxis hide />
                  <ChartTooltip
                    cursor={{ stroke: "#DDE9E4", strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                          })
                        }
                      />
                    }
                  />
                  <RechartsPrimitive.Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="var(--color-heartRate)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-heartRate)", strokeWidth: 0, r: 3 }}
                  />
                  <RechartsPrimitive.Line
                    type="monotone"
                    dataKey="bloodPressure"
                    stroke="var(--color-bloodPressure)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-bloodPressure)", strokeWidth: 0, r: 3 }}
                  />
                </RechartsPrimitive.LineChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SectionHeader
            title="Care Summary"
            dotClassName="bg-[#CC5533]"
            badge={
              <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                Active care
              </span>
            }
          />

          <div className="space-y-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/50 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <StethoscopeIcon className="size-4 text-[#1A5345]" aria-hidden />
                <span className="text-[12px] font-medium text-muted-foreground">Last check-up</span>
              </div>
              <span className="text-[12px] font-bold text-[#1A1F1E]">
                {formatDate(data.careSummary.lastCheckUpAt)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/50 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <CalendarClockIcon className="size-4 text-[#CC5533]" aria-hidden />
                <span className="text-[12px] font-medium text-muted-foreground">Next follow-up</span>
              </div>
              <span className="text-[12px] font-bold text-[#1A1F1E]">
                {formatDate(data.careSummary.nextFollowUpAt)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/50 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-[#2E8B68]" aria-hidden />
                <span className="text-[12px] font-medium text-muted-foreground">Days to follow-up</span>
              </div>
              <span className="text-[12px] font-bold text-[#1A5345]">{nextFollowUpDays} days</span>
            </div>
            <div className="rounded-xl border border-[#F2E1C7] bg-[#FFF8EB] px-3.5 py-3">
              <p className="text-[12px] leading-relaxed text-[#8C5B1E]">
                <span className="font-bold">Note:</span> {data.careSummary.planNote}
              </p>
            </div>
          </div>

          <SectionHeader
            title="Upcoming Visits"
            dotClassName="bg-[#1A5345]"
            badge={
              <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                {data.upcomingAppointments.length} scheduled
              </span>
            }
          />

          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {data.upcomingAppointments.map((appt, idx) => (
              <AppointmentRow key={appt.id} appt={appt} isNext={idx === 0} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader
          title="Today's Medications"
          dotClassName="bg-[#2E8B68]"
          badge={
            <span className="rounded-lg bg-[#E8F0EE] px-2.5 py-0.5 text-[11px] font-bold text-[#1A5345]">
              {medsTaken} / {medsTotal} taken
            </span>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MedicationSnapshotCard label="Adherence score">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">
                {overallAdherence}%
              </span>
              <AdherencePill pct={overallAdherence} />
            </div>
          </MedicationSnapshotCard>
          <MedicationSnapshotCard label="Medications">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A5345]">
                {medsTotal}
              </span>
              <PillIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            </div>
          </MedicationSnapshotCard>
          <MedicationSnapshotCard label="Taken today">
            <p className="text-[18px] font-bold leading-none tabular-nums text-emerald-600">{medsTaken}</p>
          </MedicationSnapshotCard>
          <MedicationSnapshotCard label="Due today">
            <p className="text-[18px] font-bold leading-none tabular-nums text-amber-600">{medsDue}</p>
          </MedicationSnapshotCard>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <PillIcon className="size-5 text-[#1A5345]" aria-hidden />
              <h3 className="text-[18px] font-bold text-[#1A1F1E]">Today&apos;s doses</h3>
              <span className="rounded-lg bg-[#F9F8F5] px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {medsProgress}% complete
              </span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
            >
              <Link href="/medications">
                View all medications
                <ArrowRightIcon className="ml-1.5 size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]">
                    <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">Drug name</th>
                    <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">Schedule</th>
                    <th className="px-5 py-4 text-[13px] font-bold text-[#1A1F1E]">7-day adherence</th>
                    <th className="px-5 py-4 text-right text-[13px] font-bold text-[#1A1F1E]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {data.medications.map((med) => (
                    <DashboardMedicationRow key={med.id} med={med} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="border-t border-[#E8E6E0]/60 pt-6">
        <h3 className="mb-4 font-serif text-[17px] font-bold text-[#1A1F1E]">Quick Access</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/vitals"
            className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
          >
            <ActivityIcon className="size-5 text-[#1A5345]" aria-hidden />
            <div>
              <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                Log Vitals
              </h4>
              <p className="text-[11px] text-muted-foreground">Track your daily measurements</p>
            </div>
          </Link>
          <Link
            href="/medications"
            className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
          >
            <PillIcon className="size-5 text-orange-600" aria-hidden />
            <div>
              <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                My Medications
              </h4>
              <p className="text-[11px] text-muted-foreground">View schedule and adherence</p>
            </div>
          </Link>
          <Link
            href="/appointments"
            className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
          >
            <CalendarClockIcon className="size-5 text-blue-600" aria-hidden />
            <div>
              <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                Appointments
              </h4>
              <p className="text-[11px] text-muted-foreground">Book and manage visits</p>
            </div>
          </Link>
          <Link
            href="/consultations"
            className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
          >
            <MessageCircleIcon className="size-5 text-purple-600" aria-hidden />
            <div>
              <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                Consultations
              </h4>
              <p className="text-[11px] text-muted-foreground">Review visit history</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-[#F9F8F5] px-6 py-6 sm:px-8">
      <div className="w-full min-w-0 space-y-6">
        <div className="w-full rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm">
          <Skeleton className="mb-3 h-3 w-40" />
          <Skeleton className="mb-3 h-8 w-[min(100%,280px)]" />
          <Skeleton className="h-4 w-[min(100%,420px)]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[300px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export type PatientDashboardProps = {
  data: PatientDashboardData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function PatientDashboard({ data, isLoading, isError, error }: PatientDashboardProps) {
  if (isLoading) return <DashboardLoading />

  if (isError) {
    return (
      <div className="w-full min-w-0 flex-1 bg-[#F9F8F5] p-6 sm:p-8">
        <Alert variant="destructive" className="w-full max-w-none rounded-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load dashboard."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  const { patient, lastVitalsAt } = data

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="border-l-[3px] border-[#CC5533] pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[12px]">
              {formatTodayHeading()}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              Care plan active
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Welcome back, {patient.fullName.split(" ")[0]}
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Patient ID: {patient.id}
                {patient.age ? ` · Age ${patient.age}` : ""} · Last vitals{" "}
                {formatDateTime(lastVitalsAt)}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
              >
                <Link href="/vitals">
                  <ActivityIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                  Log Vitals
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
              >
                <Link href="/medications">
                  <PillIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                  My Medications
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <PatientDashboardContent data={data} />
      </div>
    </div>
  )
}
