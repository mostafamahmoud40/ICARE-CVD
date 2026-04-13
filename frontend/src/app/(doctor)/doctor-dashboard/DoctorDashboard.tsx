"use client"

import * as React from "react"
import type {
  DoctorDashboardData,
  DoctorPatient,
  DoctorAppointment,
  VitalAlert,
  VitalSeverity,
} from "./doctorDashboard.types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  ClipboardPlusIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  StethoscopeIcon,
  RefreshCcwIcon,
  TrendingUpIcon,
  UserRoundIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react"

const workloadChartData = [
  { date: "2026-04-15", scheduled: 42, completed: 26 },
  { date: "2026-04-16", scheduled: 36, completed: 33 },
  { date: "2026-04-17", scheduled: 50, completed: 19 },
  { date: "2026-04-18", scheduled: 22, completed: 41 },
  { date: "2026-04-19", scheduled: 54, completed: 30 },
  { date: "2026-04-20", scheduled: 44, completed: 35 },
]

const patientOverviewData = [{ period: "current", followUp: 62, newPatients: 38 }]

const workloadChartConfig = {
  scheduled: { label: "Scheduled", color: "#E5C9AA" },
  completed: { label: "Completed", color: "#1A5345" },
} satisfies ChartConfig

const rangeOptions = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
] as const

const patientOverviewChartConfig = {
  patients: { label: "Patients" },
  followUp: { label: "Follow-up", color: "#1A5345" },
  newPatients: { label: "New", color: "#E89042" },
} satisfies ChartConfig

type DashboardMetric = {
  label: string
  value: number
  delta: string
  trend: "up" | "down"
  icon: React.ComponentType<{ className?: string }>
  iconStyle: string
  sparkStyle: string
}

const primaryMetrics: DashboardMetric[] = [
  {
    label: "Total Appointments",
    value: 658,
    delta: "+85%",
    trend: "up",
    icon: CalendarClockIcon,
    iconStyle: "bg-[#EEF5F3] text-[#1A5345]",
    sparkStyle: "bg-[#1A5345]/80",
  },
  {
    label: "Online Consultations",
    value: 125,
    delta: "-5%",
    trend: "down",
    icon: VideoIcon,
    iconStyle: "bg-[#F9F2E8] text-[#C26D2A]",
    sparkStyle: "bg-[#E89042]/80",
  },
  {
    label: "Canceled Appointments",
    value: 35,
    delta: "-45%",
    trend: "down",
    icon: XCircleIcon,
    iconStyle: "bg-[#F4F9F7] text-[#2E8B68]",
    sparkStyle: "bg-[#2E8B68]/80",
  },
]

const secondaryMetrics: DashboardMetric[] = [
  {
    label: "Total Patients",
    value: 658,
    delta: "+31%",
    trend: "up",
    icon: UserRoundIcon,
    iconStyle: "bg-[#EEF5F3] text-[#3C57D0]",
    sparkStyle: "bg-[#3C57D0]/70",
  },
  {
    label: "Video Consultations",
    value: 256,
    delta: "-21%",
    trend: "down",
    icon: VideoIcon,
    iconStyle: "bg-[#EEF8F7] text-[#08A89A]",
    sparkStyle: "bg-[#08A89A]/70",
  },
  {
    label: "Rescheduled",
    value: 141,
    delta: "+64%",
    trend: "up",
    icon: RefreshCcwIcon,
    iconStyle: "bg-[#EFF8F0] text-[#2E8B57]",
    sparkStyle: "bg-[#2E8B57]/70",
  },
  {
    label: "Pre Visit Bookings",
    value: 524,
    delta: "+38%",
    trend: "up",
    icon: ClipboardPlusIcon,
    iconStyle: "bg-[#FFF2F2] text-[#D33F3F]",
    sparkStyle: "bg-[#D33F3F]/70",
  },
  {
    label: "Walkin Bookings",
    value: 21,
    delta: "+95%",
    trend: "up",
    icon: CalendarCheck2Icon,
    iconStyle: "bg-[#EEF5F3] text-[#3577DA]",
    sparkStyle: "bg-[#3577DA]/70",
  },
  {
    label: "Follow Ups",
    value: 451,
    delta: "+76%",
    trend: "up",
    icon: FlaskConicalIcon,
    iconStyle: "bg-[#EFF8F2] text-[#48A879]",
    sparkStyle: "bg-[#48A879]/70",
  },
]

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function severityStyles(severity: VitalSeverity) {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive"
    case "high":
      return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
    case "normal":
    default:
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  }
}

