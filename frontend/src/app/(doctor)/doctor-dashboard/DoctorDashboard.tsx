"use client"

import * as React from "react"
import Link from "next/link"
import type {
  DoctorDashboardData,
  DoctorPatient,
  DoctorAppointment,
  VitalAlert,
  VitalSeverity,
} from "./doctorDashboard.types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  ClockIcon,
  HeartPulseIcon,
  MessageCircleIcon,
  PillIcon,
  StethoscopeIcon,
  UserRoundIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"

const workloadChartData = [
  { date: "Mon", scheduled: 42, completed: 26 },
  { date: "Tue", scheduled: 36, completed: 33 },
  { date: "Wed", scheduled: 50, completed: 19 },
  { date: "Thu", scheduled: 22, completed: 41 },
  { date: "Fri", scheduled: 54, completed: 30 },
  { date: "Sat", scheduled: 44, completed: 35 },
]

const workloadChartConfig = {
  scheduled: { label: "Scheduled", color: "#E5C9AA" },
  completed: { label: "Completed", color: "#1A5345" },
} satisfies ChartConfig

const rangeOptions = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
] as const

type AlertTone = "danger" | "warning" | "info"

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function severityTone(severity: VitalSeverity): AlertTone {
  if (severity === "critical") return "danger"
  if (severity === "high") return "warning"
  return "info"
}

function severityRank(severity: VitalSeverity) {
  if (severity === "critical") return 0
  if (severity === "high") return 1
  return 2
}

function alertDescription(alert: VitalAlert) {
  return `${alert.patientName} — ${alert.label}: ${alert.value}. Recorded ${formatTimeOnly(alert.at)}.`
}

function alertActionLabel(severity: VitalSeverity) {
  if (severity === "critical") return "Open Queue"
  if (severity === "high") return "Review Chart"
  return "View Vitals"
}

function alertActionHref(severity: VitalSeverity) {
  if (severity === "critical") return "/doctor-queue"
  return "/doctor-patients"
}

