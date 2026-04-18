"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  LogInIcon,
  MapPinIcon,
  PhoneIcon,
  PillIcon,
  PlayCircleIcon,
  SearchIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TimerIcon,
  UserRoundIcon,
  UsersIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { QueuePatient, QueueStats, QueueStatus, QueuePriority, QueueFilter } from "./assistantQueue.types"

/* ---------- config maps ---------- */

const STATUS_CONFIG: Record<QueueStatus, { label: string; style: string; dot: string }> = {
  scheduled: { label: "Scheduled", style: "bg-[#E8F0EE] text-[#4F6D64]", dot: "bg-[#6B7870]" },
  arrived: { label: "Arrived", style: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  waiting: { label: "Waiting", style: "bg-[#F6EFE4] text-[#9A6B2F]", dot: "bg-amber-400" },
  "in-consultation": { label: "In Consultation", style: "bg-[#E8F0EE] text-[#1A5345]", dot: "bg-[#1A5345] animate-pulse" },
  completed: { label: "Completed", style: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  "no-show": { label: "No Show", style: "bg-red-50 text-red-600", dot: "bg-red-400" },
  cancelled: { label: "Cancelled", style: "bg-gray-50 text-gray-500", dot: "bg-gray-400" },
}

const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal: { label: "Normal", style: "bg-[#E8F0EE] text-[#1A5345]" },
  urgent: { label: "Urgent", style: "bg-amber-50 text-amber-700 border border-amber-200" },
  emergency: { label: "Emergency", style: "bg-red-50 text-red-700 border border-red-200 animate-pulse" },
}

const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up": { label: "Follow-up", style: "bg-[#EEF5F3] text-[#2C6A5B]" },
  new: { label: "New", style: "bg-violet-50 text-violet-700" },
  "walk-in": { label: "Walk-in", style: "bg-orange-50 text-orange-700" },
  "urgent-care": { label: "Urgent", style: "bg-red-50 text-red-700" },
  "post-procedure": { label: "Post-Proc", style: "bg-teal-50 text-teal-700" },
}

/* ---------- small reusable pieces ---------- */

function StatusBadge({ status }: { status: QueueStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", cfg.style)}>
      <span className={cn("inline-block size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function StatCard({ icon: Icon, iconStyle, value, label }: {
  icon: React.ElementType
  iconStyle: string
  value: number | string
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9", iconStyle)}>
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-[#102F27] sm:text-xl">{value}</div>
        <div className="text-[10px] text-muted-foreground sm:text-[11px]">{label}</div>
      </div>
    </div>
  )
}

/* ---------- compact queue row (left panel) ---------- */

function QueueRow({
  patient,
  position,
  isSelected,
  onSelect,
}: {
  patient: QueuePatient
  position: number
  isSelected: boolean
  onSelect: () => void
}) {
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all sm:gap-3 sm:p-3",
        isSelected
          ? "border-[#1A5345]/40 bg-[#F6FBF9] ring-1 ring-[#1A5345]/10"
          : patient.priority === "emergency"
            ? "border-red-200 bg-red-50/20 hover:border-red-300"
            : patient.priority === "urgent"
              ? "border-amber-200 bg-amber-50/20 hover:border-amber-300"
              : patient.status === "completed" || patient.status === "no-show" || patient.status === "cancelled"
                ? "border-[#E5EEEA] opacity-60 hover:opacity-80"
                : "border-[#E5EEEA] bg-white hover:border-[#A8C4BC]",
      )}
    >
      {/* Position */}
      <div className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:size-8 sm:text-[11px]",
        patient.status === "in-consultation"
          ? "bg-[#1A5345] text-white"
          : "bg-[#E8F0EE] text-[#1A5345]",
      )}>
        {patient.status === "in-consultation" ? <PlayCircleIcon className="size-3.5" /> : position + 1}
      </div>

      {/* Avatar */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] sm:size-9">
        <UserRoundIcon className="size-4 text-[#1A5345] sm:size-4.5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{patient.fullName}</span>
            <span className="shrink-0 text-[9px] text-muted-foreground sm:text-[10px]">{patient.age}y</span>
          </div>
          <StatusBadge status={patient.status} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {patient.priority !== "normal" && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", PRIORITY_CONFIG[patient.priority].style)}>
              {PRIORITY_CONFIG[patient.priority].label}
            </span>
          )}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", visitCfg.style)}>
            {visitCfg.label}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground sm:text-[10px]">
            <StethoscopeIcon className="size-2.5" />
            {patient.assignedDoctor}
          </span>
          {patient.scheduledTime && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground sm:text-[10px]">
              <ClockIcon className="size-2.5" />
              {patient.scheduledTime}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ---------- in-clinic mini card (right panel, waiting list) ---------- */

function InClinicCard({
  patient,
  onClick,
}: {
  patient: QueuePatient
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg border border-[#E5EEEA] bg-white p-2.5 text-left transition-colors hover:border-[#A8C4BC] hover:bg-[#F6FBF9] sm:p-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
        <UserRoundIcon className="size-4 text-[#1A5345]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{patient.fullName}</span>
          <StatusBadge status={patient.status} />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground sm:text-[10px]">
          <span className="flex items-center gap-0.5">
            <StethoscopeIcon className="size-2.5" />
            {patient.assignedDoctor}
          </span>
          {patient.arrivedAt && (
            <span className="flex items-center gap-0.5">
              <LogInIcon className="size-2.5 text-blue-500" />
              {patient.arrivedAt}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ---------- patient detail view (right panel) ---------- */

function PatientDetailView({
  patient,
  onBack,
  onMarkArrived,
  onMoveToWaiting,
  onNoShow,
}: {
  patient: QueuePatient
  onBack: () => void
  onMarkArrived: (id: string) => void
  onMoveToWaiting: (id: string) => void
  onNoShow: (id: string) => void
}) {
  const statusCfg = STATUS_CONFIG[patient.status]
  const priorityCfg = PRIORITY_CONFIG[patient.priority]
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }

  const steps = [
    { key: "scheduled", done: true, label: "Scheduled" },
    { key: "arrived", done: !!patient.arrivedAt, label: "Arrived" },
    { key: "waiting", done: !!patient.waitingSince, label: "Waiting" },
    { key: "consultation", done: !!patient.startedAt, label: "Consultation" },
    { key: "done", done: !!patient.completedAt, label: "Done" },
  ]
  const currentIdx = steps.findLastIndex((s) => s.done)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#E8E6E0] px-3 py-2.5 sm:px-4 sm:py-3">
        <button
          onClick={onBack}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345]"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-bold text-[#102F27] sm:text-[13px]">{patient.fullName}</h3>
          <p className="text-[9px] text-muted-foreground sm:text-[10px]">{patient.condition}</p>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      {/* Scrollable content */}
      <div className="space-y-3 p-3 sm:p-4">
        {/* Demographics */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#E8F0EE] sm:size-14">
            <UserRoundIcon className="size-6 text-[#1A5345] sm:size-7" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{patient.fullName}</p>
            <p className="text-[10px] text-muted-foreground sm:text-[11px]">{patient.age} years &middot; <span className="capitalize">{patient.gender}</span></p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {patient.priority !== "normal" && (
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]", priorityCfg.style)}>
              {priorityCfg.label}
            </span>
          )}
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]", visitCfg.style)}>
            {VISIT_TYPE_CONFIG[patient.visitType]?.label ?? patient.visitType}
          </span>
          {patient.hasAllergies && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600 sm:text-[10px]">
              <ShieldAlertIcon className="size-2.5" />
              Allergies
            </span>
          )}
          {patient.vitalAlerts > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-600 sm:text-[10px]">
              <AlertTriangleIcon className="size-2.5" />
              {patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Assigned Doctor */}
        <div className="rounded-lg border border-[#E5EEEA] bg-[#F6FBF9] p-2.5 sm:p-3">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Assigned Doctor</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#1A5345]">
              <StethoscopeIcon className="size-3.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{patient.assignedDoctor}</p>
              <p className="text-[9px] text-muted-foreground sm:text-[10px]">{patient.assignedDoctorDepartment}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="mb-3 text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Progress</p>
          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                {/* Dot row */}
                <div className="flex w-full items-center">
                  {/* Left line */}
                  <div className="flex-1 flex justify-end">
                    {idx > 0 && (
                      <div className={cn("h-px w-full", step.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
                    )}
                  </div>
                  {/* Dot */}
                  <div
                    className={cn(
                      "mx-2 size-2.5 shrink-0 rounded-full sm:size-3",
                      idx === currentIdx && !patient.completedAt
                        ? "bg-[#1A5345] ring-2 ring-[#1A5345]/20"
                        : step.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]",
                    )}
                    title={step.label}
                  />
                  {/* Right line */}
                  <div className="flex-1 flex justify-start">
                    {idx < steps.length - 1 && (
                      <div className={cn("h-px w-full", step.done && steps[idx + 1]?.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
                    )}
                  </div>
                </div>
                {/* Label */}
                <span className="mt-2 whitespace-nowrap text-center text-[8px] text-muted-foreground sm:text-[9px]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {patient.scheduledTime && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground sm:text-[10px]">Scheduled</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">{patient.scheduledTime}</p>
            </div>
          )}
          {patient.arrivedAt && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground sm:text-[10px]">Arrived</p>
              <p className="mt-0.5 text-[11px] font-medium text-blue-600 sm:text-[12px]">{patient.arrivedAt}</p>
            </div>
          )}
          {patient.roomNumber && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground sm:text-[10px]">Room</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">{patient.roomNumber}</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
            <p className="text-[9px] text-muted-foreground sm:text-[10px]">Duration</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">~{patient.estimatedDurationMin} min</p>
          </div>
          {patient.activeMedications > 0 && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground sm:text-[10px]">Medications</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">{patient.activeMedications} active Rx</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
            <p className="text-[9px] text-muted-foreground sm:text-[10px]">Phone</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">{patient.phoneNumber}</p>
          </div>
        </div>

        {/* Notes */}
        {patient.notes && (
          <div className="rounded-lg bg-[#FAFAF8] p-2.5 sm:p-3">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Notes</p>
            <p className="mt-0.5 text-[10px] text-[#1A1F1E] sm:text-[11px]">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {patient.status !== "completed" && patient.status !== "cancelled" && patient.status !== "in-consultation" && (
        <div className="border-t border-[#E8E6E0] p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            {patient.status === "scheduled" && (
              <>
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-blue-600 text-[10px] hover:bg-blue-700 sm:text-[11px]"
                  onClick={() => onMarkArrived(patient.queueEntryId)}
                >
                  <LogInIcon className="size-3.5" />
                  Mark as Arrived
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700 sm:text-[11px]"
                  onClick={() => onNoShow(patient.queueEntryId)}
                >
                  <XCircleIcon className="size-3.5" />
                  No Show
                </Button>
              </>
            )}
            {patient.status === "arrived" && (
              <Button
                size="sm"
                className="w-full gap-1.5 bg-amber-600 text-[10px] hover:bg-amber-700 sm:text-[11px]"
                onClick={() => onMoveToWaiting(patient.queueEntryId)}
              >
                <ClockIcon className="size-3.5" />
                Move to Waiting
              </Button>
            )}
            {patient.status === "waiting" && (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#EEF5F3] px-3 py-2 text-[10px] text-[#1A5345] sm:text-[11px]">
                <ClockIcon className="size-3.5" />
                Waiting for doctor
                <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-[#1A5345]" />
              </div>
            )}
            {patient.status === "no-show" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-[10px] text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:text-[11px]"
                onClick={() => onMarkArrived(patient.queueEntryId)}
              >
                <LogInIcon className="size-3.5" />
                Patient Arrived Late
              </Button>
            )}
          </div>
        </div>
      )}

      {patient.status === "in-consultation" && (
        <div className="border-t border-[#E8E6E0] p-3 sm:p-4">
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#E8F0EE] px-3 py-2 text-[10px] text-[#1A5345] sm:text-[11px]">
            <StethoscopeIcon className="size-3.5" />
            Currently with {patient.assignedDoctor}
            <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-[#1A5345]" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- main component ---------- */

type AssistantQueueProps = {
  patients: QueuePatient[]
  stats: QueueStats
  filter: QueueFilter
  setFilter: (filter: QueueFilter) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  tabCounts: Record<QueueFilter, number>
  selectedPatient: QueuePatient | null
  selectPatient: (id: string | null) => void
  clearSelection: () => void
  inClinicPatients: QueuePatient[]
  onMarkArrived: (queueEntryId: string) => void
  onMoveToWaiting: (queueEntryId: string) => void
  onNoShow: (queueEntryId: string) => void
  isLoading?: boolean
  isError?: boolean
}

export function AssistantQueue({
  patients,
  stats,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  tabCounts,
  selectedPatient,
  selectPatient,
  clearSelection,
  inClinicPatients,
  onMarkArrived,
  onMoveToWaiting,
  onNoShow,
  isLoading,
  isError,
}: AssistantQueueProps) {
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
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      {/* ======== TOP SECTION: Header + Stats ======== */}
      <div className="shrink-0 space-y-4 border-b border-[#E8E6E0] p-3 sm:space-y-5 sm:p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A5345] sm:size-9">
            <UsersIcon className="size-4 text-white sm:size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-[13px] font-bold text-[#1A1F1E] sm:text-[15px]">Patient Queue</h2>
            <p className="text-[10px] text-muted-foreground sm:text-[11px]">
              {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date())}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:px-2.5 sm:text-[11px]">
            <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Stats - Full Width */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 sm:gap-3">
          <StatCard icon={CalendarDaysIcon} iconStyle="bg-[#E8F0EE] text-[#1A5345]" value={stats.totalToday} label="Total Today" />
          <StatCard icon={CalendarDaysIcon} iconStyle="bg-[#E8F0EE] text-[#4F6D64]" value={stats.scheduled} label="Scheduled" />
          <StatCard icon={LogInIcon} iconStyle="bg-blue-50 text-blue-600" value={stats.arrived} label="Arrived" />
          <StatCard icon={UsersIcon} iconStyle="bg-amber-50 text-amber-600" value={stats.inWaiting} label="Waiting" />
          <StatCard icon={PlayCircleIcon} iconStyle="bg-[#E8F0EE] text-[#1A5345]" value={stats.inConsultation} label="In Consult." />
          <StatCard icon={CheckCircle2Icon} iconStyle="bg-emerald-50 text-emerald-600" value={stats.completed} label="Completed" />
          <StatCard icon={TimerIcon} iconStyle="bg-violet-50 text-violet-600" value={`${stats.avgWaitMin}m`} label="Avg Wait" />
        </div>
      </div>

      {/* ======== BOTTOM SECTION: Queue List + In Clinic ======== */}
      <div className="flex flex-1 min-h-0">
        {/* Queue List */}
        <div className="flex flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="space-y-4 sm:space-y-5">
            {/* Search + Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, doctor, or condition..."
                  className="h-8 border-[#E8E6E0] bg-white pl-8 text-[11px] placeholder:text-[#9CA3AF] sm:text-[12px]"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]">
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="flex">
                <div className="flex w-full rounded-full border border-[#D6E6DF] bg-[#F8FCFA] p-0.5 sm:w-auto">
                  {([
                    { key: "active" as const, label: "Active", shortLabel: "Active", count: tabCounts.active },
                    { key: "scheduled" as const, label: "Not Yet Arrived", shortLabel: "Pending", count: tabCounts.scheduled },
                    { key: "completed" as const, label: "Completed", shortLabel: "Done", count: tabCounts.completed },
                    { key: "no-show" as const, label: "No Show", shortLabel: "No Show", count: tabCounts["no-show"] },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={cn(
                        "flex-1 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition-colors sm:flex-none sm:px-3.5 sm:text-[11px]",
                        filter === tab.key
                          ? "bg-[#1A5345] text-white"
                          : "text-[#4F6D64] hover:bg-[#E8F0EE]",
                      )}
                    >
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className={cn(
                        "ml-1 rounded-full px-1 py-0.5 text-[8px] sm:ml-1.5 sm:px-1.5 sm:text-[9px]",
                        filter === tab.key ? "bg-white/20 text-white" : "bg-[#E8F0EE] text-[#1A5345]",
                      )}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient rows */}
            {patients.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5">
                {patients.map((patient, idx) => (
                  <QueueRow
                    key={patient.queueEntryId}
                    patient={patient}
                    position={idx}
                    isSelected={selectedPatient?.queueEntryId === patient.queueEntryId}
                    onSelect={() => selectPatient(patient.queueEntryId)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 sm:py-12">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
                  <UsersIcon className="size-6 text-[#9CA3AF] sm:size-7" />
                </div>
                <p className="px-4 text-center text-[12px] text-[#6B7870] sm:text-[13px]">
                  {filter === "active" ? "No active patients right now." : "No patients in this category."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* In-Clinic / Patient Detail Panel */}
        <div className="hidden w-[340px] shrink-0 flex-col overflow-y-auto border-l border-[#E8E6E0] bg-white lg:flex">
          {selectedPatient ? (
            <PatientDetailView
              patient={selectedPatient}
              onBack={clearSelection}
              onMarkArrived={onMarkArrived}
              onMoveToWaiting={onMoveToWaiting}
              onNoShow={onNoShow}
            />
          ) : (
            <div className="flex flex-col">
              {/* In-Clinic header */}
              <div className="flex items-center gap-2 border-b border-[#E8E6E0] px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50">
                  <UsersIcon className="size-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[12px] font-bold text-[#102F27] sm:text-[13px]">In Clinic</h3>
                  <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                    {inClinicPatients.length} patient{inClinicPatients.length !== 1 ? "s" : ""} arrived &middot; waiting
                  </p>
                </div>
              </div>

              {/* In-Clinic list */}
              {inClinicPatients.length > 0 ? (
                <div className="space-y-2 p-2 sm:p-2.5">
                  {inClinicPatients.map((p) => (
                    <InClinicCard
                      key={p.queueEntryId}
                      patient={p}
                      onClick={() => selectPatient(p.queueEntryId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                    <UsersIcon className="size-6 text-[#9CA3AF]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground sm:text-[12px]">
                    No patients in clinic right now.
                  </p>
                  <p className="mt-1 text-[9px] text-muted-foreground sm:text-[10px]">
                    Patients will appear here once marked as arrived.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
