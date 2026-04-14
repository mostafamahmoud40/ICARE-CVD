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
    iconStyle: "bg-[#EEF5F3] text-[#1A5345]",
    sparkStyle: "bg-[#1A5345]/80",
  },
  {
    label: "Upcoming Visits",
    value: 3,
    delta: "This month",
    trend: "up",
    icon: CalendarClockIcon,
    iconStyle: "bg-[#F9F2E8] text-[#C26D2A]",
    sparkStyle: "bg-[#E89042]/80",
  },
  {
    label: "Active Medications",
    value: 3,
    delta: "On track",
    trend: "up",
    icon: PillIcon,
    iconStyle: "bg-[#F4F9F7] text-[#2E8B68]",
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
    iconStyle: "bg-[#EEF5F3] text-[#3C57D0]",
    sparkStyle: "bg-[#3C57D0]/70",
  },
  {
    label: "Days to Follow-up",
    value: 10,
    delta: "Apr 12",
    trend: "up",
    icon: CalendarCheckIcon,
    iconStyle: "bg-[#EEF8F7] text-[#08A89A]",
    sparkStyle: "bg-[#08A89A]/70",
  },
  {
    label: "Completed Visits",
    value: 8,
    delta: "+2",
    trend: "up",
    icon: StethoscopeIcon,
    iconStyle: "bg-[#EFF8F0] text-[#2E8B57]",
    sparkStyle: "bg-[#2E8B57]/70",
  },
  {
    label: "Reports Ready",
    value: 2,
    delta: "View now",
    trend: "up",
    icon: FileTextIcon,
    iconStyle: "bg-[#FFF2F2] text-[#D33F3F]",
    sparkStyle: "bg-[#D33F3F]/70",
  },
  {
    label: "Care Plan Steps",
    value: 5,
    delta: "3 done",
    trend: "up",
    icon: ClockIcon,
    iconStyle: "bg-[#EEF5F3] text-[#3577DA]",
    sparkStyle: "bg-[#3577DA]/70",
  },
  {
    label: "Wellness Trend",
    value: "Good",
    delta: "Stable",
    trend: "up",
    icon: TrendingUpIcon,
    iconStyle: "bg-[#EFF8F2] text-[#48A879]",
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
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <div className="text-3xl font-semibold leading-none tracking-tight">{metric.value}</div>
          </div>
          <div className={`flex size-8 items-center justify-center rounded-lg ${metric.iconStyle}`}>
            <Icon className="size-4" />
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
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#EEF5F3] text-[#1A5345]">
            <ActivityIcon className="size-3.5" />
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
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${isNext ? "bg-[#1A5345] text-white shadow-md" : "bg-[#E8F0EE] text-[#1A5345]"}`}>
          <CalendarClockIcon className="size-6" />
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

function MedicationRow({ med }: { med: Medication }) {
  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-4">
      <div className="flex items-start gap-4">
        {/* Left: Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F6EFE4] text-[#9A6B2F]">
          <PillIcon className="size-6" />
        </div>

        {/* Middle: Info */}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#102F27] text-lg">
            {med.name}
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {med.dosage}
            </span>
            <span className="text-[#DDE9E4]">|</span>
            <span className="text-[#4F6D64]">{med.frequency}</span>
          </div>

          {med.lastTakenAt ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last taken: {formatDate(med.lastTakenAt)}
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9A6B2F]">
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Not taken yet
            </div>
          )}
        </div>

        {/* Right: Status */}
        <div className="shrink-0">
          <span className="rounded-full bg-[#E8F0EE] px-3 py-1.5 text-xs font-medium text-[#1A5345]">
            Active
          </span>
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#EEF5F3] text-[#1A5345]">
                <HeartPulseIcon className="size-4" />
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
              <div className="rounded-xl border border-[#DCE9E4] bg-[#F6FBF9] p-3">
                <div className="text-xs text-[#6A7F77]">Average Heart Rate</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[#10382E]">{avgHeartRate} <span className="text-sm font-normal text-muted-foreground">bpm</span></div>
                <div className="mt-1 text-xs text-[#2A7D66]">Normal range</div>
              </div>
              <div className="rounded-xl border border-[#E9DFD2] bg-[#FDF8F2] p-3">
                <div className="text-xs text-[#7F7568]">Average BP</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[#3A2F22]">{avgBP}</div>
                <div className="mt-1 text-xs text-[#A06A36]">Optimal range</div>
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#EEF5F3] text-[#1A5345]">
                <FileTextIcon className="size-4" />
              </div>
              <CardTitle className="text-base text-[#0F2D25]">Care Summary</CardTitle>
            </div>
            <CardDescription>Your care journey at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#E8F0EE] text-[#1A5345]">
                    <StethoscopeIcon className="size-3.5" />
                  </div>
                  <span className="text-sm text-[#6A7F77]">Last check-up</span>
                </div>
                <span className="text-sm font-medium text-[#0F2D25]">
                  {formatDate(data.careSummary.lastCheckUpAt)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#F6EFE4] text-[#9A6B2F]">
                    <CalendarClockIcon className="size-3.5" />
                  </div>
                  <span className="text-sm text-[#6A7F77]">Next follow-up</span>
                </div>
                <span className="text-sm font-medium text-[#0F2D25]">
                  {formatDate(data.careSummary.nextFollowUpAt)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#E7EFEB] bg-[#FBFDFC] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#EEF8F0] text-[#2E8B57]">
                    <ActivityIcon className="size-3.5" />
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
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#1A5345] text-white shadow-lg shadow-[#1A5345]/25">
                  <CalendarClockIcon className="size-5" />
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
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center gap-2">
              <PillIcon className="size-4 text-[#1A5345]" />
              <CardTitle className="text-base text-[#0F2D25]">Current Medications</CardTitle>
            </div>
            <CardDescription>Your active prescriptions.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[360px] space-y-3 overflow-y-auto pt-4 scrollbar-hide">
            {data.medications.map((med) => (
              <MedicationRow key={med.id} med={med} />
            ))}
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
