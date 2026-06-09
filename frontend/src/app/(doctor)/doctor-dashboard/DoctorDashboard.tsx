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
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  ClipboardPlusIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  RefreshCcwIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserRoundIcon,
  UsersIcon,
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
    <div className="rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-2.5 shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-white group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <UserRoundIcon className="size-3.5 text-[#1A5345]" />
          <span className="text-[12px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">{patient.fullName}</span>
        </div>
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight font-mono">{patient.id}</span>
      </div>
      <div className="text-[10px] font-medium text-[#6B7870] line-clamp-1">{patient.condition}</div>
      <div className="mt-1.5 pt-1.5 border-t border-[#E8E6E0]/40 flex items-center justify-between">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Last seen</span>
        <span className="text-[9px] font-black text-[#1A5345]">{formatDateTime(patient.lastSeenAt)}</span>
      </div>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: DoctorAppointment }) {
  const statusCfg = 
    appt.status === "confirmed" ? { style: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" } :
    appt.status === "completed" ? { style: "bg-blue-50 text-blue-700", dot: "bg-blue-400" } :
    { style: "bg-amber-50 text-amber-700", dot: "bg-amber-400" }

  return (
    <div className="rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-2.5 shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-white group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">{appt.patientName}</span>
        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1", statusCfg.style)}>
          <span className={cn("size-1 rounded-full", statusCfg.dot)} />
          {appt.status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-medium text-[#6B7870]">
        <div className="flex items-center gap-1">
          <CalendarClockIcon className="size-3 text-[#1A5345]/70" />
          {formatDateTime(appt.scheduledAt)}
        </div>
        <span>&middot;</span>
        <span>{appt.department}</span>
      </div>
      <div className="mt-1.5 text-[10px] font-bold text-[#1A5345] flex items-center gap-1">
        <ArrowUpRightIcon className="size-3" />
        {appt.location}
      </div>
    </div>
  )
}

function AlertRow({ alert }: { alert: VitalAlert }) {
  const style = severityStyles(alert.severity)
  
  return (
    <div className="rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-2.5 shadow-sm transition-all hover:border-red-200 hover:bg-white group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-bold text-[#1A1F1E] group-hover:text-red-700 transition-colors">{alert.patientName}</span>
        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md", style)}>
          {alert.severity}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-[#1A1F1E] flex items-center gap-1.5">
          <ActivityIcon className="size-3 text-red-600" />
          {alert.label}: <span className="text-red-600">{alert.value}</span>
        </div>
        <span className="text-[9px] font-medium text-muted-foreground">{formatDateTime(alert.at)}</span>
      </div>
    </div>
  )
}

function DoctorHeader({ data }: { data: DoctorDashboardData }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-2 sm:gap-3">
        <StethoscopeIcon className="size-4 sm:size-5 text-[#1A5345]" aria-hidden />
        <div>
          <h1 className="text-[13px] font-bold text-[#1A1F1E] sm:text-[15px]">
            Welcome, Dr. {data.doctor.fullName}
          </h1>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            {data.doctor.department} Department &middot; Workload: {data.workload.patientsPerWeek} patients/week
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Shift Active
        </span>
      </div>
    </header>
  )
}

function MetricCard({ icon: Icon, iconColor, value, label, delta, trend }: { 
  icon: React.ElementType; 
  iconColor: string;
  value: number | string;
  label: string;
  delta: string;
  trend: "up" | "down";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white px-4 py-3.5 shadow-sm group hover:shadow-md transition-all duration-300">
      <Icon className={cn("size-4 sm:size-5 shrink-0 transition-colors duration-300", iconColor)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <div className="text-[18px] font-bold text-[#1A1F1E] sm:text-[20px] leading-none transition-colors group-hover:text-[#1A5345]">{value}</div>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-300",
            trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          )}>
            {delta}
          </span>
        </div>
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  )
}

function DoctorDashboardContent({ data }: { data: DoctorDashboardData }) {
  const [activeRange, setActiveRange] = React.useState<(typeof rangeOptions)[number]["key"]>("1M")

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
    <div className="space-y-4 sm:space-y-5">
      <DoctorHeader data={data} />

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        {primaryMetrics.map((m) => (
          <MetricCard 
            key={m.label} 
            icon={m.icon} 
            iconColor={m.iconStyle.split(" ").find(c => c.startsWith("text-")) || "text-[#1A5345]"} 
            value={m.value} 
            label={m.label} 
            delta={m.delta} 
            trend={m.trend} 
          />
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
        {secondaryMetrics.map((m) => (
          <MetricCard 
            key={m.label} 
            icon={m.icon} 
            iconColor={m.iconStyle.split(" ").find(c => c.startsWith("text-")) || "text-[#1A5345]"} 
            value={m.value} 
            label={m.label} 
            delta={m.delta} 
            trend={m.trend} 
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Appointments Performance</h2>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">Scheduled vs completed consultations</p>
            </div>
            <div className="mt-2 flex items-center gap-2 sm:mt-0">
              <div className="inline-flex rounded-full border border-[#E8E6E0] bg-white p-1">
                {rangeOptions.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setActiveRange(range.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                      activeRange === range.key
                        ? "bg-[#1A5345] text-white shadow-sm"
                        : "text-[#4F6D64] hover:bg-[#F9F8F5]"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-3">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total scheduled</div>
                <div className="mt-1 text-2xl font-bold text-[#1A1F1E]">78</div>
                <div className="mt-1 text-[10px] font-bold text-emerald-700">+12% vs last week</div>
              </div>
              <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FDF8F2]/50 p-3">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total completed</div>
                <div className="mt-1 text-2xl font-bold text-[#1A1F1E]">54</div>
                <div className="mt-1 text-[10px] font-bold text-amber-700">69% completion rate</div>
              </div>
            </div>
            <div className="rounded-lg border border-[#E8E6E0]/40 p-3 bg-white">
              <ChartContainer config={workloadChartConfig} className="h-60 w-full">
                <RechartsPrimitive.BarChart accessibilityLayer data={chartData}>
                  <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E6E0" />
                  <RechartsPrimitive.XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 10, fontWeight: 600, fill: "#6B7870" }}
                    tickFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", { weekday: "short" })
                    }}
                  />
                  <RechartsPrimitive.YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: "#F9F8F5" }}
                    content={<ChartTooltipContent />}
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
              <div className="mt-4 flex items-center gap-4 px-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#E5C9AA]" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#1A5345]" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3">
            <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Distribution</h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Patient type breakdown</p>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Patients", val: "312", icon: UsersIcon, color: "text-[#1A5345]" },
                { label: "Consults", val: "184", icon: StethoscopeIcon, color: "text-blue-600" },
                { label: "Orders", val: "96", icon: ClipboardPlusIcon, color: "text-amber-600" }
              ].map((i) => (
                <div key={i.label} className="rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-2 text-center">
                  <i.icon className={cn("size-3 mx-auto mb-1", i.color)} />
                  <div className="text-[14px] font-bold text-[#1A1F1E]">{i.val}</div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight">{i.label}</div>
                </div>
              ))}
            </div>

            <div className="relative rounded-xl border border-[#E8E6E0]/40 p-4 bg-white">
              <ChartContainer
                config={patientOverviewChartConfig}
                className="mx-auto aspect-square max-h-[180px]"
              >
                <RechartsPrimitive.RadialBarChart
                  data={patientOverviewData}
                  innerRadius={30}
                  outerRadius={100}
                  barSize={12}
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
                    background={{ fill: "#F9F8F5" }}
                    cornerRadius={999}
                  />
                  <RechartsPrimitive.RadialBar
                    dataKey="followUp"
                    fill="var(--color-followUp)"
                    background={{ fill: "#F9F8F5" }}
                    cornerRadius={999}
                  />
                </RechartsPrimitive.RadialBarChart>
              </ChartContainer>
              <div className="mt-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#1A1F1E]">
                  <TrendingUpIcon className="size-3.5 text-[#1A5345]" />
                  Trending up by 6.4%
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  Follow-up 62% &middot; New 38%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <UserRoundIcon className="size-4 text-[#1A5345]" />
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Assigned Patients</h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Your active patient directory</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="h-7 rounded-lg border-[#E8E6E0] bg-white px-3 text-[10px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]">
              <Link href="/doctor-patients" className="flex items-center gap-1.5">
                View All <ArrowUpRightIcon className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="p-4 flex-1 space-y-3 max-h-[400px] overflow-y-auto">
            {data.assignedPatients.map((p) => (
              <PatientRow key={p.id} patient={p} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="size-4 text-[#1A5345]" />
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Current Workload</h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Capacity & clinic efficiency</p>
              </div>
            </div>
            <span className="rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
              Live Stats
            </span>
          </div>
          <div className="p-4 flex-1 space-y-5">
            <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Patients / week</span>
                <span className="text-[12px] font-bold text-[#1A1F1E]">{data.workload.patientsPerWeek}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E8E6E0]/40 overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-[#1A5345] shadow-sm" />
              </div>
              <p className="mt-2 text-[9px] font-medium text-muted-foreground">Utilization rate: 68%</p>
            </div>
            <div className="rounded-xl border border-[#E9DFD2]/60 bg-[#FDF8F2]/40 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#7F7568] uppercase tracking-wider">Available Slots</span>
                <span className="text-[12px] font-bold text-[#3A2F22]">{data.workload.hoursAvailable} hrs</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E9DFD2]/40 overflow-hidden">
                <div className="h-full w-[45%] rounded-full bg-[#C58A4B] shadow-sm" />
              </div>
              <p className="mt-2 text-[9px] font-medium text-[#7F7568]">Next availability in 24 hours</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Clinic Focus", "Balanced Shift", "Priority Tier"].map(tag => (
                <span key={tag} className="rounded-full bg-white border border-[#E8E6E0] px-2 py-0.5 text-[10px] font-bold text-[#1A1F1E] shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-[#1A5345]" />
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Upcoming Visits</h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Next 12 hours</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="h-7 rounded-lg border-[#E8E6E0] bg-white px-3 text-[10px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]">
              <Link href="/doctor-appointments" className="flex items-center gap-1.5">
                Manage <ArrowUpRightIcon className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="p-4 flex-1 space-y-3 max-h-[400px] overflow-y-auto">
            {data.upcomingAppointments.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="size-4 text-red-600" />
              <div>
                <h2 className="text-[12px] sm:text-[14px] font-bold text-[#1A1F1E]">Vital Health Alerts</h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Patients requiring immediate review</p>
              </div>
            </div>
            <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {data.recentAlerts.length} Critical
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3 max-h-[400px] overflow-y-auto">
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2 text-center text-[10px] font-bold text-amber-700 uppercase tracking-tight flex items-center justify-center gap-2">
              <AlertTriangleIcon className="size-3" /> Prioritize critical status alerts first
            </div>
            {data.recentAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
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
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5 min-h-[calc(100vh-4rem)]">
      {isLoading ? (
        <div className="space-y-4 sm:space-y-5">
          <Skeleton className="h-20 w-full rounded-xl bg-[#E8E6E0]/50" />
          
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-xl bg-[#E8E6E0]/50" />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-[400px] xl:col-span-2 rounded-xl bg-[#E8E6E0]/50" />
            <Skeleton className="h-[400px] rounded-xl bg-[#E8E6E0]/50" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[300px] rounded-xl bg-[#E8E6E0]/50" />
            <Skeleton className="h-[300px] rounded-xl bg-[#E8E6E0]/50" />
          </div>
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive" className="rounded-xl shadow-sm">
          <AlertCircleIcon className="size-4" />
          <AlertTitle className="font-bold text-[13px] sm:text-[14px]">Dashboard Error</AlertTitle>
          <AlertDescription className="text-[11px] sm:text-[12px]">
            {error instanceof Error ? error.message : "Unable to load dashboard. Please try again."}
          </AlertDescription>
        </Alert>
      ) : null}

      {data ? <DoctorDashboardContent data={data} /> : null}
    </main>
  )
}