function PatientRow({ patient }: { patient: DoctorPatient }) {
  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#E8F0EE] text-[#1A5345]">
          <UserRoundIcon className="size-4" />
        </div>
        <span className="text-xs text-muted-foreground">Patient profile</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium text-[#102F27]">{patient.fullName}</span>
        <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-xs text-[#2C6A5B]">{patient.id}</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{patient.condition}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Last seen: {formatDateTime(patient.lastSeenAt)}
      </div>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: DoctorAppointment }) {
  const statusStyle =
    appt.status === "confirmed"
      ? "bg-[#E8F0EE] text-[#1A5345]"
      : appt.status === "completed"
        ? "bg-[#EEF2EF] text-[#5B6D63]"
        : "bg-[#F6EFE4] text-[#9A6B2F]"

  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium text-[#102F27]">{appt.patientName}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}>
          {appt.status}
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {formatDateTime(appt.scheduledAt)} • {appt.department}
      </div>
      <div className="mt-1 text-sm">{appt.location}</div>
    </div>
  )
}

function AlertRow({ alert }: { alert: VitalAlert }) {
  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium text-[#102F27]">{alert.patientName}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles(alert.severity)}`}>
          {alert.severity}
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {alert.label}: {alert.value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Updated: {formatDateTime(alert.at)}
      </div>
    </div>
  )
}

function DoctorHeader({ data }: { data: DoctorDashboardData }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, Dr. {data.doctor.fullName}
      </h1>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <span>Department: {data.doctor.department}</span>
        <span>•</span>
        <span>
          Workload: {data.workload.patientsPerWeek} patients/week
        </span>
      </div>
    </div>
  )
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
          <span className={metric.trend === "up" ? "text-emerald-600" : "text-rose-600"}>{metric.delta}</span>{" "}
          in last 7 days
        </p>
      </CardContent>
    </Card>
  )
}