function DoctorMetricCard({
  label,
  value,
  suffix,
  detail,
  detailClassName,
  icon: Icon,
  iconClassName,
}: {
  label: string
  value: number | string
  suffix?: string
  detail: React.ReactNode
  detailClassName?: string
  icon: React.ComponentType<{ className?: string }>
  iconClassName: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <Icon className={cn("absolute right-4 top-4 size-5", iconClassName)} aria-hidden />
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">
        {value}
        {suffix ? (
          <span className="font-sans text-[16px] font-medium text-muted-foreground"> {suffix}</span>
        ) : null}
      </h3>
      <div className={cn("mt-3 text-[11px] font-medium text-muted-foreground", detailClassName)}>
        {detail}
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: DoctorPatient }) {
  return (
    <Link
      href="/doctor-patients"
      className="group flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
    >
      <div className="size-9 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F4F6]">
        <img
          src={`https://i.pravatar.cc/150?u=${encodeURIComponent(patient.fullName)}`}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h5 className="truncate text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
            {patient.fullName}
          </h5>
          <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {patient.id}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-muted-foreground">
          {patient.condition}
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-[#E8E6E0]/30 pt-2 text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-[#6B7870]">Last seen</span>
          <span className="font-bold text-[#1A5345]">{formatDateTime(patient.lastSeenAt)}</span>
        </div>
      </div>
    </Link>
  )
}

function AppointmentCard({ appt }: { appt: DoctorAppointment }) {
  const isVirtual = appt.location.toLowerCase().includes("virtual")

  return (
    <div className="group rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="size-9 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F4F6]">
          <img
            src={`https://i.pravatar.cc/150?u=${encodeURIComponent(appt.patientName)}`}
            alt=""
            className="size-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h5 className="truncate text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {appt.patientName}
            </h5>
            <span className="shrink-0 rounded-md bg-[#CC5533]/5 px-2 py-0.5 text-[11px] font-bold text-[#CC5533]">
              {formatTimeOnly(appt.scheduledAt)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-muted-foreground">
            {appt.department} · {appt.location}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-[#E8E6E0]/30 pt-2 text-[10px]">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                appt.status === "confirmed"
                  ? "bg-emerald-50 text-emerald-700"
                  : appt.status === "completed"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700",
              )}
            >
              {appt.status}
            </span>
            <span className="flex items-center gap-1 font-bold text-[#1A5345]">
              {isVirtual ? <VideoIcon className="size-3" /> : <StethoscopeIcon className="size-3" />}
              {isVirtual ? "Virtual" : "In clinic"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DoctorWelcomeBanner({ data }: { data: DoctorDashboardData }) {
  return (
    <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
        aria-hidden
      />
      <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
        <div className="flex items-center gap-2">
          <p className="border-l-[3px] border-[#CC5533] pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[12px]">
            {formatTodayHeading()}
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>
            Shift Active
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="flex items-center gap-2 font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
              Welcome back, Dr. {data.doctor.fullName}
            </h1>
            <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              {data.doctor.department} practice · {data.workload.patientsPerWeek} patients/week · real-time
              clinical updates, appointments, and priority alerts
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
            >
              <Link href="/doctor-schedule">
                <CalendarClockIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                Manage Schedule
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
            >
              <Link href="/doctor-queue">
                <UsersIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                Open Queue
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DoctorDashboardContent({ data }: { data: DoctorDashboardData }) {
  const [activeRange, setActiveRange] = React.useState<(typeof rangeOptions)[number]["key"]>("1W")

  const todayStr = new Date().toISOString().split("T")[0]
  const todayAppointments = React.useMemo(
    () =>
      [...data.upcomingAppointments]
        .filter((appt) => appt.scheduledAt.startsWith(todayStr))
        .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
    [data.upcomingAppointments, todayStr],
  )

  const priorityAlerts = React.useMemo(
    () =>
      [...data.recentAlerts].sort(
        (a, b) => severityRank(a.severity) - severityRank(b.severity),
      ),
    [data.recentAlerts],
  )

  const criticalCount = priorityAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high",
  ).length

  const chartData = React.useMemo(() => {
    if (activeRange === "1D") return workloadChartData.slice(0, 1)
    if (activeRange === "1M") return [...workloadChartData, ...workloadChartData]
    return workloadChartData
  }, [activeRange])

  const utilizationRate = Math.min(
    100,
    Math.round((data.workload.patientsPerWeek / 62) * 100),
  )

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <DoctorWelcomeBanner data={data} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="w-full min-w-0 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DoctorMetricCard
              label="Today's Appointments"
              value={todayAppointments.length}
              detail={
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {todayAppointments.filter((a) => a.status === "confirmed").length} confirmed
                </span>
              }
              icon={CalendarClockIcon}
              iconClassName="text-[#1A5345]"
            />
            <DoctorMetricCard
              label="Assigned Patients"
              value={data.assignedPatients.length}
              detail="Active under your care"
              icon={UserRoundIcon}
              iconClassName="text-[#CC5533]"
            />
            <DoctorMetricCard
              label="Priority Alerts"
              value={criticalCount}
              detail="Critical & high severity"
              detailClassName="text-red-600"
              icon={AlertCircleIcon}
              iconClassName="text-red-500"
            />
            <DoctorMetricCard
              label="Weekly Workload"
              value={data.workload.patientsPerWeek}
              suffix="pts"
              detail={`${data.workload.hoursAvailable} clinic hours available`}
              icon={ActivityIcon}
              iconClassName="text-emerald-600"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#CC5533]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Priority Clinical Alerts</h2>
                </div>
                <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  {priorityAlerts.length} Alerts
                </span>
              </div>

              <div className="grid gap-4">
                {priorityAlerts.map((alert) => {
                  const tone = severityTone(alert.severity)
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md",
                        tone === "danger"
                          ? "border-l-4 border-l-red-500 border-[#E8E6E0]/60"
                          : tone === "warning"
                            ? "border-l-4 border-l-amber-500 border-[#E8E6E0]/60"
                            : "border-l-4 border-l-blue-500 border-[#E8E6E0]/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-[15px] font-bold text-[#1A1F1E]">
                            {alert.label} — {alert.patientName}
                          </h4>
                          <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
                            {alertDescription(alert)}
                          </p>
                        </div>
                        <AlertTriangleIcon
                          className={cn(
                            "size-5 shrink-0",
                            tone === "danger"
                              ? "text-red-600"
                              : tone === "warning"
                                ? "text-amber-600"
                                : "text-blue-600",
                          )}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#E8E6E0]/40 pt-3">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <ClockIcon className="size-3.5" />
                          {alert.severity} priority
                        </span>
                        <Button
                          asChild
                          size="sm"
                          className={cn(
                            "h-8 rounded-lg px-4 text-[12px] font-bold",
                            tone === "danger"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : tone === "warning"
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : "bg-[#1A5345] text-white hover:bg-[#133F34]",
                          )}
                        >
                          <Link href={alertActionHref(alert.severity)}>
                            {alertActionLabel(alert.severity)}
                            <ArrowRightIcon className="ml-1.5 size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#1A5345]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Today&apos;s Schedule</h2>
                </div>
                <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  {todayAppointments.length} Active
                </span>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-8 text-center text-muted-foreground">
                  <CalendarClockIcon className="mx-auto mb-2 size-8 opacity-40" />
                  <p className="text-[13px] font-bold">No appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                  {todayAppointments.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              )}

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 w-full rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
              >
                <Link href="/doctor-appointments">View all appointments</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#1A5345]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Assigned Patients</h2>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg border-[#E8E6E0] bg-white px-3 text-[11px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                >
                  <Link href="/doctor-patients">View all</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {data.assignedPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#CC5533]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Workload & Performance</h2>
                </div>
                <div className="inline-flex rounded-full border border-[#E8E6E0] bg-white p-1">
                  {rangeOptions.map((range) => (
                    <button
                      key={range.key}
                      type="button"
                      onClick={() => setActiveRange(range.key)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                        activeRange === range.key
                          ? "bg-[#1A5345] text-white shadow-sm"
                          : "text-[#4F6D64] hover:bg-[#F9F8F5]",
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/30 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Utilization
                    </p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#1A1F1E]">{utilizationRate}%</p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-700">
                      {data.workload.patientsPerWeek} patients / week
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FDF8F2]/50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Available hours
                    </p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#1A1F1E]">
                      {data.workload.hoursAvailable}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#7F7568]">Clinic slots this week</p>
                  </div>
                </div>

                <ChartContainer config={workloadChartConfig} className="h-52 w-full">
                  <RechartsPrimitive.BarChart accessibilityLayer data={chartData}>
                    <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8E6E0" />
                    <RechartsPrimitive.XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fontSize: 11, fontWeight: 600, fill: "#6B7870" }}
                    />
                    <RechartsPrimitive.YAxis hide />
                    <ChartTooltip cursor={{ fill: "#F9F8F5" }} content={<ChartTooltipContent />} />
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

                <div className="mt-4 flex items-center gap-4 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#E5C9AA]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Scheduled
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#1A5345]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E6E0]/60 pt-6">
            <h3 className="mb-4 font-serif text-[17px] font-bold text-[#1A1F1E]">Clinical Shortcuts</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/doctor-queue"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <HeartPulseIcon className="size-5 text-[#1A5345]" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                    Live Patient Queue
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Start consultations & triage</p>
                </div>
              </Link>
              <Link
                href="/doctor-prescriptions"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <PillIcon className="size-5 text-orange-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                    Prescriptions
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Review & adjust medications</p>
                </div>
              </Link>
              <Link
                href="/doctor-schedule"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <ClipboardListIcon className="size-5 text-blue-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                    Schedule & Blocks
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Manage clinic availability</p>
                </div>
              </Link>
              <Link
                href="/doctor-chat"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <MessageCircleIcon className="size-5 text-purple-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                    Team Messages
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Chat with assistants & staff</p>
                </div>
              </Link>
            </div>
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
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 py-6 sm:px-8">
        <div className="w-full min-w-0 space-y-6">
          <div className="w-full rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="mb-3 h-8 w-[min(100%,320px)]" />
            <Skeleton className="h-4 w-[min(100%,480px)]" />
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
              <Skeleton className="h-40 w-full rounded-2xl" />
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

  if (isError) {
    return (
      <div className="w-full min-w-0 flex-1 bg-[#F9F8F5] p-6 sm:p-8">
        <Alert variant="destructive" className="w-full max-w-none rounded-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error loading Clinical Overview</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load dashboard. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  return <DoctorDashboardContent data={data} />
}
