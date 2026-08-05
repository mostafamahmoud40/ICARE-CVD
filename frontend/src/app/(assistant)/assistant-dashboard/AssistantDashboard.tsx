"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useAssistantQueue } from "../assistant-queue/useAssistantQueue"
import { useAssistantAppointments } from "../assistant-appointments/useAssistantAppointments"
export type AssistantDashboardProps = {
  data: any
  isLoading: boolean
  isError: boolean
  error: Error | null
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  ActivityIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircleIcon,
  ClockIcon,
  InboxIcon,
  UsersIcon,
  StethoscopeIcon,
  PlusIcon,
  UserPlusIcon,
  CheckIcon,
  VideoIcon,
  Building2Icon,
  MessageCircleIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  UserCheckIcon,
  SlidersHorizontalIcon
} from "lucide-react"

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date())
}

function formatTimeOnly(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date)
}

// ─── Mock data for design review ───────────────────────────────────
const USE_MOCK = true

function buildMockTodayISO(hour: number, minute: number) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const MOCK_TODAY_APPOINTMENTS = [
  { id: "ma-1", patientName: "Sara Ahmed", doctorName: "Dr. Mahmoud Ali", scheduledAt: buildMockTodayISO(9, 0), visitType: "clinic" as const, reason: "Hypertension follow-up — BP log review", status: "confirmed" as const },
  { id: "ma-2", patientName: "Omar Hassan", doctorName: "Dr. Hana Farid", scheduledAt: buildMockTodayISO(9, 30), visitType: "clinic" as const, reason: "Post-MI cardiac rehabilitation assessment", status: "scheduled" as const },
  { id: "ma-3", patientName: "Laila Nasser", doctorName: "Dr. Mahmoud Ali", scheduledAt: buildMockTodayISO(10, 0), visitType: "virtual" as const, reason: "Lipid panel review & statin adjustment", status: "scheduled" as const },
  { id: "ma-4", patientName: "Kamal Al-Fayed", doctorName: "Dr. Karim El-Sayed", scheduledAt: buildMockTodayISO(10, 30), visitType: "clinic" as const, reason: "Arrhythmia monitoring — Holter results", status: "scheduled" as const },
  { id: "ma-5", patientName: "Fatima Hassan", doctorName: "Dr. Hana Farid", scheduledAt: buildMockTodayISO(11, 0), visitType: "clinic" as const, reason: "Echocardiogram — structural follow-up", status: "scheduled" as const },
  { id: "ma-6", patientName: "Ahmed Mohamed", doctorName: "Dr. Mahmoud Ali", scheduledAt: buildMockTodayISO(11, 30), visitType: "clinic" as const, reason: "Chest pain assessment — new symptom", status: "scheduled" as const },
  { id: "ma-7", patientName: "Nadia Selim", doctorName: "Dr. Karim El-Sayed", scheduledAt: buildMockTodayISO(12, 0), visitType: "virtual" as const, reason: "Thyroid & dyslipidemia co-management", status: "scheduled" as const },
  { id: "ma-8", patientName: "Hassan Mahmoud", doctorName: "Dr. Mahmoud Ali", scheduledAt: buildMockTodayISO(14, 0), visitType: "clinic" as const, reason: "Routine hypertension — weight review", status: "scheduled" as const },
]

const MOCK_URGENT_TASKS = [
  {
    id: "urgent-triage",
    type: "danger" as const,
    title: "Urgent Priority Patient Waiting",
    description: "Kamal Al-Fayed has urgent status and has been waiting for 18 mins. Please route to consulting room immediately.",
    actionLabel: "Assign Doctor",
    link: "/assistant-queue/live-desk",
  },
  {
    id: "incomplete-procedure",
    type: "warning" as const,
    title: "Incomplete Procedure Setup",
    description: "Omar Hassan is scheduled for Echocardiogram at 11:30 AM. Missing signed clinical consent form — requires patient signature.",
    actionLabel: "Upload Consent",
    link: "/assistant-procedures?view=operations",
  },
  {
    id: "potential-no-show",
    type: "info" as const,
    title: "Attendance Review Needed",
    description: "Ali Seif has not checked in for the 10:15 AM appointment yet. Administrative confirmation call recommended.",
    actionLabel: "Contact Patient",
    link: "/assistant-appointments",
  },
  {
    id: "critical-medication",
    type: "warning" as const,
    title: "Critical Medication Safety Check",
    description: "Fatima Hassan has an active Amiodarone + Warfarin regimen. High-risk interaction flagged — verify INR before consult.",
    actionLabel: "Log Vitals",
    link: "/assistant-medications",
  },
]

