"use client"

import * as React from "react"
import type { PatientDashboardData, Vital, Appointment, Medication } from "./dashboard.types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import * as RechartsPrimitive from "recharts"
import {
  ActivityIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  HeartPulseIcon,
  PillIcon,
  TrendingUpIcon,
  UserRoundIcon,
  StethoscopeIcon,
  FileTextIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  SunriseIcon,
  SunIcon,
  SunsetIcon,
  MoonIcon,
  GaugeIcon,
  TrendingDownIcon,
} from "lucide-react"

type DashboardMetric = {
  label: string
  value: number | string
  delta: string
  trend: "up" | "down"
  icon: React.ComponentType<{ className?: string }>
  iconStyle: string
  sparkStyle: string
}

const primaryMetrics: DashboardMetric[] = [
  {
    label: "Health Score",
    value: "94",
    delta: "+2%",
    trend: "up",
    icon: HeartPulseIcon,
    iconStyle: "text-[#1A5345]",
    sparkStyle: "bg-[#1A5345]/80",
  },
  {
    label: "Upcoming Visits",
    value: 3,
    delta: "This month",
    trend: "up",
    icon: CalendarClockIcon,
    iconStyle: "text-[#C26D2A]",
    sparkStyle: "bg-[#E89042]/80",
  },
  {
    label: "Active Medications",
    value: 3,
    delta: "On track",
    trend: "up",
    icon: PillIcon,
    iconStyle: "text-[#2E8B68]",
    sparkStyle: "bg-[#2E8B68]/80",
  },
]

const secondaryMetrics: DashboardMetric[] = [
  {
    label: "Vitals Recorded",
    value: 4,
    delta: "Latest today",
    trend: "up",
    icon: ActivityIcon,
    iconStyle: "text-[#3C57D0]",
    sparkStyle: "bg-[#3C57D0]/70",
  },
  {
    label: "Days to Follow-up",
    value: 10,
    delta: "Apr 12",
    trend: "up",
    icon: CalendarCheckIcon,
    iconStyle: "text-[#08A89A]",
    sparkStyle: "bg-[#08A89A]/70",
  },
  {
    label: "Completed Visits",
    value: 8,
    delta: "+2",
    trend: "up",
    icon: StethoscopeIcon,
    iconStyle: "text-[#2E8B57]",
    sparkStyle: "bg-[#2E8B57]/70",
  },
  {
    label: "Reports Ready",
    value: 2,
    delta: "View now",
    trend: "up",
    icon: FileTextIcon,
    iconStyle: "text-[#D33F3F]",
    sparkStyle: "bg-[#D33F3F]/70",
  },
  {
    label: "Care Plan Steps",
    value: 5,
    delta: "3 done",
    trend: "up",
    icon: ClockIcon,
    iconStyle: "text-[#3577DA]",
    sparkStyle: "bg-[#3577DA]/70",
  },
  {
    label: "Wellness Trend",
    value: "Good",
    delta: "Stable",
    trend: "up",
    icon: TrendingUpIcon,
    iconStyle: "text-[#48A879]",
    sparkStyle: "bg-[#48A879]/70",
  },
]

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

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatDate(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
}

