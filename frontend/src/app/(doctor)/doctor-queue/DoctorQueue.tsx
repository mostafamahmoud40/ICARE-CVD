"use client"

import React from "react"
import type { QueuePatient, QueueStats, QueueStatus, QueuePriority } from "./doctorQueue.types"
import { useHasConsultationDraft } from "./useHasConsultationDraft"
import { clearConsultationDraft } from "./[queueEntryId]/consultation/consultationDraftStorage"
import { useBriefingPreparation } from "./[queueEntryId]/consultation/useBriefingPreparation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  LogInIcon,
  PlayCircleIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StethoscopeIcon,
  TimerIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PatientAvatar } from "@/components/shared/PatientAvatar"

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date())
}

const STATUS_CONFIG: Record<QueueStatus, { label: string; style: string }> = {
  scheduled: { label: "Scheduled", style: "bg-[#6B7870] text-white" },
  arrived: { label: "Arrived", style: "bg-blue-600 text-white" },
  waiting: { label: "Waiting", style: "bg-amber-600 text-white" },
  "in-consultation": { label: "In consultation", style: "bg-[#1A5345] text-white animate-pulse" },
  "report-pending": { label: "Report pending", style: "bg-violet-600 text-white" },
  completed: { label: "Completed", style: "bg-emerald-600 text-white" },
  "no-show": { label: "No show", style: "bg-red-600 text-white" },
  cancelled: { label: "Cancelled", style: "bg-gray-500 text-white" },
}

const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal: { label: "Normal", style: "bg-[#6B7870] text-white" },
  urgent: { label: "Urgent", style: "bg-[#CC5533] text-white" },
  emergency: { label: "Emergency", style: "bg-red-600 text-white animate-pulse" },
}

const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up": { label: "Follow-up", style: "bg-[#1A5345] text-white" },
  new: { label: "New", style: "bg-violet-600 text-white" },
  "walk-in": { label: "Walk-in", style: "bg-[#CC5533] text-white" },
  "urgent-care": { label: "Urgent care", style: "bg-red-600 text-white" },
  "post-procedure": { label: "Post-procedure", style: "bg-teal-600 text-white" },
}

function StatCard({ icon: Icon, iconColor, value, label }: {
  icon: React.ElementType
  iconColor: string
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <Icon className={cn("absolute right-4 top-4 size-5 opacity-80", iconColor)} aria-hidden />
      <p className="text-[11px] font-bold text-muted-foreground tracking-wide">{label}</p>
      <h3 className="font-serif text-[28px] font-bold text-[#1A1F1E] mt-2">{value}</h3>
    </div>
  )
}