const MOCK_STATS = { patientsInClinic: 14, averageWaitTime: 12, completedToday: 7, noShowsToday: 2, inWaiting: 6, inConsultation: 3 }

// ─── Component ─────────────────────────────────────────────────────
export function AssistantDashboard({ data, isLoading, isError, error }: AssistantDashboardProps) {
  const queue = useAssistantQueue()
  const appointments = useAssistantAppointments()

  // Calculate stats dynamically from Queue and Appointments hooks — with mock fallback
  const hasRealQueueData = !queue.isLoading && !queue.isError && queue.patients.length > 0
  const patientsInClinic = hasRealQueueData
    ? (queue.stats.arrived ?? 0) + (queue.stats.inWaiting ?? 0) + (queue.stats.inConsultation ?? 0)
    : USE_MOCK ? MOCK_STATS.patientsInClinic : 0
  const averageWaitTime = hasRealQueueData ? (queue.stats.avgWaitMin ?? 12) : USE_MOCK ? MOCK_STATS.averageWaitTime : 0
  const completedToday = hasRealQueueData ? (queue.stats.completed ?? 0) : USE_MOCK ? MOCK_STATS.completedToday : 0
  const noShowsToday = hasRealQueueData ? (queue.stats.noShow ?? 0) : USE_MOCK ? MOCK_STATS.noShowsToday : 0
  const inWaitingStat = hasRealQueueData ? (queue.stats.inWaiting ?? 0) : USE_MOCK ? MOCK_STATS.inWaiting : 0
  const inConsultStat = hasRealQueueData ? (queue.stats.inConsultation ?? 0) : USE_MOCK ? MOCK_STATS.inConsultation : 0

  // Get upcoming appointments scheduled for today — with mock fallback
  const todayAppointments = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    const real = appointments.appointments
      .filter(app => app.scheduledAt.startsWith(todayStr) && app.status !== "cancelled")
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
    if (real.length > 0) return real
    if (USE_MOCK) return MOCK_TODAY_APPOINTMENTS as any[]
    return []
  }, [appointments.appointments])

  // Urgent tasks — with mock fallback
  const urgentTasks = React.useMemo(() => {
    if (USE_MOCK) return MOCK_URGENT_TASKS
    const tasks: typeof MOCK_URGENT_TASKS = []
    const waitingPatients = queue.patients.filter(p => p.status === "waiting" || p.status === "arrived")
    const urgentWaiting = waitingPatients.find(p => p.priority === "emergency" || p.priority === "urgent")
    if (urgentWaiting) {
      tasks.push({ id: "urgent-triage", type: "danger", title: "Urgent Priority Patient Waiting", description: `${urgentWaiting.fullName} has urgent priority and is currently in wait list. Please route to a consulting room.`, actionLabel: "Assign Doctor", link: "/assistant-queue/live-desk" })
    }
    tasks.push({ id: "incomplete-procedure", type: "warning", title: "Incomplete Procedure Setup", description: "Omar Hassan is scheduled for Echocardiogram at 11:30 AM. Status: Missing signed clinical consent form.", actionLabel: "Upload Consent", link: "/assistant-procedures?view=operations" })
    const scheduledNext = todayAppointments.find((app: any) => app.status === "scheduled")
    if (scheduledNext) {
      tasks.push({ id: "potential-no-show", type: "info", title: "Upcoming Attendance Check", description: `Appointment for ${(scheduledNext as any).patientName} starts shortly. Patient has not arrived at the reception desk yet.`, actionLabel: "Contact Patient", link: "/assistant-appointments" })
    }
    tasks.push({ id: "critical-medication", type: "warning", title: "Critical Medication Safety Check", description: "Sarah Jenkins has an active Amiodarone regimen. High risk alert: Please verify vitals compliance first.", actionLabel: "Log Vitals", link: "/assistant-medications" })
    return tasks
  }, [queue.patients, todayAppointments])

  const combinedLoading = USE_MOCK ? false : (isLoading || queue.isLoading || appointments.isLoading)

  if (combinedLoading) {
    return (
      <main className="flex h-[calc(100vh-4.5rem)] w-full min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 py-6 sm:px-8">
        <div className="w-full min-w-0 space-y-6">
          <div className="w-full rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="mb-3 h-8 w-[min(100%,280px)]" />
            <Skeleton className="h-4 w-[min(100%,420px)]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
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
      </main>
    )
  }

  if (!USE_MOCK && (isError || queue.isError || appointments.isError)) {
    return (
      <main className="w-full min-w-0 flex-1 bg-[#F9F8F5] p-6 sm:p-8">
        <Alert variant="destructive" className="w-full max-w-none rounded-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error loading Today's Command Center</AlertTitle>
          <AlertDescription>
            {error?.message || queue.isError || appointments.isError || "An error occurred while loading clinic live operations data."}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const assistantName = data?.assistant.fullName || "Amira Hassan"

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      
      {/* Premium Medical Command Header */}
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-white"></span>
              </span>
              Live Desk Status: Active
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px] flex items-center gap-2">
                Today's Command Center
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Real-time clinic operations, scheduling, and triage management system
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
              >
                <Link href="/assistant-patients?add=1">
                  <UserPlusIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                  Register Patient
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
              >
                <Link href="/assistant-appointments?create=1">
                  <CalendarClockIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                  New Booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="w-full min-w-0 space-y-8">
          
          {/* Live Metrics Grid (Dynamic) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Patients in Clinic Card */}
            <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <UsersIcon className="absolute right-4 top-4 size-5 text-[#1A5345]" />
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Patients in Clinic</p>
              <h3 className="font-serif text-[32px] font-bold text-[#1A1F1E] mt-2">{patientsInClinic}</h3>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{inWaitingStat} waiting · {inConsultStat} in consult</span>
              </div>
            </div>

            {/* Average Wait Index */}
            <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <ClockIcon className="absolute right-4 top-4 size-5 text-[#CC5533]" />
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Average Wait Time</p>
              <h3 className="font-serif text-[32px] font-bold text-[#1A1F1E] mt-2">{averageWaitTime} <span className="text-[16px] font-sans font-medium text-muted-foreground">mins</span></h3>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                Target workflow: &lt; 15 mins
              </p>
            </div>

            {/* Completed Today */}
            <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <CheckCircleIcon className="absolute right-4 top-4 size-5 text-emerald-600" />
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Completed Today</p>
              <h3 className="font-serif text-[32px] font-bold text-[#1A1F1E] mt-2">{completedToday}</h3>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                Successfully checked out & discharged
              </p>
            </div>

            {/* No-Shows Today */}
            <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <AlertCircleIcon className="absolute right-4 top-4 size-5 text-red-500" />
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">No-Shows Today</p>
              <h3 className="font-serif text-[32px] font-bold text-[#1A1F1E] mt-2">{noShowsToday}</h3>
              <p className="mt-3 text-[11px] font-medium text-red-600">
                Cancelled / missed bookings
              </p>
            </div>

          </div>

          {/* Core Command Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Urgent Operations Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#CC5533]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                    Urgent Actions
                  </h2>
                </div>
                <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  {urgentTasks.length} Alerts
                </span>
              </div>

              <div className="grid gap-4">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md",
                      task.type === "danger" ? "border-l-4 border-l-red-500 border-[#E8E6E0]/60" :
                      task.type === "warning" ? "border-l-4 border-l-amber-500 border-[#E8E6E0]/60" :
                      "border-l-4 border-l-blue-500 border-[#E8E6E0]/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h4 className="text-[15px] font-bold text-[#1A1F1E]">
                            {task.title}
                          </h4>
                        </div>
                        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      <AlertTriangleIcon className={cn(
                        "size-5 shrink-0",
                        task.type === "danger" ? "text-red-600" :
                        task.type === "warning" ? "text-amber-600" :
                        "text-blue-600"
                      )} />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E8E6E0]/40 pt-3">
                      <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <ClockIcon className="size-3.5" /> Immediate Action Required
                      </span>
                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "rounded-lg font-bold text-[12px] h-8 px-4",
                          task.type === "danger" ? "bg-red-600 hover:bg-red-700 text-white" :
                          task.type === "warning" ? "bg-amber-600 hover:bg-amber-700 text-white" :
                          "bg-[#1A5345] hover:bg-[#133F34] text-white"
                        )}
                      >
                        <Link href={task.link}>
                          {task.actionLabel} <ArrowRightIcon className="ml-1.5 size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments in next hours */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#1A5345]" />
                  <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                    Today's Schedule
                  </h2>
                </div>
                <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  {todayAppointments.length} Active
                </span>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-8 text-center text-muted-foreground">
                  <CalendarClockIcon className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="text-[13px] font-bold">No upcoming appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {todayAppointments.map((app) => {
                    const timeStr = formatTimeOnly(app.scheduledAt)
                    return (
                      <div
                        key={app.id}
                        className="group rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-full bg-[#F3F4F6] border border-[#E8E6E0]/60 overflow-hidden shrink-0">
                            <img
                              src={`https://i.pravatar.cc/150?u=${encodeURIComponent(app.patientName)}`}
                              alt=""
                              className="size-full object-cover"
                            />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="text-[13px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors truncate">
                                {app.patientName}
                              </h5>
                              <span className="text-[11px] font-bold text-[#CC5533] bg-[#CC5533]/5 px-2 py-0.5 rounded-md shrink-0">
                                {timeStr}
                              </span>
                            </div>
                            
                            <p className="text-[11px] font-medium text-muted-foreground mt-0.5 line-clamp-1">
                              {app.reason || "General cardiovascular follow-up"}
                            </p>
                            
                            <div className="mt-2 flex items-center justify-between border-t border-[#E8E6E0]/30 pt-2 text-[10px]">
                              <span className="font-semibold text-[#6B7870] truncate">
                                Dr. {app.doctorName}
                              </span>
                              
                              <button
                                onClick={() => {
                                  // Quick checkin operation
                                  queue.markArrived(app.id)
                                }}
                                className="text-[#1A5345] font-bold hover:underline flex items-center gap-1 shrink-0"
                              >
                                <UserCheckIcon className="size-3" /> Check In
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Quick Shortcuts / Action Grid */}
          <div className="mt-8 border-t border-[#E8E6E0]/60 pt-6">
            <h3 className="font-serif text-[17px] font-bold text-[#1A1F1E] mb-4">Operations Shortcuts</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/assistant-queue/live-desk"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <ActivityIcon className="size-5 text-[#1A5345]" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">Live Queue Desk</h4>
                  <p className="text-[11px] text-muted-foreground">Manage ongoing clinic flow</p>
                </div>
              </Link>

              <Link
                href="/assistant-medications"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <SlidersHorizontalIcon className="size-5 text-orange-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">Medication Safety</h4>
                  <p className="text-[11px] text-muted-foreground">Manage active risk flags</p>
                </div>
              </Link>

              <Link
                href="/assistant-procedures"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <ClipboardListIcon className="size-5 text-blue-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">Clinical Procedures</h4>
                  <p className="text-[11px] text-muted-foreground">Fulfill checklist requirements</p>
                </div>
              </Link>

              <Link
                href="/assistant-chats"
                className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 transition-all hover:shadow-md"
              >
                <MessageCircleIcon className="size-5 text-purple-600" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">Team Inbox & Chats</h4>
                  <p className="text-[11px] text-muted-foreground">Message clinic practitioners</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
