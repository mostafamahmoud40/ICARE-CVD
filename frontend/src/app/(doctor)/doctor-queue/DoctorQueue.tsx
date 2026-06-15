"use client"

import React from "react"
import type { QueuePatient, QueueStats, QueueStatus, QueuePriority } from "./doctorQueue.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  LogInIcon,
  MapPinIcon,
  PhoneIcon,
  PillIcon,
  PlayCircleIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TimerIcon,
  UserRoundIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
const STATUS_CONFIG: Record<QueueStatus, { label: string; icon: React.ElementType; style: string; dot: string }> = {
  scheduled: { label: "Scheduled", icon: CalendarDaysIcon, style: "bg-[#E8F0EE] text-[#4F6D64]", dot: "bg-[#6B7870]" },
  arrived: { label: "Arrived", icon: LogInIcon, style: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  waiting: { label: "Waiting", icon: ClockIcon, style: "bg-[#F6EFE4] text-[#9A6B2F]", dot: "bg-amber-400" },
  "in-consultation": { label: "In Consultation", icon: PlayCircleIcon, style: "bg-[#E8F0EE] text-[#1A5345]", dot: "bg-[#1A5345] animate-pulse" },
  completed: { label: "Completed", icon: CheckCircle2Icon, style: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  "no-show": { label: "No Show", icon: XCircleIcon, style: "bg-red-50 text-red-600", dot: "bg-red-400" },
  cancelled: { label: "Cancelled", icon: XCircleIcon, style: "bg-gray-50 text-gray-500", dot: "bg-gray-400" },
}

const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal: { label: "Normal", style: "bg-[#E8F0EE] text-[#1A5345]" },
  urgent: { label: "Urgent", style: "bg-amber-50 text-amber-700 border border-amber-200" },
  emergency: { label: "Emergency", style: "bg-red-50 text-red-700 border border-red-200 animate-pulse" },
}

const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up": { label: "Follow-up", style: "bg-[#EEF5F3] text-[#2C6A5B]" },
  new: { label: "New Patient", style: "bg-violet-50 text-violet-700" },
  "walk-in": { label: "Walk-in", style: "bg-orange-50 text-orange-700" },
  "urgent-care": { label: "Urgent Care", style: "bg-red-50 text-red-700" },
  "post-procedure": { label: "Post-Procedure", style: "bg-teal-50 text-teal-700" },
}

type QueueFilter = "active" | "scheduled" | "completed" | "no-show"

function StatCard({ icon: Icon, iconColor, value, label }: {
  icon: React.ElementType
  iconColor: string
  value: number | string
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3">
      <Icon className={cn("size-4 sm:size-5 shrink-0", iconColor)} aria-hidden />
      <div className="min-w-0">
        <div className="text-[16px] font-bold text-[#1A1F1E] sm:text-lg leading-tight">{value}</div>
        <div className="text-[9px] font-bold text-muted-foreground sm:text-[10px] tracking-wider">{label}</div>
      </div>
    </div>
  )
}

function QueuePositionBadge({ index, status }: { index: number; status: QueueStatus }) {
  if (status === "completed" || status === "no-show" || status === "cancelled" || status === "scheduled" || status === "arrived") return null
  if (status === "in-consultation") {
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-[#1A5345] text-white sm:size-7">
        <PlayCircleIcon className="size-3.5 sm:size-4" />
      </div>
    )
  }
  return (
    <div className="flex size-6 items-center justify-center rounded-full bg-[#E8F0EE] text-[10px] font-bold text-[#1A5345] sm:size-7 sm:text-[11px]">
      {index + 1}
    </div>
  )
}

function TimelineIndicator({ patient }: { patient: QueuePatient }) {
  const steps = [
    { key: "scheduled", done: true, label: "Scheduled", time: patient.scheduledTime || "Walk-in" },
    { key: "arrived", done: !!patient.arrivedAt, label: "Arrived", time: patient.arrivedAt },
    { key: "waiting", done: !!patient.waitingSince, label: "Waiting", time: patient.waitingSince },
    { key: "consultation", done: !!patient.startedAt, label: "Consultation", time: patient.startedAt },
    { key: "done", done: !!patient.completedAt, label: "Done", time: patient.completedAt },
  ]

  const currentIdx = steps.findLastIndex((s) => s.done)

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div
            className={cn(
              "size-2 rounded-full sm:size-2.5",
              idx === currentIdx && !patient.completedAt
                ? "bg-[#1A5345] ring-2 ring-[#1A5345]/20"
                : step.done
                  ? "bg-[#1A5345]"
                  : "bg-[#E8E6E0]",
            )}
            title={`${step.label}${step.time ? `: ${step.time}` : ""}`}
          />
          {idx < steps.length - 1 && (
            <div className={cn("h-px w-2 sm:w-3", step.done && steps[idx + 1]?.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
          )}
        </div>
      ))}
    </div>
  )
}