function MetricCard({ metric, compact = false }: { metric: DashboardMetric; compact?: boolean }) {
  const Icon = metric.icon
  return (
    <Card className="border border-black/5 shadow-sm">
      <CardContent className={compact ? "space-y-2 pt-4" : "space-y-3 pt-4"}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
            <div className="text-3xl font-semibold leading-none tracking-tight">{metric.value}</div>
          </div>
          <div className={`flex size-8 items-center justify-center ${metric.iconStyle}`}>
            <Icon className="size-5" />
          </div>
        </div>
        <div className="flex h-8 items-end gap-1">
          {[10, 16, 9, 14, 20, 12, 18].map((h, idx) => (
            <span key={idx} className={`w-1.5 rounded ${metric.sparkStyle}`} style={{ height: `${h}px` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className={metric.trend === "up" ? "text-emerald-600" : "text-rose-600"}>{metric.delta}</span>
          {" "}{compact ? "" : "in last 7 days"}
        </p>
      </CardContent>
    </Card>
  )
}

function VitalCard({ vital }: { vital: Vital }) {
  return (
    <Card className="h-full border border-black/5 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center text-[#1A5345]">
            <ActivityIcon className="size-4.5" />
          </div>
          <CardDescription className="text-xs font-medium text-[#4F6D64]">{vital.label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tracking-tight text-[#102F27]">{vital.value}</div>
          {vital.unit ? (
            <div className="text-sm text-muted-foreground">{vital.unit}</div>
          ) : null}
        </div>
        {vital.reference ? (
          <p className="mt-1 text-xs text-[#6A7F77]">
            Ref: {vital.reference}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDateTime(vital.lastMeasuredAt)}
        </p>
      </CardContent>
    </Card>
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
    <div className={`rounded-xl border p-4 transition-all ${isNext ? "border-[#1A5345] bg-[#E8F0EE]/50 shadow-md ring-1 ring-[#1A5345]/20" : "border-[#E5EEEA] bg-[#FBFDFC]"}`}>
      <div className="flex items-start gap-4">
        {/* Left: Icon */}
        <div className={`flex size-12 shrink-0 items-center justify-center ${isNext ? "text-[#1A5345]" : "text-[#1A5345]"}`}>
          <CalendarClockIcon className={isNext ? "size-8" : "size-7"} />
        </div>

        {/* Middle: Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold truncate ${isNext ? "text-[#1A5345] text-lg" : "text-[#102F27]"}`}>
              {appt.department}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${statusStyle}`}>
              {appt.status}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDateTime(appt.scheduledAt)}
            </span>
            <span className="text-[#DDE9E4]">|</span>
            <span className="text-[#4F6D64]">{appt.clinician}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {appt.location}
          </div>
        </div>

        {/* Right: Badge */}
        {isNext && (
          <div className="shrink-0">
            <span className="rounded-full bg-[#E89042] px-3 py-1.5 text-xs font-bold text-white shadow-md">
              UPCOMING
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function getMedicationStatusStyles(status: Medication["status"]) {
  switch (status) {
    case "taken":
      return {
        borderColor: "border-[#1A5345]",
        iconBg: "",
        iconColor: "text-[#1A5345]",
        timeBadge: "bg-[#E8F0EE] text-[#1A5345]",
      }
    case "due":
      return {
        borderColor: "border-[#3577DA]",
        iconBg: "",
        iconColor: "text-[#3577DA]",
        timeBadge: "bg-[#E8F2FF] text-[#3577DA]",
      }
    case "missed":
      return {
        borderColor: "border-[#C94B4B]",
        iconBg: "",
        iconColor: "text-[#C94B4B]",
        timeBadge: "bg-[#FFE5E5] text-[#C94B4B]",
      }
  }
}

function getTimeIcon(timeOfDay: Medication["timeOfDay"]) {
  switch (timeOfDay) {
    case "Morning":
      return SunriseIcon
    case "Afternoon":
      return SunIcon
    case "Evening":
      return SunsetIcon
    case "Night":
      return MoonIcon
  }
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function MedicationRow({ med }: { med: Medication }) {
  const styles = getMedicationStatusStyles(med.status)
  const TimeIcon = getTimeIcon(med.timeOfDay)

  return (
    <div className={`rounded-xl border-2 bg-white p-4 transition-all hover:shadow-sm ${styles.borderColor}`}>
      <div className="flex items-start gap-4">
        {/* Left: Status Icon */}
        <div className={`flex size-11 shrink-0 items-center justify-center ${styles.iconColor}`}>
          {med.status === "taken" ? (
            <CheckIcon className="size-7" />
          ) : med.status === "missed" ? (
            <AlertCircleIcon className="size-7" />
          ) : (
            <ClockIcon className="size-7" />
          )}
        </div>

        {/* Middle: Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#102F27] text-base">
              {med.name} <span className="text-muted-foreground font-normal">{med.dosage}</span>
            </span>
          </div>

          {/* Time info */}
          <div className="mt-1 text-sm text-muted-foreground">
            {med.status === "taken" && med.lastTakenAt ? (
              <span>Taken at {formatTime(med.lastTakenAt)}</span>
            ) : med.status === "missed" ? (
              <span className="text-[#C94B4B]">Missed yesterday at {med.dueAt ? formatTime(med.dueAt) : "9:00 PM"}</span>
            ) : (
              <span>Due at {med.dueAt ? formatTime(med.dueAt) : "9:00 PM"}</span>
            )}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-[#E7EFEB]" />

          {/* Last 7 days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Last 7 days:</span>
              <div className="flex gap-0.5">
                {med.adherenceHistory.map((taken, idx) => (
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
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 ${styles.timeBadge}`}>
            <TimeIcon className="size-3" />
            {med.timeOfDay}
          </span>
          {med.status === "taken" ? (
            <span className="rounded-lg border border-[#1A5345]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#1A5345]">
              Taken
            </span>
          ) : med.status === "missed" ? (
            <span className="text-xs text-[#C94B4B] font-medium">
              Due tonight
            </span>
          ) : (
            <button className="rounded-lg border border-[#1A5345]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#1A5345] hover:bg-[#E8F0EE] transition-colors">
              Mark as taken
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PatientHeader({ data }: { data: PatientDashboardData }) {
  const { patient, lastVitalsAt } = data
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {patient.fullName}
      </h1>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <span>Patient ID: {patient.id}</span>
        {patient.age ? (
          <>
            <span>•</span>
            <span>Age: {patient.age} years</span>
          </>
        ) : null}
        <span>•</span>
        <span>Last vitals: {formatDateTime(lastVitalsAt)}</span>
      </div>
    </div>
  )
}

function PatientDashboardContent({ data }: { data: PatientDashboardData }) {
  const [activeVitalsRange, setActiveVitalsRange] = React.useState<(typeof vitalsRangeOptions)[number]["key"]>("1W")

  const chartData = React.useMemo(() => {
    if (activeVitalsRange === "1W") {
      return weeklyVitalsData
    }
    return monthlyVitalsData
  }, [activeVitalsRange])

  const avgHeartRate = React.useMemo(() => {
    const values = chartData.map(d => d.heartRate)
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }, [chartData])

  const avgBP = React.useMemo(() => {
    const values = chartData.map(d => d.bloodPressure)
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }, [chartData])

  return (
    <div className="space-y-6">
      <PatientHeader data={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        {primaryMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {secondaryMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} compact />
        ))}
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-white via-white to-[#F7FBF9] shadow-sm ring-1 ring-[#DDE9E4]">
        <CardHeader className="border-b border-[#E7EFEB] pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center text-[#1A5345]">
                <HeartPulseIcon className="size-6" />
              </div>
              <div>
                <CardTitle className="text-base text-[#0F2D25]">Your Vital Signs</CardTitle>
                <CardDescription>Recent measurements from your care team</CardDescription>
              </div>
            </div>
            <span className="rounded-full bg-[#E8F0EE] px-3 py-1 text-xs font-semibold text-[#1A5345]">
              Latest Today
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.vitals.map((v) => (
              <VitalCard key={v.id} vital={v} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-white via-white to-[#F7FBF9] shadow-sm ring-1 ring-[#DDE9E4] xl:col-span-2">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base text-[#0F2D25]">Vitals Trends</CardTitle>
                <CardDescription>Heart rate and blood pressure over time.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-[#D6E6DF] bg-[#F8FCFA] p-1">
                  {vitalsRangeOptions.map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setActiveVitalsRange(range.key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        activeVitalsRange === range.key
                          ? "bg-[#1A5345] text-white"
                          : "text-[#4F6D64] hover:bg-[#E8F0EE]"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <span className="rounded-full bg-[#E8F0EE] px-3 py-1 text-xs font-semibold text-[#1A5345]">
                  {activeVitalsRange === "1W" ? "Weekly" : "Monthly"} analytics
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Heart Rate Card */}
              <div className="group flex items-center gap-4 rounded-xl border border-[#E7EFEB] bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#1A5345]/30 hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center text-[#1A5345]">
                  <HeartPulseIcon className="size-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#6A7F77]">Heart Rate</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                      <span className="size-1.5 rounded-full bg-[#4CAF50]" />
                      Normal
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[#0F2D25]">{avgHeartRate}</span>
                    <span className="text-sm text-[#6A7F77]">bpm</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#8A9A93]">
                    <ActivityIcon className="size-3" />
                    <span>7-day average</span>
                  </div>
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="group flex items-center gap-4 rounded-xl border border-[#E7EFEB] bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#E89042]/30 hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center text-[#B0783C]">
                  <GaugeIcon className="size-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#6A7F77]">Blood Pressure</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6EFE4] px-2 py-0.5 text-[10px] font-semibold text-[#9A6B2F]">
                      <span className="size-1.5 rounded-full bg-[#E89042]" />
                      Optimal
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[#0F2D25]">{avgBP}</span>
                    <span className="text-sm text-[#6A7F77]">mmHg</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#8A9A93]">
                    <TrendingDownIcon className="size-3" />
                    <span>Stable trend</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E7EFEB] bg-white p-3">
              <ChartContainer config={vitalsChartConfig} className="h-60 w-full">
                <RechartsPrimitive.LineChart accessibilityLayer data={chartData}>
                  <RechartsPrimitive.CartesianGrid vertical={false} stroke="#E7EFEB" />
                  <RechartsPrimitive.XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                    }}
                  />
                  <RechartsPrimitive.YAxis hide />
                  <ChartTooltip
                    cursor={{ stroke: "#DDE9E4", strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                          })
                        }}
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
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-[var(--color-heartRate)]" />
                  Heart Rate
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-[var(--color-bloodPressure)]" />
                  BP Systolic
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center text-[#1A5345]">
                <FileTextIcon className="size-6" />
              </div>
              <CardTitle className="text-base text-[#0F2D25]">Care Summary</CardTitle>
            </div>
            <CardDescription>Your care journey at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center text-[#1A5345]">
                    <StethoscopeIcon className="size-4.5" />
                  </div>
                  <span className="text-sm text-[#6A7F77]">Last check-up</span>
                </div>
                <span className="text-sm font-medium text-[#0F2D25]">
                  {formatDate(data.careSummary.lastCheckUpAt)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center text-[#9A6B2F]">
                    <CalendarClockIcon className="size-4.5" />
                  </div>
                  <span className="text-sm text-[#6A7F77]">Next follow-up</span>
                </div>
                <span className="text-sm font-medium text-[#0F2D25]">
                  {formatDate(data.careSummary.nextFollowUpAt)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center text-[#2E8B57]">
                    <ActivityIcon className="size-4.5" />
                  </div>
                  <span className="text-sm text-[#6A7F77]">Status</span>
                </div>
                <span className="rounded-full bg-[#E8F0EE] px-2.5 py-0.5 text-xs font-medium text-[#1A5345]">
                  Active Care
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-[#F2E1C7] bg-[#FFF8EB] px-3 py-2.5">
              <p className="text-xs text-[#8C5B1E]">
                <span className="font-medium">Note:</span> {data.careSummary.planNote}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-0 shadow-lg ring-2 ring-[#1A5345]/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A5345]/5 via-white to-[#E89042]/5" />
          <CardHeader className="relative border-b border-[#1A5345]/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center text-[#1A5345]">
                  <CalendarClockIcon className="size-7" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-[#0F2D25]">Upcoming Appointments</CardTitle>
                  <CardDescription className="text-sm">Plan your visits and keep track of dates</CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-[#1A5345] px-3 py-1 text-xs font-bold text-white shadow-md">
                  {data.upcomingAppointments.length} Visits
                </span>
                <span className="text-xs text-[#1A5345] font-medium">This Month</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative max-h-[400px] space-y-4 overflow-y-auto pt-5 scrollbar-hide">
            {data.upcomingAppointments.map((appt, idx) => (
              <AppointmentRow key={appt.id} appt={appt} isNext={idx === 0} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#0F2D25]">Today's medications</CardTitle>
                <CardDescription className="mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-[#E8F0EE] px-3 py-1 text-sm font-medium text-[#1A5345]">
                  {data.medications.filter(m => m.status === "taken").length} / {data.medications.length} taken
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-[#1A5345]">
                  {Math.round((data.medications.filter(m => m.status === "taken").length / data.medications.length) * 100)}% done today
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E7EFEB]">
                <div
                  className="h-2 rounded-full bg-[#1A5345] transition-all"
                  style={{
                    width: `${(data.medications.filter(m => m.status === "taken").length / data.medications.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto max-h-[400px] pt-4 scrollbar-hide">
            {data.medications.map((med) => (
              <MedicationRow key={med.id} med={med} />
            ))}

            {/* Weekly adherence */}
            <div className="mt-4 rounded-xl bg-[#F8FAF9] p-4">
              <h4 className="text-sm font-semibold text-[#0F2D25] mb-3">This week's adherence</h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                  // Calculate overall adherence for each day
                  const dayIndex = idx
                  const totalMeds = data.medications.length
                  const takenMeds = data.medications.filter(m => m.adherenceHistory[dayIndex]).length
                  const percentage = (takenMeds / totalMeds) * 100

                  let bgClass = "bg-[#E7EFEB]"
                  if (percentage >= 80) bgClass = "bg-[#1A5345]/20"
                  else if (percentage >= 50) bgClass = "bg-[#E89042]/20"

                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{day}</span>
                      <div className={`w-full aspect-square rounded-lg ${bgClass} flex items-center justify-center`}>
                        {percentage >= 80 && <CheckIcon className="size-3 text-[#1A5345]" />}
                        {percentage >= 50 && percentage < 80 && <span className="text-[10px] text-[#E89042]">{Math.round(percentage)}%</span>}
                        {percentage < 50 && percentage > 0 && <span className="text-[10px] text-muted-foreground">{Math.round(percentage)}%</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
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
  return (
    <main className="w-full space-y-6 p-4">
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx} className="border border-black/5 shadow-sm">
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-black/5 shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
            <Card className="border border-black/5 shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load dashboard."}
          </AlertDescription>
        </Alert>
      ) : null}

      {data ? <PatientDashboardContent data={data} /> : null}
    </main>
  )
}