function DoctorDashboardContent({ data }: { data: DoctorDashboardData }) {
  const [activeRange, setActiveRange] = React.useState<(typeof rangeOptions)[number]["key"]>("1W")

  const chartData = React.useMemo(() => {
    if (activeRange === "1D") {
      return workloadChartData.slice(-1)
    }
    if (activeRange === "1M") {
      return [...workloadChartData, ...workloadChartData].slice(0, 12)
    }
    return workloadChartData
  }, [activeRange])

  return (
    <div className="space-y-6">
      <DoctorHeader data={data} />

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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-white via-white to-[#F7FBF9] shadow-sm ring-1 ring-[#DDE9E4] xl:col-span-2">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base text-[#0F2D25]">Appointments Performance</CardTitle>
                <CardDescription>Scheduled vs completed consultations (last 7 days).</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-[#D6E6DF] bg-[#F8FCFA] p-1">
                  {rangeOptions.map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setActiveRange(range.key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        activeRange === range.key
                          ? "bg-[#1A5345] text-white"
                          : "text-[#4F6D64] hover:bg-[#E8F0EE]"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <span className="rounded-full bg-[#E8F0EE] px-3 py-1 text-xs font-semibold text-[#1A5345]">
                  {activeRange === "1D" ? "Daily" : activeRange === "1M" ? "Monthly" : "Weekly"} analytics
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#DCE9E4] bg-[#F6FBF9] p-3">
                <div className="text-xs text-[#6A7F77]">Total scheduled</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[#10382E]">78</div>
                <div className="mt-1 text-xs text-[#2A7D66]">+12% vs previous week</div>
              </div>
              <div className="rounded-xl border border-[#E9DFD2] bg-[#FDF8F2] p-3">
                <div className="text-xs text-[#7F7568]">Total completed</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[#3A2F22]">54</div>
                <div className="mt-1 text-xs text-[#A06A36]">Completion rate 69%</div>
              </div>
            </div>
            <div className="rounded-xl border border-[#E7EFEB] bg-white p-3">
              <ChartContainer config={workloadChartConfig} className="h-60 w-full">
              <RechartsPrimitive.BarChart accessibilityLayer data={chartData}>
                <RechartsPrimitive.CartesianGrid vertical={false} />
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
                  cursor={false}
                  defaultIndex={1}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      }}
                    />
                  }
                />
                <RechartsPrimitive.Bar
                  dataKey="scheduled"
                  stackId="appointments"
                  fill="var(--color-scheduled)"
                  radius={[0, 0, 4, 4]}
                />
                <RechartsPrimitive.Bar
                  dataKey="completed"
                  stackId="appointments"
                  fill="var(--color-completed)"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsPrimitive.BarChart>
              </ChartContainer>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-[var(--color-scheduled)]" />
                  Scheduled
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-[var(--color-completed)]" />
                  Completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Information</CardTitle>
            <CardDescription>Quick operational snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-2 text-center">
                <div className="text-xs text-muted-foreground">Patients</div>
                <div className="text-lg font-semibold">312</div>
              </div>
              <div className="rounded-lg border p-2 text-center">
                <div className="text-xs text-muted-foreground">Consults</div>
                <div className="text-lg font-semibold">184</div>
              </div>
              <div className="rounded-lg border p-2 text-center">
                <div className="text-xs text-muted-foreground">Orders</div>
                <div className="text-lg font-semibold">96</div>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="space-y-1 text-center">
                <div className="text-sm font-medium">Patients Overview</div>
                <div className="text-xs text-muted-foreground">Current month distribution</div>
              </div>
              <ChartContainer
                config={patientOverviewChartConfig}
                className="mx-auto mt-2 aspect-square max-h-[190px]"
              >
                <RechartsPrimitive.RadialBarChart
                  data={patientOverviewData}
                  innerRadius={26}
                  outerRadius={96}
                  barSize={10}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RechartsPrimitive.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <RechartsPrimitive.RadialBar
                    dataKey="newPatients"
                    fill="var(--color-newPatients)"
                    background
                    cornerRadius={999}
                  />
                  <RechartsPrimitive.RadialBar
                    dataKey="followUp"
                    fill="var(--color-followUp)"
                    background
                    cornerRadius={999}
                  />
                </RechartsPrimitive.RadialBarChart>
              </ChartContainer>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center justify-center gap-2 font-medium">
                  Trending up by 6.4% this month <TrendingUpIcon className="size-4 text-[#1A5345]" />
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Follow-up 62% · New 38%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#0F2D25]">
                  <UserRoundIcon className="size-4 text-[#1A5345]" />
                  Assigned Patients
                </CardTitle>
                <CardDescription>Your current patient list.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                View all <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[360px] space-y-3 overflow-y-auto">
            {data.assignedPatients.map((p, idx) => (
              <div key={p.id}>
                <PatientRow patient={p} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#0F2D25]">
                  <StethoscopeIcon className="size-4 text-[#1A5345]" />
                  Workload
                </CardTitle>
                <CardDescription>Capacity and availability.</CardDescription>
              </div>
              <span className="rounded-full bg-[#E8F0EE] px-2.5 py-1 text-xs font-medium text-[#1A5345]">
                Live
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-[#DCE9E4] bg-[#F6FBF9] p-3">
              <div className="text-sm text-muted-foreground">Patients / week</div>
              <div className="text-3xl font-semibold tracking-tight text-[#0F2D25]">
                {data.workload.patientsPerWeek}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-[#E4F0EB]">
                <div className="h-2 w-[68%] rounded-full bg-[#1A5345]" />
              </div>
            </div>
            <div className="rounded-xl border border-[#E9DFD2] bg-[#FDF8F2] p-3">
              <div className="text-sm text-muted-foreground">Hours available</div>
              <div className="text-3xl font-semibold tracking-tight text-[#3A2F22]">
                {data.workload.hoursAvailable}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-[#F1E6D8]">
                <div className="h-2 w-[45%] rounded-full bg-[#C58A4B]" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Updated from the latest schedule snapshot.</div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[#2C6A5B]">Clinic focus</span>
              <span className="rounded-full bg-[#FDF8F2] px-2.5 py-1 text-[#9A6B2F]">Balanced shifts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#0F2D25]">
                  <CalendarClockIcon className="size-4 text-[#1A5345]" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription>Next visits scheduled for your department.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                Manage <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[360px] space-y-3 overflow-y-auto">
            {data.upcomingAppointments.map((appt, idx) => (
              <div key={appt.id}>
                <AppointmentRow appt={appt} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
          <CardHeader className="border-b border-[#E7EFEB] pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#0F2D25]">
                  <HeartPulseIcon className="size-4 text-[#1A5345]" />
                  Recent Vital Alerts
                </CardTitle>
                <CardDescription>Needs attention based on current severity.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                Review <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[360px] space-y-3 overflow-y-auto">
            <div className="rounded-lg border border-[#F2E1C7] bg-[#FFF8EB] px-3 py-2 text-xs text-[#8C5B1E]">
              <span className="inline-flex items-center gap-1 font-medium">
                <AlertTriangleIcon className="size-3.5" />
                Prioritize critical alerts first.
              </span>
            </div>
            {data.recentAlerts.map((alert, idx) => (
              <div key={alert.id}>
                <AlertRow alert={alert} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type DoctorDashboardProps = {
  data: DoctorDashboardData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function DoctorDashboard({ data, isLoading, isError, error }: DoctorDashboardProps) {
  return (
    <main className="w-full space-y-6 p-4">
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
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

      {data ? <DoctorDashboardContent data={data} /> : null}
    </main>
  )
}