function QueuePatientCard({
  patient,
  position,
  onMarkArrived,
  onStart,
  onComplete,
  onNoShow,
}: {
  patient: QueuePatient
  position: number
  onMarkArrived: (id: string) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onNoShow: (id: string) => void
}) {
  const statusCfg = STATUS_CONFIG[patient.status]
  const priorityCfg = PRIORITY_CONFIG[patient.priority]
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 transition-all sm:p-4 shadow-sm",
        patient.status === "in-consultation"
          ? "border-[#1A5345]/40 bg-[#F6FBF9] ring-1 ring-[#1A5345]/10"
          : patient.priority === "emergency"
            ? "border-red-200 bg-red-50/30"
            : patient.priority === "urgent" && (patient.status === "waiting" || patient.status === "arrived")
              ? "border-amber-200"
              : "border-[#E8E6E0]/60 hover:border-[#A8C4BC]/60 hover:shadow-md",
        (patient.status === "completed" || patient.status === "no-show" || patient.status === "cancelled") && "opacity-75"
      )}
    >
      <div className="flex items-start gap-2.5 sm:gap-4">
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          <QueuePositionBadge index={position} status={patient.status} />
          <UserRoundIcon className="size-4 text-[#1A5345] sm:size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="text-[12px] font-bold text-[#1A1F1E] sm:text-[14px]">{patient.fullName}</h3>
            <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{patient.age}y &middot; <span className="capitalize">{patient.gender}</span></span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px]", statusCfg.style)}>
              <span className={cn("inline-block size-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </span>
            {patient.priority !== "normal" && (
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px]", priorityCfg.style)}>
                {priorityCfg.label}
              </span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px]", visitCfg.style)}>
              {visitCfg.label}
            </span>
            {patient.hasAllergies && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 sm:text-[10px]">
                <ShieldAlertIcon className="size-3" />
                Allergies
              </span>
            )}
            {patient.vitalAlerts > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 sm:text-[10px]">
                <AlertTriangleIcon className="size-3" />
                {patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[10px] font-medium text-muted-foreground sm:text-[11px] leading-relaxed">{patient.condition}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground sm:mt-2.5 sm:gap-4 sm:text-[11px]">
            {patient.scheduledTime && (
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarDaysIcon className="size-3 text-[#1A5345]/70" />
                {patient.scheduledTime}
              </span>
            )}
            {patient.arrivedAt && (
              <span className="flex items-center gap-1.5 font-medium">
                <LogInIcon className="size-3 text-blue-500/70" />
                <span className="hidden sm:inline">Arrived </span>{patient.arrivedAt}
              </span>
            )}
            {patient.roomNumber && (
              <span className="flex items-center gap-1.5 font-medium">
                <MapPinIcon className="size-3 text-[#1A5345]/70" />
                {patient.roomNumber}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              <TimerIcon className="size-3 text-[#1A5345]/70" />
              ~{patient.estimatedDurationMin} min
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#E8E6E0]/40 pt-2 sm:mt-3 sm:pt-2.5">
            <TimelineIndicator patient={patient} />
            <span className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
              <PhoneIcon className="size-2.5" />
              {patient.phoneNumber}
            </span>
          </div>

          {patient.notes && (
            <div className="mt-2 rounded-lg bg-[#F9F8F5] px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground sm:mt-2.5 sm:text-[11px] border border-[#E8E6E0]/30 italic">
              &quot;{patient.notes}&quot;
            </div>
          )}
        </div>
      </div>

      {patient.status !== "completed" && patient.status !== "cancelled" && (
        <>
          <div className="mt-3 flex flex-col gap-2 border-t border-[#E8E6E0]/60 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:pt-4">
            {patient.status === "scheduled" && (
              <>
                <Button
                  size="sm"
                  className="flex-1 h-8 sm:h-9 gap-1.5 bg-blue-600 text-[10px] font-bold hover:bg-blue-700 sm:text-[11px] rounded-lg shadow-sm"
                  onClick={() => onMarkArrived(patient.queueEntryId)}
                >
                  <LogInIcon className="size-3 sm:size-3.5" />
                  Mark as Arrived
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-9 gap-1.5 text-[10px] font-bold text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 sm:text-[11px] rounded-lg shadow-sm"
                  onClick={() => onNoShow(patient.queueEntryId)}
                >
                  <XCircleIcon className="size-3 sm:size-3.5" />
                  No Show
                </Button>
              </>
            )}
            {patient.status === "arrived" && (
              <Button
                size="sm"
                className="flex-1 h-8 sm:h-9 gap-1.5 bg-amber-600 text-[10px] font-bold hover:bg-amber-700 sm:text-[11px] rounded-lg shadow-sm"
                onClick={() => onStart(patient.queueEntryId)}
              >
                <ClockIcon className="size-3 sm:size-3.5" />
                Move to Waiting
              </Button>
            )}
            {patient.status === "waiting" && (
              <Link href={`/doctor-queue/${patient.queueEntryId}/consultation/new`} className="flex-1">
                <Button size="sm" className="w-full h-8 sm:h-9 gap-1.5 bg-[#1A5345] text-[10px] font-bold hover:bg-[#0F3D32] sm:text-[11px] rounded-lg shadow-sm">
                  <StethoscopeIcon className="size-3 sm:size-3.5" />
                  Start Consultation
                </Button>
              </Link>
            )}
            {patient.status === "in-consultation" && (
              <>
                <Link href={`/doctor-queue/${patient.queueEntryId}/consultation/new`} className="flex-1">
                  <Button size="sm" className="w-full h-8 sm:h-9 gap-1.5 bg-[#1A5345] text-[10px] font-bold hover:bg-[#0F3D32] sm:text-[11px] rounded-lg shadow-sm">
                    <EyeIcon className="size-3 sm:size-3.5" />
                    Continue Consultation
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-9 gap-1.5 text-[10px] font-bold text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-800 sm:text-[11px] rounded-lg shadow-sm"
                  onClick={() => onComplete(patient.queueEntryId)}
                >
                  <CheckCircle2Icon className="size-3 sm:size-3.5" />
                  Complete
                </Button>
              </>
            )}
            {patient.status === "no-show" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 sm:h-9 gap-1.5 text-[10px] font-bold text-blue-600 border-blue-100 hover:bg-blue-50 hover:text-blue-700 sm:text-[11px] rounded-lg shadow-sm"
                onClick={() => onMarkArrived(patient.queueEntryId)}
              >
                <LogInIcon className="size-3 sm:size-3.5" />
                Patient Arrived Late
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

type DoctorQueueProps = {
  patients: QueuePatient[]
  stats: QueueStats
  filter: string
  setFilter: (filter: string) => void
  tabCounts: Record<string, number>
  onMarkArrived: (id: string) => void
  onMoveToWaiting: (id: string) => void
  onStartConsultation: (id: string) => void
  onComplete: (id: string) => void
  onNoShow: (id: string) => void
  isLoading?: boolean
  isError?: boolean
}

export function DoctorQueue({
  patients,
  stats,
  filter,
  setFilter,
  tabCounts,
  onMarkArrived,
  onMoveToWaiting,
  onStartConsultation,
  onComplete,
  onNoShow,
  isLoading,
  isError,
}: DoctorQueueProps) {
  if (isLoading) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[11px] text-muted-foreground sm:text-[12px]">Loading queue...</p>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangleIcon className="size-8 text-red-400" />
          <p className="text-[11px] text-red-600 sm:text-[12px]">Failed to load patient queue.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 sm:gap-3">
          <StatCard icon={CalendarDaysIcon} iconColor="text-[#1A5345]" value={stats.totalToday} label="Total Today" />
          <StatCard icon={CalendarDaysIcon} iconColor="text-[#4F6D64]" value={stats.scheduled} label="Scheduled" />
          <StatCard icon={LogInIcon} iconColor="text-blue-600" value={stats.arrived} label="Arrived" />
          <StatCard icon={UsersIcon} iconColor="text-amber-600" value={stats.inWaiting} label="Waiting" />
          <StatCard icon={PlayCircleIcon} iconColor="text-[#1A5345]" value={stats.inConsultation} label="In Consultation" />
          <StatCard icon={CheckCircle2Icon} iconColor="text-emerald-600" value={stats.completed} label="Completed" />
          <StatCard icon={TimerIcon} iconColor="text-violet-600" value={`${stats.avgWaitMin}m`} label="Avg Wait" />
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full sm:min-w-0 rounded-xl border border-[#E8E6E0] bg-white p-1 shadow-sm">
            {([
              { key: "active" as const, label: "Active Queue", shortLabel: "Active", icon: UsersIcon, count: tabCounts.active ?? 0 },
              { key: "scheduled" as const, label: "Not Arrived", shortLabel: "Pending", icon: CalendarDaysIcon, count: tabCounts.scheduled ?? 0 },
              { key: "completed" as const, label: "Completed", shortLabel: "Done", icon: CheckCircle2Icon, count: tabCounts.completed ?? 0 },
              { key: "no-show" as const, label: "No Show", shortLabel: "No Show", icon: XCircleIcon, count: tabCounts["no-show"] ?? 0 },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all sm:flex-none sm:px-4 sm:text-[11px] whitespace-nowrap",
                  filter === tab.key
                    ? "bg-[#1A5345] text-white shadow-sm"
                    : "text-[#4F6D64] hover:bg-[#F9F8F5] hover:text-[#1A5345]",
                )}
              >
                <tab.icon className={cn("size-3 sm:size-3.5", filter === tab.key ? "text-white" : "text-[#4F6D64]")} aria-hidden />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[8px] sm:ml-2 sm:text-[9px] font-black",
                  filter === tab.key ? "bg-white/20 text-white" : "bg-[#E8F0EE] text-[#1A5345]",
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {patients.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {patients.map((patient, idx) => (
              <QueuePatientCard
                key={patient.queueEntryId}
                patient={patient}
                position={idx}
                onMarkArrived={onMarkArrived}
                onStart={(id) => {
                  const p = patients.find((x) => x.queueEntryId === id)
                  if (p?.status === "arrived") onMoveToWaiting(id)
                  else if (p?.status === "waiting") onStartConsultation(id)
                }}
                onComplete={onComplete}
                onNoShow={onNoShow}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-12 sm:py-16 shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-16">
              <UsersIcon className="size-6 text-[#9CA3AF] sm:size-7" />
            </div>
            <p className="px-4 text-center text-[12px] font-medium text-[#6B7870] sm:text-[13px]">
              {filter === "active"
                ? "No active patients right now."
                : filter === "scheduled"
                  ? "All scheduled patients have arrived."
                  : filter === "completed"
                    ? "No completed visits yet."
                    : "No patients in this category."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