function QueuePositionBadge({ index, status }: { index: number; status: QueueStatus }) {
  if (status === "completed" || status === "no-show" || status === "cancelled" || status === "scheduled" || status === "arrived" || status === "report-pending") return null
  if (status === "in-consultation") {
    return (
      <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-[#E8E6E0]/80">
        <PlayCircleIcon className="size-4 text-[#1A5345]" aria-hidden />
      </div>
    )
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-[#1A5345] text-[13px] font-bold text-white shadow-sm ring-2 ring-white">
      {index + 1}
    </div>
  )
}

function BriefingQueueBadge({ queueEntryId, enabled }: { queueEntryId: string; enabled: boolean }) {
  const { isReady, isPreparing } = useBriefingPreparation(queueEntryId, enabled)
  if (!enabled) return null
  if (isReady) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
        <SparklesIcon className="size-3" aria-hidden />
        Briefing ready
      </span>
    )
  }
  if (isPreparing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <SparklesIcon className="size-3 animate-pulse" aria-hidden />
        Preparing briefing
      </span>
    )
  }
  return null
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
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-500 text-white" }
  const hasDraft = useHasConsultationDraft(patient.queueEntryId)
  const isReportPending = patient.status === "report-pending"
  const isInConsultation = patient.status === "in-consultation"
  const isWaiting = patient.status === "waiting"
  const showContinueConsultation = isInConsultation || isReportPending || hasDraft
  const needsBriefingFirst = isWaiting && !hasDraft
  const consultationHref = needsBriefingFirst
    ? `/doctor-queue/${patient.queueEntryId}/briefing`
    : `/doctor-queue/${patient.queueEntryId}/consultation/new`
  const primaryActionLabel = isReportPending
    ? "Complete report"
    : needsBriefingFirst
      ? "Review briefing"
      : showContinueConsultation
        ? "Continue consultation"
        : "Start consultation"

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full",
        patient.status === "in-consultation"
          ? "border-l-4 border-l-[#1A5345] border-[#E8E6E0]/60 bg-[#F6FBF9]"
          : patient.status === "report-pending"
            ? "border-l-4 border-l-violet-500 border-[#E8E6E0]/60 bg-violet-50/20"
            : patient.priority === "emergency"
            ? "border-l-4 border-l-red-500 border-[#E8E6E0]/60 bg-red-50/20"
            : patient.priority === "urgent" && (patient.status === "waiting" || patient.status === "arrived")
              ? "border-l-4 border-l-amber-500 border-[#E8E6E0]/60"
              : "border-l-4 border-l-transparent border-[#E8E6E0]/60",
        (patient.status === "completed" || patient.status === "no-show" || patient.status === "cancelled") && "opacity-70 grayscale-[20%]"
      )}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <QueuePositionBadge index={position} status={patient.status} />
          <div className="size-11 rounded-full bg-[#F3F4F6] border border-[#E8E6E0]/60 overflow-hidden shrink-0 mt-1">
            <PatientAvatar
              name={patient.fullName}
              avatarUrl={patient.avatarUrl}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-serif text-[18px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors truncate">
                {patient.fullName}
              </h4>
              <span className="text-[12px] font-medium text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 shrink-0">
                {patient.age}y &middot; <span className="capitalize">{patient.gender}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm whitespace-nowrap",
                  statusCfg.style,
                )}
              >
                {statusCfg.label}
              </span>
              {patient.priority !== "normal" && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm whitespace-nowrap",
                    priorityCfg.style,
                  )}
                >
                  {priorityCfg.label}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                visitCfg.style,
              )}
            >
              {visitCfg.label}
            </span>
            {patient.hasAllergies && (
              <span className="flex items-center gap-1 rounded-lg bg-red-50/50 px-2 py-0.5 text-[11px] font-bold text-red-600 border border-red-100">
                <ShieldAlertIcon className="size-3" /> Allergies
              </span>
            )}
            {patient.vitalAlerts > 0 && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-50/50 px-2 py-0.5 text-[11px] font-bold text-amber-600 border border-amber-100">
                <AlertTriangleIcon className="size-3" /> {patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
              </span>
            )}
            <BriefingQueueBadge queueEntryId={patient.queueEntryId} enabled={isWaiting} />
          </div>

          <div className="mt-3.5 bg-[#F9F8F5] px-3 py-2.5 rounded-xl border border-[#E8E6E0]/40">
            <p className="text-[13px] sm:text-[14px] font-bold leading-snug text-[#1A1F1E] line-clamp-3">
              {patient.condition?.trim() || "No chief complaint recorded"}
            </p>
          </div>

          {patient.notes && (
            <div className="mt-3 text-[12px] font-medium text-muted-foreground italic border-l-2 border-[#E8E6E0] pl-3 py-1 bg-white">
              "{patient.notes}"
            </div>
          )}
        </div>
      </div>

      {patient.status !== "completed" && patient.status !== "cancelled" && (
        <div className="mt-5 flex flex-col gap-2 border-t border-[#E8E6E0]/60 pt-4 sm:flex-row sm:items-center">
          {patient.status === "scheduled" && (
            <>
              <Button
                size="sm"
                className="flex-1 h-9 gap-1.5 bg-blue-600 text-[12px] font-bold hover:bg-blue-700 rounded-lg shadow-sm"
                onClick={() => onMarkArrived(patient.queueEntryId)}
              >
                <LogInIcon className="size-4" />
                Mark as Arrived
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 text-[12px] font-bold text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 rounded-lg shadow-sm"
                onClick={() => onNoShow(patient.queueEntryId)}
              >
                <XCircleIcon className="size-4" />
                No Show
              </Button>
            </>
          )}
          {patient.status === "arrived" && (
            <Button
              size="sm"
              className="flex-1 h-9 gap-1.5 bg-amber-600 text-[12px] font-bold hover:bg-amber-700 rounded-lg shadow-sm"
              onClick={() => onStart(patient.queueEntryId)}
            >
              <ClockIcon className="size-4" />
              Move to Waiting
            </Button>
          )}
          {(patient.status === "waiting" || patient.status === "in-consultation" || patient.status === "report-pending") && (
            <>
              <Link href={consultationHref} className="flex-1">
                <Button
                  size="sm"
                  className={cn(
                    "w-full h-9 gap-1.5 bg-[#1A5345] text-[12px] font-bold hover:bg-[#133F34] rounded-lg transition-all",
                    showContinueConsultation
                      ? "shadow-sm"
                      : "shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]",
                  )}
                >
                  {isReportPending ? (
                    <>
                      <FileTextIcon className="size-4" />
                      {primaryActionLabel}
                    </>
                  ) : needsBriefingFirst ? (
                    <>
                      <FileTextIcon className="size-4" />
                      {primaryActionLabel}
                    </>
                  ) : showContinueConsultation ? (
                    <>
                      <EyeIcon className="size-4" />
                      {primaryActionLabel}
                    </>
                  ) : (
                    <>
                      <StethoscopeIcon className="size-4" />
                      {primaryActionLabel}
                    </>
                  )}
                </Button>
              </Link>
              {(patient.status === "in-consultation" || patient.status === "report-pending") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-lg border border-[#E8E6E0]/80 bg-white/80 px-4 text-[12px] font-bold text-[#1A1F1E] shadow-none hover:bg-white hover:text-[#1A1F1E]"
                  onClick={() => {
                    clearConsultationDraft(patient.queueEntryId)
                    onComplete(patient.queueEntryId)
                  }}
                >
                  Complete
                </Button>
              )}
            </>
          )}
          {patient.status === "no-show" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 gap-1.5 text-[12px] font-bold text-blue-600 border-blue-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm"
              onClick={() => onMarkArrived(patient.queueEntryId)}
            >
              <LogInIcon className="size-4" />
              Patient Arrived Late
            </Button>
          )}
        </div>
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
      <div className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[13px] font-medium text-muted-foreground">Loading operations queue...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3 bg-red-50 p-6 rounded-2xl border border-red-100 max-w-sm text-center">
          <AlertTriangleIcon className="size-8 text-red-500" />
          <p className="text-[14px] font-bold text-red-700">Failed to load patient queue</p>
          <p className="text-[12px] text-red-600/80">There was an error communicating with the operations center.</p>
        </div>
      </div>
    )
  }

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
              Clinic Active
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px] flex items-center gap-2">
                Doctor Operations Queue
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Manage daily appointments, active consultations, and patient flow.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 custom-scrollbar">
        <div className="w-full min-w-0 space-y-6 sm:space-y-8">
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard icon={CalendarDaysIcon} iconColor="text-[#1A5345]" value={stats.totalToday} label="Total Today" />
            <StatCard icon={CalendarDaysIcon} iconColor="text-[#4F6D64]" value={stats.scheduled} label="Scheduled" />
            <StatCard icon={LogInIcon} iconColor="text-blue-600" value={stats.arrived} label="Arrived" />
            <StatCard icon={UsersIcon} iconColor="text-amber-600" value={stats.inWaiting} label="Waiting" />
            <StatCard icon={PlayCircleIcon} iconColor="text-[#1A5345]" value={stats.inConsultation} label="In Consult" />
            <StatCard icon={CheckCircle2Icon} iconColor="text-emerald-600" value={stats.completed} label="Completed" />
            <StatCard icon={TimerIcon} iconColor="text-[#CC5533]" value={`${stats.avgWaitMin}m`} label="Avg Wait" />
          </div>

          <div className="flex flex-wrap gap-2.5 bg-white p-1.5 rounded-2xl border border-[#E8E6E0]/60 shadow-sm w-fit">
            {([
              { key: "active" as const, label: "Active Queue", icon: UsersIcon, count: tabCounts.active ?? 0 },
              { key: "scheduled" as const, label: "Pending", icon: CalendarDaysIcon, count: tabCounts.scheduled ?? 0 },
              { key: "completed" as const, label: "Completed", icon: CheckCircle2Icon, count: tabCounts.completed ?? 0 },
              { key: "no-show" as const, label: "No Show", icon: XCircleIcon, count: tabCounts["no-show"] ?? 0 },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-all shadow-sm whitespace-nowrap",
                  filter === tab.key
                    ? "bg-[#1A5345] text-white shadow-md ring-1 ring-[#1A5345]"
                    : "bg-transparent text-[#4F6D64] border-transparent hover:bg-[#F4F3ED] hover:text-[#1A5345]",
                )}
              >
                <tab.icon className={cn("size-4", filter === tab.key ? "text-white" : "text-[#4F6D64]")} aria-hidden />
                <span>{tab.label}</span>
                <span className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-[10px] font-black",
                  filter === tab.key ? "bg-white/20 text-white" : "bg-[#E8F0EE] text-[#1A5345]",
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {patients.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-16 sm:py-24 shadow-sm">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#F5F5F3] shadow-sm">
                <UsersIcon className="size-7 text-[#9CA3AF]" />
              </div>
              <h3 className="text-[18px] font-serif font-bold text-[#1A1F1E]">No Patients Found</h3>
              <p className="mt-2 text-center text-[13px] font-medium text-[#6B7870] max-w-sm">
                {filter === "active"
                  ? "Your active queue is empty right now. You can check the pending tab for upcoming appointments."
                  : filter === "scheduled"
                    ? "All scheduled patients have already arrived or there are no upcoming appointments."
                    : filter === "completed"
                      ? "No completed visits yet today."
                      : "No patients currently in this category."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
