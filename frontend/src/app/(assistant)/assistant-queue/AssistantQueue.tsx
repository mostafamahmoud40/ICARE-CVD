"use client"

import { useState, useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  ArrowDownCircleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  HistoryIcon,
  LogInIcon,
  PauseCircleIcon,
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
import type { QueuePatient, QueueStats, QueueStatus, QueuePriority, QueueFilter } from "./assistantQueue.types"
import type { DoctorLiveSnapshot } from "./assistantQueue.liveBoard"
import { formatShortTime } from "./assistantQueue.liveBoard"
import { PatientStudiesUploadSection } from "./PatientStudiesUploadSection"

/* ─────────────────────────────────────────────────────────────────────── */
/*  Config maps                                                             */
/* ─────────────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<QueueStatus, { label: string; style: string; dot: string }> = {
  scheduled:         { label: "Scheduled",       style: "bg-[#E8F0EE] text-[#4F6D64]",          dot: "bg-[#6B7870]" },
  arrived:           { label: "Arrived",          style: "bg-blue-50 text-blue-700",              dot: "bg-blue-400" },
  waiting:           { label: "Waiting",          style: "bg-[#F6EFE4] text-[#9A6B2F]",          dot: "bg-amber-400" },
  "in-consultation": { label: "In Consultation",  style: "bg-[#E8F0EE] text-[#1A5345]",          dot: "bg-[#1A5345] animate-pulse" },
  completed:         { label: "Completed",        style: "bg-emerald-50 text-emerald-700",        dot: "bg-emerald-400" },
  "no-show":         { label: "No Show",          style: "bg-red-50 text-red-600",                dot: "bg-red-400" },
  cancelled:         { label: "Cancelled",        style: "bg-gray-50 text-gray-500",              dot: "bg-gray-400" },
}

const PRIORITY_CONFIG: Record<QueuePriority, { label: string; style: string }> = {
  normal:    { label: "Normal",    style: "bg-[#E8F0EE] text-[#1A5345]" },
  urgent:    { label: "Urgent",    style: "bg-amber-50 text-amber-700 border border-amber-200" },
  emergency: { label: "Emergency", style: "bg-red-50 text-red-700 border border-red-200 animate-pulse" },
}

const VISIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  "follow-up":      { label: "Follow-up",   style: "bg-[#EEF5F3] text-[#2C6A5B]" },
  new:              { label: "New",          style: "bg-violet-50 text-violet-700" },
  "walk-in":        { label: "Walk-in",      style: "bg-orange-50 text-orange-700" },
  "urgent-care":    { label: "Urgent",       style: "bg-red-50 text-red-700" },
  "post-procedure": { label: "Post-Proc",    style: "bg-teal-50 text-teal-700" },
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Tiny shared atoms                                                       */
/* ─────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: QueueStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", cfg.style)}>
      <span className={cn("inline-block size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function StatCell({
  icon: Icon, iconStyle, value, label,
}: { icon: React.ElementType; iconStyle: string; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl shadow-md sm:size-10", iconStyle)}>
        <Icon className="size-4 text-white sm:size-5" />
      </div>
      <div className="text-[14px] font-bold leading-none text-[#102F27] sm:text-[15px]">{value}</div>
      <div className="text-[8px] text-muted-foreground">{label}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Pill navigation                                                         */
/* ─────────────────────────────────────────────────────────────────────── */

export type QueueNavMode = "operations" | "schedule" | "history" | "doctors"


/* ─────────────────────────────────────────────────────────────────────── */
/*  Queue row (left list)                                                   */
/* ─────────────────────────────────────────────────────────────────────── */

function QueueRow({
  patient,
  position,
  waitingTurn,
  isSelected,
  onSelect,
}: {
  patient: QueuePatient
  position: number
  waitingTurn?: number | null
  isSelected: boolean
  onSelect: () => void
}) {
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all",
        isSelected
          ? "border-[#1A5345]/40 bg-[#F6FBF9] ring-1 ring-[#1A5345]/10"
          : patient.priority === "emergency"
            ? "border-red-100 bg-red-50/20 hover:border-red-200"
            : patient.priority === "urgent"
              ? "border-amber-100 bg-amber-50/20 hover:border-amber-200"
              : patient.status === "completed" || patient.status === "no-show" || patient.status === "cancelled"
                ? "border-[#E5EEEA] opacity-60 hover:opacity-80"
                : "border-[#E5EEEA] bg-white hover:border-[#A8C4BC]",
      )}
    >
      {/* Merged avatar — icon + status encoding */}
      <div className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold",
        patient.status === "in-consultation" ? "bg-[#1A5345]"
          : patient.status === "waiting"     ? "bg-amber-50 ring-1 ring-amber-200"
          : patient.status === "arrived"     ? "bg-blue-50 ring-1 ring-blue-100"
          : patient.status === "completed"   ? "bg-emerald-50"
          : "bg-[#E8F0EE]",
      )}>
        {patient.status === "in-consultation" ? (
          <StethoscopeIcon className="size-4 text-white" />
        ) : patient.status === "waiting" && waitingTurn != null ? (
          <span className="tabular-nums text-amber-700">#{waitingTurn}</span>
        ) : patient.status === "waiting" ? (
          <ClockIcon className="size-4 text-amber-500" />
        ) : patient.status === "arrived" ? (
          <LogInIcon className="size-4 text-blue-500" />
        ) : patient.status === "completed" ? (
          <CheckCircle2Icon className="size-4 text-emerald-600" />
        ) : patient.status === "no-show" ? (
          <XIcon className="size-4 text-[#9CA3AF]" />
        ) : (
          <UserRoundIcon className="size-4 text-[#1A5345]" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[11px] font-semibold text-[#102F27]">{patient.fullName}</span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{patient.age}y</span>
          </div>
          <StatusBadge status={patient.status} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {patient.priority !== "normal" && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", PRIORITY_CONFIG[patient.priority].style)}>
              {PRIORITY_CONFIG[patient.priority].label}
            </span>
          )}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", visitCfg.style)}>{visitCfg.label}</span>
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
            <StethoscopeIcon className="size-2.5" />{patient.assignedDoctor}
          </span>
          {patient.scheduledTime && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <ClockIcon className="size-2.5" />{formatShortTime(patient.scheduledTime)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Live desk — single-doctor pipeline                                      */
/* ─────────────────────────────────────────────────────────────────────── */

/** A row used in every section of the pipeline */
function PipelineRow({
  patient,
  badge,
  subline,
  accent = false,
  onSelect,
}: {
  patient: QueuePatient
  badge: ReactNode
  subline?: string
  accent?: boolean
  onSelect: (id: string) => void
}) {
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }
  return (
    <button
      type="button"
      onClick={() => onSelect(patient.queueEntryId)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all sm:p-3.5",
        accent
          ? "border-[#1A5345]/20 bg-[#EEF7F3] hover:bg-[#E4F2EC]"
          : patient.priority === "emergency"
            ? "border-red-200 bg-red-50/30 hover:border-red-300"
            : patient.priority === "urgent"
              ? "border-amber-200 bg-amber-50/30 hover:border-amber-300"
              : "border-[#E8E6E0] bg-white hover:border-[#A8C4BC] hover:bg-[#F6FBF9]",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5EEEA] sm:size-10">
        {badge}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{patient.fullName}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{patient.age}y</span>
          {patient.priority !== "normal" && (
            <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium", PRIORITY_CONFIG[patient.priority].style)}>
              {PRIORITY_CONFIG[patient.priority].label}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", visitCfg.style)}>{visitCfg.label}</span>
          {subline && <span>{subline}</span>}
          {patient.hasAllergies && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] font-medium text-red-600">
              <ShieldAlertIcon className="size-2.5" />Allergies
            </span>
          )}
          {patient.vitalAlerts > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-medium text-amber-600">
              <AlertTriangleIcon className="size-2.5" />{patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={patient.status} />
    </button>
  )
}

/** Section header used inside the pipeline */
function PipelineSectionHeader({
  icon: Icon,
  iconClass,
  title,
  count,
  countStyle,
}: {
  icon: React.ElementType
  iconClass: string
  title: string
  count?: number
  countStyle?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex size-6 items-center justify-center rounded-md", iconClass)}>
        <Icon className="size-3.5" />
      </div>
      <span className="text-[11px] font-bold text-[#102F27] sm:text-[12px]">{title}</span>
      {count != null && (
        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", countStyle ?? "bg-[#E8F0EE] text-[#1A5345]")}>
          {count}
        </span>
      )}
    </div>
  )
}

function SingleDoctorLivePipeline({
  snapshot,
  waitingTurnByQueueId,
  liveBoardLoading,
  onSelectPatient,
}: {
  snapshot: DoctorLiveSnapshot | null
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onSelectPatient: (id: string) => void
}) {
  if (liveBoardLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[10px] text-muted-foreground">Loading live data…</p>
        </div>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
          <StethoscopeIcon className="size-7 text-[#9CA3AF]" />
        </div>
        <p className="text-[12px] font-medium text-muted-foreground">No active visits yet</p>
        <p className="mt-1 text-[9px] text-muted-foreground">The queue will update automatically once patients check in.</p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-0 divide-y divide-[#F0EFEA]">

        {/* ── 1. WITH DOCTOR NOW ───────────────────────────── */}
        <section className="px-4 py-4 sm:px-5 sm:py-5">
          <PipelineSectionHeader
            icon={PlayCircleIcon}
            iconClass="bg-[#1A5345] text-white"
            title="With doctor now"
            count={snapshot.inConsultation.length}
            countStyle="bg-[#E8F0EE] text-[#1A5345]"
          />
          <div className="mt-3">
            {snapshot.inConsultation.length > 0 ? (
              <div className="space-y-2">
                {snapshot.inConsultation.map((p) => (
                  <PipelineRow
                    key={p.queueEntryId}
                    patient={p}
                    badge={<PlayCircleIcon className="size-5 text-[#1A5345]" />}
                    subline={p.startedAt ? `Started ${formatShortTime(p.startedAt)} · ~${p.estimatedDurationMin} min` : undefined}
                    accent
                    onSelect={onSelectPatient}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-[#FAFAF8]">
                <p className="text-[10px] text-muted-foreground">Room is free</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 2. NEXT UP ───────────────────────────────────── */}
        {snapshot.nextPatient ? (
          <section className="bg-[#F6FBF9] px-4 py-4 sm:px-5 sm:py-5">
            <PipelineSectionHeader
              icon={ArrowDownCircleIcon}
              iconClass="bg-[#1A5345] text-white"
              title="Next up"
            />
            <div className="mt-3">
              <PipelineRow
                patient={snapshot.nextPatient}
                badge={<ArrowDownCircleIcon className="size-5 text-[#1A5345]" />}
                subline={
                  snapshot.nextPatient.status === "waiting"
                    ? `Turn #${waitingTurnByQueueId.get(snapshot.nextPatient.queueEntryId) ?? "—"} · waiting since ${snapshot.nextPatient.waitingSince ? formatShortTime(snapshot.nextPatient.waitingSince) : "—"}`
                    : snapshot.nextPatient.arrivedAt
                      ? `Arrived ${formatShortTime(snapshot.nextPatient.arrivedAt)} · needs to be moved to waiting`
                      : undefined
                }
                onSelect={onSelectPatient}
              />
            </div>
          </section>
        ) : null}

        {/* ── 3. WAITING QUEUE ─────────────────────────────── */}
        {snapshot.waitingOrdered.length > 0 && (
          <section className="px-4 py-4 sm:px-5 sm:py-5">
            <PipelineSectionHeader
              icon={UsersIcon}
              iconClass="bg-amber-100 text-amber-700"
              title="Waiting queue"
              count={snapshot.waitingOrdered.length}
              countStyle="bg-amber-50 text-amber-700"
            />
            <div className="mt-3 space-y-2">
              {snapshot.waitingOrdered.map((p) => {
                const turn = waitingTurnByQueueId.get(p.queueEntryId) ?? 0
                const isNext = snapshot.nextPatient?.queueEntryId === p.queueEntryId
                return (
                  <PipelineRow
                    key={p.queueEntryId}
                    patient={p}
                    badge={
                      <span className="text-[13px] font-extrabold leading-none text-amber-800">
                        #{turn}
                      </span>
                    }
                    subline={p.waitingSince ? `Waiting since ${formatShortTime(p.waitingSince)}` : undefined}
                    accent={isNext}
                    onSelect={onSelectPatient}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* ── 4. JUST ARRIVED ──────────────────────────────── */}
        {snapshot.arrivedOrdered.length > 0 && (
          <section className="px-4 py-4 sm:px-5 sm:py-5">
            <PipelineSectionHeader
              icon={LogInIcon}
              iconClass="bg-blue-100 text-blue-700"
              title="Just arrived"
              count={snapshot.arrivedOrdered.length}
              countStyle="bg-blue-50 text-blue-700"
            />
            <p className="mt-1 text-[9px] text-muted-foreground sm:text-[10px]">
              Move to waiting when ready to be seen.
            </p>
            <div className="mt-3 space-y-2">
              {snapshot.arrivedOrdered.map((p) => (
                <PipelineRow
                  key={p.queueEntryId}
                  patient={p}
                  badge={<LogInIcon className="size-5 text-blue-600" />}
                  subline={p.arrivedAt ? `Checked in ${formatShortTime(p.arrivedAt)}` : undefined}
                  onSelect={onSelectPatient}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. UPCOMING TODAY ────────────────────────────── */}
        {snapshot.scheduledOrdered.length > 0 && (
          <section className="px-4 py-4 sm:px-5 sm:py-5">
            <PipelineSectionHeader
              icon={CalendarDaysIcon}
              iconClass="bg-[#E8F0EE] text-[#4F6D64]"
              title="Upcoming today"
              count={snapshot.scheduledOrdered.length}
            />
            <div className="mt-3 space-y-2">
              {snapshot.scheduledOrdered.map((p) => (
                <PipelineRow
                  key={p.queueEntryId}
                  patient={p}
                  badge={
                    <span className="text-center text-[9px] font-bold leading-tight text-[#4F6D64]">
                      {formatShortTime(p.scheduledTime)}
                    </span>
                  }
                  subline={p.condition || undefined}
                  onSelect={onSelectPatient}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

/* ── LiveDeskDoctorBar (SRP: doctor identity bar with live queue timer) ── */
function LiveDeskDoctorBar({ snapshot }: { snapshot: DoctorLiveSnapshot }) {
  const allActive = [
    ...snapshot.inConsultation,
    ...snapshot.waitingOrdered,
    ...snapshot.arrivedOrdered,
  ]
  const queueStartISO =
    allActive
      .map((p) => p.waitingSince ?? p.arrivedAt)
      .filter(Boolean)
      .sort()
      .at(0) ?? null

  const elapsed = useElapsedTime(queueStartISO)

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-2.5 sm:px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#1A5345]">
          <StethoscopeIcon className="size-4 text-white" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-[#102F27] sm:text-[13px]">{snapshot.doctorName}</p>
          <p className="text-[9px] text-muted-foreground">{snapshot.department}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {snapshot.roomHints.length > 0 && (
          <span className="rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[9px] font-medium text-[#1A5345]">
            Room {snapshot.roomHints.join(", ")}
          </span>
        )}
        <span className="rounded-full bg-[#F5F5F3] px-2 py-0.5 text-[9px] ring-1 ring-[#E8E6E0]">
          {snapshot.inConsultation.length + snapshot.waitingOrdered.length + snapshot.arrivedOrdered.length} active
        </span>
        {elapsed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#1A5345]/10 px-2 py-0.5 text-[9px] font-medium tabular-nums text-[#1A5345]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#1A5345]" />
            {elapsed}
          </span>
        )}
      </div>
    </div>
  )
}

function LiveDeskPanel({
  snapshots,
  waitingTurnByQueueId,
  liveBoardLoading,
  onSelectPatient,
}: {
  snapshots: DoctorLiveSnapshot[]
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onSelectPatient: (id: string) => void
}) {
  const snapshot = snapshots[0] ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Doctor identity bar */}
      {snapshot && (
        <LiveDeskDoctorBar snapshot={snapshot} />
      )}
      <SingleDoctorLivePipeline
        snapshot={snapshot}
        waitingTurnByQueueId={waitingTurnByQueueId}
        liveBoardLoading={liveBoardLoading}
        onSelectPatient={onSelectPatient}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Expected today right panel (scheduled, not arrived)                    */
/* ─────────────────────────────────────────────────────────────────────── */

function ExpectedTodayPanel({
  patients,
  onSelectPatient,
}: {
  patients: QueuePatient[]
  onSelectPatient: (id: string) => void
}) {
  if (patients.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
          <CalendarDaysIcon className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">All expected patients have arrived</p>
        <p className="mt-1 text-[9px] text-muted-foreground">No pending scheduled arrivals remaining for today.</p>
      </div>
    )
  }

  const byDoctor = patients.reduce<Record<string, QueuePatient[]>>((acc, p) => {
    const key = p.assignedDoctor
    acc[key] = acc[key] ?? []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <div className="space-y-4">
        {Object.entries(byDoctor).map(([doctor, list]) => (
          <div key={doctor}>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-[#1A5345]">
                <StethoscopeIcon className="size-3 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#102F27]">{doctor}</span>
              <span className="rounded-full bg-[#E8F0EE] px-1.5 py-0.5 text-[8px] font-medium text-[#1A5345]">{list.length}</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-[#E8E6E0] ml-3">
              {list.map((p) => {
                const visitCfg = VISIT_TYPE_CONFIG[p.visitType] ?? { label: p.visitType, style: "bg-gray-50 text-gray-600" }
                return (
                  <button
                    key={p.queueEntryId}
                    type="button"
                    onClick={() => onSelectPatient(p.queueEntryId)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-[#E5EEEA] bg-white p-2.5 text-left transition-colors hover:border-[#A8C4BC] hover:bg-[#F6FBF9]"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
                      <UserRoundIcon className="size-4 text-[#1A5345]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-[#102F27]">{p.fullName}</span>
                        <span className="shrink-0 rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[9px] font-medium text-[#1A5345]">
                          {formatShortTime(p.scheduledTime)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                        <span className={cn("rounded-full px-1.5 py-0.5 font-medium", visitCfg.style)}>{visitCfg.label}</span>
                        {p.condition && <span className="truncate">{p.condition}</span>}
                        {p.priority !== "normal" && (
                          <span className={cn("rounded-full px-1.5 py-0.5 font-medium", PRIORITY_CONFIG[p.priority].style)}>
                            {PRIORITY_CONFIG[p.priority].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Past visits right panel (completed + no-show)                          */
/* ─────────────────────────────────────────────────────────────────────── */

function PastVisitsPanel({
  patients,
  onSelectPatient,
}: {
  patients: QueuePatient[]
  onSelectPatient: (id: string) => void
}) {
  if (patients.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
          <HistoryIcon className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">No past visits yet today</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Completed and no-show visits will appear here.</p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <div className="space-y-2">
        {patients.map((p) => {
          const isCompleted = p.status === "completed"
          const duration = p.startedAt && p.completedAt
            ? Math.round((Date.parse(p.completedAt) - Date.parse(p.startedAt)) / 60000)
            : null
          return (
            <button
              key={p.queueEntryId}
              type="button"
              onClick={() => onSelectPatient(p.queueEntryId)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-white p-3 text-left transition-colors hover:border-[#A8C4BC] hover:bg-[#FAFAF8]"
            >
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full",
                isCompleted ? "bg-emerald-50" : "bg-red-50",
              )}>
                {isCompleted
                  ? <CheckCircle2Icon className="size-4 text-emerald-600" />
                  : <XCircleIcon className="size-4 text-red-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-[#102F27]">{p.fullName}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <StethoscopeIcon className="size-2.5" />{p.assignedDoctor}
                  </span>
                  {p.scheduledTime && (
                    <span className="flex items-center gap-0.5">
                      <ClockIcon className="size-2.5" />{formatShortTime(p.scheduledTime)}
                    </span>
                  )}
                  {duration != null && (
                    <span className="flex items-center gap-0.5">
                      <TimerIcon className="size-2.5" />{duration} min
                    </span>
                  )}
                  {p.condition && <span className="truncate max-w-[160px]">{p.condition}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Doctors check-in panel (fourth tab)                                     */
/*  SOLID: each sub-component has one responsibility; state lives only in   */
/*  DoctorsCheckInPanel; presentational components receive all data via     */
/*  props (DIP). Pure helpers are module-level functions (SRP).             */
/* ─────────────────────────────────────────────────────────────────────── */

/* ── Types ── */
type DoctorQueueState = "idle" | "checkedIn" | "scheduled" | "active" | "paused"

type DoctorStatus = {
  id: string
  name: string
  department: string
  room: string
  checkedInAt: string | null
  queueStartAt: string | null
  isPaused: boolean
  pausedAt: string | null
}

/* ── useElapsedTime hook (SRP: timer logic only) ── */
function useElapsedTime(startISO: string | null): string | null {
  const [elapsed, setElapsed] = useState<string | null>(null)

  useEffect(() => {
    if (!startISO) { setElapsed(null); return }
    const compute = () => {
      const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000)
      if (diff < 0) { setElapsed(null); return }
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m`
          : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
      )
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [startISO])

  return elapsed
}

/* ── Pure helpers (no side effects, no state) ── */
function getDoctorQueueState(doc: DoctorStatus): DoctorQueueState {
  if (!doc.checkedInAt) return "idle"
  if (doc.isPaused) return "paused"
  if (doc.queueStartAt && new Date() >= new Date(doc.queueStartAt)) return "active"
  if (doc.queueStartAt) return "scheduled"
  return "checkedIn"
}

function isoToTimeValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function formatBreakDuration(pausedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(pausedAt).getTime()) / 60000)
  return diff < 1 ? "just now" : `${diff} min ago`
}

/* ── DoctorStateChip (SRP: renders only the status badge) ── */
const STATE_CHIP: Record<DoctorQueueState, { label: string; style: string; pulse?: boolean }> = {
  idle:      { label: "Not arrived",     style: "bg-[#F5F5F3] text-[#9CA3AF]" },
  checkedIn: { label: "Arrived",         style: "bg-blue-50 text-blue-600" },
  scheduled: { label: "Queue scheduled", style: "bg-amber-50 text-amber-700" },
  active:    { label: "Queue active",    style: "bg-[#E8F0EE] text-[#1A5345]", pulse: true },
  paused:    { label: "On break",        style: "bg-orange-50 text-orange-600" },
}

function DoctorStateChip({ state }: { state: DoctorQueueState }) {
  const cfg = STATE_CHIP[state]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium", cfg.style)}>
      {cfg.pulse && <span className="size-1.5 animate-pulse rounded-full bg-[#1A5345]" />}
      {cfg.label}
    </span>
  )
}

/* ── DoctorAvatar (SRP: renders only the icon circle) ── */
function DoctorAvatar({ state }: { state: DoctorQueueState }) {
  const styles: Record<DoctorQueueState, { bg: string; icon: React.ElementType; iconCls: string }> = {
    idle:      { bg: "bg-[#F0F0EE]",  icon: StethoscopeIcon, iconCls: "text-[#B0B7B3]" },
    checkedIn: { bg: "bg-blue-50",    icon: StethoscopeIcon, iconCls: "text-blue-500" },
    scheduled: { bg: "bg-amber-50",   icon: ClockIcon,       iconCls: "text-amber-500" },
    active:    { bg: "bg-[#1A5345]",  icon: StethoscopeIcon, iconCls: "text-white" },
    paused:    { bg: "bg-orange-100", icon: PauseCircleIcon, iconCls: "text-orange-500" },
  }
  const { bg, icon: Icon, iconCls } = styles[state]
  return (
    <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", bg)}>
      <Icon className={cn("size-5", iconCls)} />
    </div>
  )
}

/* ── QueueTimeRow (SRP: only the time-picker + Start now row) ── */
function QueueTimeRow({
  doctorId,
  queueStartAt,
  isDisabled,
  onSetTime,
  onStartNow,
}: {
  doctorId: string
  queueStartAt: string | null
  isDisabled: boolean
  onSetTime: (id: string, time: string) => void
  onStartNow: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[#E8E6E0] pt-3">
      <span className="text-[9px] font-medium text-[#6B7870]">Queue starts at</span>
      <input
        type="time"
        value={isoToTimeValue(queueStartAt)}
        onChange={(e) => onSetTime(doctorId, e.target.value)}
        disabled={isDisabled}
        className={cn(
          "h-7 rounded-lg border border-[#E5EEEA] px-2 text-[11px] focus:border-[#1A5345] focus:outline-none",
          isDisabled ? "bg-[#F5F5F3] text-[#B0B7B3]" : "bg-white text-[#102F27]",
        )}
      />
      <button
        type="button"
        onClick={() => onStartNow(doctorId)}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-medium transition-all",
          isDisabled
            ? "cursor-not-allowed text-[#B0B7B3]"
            : "bg-[#1A5345]/10 text-[#1A5345] hover:bg-[#1A5345]/20",
        )}
      >
        <PlayCircleIcon className="size-3" />
        Start now
      </button>
    </div>
  )
}

/* ── DoctorActions (SRP: only the check-in + pause buttons) ── */
function DoctorActions({
  doctorId,
  state,
  onCheckIn,
  onTogglePause,
}: {
  doctorId: string
  state: DoctorQueueState
  onCheckIn: (id: string) => void
  onTogglePause: (id: string) => void
}) {
  const showPause = state === "active" || state === "paused"
  const isCheckedIn = state !== "idle"
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {showPause && (
        <button
          type="button"
          onClick={() => onTogglePause(doctorId)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all",
            state === "paused"
              ? "bg-[#1A5345] text-white hover:bg-[#0F3D32]"
              : "bg-orange-50 text-orange-600 hover:bg-orange-100",
          )}
        >
          {state === "paused"
            ? <><PlayCircleIcon className="size-3.5" /><span className="hidden sm:inline">Resume</span></>
            : <><PauseCircleIcon className="size-3.5" /><span className="hidden sm:inline">Pause</span></>}
        </button>
      )}
      <button
        type="button"
        onClick={() => onCheckIn(doctorId)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all",
          isCheckedIn
            ? "bg-[#F5F5F3] text-[#6B7870] hover:bg-red-50 hover:text-red-600"
            : "bg-[#1A5345] text-white hover:bg-[#0F3D32]",
        )}
      >
        {isCheckedIn
          ? <><XIcon className="size-3.5" /><span className="hidden sm:inline">Undo</span></>
          : <><LogInIcon className="size-3.5" /><span className="hidden sm:inline">Check in</span></>}
      </button>
    </div>
  )
}

/* ── DoctorAttendanceCard V3: modern dashboard card ── */
const STATUS_THEME: Record<DoctorQueueState, { bg: string; text: string; accent: string; icon: React.ElementType }> = {
  idle:      { bg: "bg-white",               text: "text-[#102F27]",         accent: "bg-[#E8E6E0]", icon: StethoscopeIcon },
  checkedIn: { bg: "bg-blue-50/30",         text: "text-blue-700",          accent: "bg-blue-500",  icon: LogInIcon },
  scheduled: { bg: "bg-amber-50/30",        text: "text-amber-700",         accent: "bg-amber-500", icon: ClockIcon },
  active:    { bg: "bg-[#1A5345]/5",        text: "text-[#1A5345]",         accent: "bg-[#1A5345]", icon: PlayCircleIcon },
  paused:    { bg: "bg-orange-50/30",       text: "text-orange-700",        accent: "bg-orange-500", icon: PauseCircleIcon },
}

function DoctorAttendanceCard({
  doc,
  onCheckIn,
  onTogglePause,
  onSetTime,
  onStartNow,
}: {
  doc: DoctorStatus
  onCheckIn: (id: string) => void
  onTogglePause: (id: string) => void
  onSetTime: (id: string, time: string) => void
  onStartNow: (id: string) => void
}) {
  const state = getDoctorQueueState(doc)
  const isCheckedIn = state !== "idle"
  const elapsed = useElapsedTime((state === "active" || state === "paused") ? doc.queueStartAt : null)
  const theme = STATUS_THEME[state]
  const Icon = theme.icon

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border transition-all", theme.bg,
      state === "idle" ? "border-[#E8E6E0]" :
      state === "checkedIn" ? "border-blue-200" :
      state === "scheduled" ? "border-amber-200" :
      state === "active" ? "border-[#1A5345]/20" :
      "border-orange-200"
    )}>
      {/* Left accent strip */}
      <div className={cn("absolute left-0 top-0 h-full w-1", theme.accent)} />

      <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Doctor info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm",
            state === "idle" ? "text-[#9CA3AF]" :
            state === "checkedIn" ? "text-blue-500" :
            state === "scheduled" ? "text-amber-500" :
            state === "active" ? "text-[#1A5345]" :
            "text-orange-500"
          )}>
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#102F27]">{doc.name}</p>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7870]">
              <span>{doc.department}</span>
              <span className="text-[#E8E6E0]">·</span>
              <span className="rounded-md bg-[#F5F5F3] px-1.5 py-0.5 text-[10px] font-medium text-[#4F6D64]">Room {doc.room}</span>
            </div>
            {/* Center: Queue time + elapsed */}
            <div className="mt-2 flex items-center gap-3">
              {doc.queueStartAt ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <ClockIcon className="size-3.5 text-[#9CA3AF]" />
                  <span className="text-[#6B7870]">Starts</span>
                  <span className="font-semibold text-[#102F27]">{formatShortTime(doc.queueStartAt)}</span>
                </div>
              ) : isCheckedIn ? (
                <span className="text-[10px] text-[#9CA3AF]">Queue not set</span>
              ) : null}

              {elapsed && (
                <div className="flex items-center gap-1.5 rounded-full bg-[#1A5345]/10 px-2 py-0.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#1A5345]" />
                  <span className="text-[10px] tabular-nums font-medium text-[#1A5345]">{elapsed}</span>
                </div>
              )}

              {state === "paused" && doc.pausedAt && (
                <div className="flex items-center gap-1 text-[10px] text-orange-600">
                  <PauseCircleIcon className="size-3" />
                  <span>Paused {formatBreakDuration(doc.pausedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-2 sm:items-end">
          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {(state === "active" || state === "paused") && (
              <button
                type="button"
                onClick={() => onTogglePause(doc.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-all",
                  state === "paused"
                    ? "bg-[#1A5345] text-white hover:bg-[#0F3D32]"
                    : "bg-white border border-orange-200 text-orange-600 hover:bg-orange-50"
                )}
              >
                {state === "paused" ? <PlayCircleIcon className="size-4" /> : <PauseCircleIcon className="size-4" />}
                {state === "paused" ? "Resume" : "Pause"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onCheckIn(doc.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-all",
                isCheckedIn
                  ? "border border-[#E5EEEA] bg-white text-[#6B7870] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  : "bg-[#1A5345] text-white hover:bg-[#0F3D32]"
              )}
            >
              {isCheckedIn ? <XIcon className="size-4" /> : <LogInIcon className="size-4" />}
              {isCheckedIn ? "Undo" : "Check in"}
            </button>
          </div>

          {/* Time control - bottom row */}
          {isCheckedIn && (
            <div className="mt-2 flex items-center justify-center gap-2 border-t border-[#E8E6E0]/60 pt-2">
              <span className="text-[10px] text-[#6B7870]">Set queue</span>
              <input
                type="time"
                value={isoToTimeValue(doc.queueStartAt)}
                onChange={(e) => onSetTime(doc.id, e.target.value)}
                disabled={state === "paused"}
                className={cn(
                  "h-7 rounded-lg border px-2 text-[11px] focus:border-[#1A5345] focus:outline-none",
                  state === "paused"
                    ? "border-[#E8E6E0] bg-[#F5F5F3] text-[#B0B7B3]"
                    : "border-[#E5EEEA] bg-white text-[#102F27]"
                )}
              />
              <span className="text-[#E8E6E0]">|</span>
              <button
                type="button"
                onClick={() => onStartNow(doc.id)}
                disabled={state === "paused"}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all",
                  state === "paused"
                    ? "text-[#B0B7B3]"
                    : "text-[#1A5345] hover:bg-[#1A5345]/10"
                )}
              >
                <PlayCircleIcon className="size-3" />
                Start now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── DoctorsCheckInPanel (container: state + handlers only, no UI logic) ── */
function DoctorsCheckInPanel() {
  const [doctors, setDoctors] = useState<DoctorStatus[]>([
    { id: "1", name: "Dr. Ahmed Hassan", department: "Cardiology",       room: "102",  checkedInAt: null,                   queueStartAt: null,                   isPaused: false, pausedAt: null },
    { id: "2", name: "Dr. Sarah Khairy", department: "Internal Medicine", room: "105",  checkedInAt: null,                   queueStartAt: null,                   isPaused: false, pausedAt: null },
    { id: "3", name: "Dr. Mohamed Ali",  department: "Emergency",         room: "ER-1", checkedInAt: "2026-05-07T08:30:00Z", queueStartAt: "2026-05-07T08:30:00Z", isPaused: false, pausedAt: null },
  ])

  const handleCheckIn = (id: string) =>
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : {
      ...d,
      checkedInAt:  d.checkedInAt ? null : new Date().toISOString(),
      queueStartAt: d.checkedInAt ? null : d.queueStartAt,
      isPaused: false,
      pausedAt: null,
    }))

  const handleTogglePause = (id: string) =>
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : {
      ...d,
      isPaused: !d.isPaused,
      pausedAt: d.isPaused ? null : new Date().toISOString(),
    }))

  const handleSetTime = (id: string, timeValue: string) => {
    if (!timeValue) {
      setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: null }))
      return
    }
    const [h, m] = timeValue.split(":")
    const now = new Date()
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h!), parseInt(m!))
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: date.toISOString() }))
  }

  const handleStartNow = (id: string) =>
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: new Date().toISOString() }))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <div className="space-y-2.5">
        {doctors.map((doc) => (
          <DoctorAttendanceCard
            key={doc.id}
            doc={doc}
            onCheckIn={handleCheckIn}
            onTogglePause={handleTogglePause}
            onSetTime={handleSetTime}
            onStartNow={handleStartNow}
          />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Empty state when no patient is selected (only shown on md+ when not    */
/*  Live desk mode)                                                         */
/* ─────────────────────────────────────────────────────────────────────── */

function SelectPatientPlaceholder() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
        <UserRoundIcon className="size-6 text-[#9CA3AF]" />
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">Select a patient</p>
      <p className="mt-1 max-w-[200px] text-[9px] text-muted-foreground">
        Choose a patient from the list to view details and take action.
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Patient detail view (right panel when patient is selected)             */
/* ─────────────────────────────────────────────────────────────────────── */

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
  const priorityCfg = PRIORITY_CONFIG[patient.priority]
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }

  const steps = [
    { key: "scheduled",    done: true,                label: "Scheduled" },
    { key: "arrived",      done: !!patient.arrivedAt, label: "Arrived" },
    { key: "waiting",      done: !!patient.waitingSince, label: "Waiting" },
    { key: "consultation", done: !!patient.startedAt, label: "Consult." },
    { key: "done",         done: !!patient.completedAt, label: "Done" },
  ]
  const currentIdx = steps.findLastIndex((s) => s.done)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Header — avatar + name + status (single source of truth) */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[#E8E6E0] px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345] md:hidden"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE]">
          <UserRoundIcon className="size-4.5 text-[#1A5345]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-bold text-[#102F27] sm:text-[13px]">{patient.fullName}</h3>
          <p className="text-[9px] text-muted-foreground">{patient.age}y · <span className="capitalize">{patient.gender}</span> · {patient.condition}</p>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {patient.priority !== "normal" && (
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", priorityCfg.style)}>{priorityCfg.label}</span>
          )}
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", visitCfg.style)}>
            {VISIT_TYPE_CONFIG[patient.visitType]?.label ?? patient.visitType}
          </span>
          {patient.hasAllergies && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600">
              <ShieldAlertIcon className="size-2.5" />Allergies
            </span>
          )}
          {patient.vitalAlerts > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-600">
              <AlertTriangleIcon className="size-2.5" />{patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Doctor */}
        <div className="rounded-lg border border-[#E5EEEA] bg-[#F6FBF9] p-2.5 sm:p-3">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Assigned Doctor</p>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#1A5345]">
              <StethoscopeIcon className="size-3.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#102F27]">{patient.assignedDoctor}</p>
              <p className="text-[9px] text-muted-foreground">{patient.assignedDoctorDepartment}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="mb-3 text-[9px] uppercase tracking-wider text-muted-foreground">Progress</p>
          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div className="flex flex-1 justify-end">
                    {idx > 0 && <div className={cn("h-px w-full", step.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />}
                  </div>
                  <div
                    className={cn(
                      "mx-2 size-2.5 shrink-0 rounded-full",
                      idx === currentIdx && !patient.completedAt
                        ? "bg-[#1A5345] ring-2 ring-[#1A5345]/20"
                        : step.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]",
                    )}
                  />
                  <div className="flex flex-1 justify-start">
                    {idx < steps.length - 1 && (
                      <div className={cn("h-px w-full", step.done && steps[idx + 1]?.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
                    )}
                  </div>
                </div>
                <span className="mt-2 text-center text-[8px] text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {patient.scheduledTime && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground">Scheduled</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E]">{formatShortTime(patient.scheduledTime)}</p>
            </div>
          )}
          {patient.arrivedAt && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground">Arrived</p>
              <p className="mt-0.5 text-[11px] font-medium text-blue-600">{formatShortTime(patient.arrivedAt)}</p>
            </div>
          )}
          {patient.roomNumber && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground">Room</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E]">{patient.roomNumber}</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
            <p className="text-[9px] text-muted-foreground">Est. Duration</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E]">~{patient.estimatedDurationMin} min</p>
          </div>
          {patient.activeMedications > 0 && (
            <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
              <p className="text-[9px] text-muted-foreground">Medications</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E]">{patient.activeMedications} active Rx</p>
            </div>
          )}
          <div className="rounded-lg border border-[#E8E6E0] p-2 sm:p-2.5">
            <p className="text-[9px] text-muted-foreground">Phone</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#1A1F1E]">{patient.phoneNumber}</p>
          </div>
        </div>

        <PatientStudiesUploadSection queueEntryId={patient.queueEntryId} />

        {patient.notes && (
          <div className="rounded-lg bg-[#FAFAF8] p-2.5 sm:p-3">
            <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">Notes</p>
            <p className="text-[10px] text-[#1A1F1E] sm:text-[11px]">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {patient.status !== "completed" && patient.status !== "cancelled" && patient.status !== "in-consultation" && (
        <div className="shrink-0 border-t border-[#E8E6E0] p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            {patient.status === "scheduled" && (
              <>
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-blue-600 text-[10px] hover:bg-blue-700 sm:text-[11px]"
                  onClick={() => onMarkArrived(patient.queueEntryId)}
                >
                  <LogInIcon className="size-3.5" />Mark as Arrived
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700 sm:text-[11px]"
                  onClick={() => onNoShow(patient.queueEntryId)}
                >
                  <XCircleIcon className="size-3.5" />No Show
                </Button>
              </>
            )}
            {patient.status === "arrived" && (
              <Button
                size="sm"
                className="w-full gap-1.5 bg-amber-600 text-[10px] hover:bg-amber-700 sm:text-[11px]"
                onClick={() => onMoveToWaiting(patient.queueEntryId)}
              >
                <ClockIcon className="size-3.5" />Move to Waiting
              </Button>
            )}
            {patient.status === "waiting" && (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#EEF5F3] px-3 py-2 text-[10px] text-[#1A5345]">
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
                <LogInIcon className="size-3.5" />Patient Arrived Late
              </Button>
            )}
          </div>
        </div>
      )}
      {patient.status === "in-consultation" && (
        <div className="shrink-0 border-t border-[#E8E6E0] p-3 sm:p-4">
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#E8F0EE] px-3 py-2 text-[10px] text-[#1A5345]">
            <StethoscopeIcon className="size-3.5" />
            Currently with {patient.assignedDoctor}
            <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-[#1A5345]" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Props + main component                                                  */
/* ─────────────────────────────────────────────────────────────────────── */

export type AssistantQueueProps = {
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
  doctorLiveSnapshots: DoctorLiveSnapshot[]
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onMarkArrived: (queueEntryId: string) => void
  onMoveToWaiting: (queueEntryId: string) => void
  onNoShow: (queueEntryId: string) => void
  isLoading?: boolean
  isError?: boolean
  queueNavMode: QueueNavMode
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
  inClinicPatients: _inClinicPatients,
  doctorLiveSnapshots,
  waitingTurnByQueueId,
  liveBoardLoading,
  onMarkArrived,
  onMoveToWaiting,
  onNoShow,
  isLoading,
  isError,
  queueNavMode,
}: AssistantQueueProps) {

  if (isLoading) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[11px] text-muted-foreground">Loading queue…</p>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangleIcon className="size-8 text-red-400" />
          <p className="text-[11px] text-red-600">Failed to load patient queue.</p>
        </div>
      </main>
    )
  }

  /* Left panel filter tabs per mode */
  const filterTabSets: Record<QueueNavMode, { key: QueueFilter; label: string; short: string; count: number }[]> = {
    operations: [
      { key: "active",    label: "Active",           short: "Active",   count: tabCounts.active },
      { key: "scheduled", label: "Not Yet Arrived",  short: "Pending",  count: tabCounts.scheduled },
      { key: "completed", label: "Completed",        short: "Done",     count: tabCounts.completed },
      { key: "no-show",   label: "No Show",          short: "No Show",  count: tabCounts["no-show"] },
    ],
    schedule: [
      { key: "scheduled", label: "Scheduled today",  short: "Today",    count: tabCounts.scheduled },
    ],
    history: [
      { key: "completed", label: "Completed",        short: "Done",     count: tabCounts.completed },
      { key: "no-show",   label: "No Show",          short: "No Show",  count: tabCounts["no-show"] },
    ],
    doctors: [],
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#F9F8F5]">

      {/* ── sticky top: only the pill nav ─────────────────────────── */}
      <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-4 border-b border-[#E8E6E0] bg-[#F9F8F5]/95 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1A5345]">
            <UsersIcon className="size-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-[#102F27]">Patient Queue</p>
            <p className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date())}</p>
          </div>
        </div>


        <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:flex">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* ── stats grid ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-[#E8E6E0] bg-[#FAFAF8] overflow-x-auto sm:overflow-visible">
        <div className="flex min-w-max divide-x divide-[#E8E6E0] sm:grid sm:min-w-0 sm:grid-cols-7">
          <StatCell icon={UsersIcon}          iconStyle="bg-[#1A5345]"        value={stats.totalToday}       label="Total today" />
          <StatCell icon={PlayCircleIcon}     iconStyle="bg-[#0F3D32]"        value={stats.inConsultation}   label="In consult." />
          <StatCell icon={ClockIcon}          iconStyle="bg-amber-600"        value={stats.inWaiting}        label="Waiting" />
          <StatCell icon={LogInIcon}          iconStyle="bg-[#C07818]"        value={stats.arrived}          label="Arrived" />
          <StatCell icon={CalendarDaysIcon}   iconStyle="bg-[#4F6D64]"        value={stats.scheduled}        label="Scheduled" />
          <StatCell icon={CheckCircle2Icon}   iconStyle="bg-[#8A6230]"        value={stats.completed}        label="Completed" />
          <StatCell icon={TimerIcon}          iconStyle="bg-[#4F6D64]"        value={`${stats.avgWaitMin}m`} label="Avg wait" />
        </div>
      </div>

      {/* ── main split: left list | right content ─────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* LEFT — queue list sidebar (hidden in doctors mode) */}
        <div
          className={cn(
            "flex flex-col overflow-hidden border-r border-[#E8E6E0] bg-[#FAFAF8]",
            "w-full md:w-[300px] md:shrink-0",
            queueNavMode === "doctors" ? "hidden"
              : selectedPatient ? "hidden md:flex"
              : "",
          )}
        >
          {/* search */}
          <div className="shrink-0 space-y-2.5 border-b border-[#E8E6E0] p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, doctor…"
                className="h-8 border-[#E8E6E0] bg-white pl-8 text-[11px] placeholder:text-[#9CA3AF]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* patient rows */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((p, idx) => (
                  <QueueRow
                    key={p.queueEntryId}
                    patient={p}
                    position={idx}
                    waitingTurn={p.status === "waiting" ? (waitingTurnByQueueId.get(p.queueEntryId) ?? null) : null}
                    isSelected={selectedPatient?.queueEntryId === p.queueEntryId}
                    onSelect={() => selectPatient(p.queueEntryId)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8">
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#F5F5F3]">
                  <UsersIcon className="size-5 text-[#9CA3AF]" />
                </div>
                <p className="px-3 text-center text-[10px] text-[#6B7870]">
                  {queueNavMode === "schedule" ? "No pending arrivals." : "No patients in this category."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — content panel */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            selectedPatient ? "flex" : "hidden md:flex",
          )}
        >
          {selectedPatient ? (
            <PatientDetailView
              patient={selectedPatient}
              onBack={clearSelection}
              onMarkArrived={onMarkArrived}
              onMoveToWaiting={onMoveToWaiting}
              onNoShow={onNoShow}
            />
          ) : queueNavMode === "operations" ? (
            <LiveDeskPanel
              snapshots={doctorLiveSnapshots}
              waitingTurnByQueueId={waitingTurnByQueueId}
              liveBoardLoading={liveBoardLoading}
              onSelectPatient={(id) => selectPatient(id)}
            />
          ) : queueNavMode === "schedule" ? (
            <ExpectedTodayPanel
              patients={patients.filter((p) => p.status === "scheduled")}
              onSelectPatient={(id) => selectPatient(id)}
            />
          ) : queueNavMode === "history" ? (
            <PastVisitsPanel
              patients={patients}
              onSelectPatient={(id) => selectPatient(id)}
            />
          ) : queueNavMode === "doctors" ? (
            <DoctorsCheckInPanel />
          ) : (
            <SelectPatientPlaceholder />
          )}
        </div>
      </div>
    </main>
  )
}
