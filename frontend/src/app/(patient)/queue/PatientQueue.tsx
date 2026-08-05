"use client"

import Link from "next/link"
import { useMemo } from "react"

import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import {
  ArmchairIcon,
  ArrowRightIcon,
  BellIcon,
  BriefcaseMedicalIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  HeartPulseIcon,
  InfoIcon,
  ListOrderedIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  FilePenLineIcon,
  RefreshCwIcon,
  RouteIcon,
  ScanLineIcon,
  ShieldIcon,
  StethoscopeIcon,
  TicketIcon,
  TimerIcon,
  UserRoundCheckIcon,
  UsersIcon,
} from "lucide-react"

import type {
  PatientQueueInstruction,
  PatientQueueInstructionIcon,
  PatientQueuePageContext,
  PatientQueueVisit,
  PatientVisitStage,
  PatientVisitStageStatus,
} from "./patientQueue.types"
import {
  aheadThresholdAppliesNow,
  estimateWaitAtAheadThreshold,
  formatApproxCallTime,
  formatQueueWaitMinutes,
  getQueueSlotMinutes,
} from "./patientQueue.utils"
import {
  PATIENT_QUEUE_ALERT_AHEAD_MAX,
  PATIENT_QUEUE_ALERT_AHEAD_MIN,
  usePatientQueueAlertThreshold,
} from "./usePatientQueueAlertThreshold"
import {
  queueScrollbarCss,
  queuePrimaryButtonClassName,
  queueOutlineButtonClassName,
  queueSelectTriggerClassName,
  QueuePanel,
  QueueProfileAvatar,
  QueueStatCell,
} from "./patientQueue.shared"

function resolvePageContext(
  page: PatientQueuePageContext | null | undefined,
  visit: PatientQueueVisit,
): PatientQueuePageContext {
  return (
    page ?? {
      clinicName: "ICARE-CVD",
      departmentLabel: visit.department,
      fileNumber: "—",
      genderLabel: "—",
      age: 0,
    }
  )
}

function formatIsoTime(iso: string | null, short: boolean) {
  if (!iso) return "—"
  const d = new Date(iso)
  return short
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function formatTodayHeaderDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function InstructionIcon({ kind }: { kind: PatientQueueInstructionIcon }) {
  let IconComponent = InfoIcon
  switch (kind) {
    case "shield": IconComponent = ShieldIcon; break;
    case "file": IconComponent = FileTextIcon; break;
    case "clock": IconComponent = ClockIcon; break;
    case "heart": IconComponent = HeartPulseIcon; break;
  }
  
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F4F3EF] border border-[#E8E6E0]/60 shadow-sm">
      <IconComponent className="size-4.5 sm:size-5 text-[#1A5345]" strokeWidth={2} />
    </div>
  )
}

type TicketStripKind = "cancelled" | "completed" | "calling" | "waiting" | "yours" | "queued"

function ticketStripVisual(
  n: number,
  nowCalling: number,
  yourTurn: number,
  cancelled: readonly number[],
): { kind: TicketStripKind; label: string } {
  if (cancelled.includes(n)) {
    return { kind: "cancelled", label: "Cancelled" }
  }
  if (n < nowCalling) {
    return { kind: "completed", label: "Finished" }
  }
  if (n === nowCalling) {
    return { kind: "calling", label: "Calling now" }
  }
  if (n > nowCalling && n < yourTurn) {
    return { kind: "waiting", label: "Waiting here" }
  }
  if (n === yourTurn) {
    return { kind: "yours", label: "Your ticket" }
  }
  return { kind: "queued", label: "Queued" }
}

const TICKET_STRIP_CIRCLE: Record<TicketStripKind, string> = {
  cancelled: "border border-rose-200 bg-rose-50/50 opacity-70",
  completed: "border border-[#E8E6E0] bg-[#F4F3EF] opacity-60",
  calling: "border-2 border-[#1A5345] bg-[#1A5345] shadow-[0_4px_12px_rgba(26,83,69,0.25)]",
  waiting: "border border-[#E8E6E0] bg-white shadow-sm",
  yours: "border-2 border-[#1A5345] bg-[#F9F8F5] shadow-md ring-4 ring-[#1A5345]/10",
  queued: "border border-dashed border-[#E8E6E0] bg-transparent opacity-60",
}

const TICKET_STRIP_NUMBER: Record<TicketStripKind, string> = {
  cancelled: "text-rose-600 line-through decoration-rose-300",
  completed: "text-muted-foreground",
  calling: "text-white font-serif text-[18px] sm:text-[20px]",
  waiting: "text-[#1A1F1E]",
  yours: "text-[#1A5345] font-serif text-[18px] sm:text-[20px]",
  queued: "text-muted-foreground",
}

const TICKET_STRIP_LABEL: Record<TicketStripKind, string> = {
  cancelled: "text-rose-600 font-semibold",
  completed: "text-muted-foreground font-medium",
  calling: "text-[#1A5345] font-bold",
  waiting: "text-[#6B7870] font-medium",
  yours: "text-[#1A5345] font-bold",
  queued: "text-muted-foreground font-medium",
}

function QueueTicketStrip({
  nowCalling,
  yourTurn,
  cancelledTicketNumbers = [],
}: {
  nowCalling: number
  yourTurn: number
  cancelledTicketNumbers?: readonly number[]
}) {
  const cancelled = cancelledTicketNumbers
  const start = Math.min(nowCalling, yourTurn)
  const end = Math.max(yourTurn + 2, nowCalling + 3)
  const tickets: number[] = []
  for (let n = start; n <= end; n++) tickets.push(n)

  return (
    <div className="flex min-h-[88px] items-end gap-3 overflow-x-auto pb-1 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:min-h-[96px] sm:gap-4">
      {tickets.map((n) => {
        const v = ticketStripVisual(n, nowCalling, yourTurn, cancelled)
        const circleClass = TICKET_STRIP_CIRCLE[v.kind]
        const showCallingPulse = v.kind === "calling"

        return (
          <div
            key={n}
            className="flex w-[68px] shrink-0 flex-col items-center gap-2 sm:w-[72px]"
            aria-label={`Ticket ${n}, ${v.label}`}
          >
            <div
              className={cn(
                "relative flex size-14 items-center justify-center rounded-full text-[15px] font-bold tabular-nums transition-colors sm:size-16 sm:text-[16px]",
                circleClass,
              )}
              aria-current={v.kind === "yours" ? "step" : undefined}
            >
              <span className={cn("tabular-nums", TICKET_STRIP_NUMBER[v.kind])}>{n}</span>
              {showCallingPulse ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[#1A5345] shadow-sm ring-2 ring-[#1A5345]/20">
                  <CheckIcon className="size-3 sm:size-3.5" aria-hidden />
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "max-w-[68px] text-center text-[11px] font-bold leading-tight sm:max-w-[72px] sm:text-[12px]",
                TICKET_STRIP_LABEL[v.kind],
              )}
            >
              {v.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function resolveStageIcon(stage: Pick<PatientVisitStage, "id" | "title">): LucideIcon {
  const key = `${stage.id} ${stage.title}`.toLowerCase()

  if (key.includes("check-in") || key.includes("check in") || key.includes("reception")) {
    return UserRoundCheckIcon
  }
  if (key.includes("lab") || key.includes("imaging") || key.includes("test") || key.includes("scan")) {
    return ScanLineIcon
  }
  if (key.includes("wait") || key.includes("queue") || key.includes("lounge")) {
    return ArmchairIcon
  }
  if (key.includes("exam") || key.includes("consult") || key.includes("consultation")) {
    return BriefcaseMedicalIcon
  }
  if (key.includes("prescription") || key.includes("rx") || key.includes("medication")) {
    return FilePenLineIcon
  }

  return RouteIcon
}

function StageStepNode({ stage }: { stage: PatientVisitStage }) {
  const Icon = resolveStageIcon(stage)

  if (stage.status === "done") {
    return (
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A5345] text-white shadow-sm"
        aria-label={`${stage.title}: completed`}
      >
        <Icon className="size-4 sm:size-[18px]" strokeWidth={2.25} aria-hidden />
      </div>
    )
  }

  if (stage.status === "in-progress") {
    return (
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-4 ring-amber-500/15"
        aria-label={`${stage.title}: in progress`}
      >
        <Icon className="size-4 sm:size-[18px]" strokeWidth={2.25} aria-hidden />
      </div>
    )
  }

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E8E6E0] bg-[#F4F3EF] text-[#9CA3AF]"
      aria-label={`${stage.title}: pending`}
    >
      <Icon className="size-4 sm:size-[18px]" strokeWidth={2} aria-hidden />
    </div>
  )
}

function StageConnector({ completed }: { completed: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "my-1.5 w-0.5 min-h-[28px] flex-1 rounded-full sm:min-h-[36px]",
        completed ? "bg-[#1A5345]" : "bg-[#E8E6E0]",
      )}
    />
  )
}

function StageStatusBadge({ status }: { status: PatientVisitStageStatus }) {
  const config: Record<PatientVisitStageStatus, { label: string; className: string }> = {
    done: { label: "Done", className: "bg-emerald-600 text-white" },
    "in-progress": { label: "In progress", className: "bg-amber-500 text-white" },
    pending: { label: "Pending", className: "bg-[#6B7870] text-white" },
  }
  const { label, className } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
        className,
      )}
    >
      {label}
    </span>
  )
}

function VisitStagesCard({ stages }: { stages: PatientVisitStage[] }) {
  return (
    <QueuePanel title="Your visit stages" dotClassName="bg-[#CC5533]">
      <ul className="space-y-0">
        {stages.map((stage, i) => (
          <li key={stage.id} className="flex gap-4">
            <div className="flex w-10 shrink-0 flex-col items-center">
              <StageStepNode stage={stage} />
              {i < stages.length - 1 ? <StageConnector completed={stage.status === "done"} /> : null}
            </div>
            <div className={cn("min-w-0 flex-1", i < stages.length - 1 ? "pb-6 sm:pb-7" : "")}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-serif text-[13px] font-bold text-[#1A1F1E] sm:text-[14px]">{stage.title}</p>
                <StageStatusBadge status={stage.status} />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">{stage.detail}</p>
              {(stage.timeLabel || stage.locationLabel) && (
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground sm:text-[13px]">
                  {stage.timeLabel ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#1A1F1E]/85">
                      <ClockIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                      {stage.timeLabel}
                    </span>
                  ) : null}
                  {stage.locationLabel ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#1A1F1E]/85">
                      <MapPinIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                      {stage.locationLabel}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </QueuePanel>
  )
}

function SidebarVisitCard({
  patientDisplayName,
  ctx,
  visit,
}: {
  patientDisplayName: string
  ctx: PatientQueuePageContext
  visit: PatientQueueVisit
}) {
  return (
    <QueuePanel title="Today's visit" dotClassName="bg-[#1A5345]">
      <div className="flex gap-4 sm:gap-5">
        <QueueProfileAvatar seed={patientDisplayName} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-serif text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">{patientDisplayName}</p>
          <p className="text-[12px] font-medium text-muted-foreground sm:text-[13px]">
            File <span className="font-bold text-[#1A1F1E]">{ctx.fileNumber}</span>
            {ctx.age > 0 ? (
              <>
                <span className="text-muted-foreground"> · </span>
                {ctx.genderLabel} · {ctx.age} yrs
              </>
            ) : null}
          </p>
          <p className="text-[12px] font-medium text-[#1A5345] sm:text-[13px]">{visit.visitTypeLabel}</p>
          <p className="text-[11px] text-muted-foreground">{ctx.clinicName}</p>
        </div>
      </div>
    </QueuePanel>
  )
}

function SidebarDoctorCard({ visit }: { visit: PatientQueueVisit }) {
  return (
    <QueuePanel title="Your clinician today" dotClassName="bg-[#CC5533]">
      <div className="flex gap-4 sm:gap-5">
        <QueueProfileAvatar seed={visit.doctorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <StethoscopeIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345] sm:size-6" strokeWidth={2} />
            <div className="min-w-0">
              <p className="truncate font-serif text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">{visit.doctorName}</p>
              <p className="mt-0.5 text-[12px] font-medium text-muted-foreground sm:text-[13px]">
                {visit.doctorTitle ?? visit.visitTypeLabel}
              </p>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-snug text-[#1A1F1E]/85 sm:text-[13px]">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-[#1A5345]" />
            {visit.doctorLocationDetail ??
              ([visit.roomNumber, visit.department].filter(Boolean).join(" · ") || "Location confirmed at check-in")}
          </p>
        </div>
      </div>
    </QueuePanel>
  )
}

function SidebarStatsCard({ visit }: { visit: PatientQueueVisit }) {
  return (
    <QueuePanel title="Visit timing" dotClassName="bg-[#2E8B68]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QueueStatCell
          size="compact"
          icon={ClockIcon}
          value={formatIsoTime(visit.scheduledTime, true)}
          label="Scheduled"
          iconColor="text-sky-600"
        />
        <QueueStatCell
          size="compact"
          icon={TimerIcon}
          value={visit.averageExamMin !== null ? `~${visit.averageExamMin} min` : "—"}
          label="Avg. visit length"
          iconColor="text-amber-600"
        />
        <QueueStatCell
          size="compact"
          icon={ClockIcon}
          value={visit.estimatedFinishTime ? formatIsoTime(visit.estimatedFinishTime, true) : "—"}
          label="Est. finish"
          iconColor="text-[#1A5345]"
        />
        <QueueStatCell
          size="compact"
          icon={MapPinIcon}
          value={visit.roomNumber ?? visit.department ?? "—"}
          label="Room / area"
          iconColor="text-[#1A5345]"
        />
      </div>
    </QueuePanel>
  )
}

function aheadThresholdCountLabel(threshold: number): string {
  return threshold === 1 ? "1 patient ahead" : `${threshold} patients ahead or fewer`
}

function AheadThresholdSelectLabel({
  threshold,
  slotMin,
  className,
}: {
  threshold: number
  slotMin: number
  className?: string
}) {
  const timeLabel = formatQueueWaitMinutes(estimateWaitAtAheadThreshold(threshold, slotMin))

  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-center gap-x-1.5 text-[13px] leading-snug sm:text-[14px]", className)}>
      <span className="font-medium text-[#1A1F1E]">{aheadThresholdCountLabel(threshold)}</span>
      <span className="text-[#9CA39E]" aria-hidden>
        ·
      </span>
      <span className="font-semibold text-[#1A5345]">{timeLabel}</span>
    </span>
  )
}

function SidebarAlertsCard({
  note,
  visit,
}: {
  note: string | null | undefined
  visit: PatientQueueVisit
}) {
  const { aheadThreshold, setAheadThreshold } = usePatientQueueAlertThreshold()

  const slotMin = useMemo(() => getQueueSlotMinutes(visit), [visit])
  const waitAtThreshold = useMemo(
    () => estimateWaitAtAheadThreshold(aheadThreshold, slotMin),
    [aheadThreshold, slotMin],
  )
  const appliesNow = aheadThresholdAppliesNow(aheadThreshold, visit.peopleAhead)
  const displayWaitMin =
    appliesNow && visit.estimatedWaitMin != null ? visit.estimatedWaitMin : waitAtThreshold
  const approxCallTime = formatApproxCallTime(displayWaitMin)

  const thresholdHint =
    aheadThreshold <= 1
      ? "We'll remind you when you're next (at most one patient still ahead)."
      : `We'll remind you when there are ${aheadThreshold} or fewer patients ahead of you.`

  const aheadLabel = aheadThresholdCountLabel(aheadThreshold)

  return (
    <QueuePanel title="Alerts & actions" dotClassName="bg-amber-500">
      <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">{thresholdHint}</p>
      {note ? (
        <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">{note}</p>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="patient-queue-alert-ahead" className="text-[12px] font-bold text-[#1A1F1E]">
            Notify when ahead count is at most
          </Label>
          <Select value={String(aheadThreshold)} onValueChange={(v) => setAheadThreshold(Number.parseInt(v, 10))}>
            <SelectTrigger
              id="patient-queue-alert-ahead"
              className={cn(queueSelectTriggerClassName, "h-auto min-h-9 w-full py-2")}
            >
              <SelectValue asChild>
                <span className="min-w-0 flex-1">
                  <AheadThresholdSelectLabel threshold={aheadThreshold} slotMin={slotMin} />
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: PATIENT_QUEUE_ALERT_AHEAD_MAX - PATIENT_QUEUE_ALERT_AHEAD_MIN + 1 }, (_, i) => {
                const n = PATIENT_QUEUE_ALERT_AHEAD_MIN + i
                return (
                  <SelectItem key={n} value={String(n)} className="py-2 text-[13px] sm:text-[14px]">
                    <AheadThresholdSelectLabel threshold={n} slotMin={slotMin} />
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/90 px-3 py-2.5">
            <p className="text-[12px] font-bold leading-snug text-[#1A1F1E]">
              {formatQueueWaitMinutes(displayWaitMin)} in front of you when {aheadLabel}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {appliesNow ? (
                <>
                  This matches your queue now — you may be called around{" "}
                  <span className="font-semibold text-[#1A5345]">{approxCallTime}</span>.
                </>
              ) : (
                <>
                  Based on ~{slotMin} min per visit slot — around{" "}
                  <span className="font-semibold text-[#1A5345]">{approxCallTime}</span> when the queue reaches
                  this point.
                </>
              )}
            </p>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Preference is saved on this device. Push alerts still require clinic integration.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          className={queuePrimaryButtonClassName}
          onClick={() =>
            toast.success(
              `Reminder armed — we'll notify at ${aheadLabel} (${formatQueueWaitMinutes(displayWaitMin)} est.).`,
            )
          }
        >
          <BellIcon className="size-3.5 shrink-0" />
          Alert me when my turn is close
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={queueOutlineButtonClassName}
          onClick={() => toast.message("Message routing will be available when messaging is enabled.")}
        >
          <MessageCircleIcon className="size-3.5 shrink-0 text-[#1A5345]" />
          Question or note for my clinician
        </Button>
      </div>
    </QueuePanel>
  )
}

function QueueStatusMainCard({ visit }: { visit: PatientQueueVisit }) {
  const nowCalling = visit.nowCallingNumber
  const yourTurn = visit.yourTurnNumber
  const peopleAhead = visit.peopleAhead
  const waitMin = visit.estimatedWaitMin
  const callingRoom = visit.callingLocationLabel

  return (
    <QueuePanel
      title="Your place in line"
      dotClassName="bg-[#1A5345]"
      action={
        nowCalling !== null ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm sm:text-[12px]">
            <MegaphoneIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
            Calling {nowCalling}
          </span>
        ) : undefined
      }
      bodyClassName="space-y-6"
    >
      {yourTurn !== null ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F4F3EF]/50 px-6 py-8 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] sm:py-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7870] shadow-sm border border-[#E8E6E0]/60 sm:text-[12px]">
              Your ticket number
            </span>
            <p className="mt-4 font-serif text-[72px] font-bold leading-none tabular-nums tracking-tight text-[#1A5345] sm:text-[84px] lg:text-[96px] drop-shadow-sm">
              {yourTurn}
            </p>
            {(peopleAhead !== null || waitMin !== null) && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-medium sm:text-[14px]">
                {peopleAhead !== null ? (
                  <span className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-[#6B7870] border border-[#E8E6E0]/40">
                    <UsersIcon className="size-4.5 text-[#D97706]" strokeWidth={2.5} />
                    <span className="font-semibold text-[#1A1F1E]">{peopleAhead}</span>
                    <span>{peopleAhead === 1 ? "person" : "people"} ahead</span>
                  </span>
                ) : null}
                {waitMin !== null ? (
                  <span className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-[#6B7870] border border-[#E8E6E0]/40">
                    <ClockIcon className="size-4.5 text-[#1A5345]" strokeWidth={2.5} />
                    <span className="font-semibold text-[#1A1F1E]">~{waitMin} min</span>
                    <span>wait</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          yourTurn !== null ? "xl:grid-cols-3" : "xl:grid-cols-4",
        )}
      >
        <QueueStatCell
          icon={MegaphoneIcon}
          value={nowCalling !== null ? String(nowCalling) : "—"}
          label="Now calling"
          hint={callingRoom}
          iconColor="text-[#1A5345]"
        />
        {yourTurn === null ? (
          <QueueStatCell
            icon={TicketIcon}
            value="—"
            label="Your ticket"
            iconColor="text-[#1A5345]"
          />
        ) : null}
        <QueueStatCell
          icon={UsersIcon}
          value={peopleAhead !== null ? String(peopleAhead) : "—"}
          label="Ahead of you"
          hint={peopleAhead === 1 ? "person" : peopleAhead !== null ? "people" : undefined}
          iconColor="text-[#D97706]"
        />
        <QueueStatCell
          icon={ClockIcon}
          value={waitMin !== null ? `${waitMin} min` : "—"}
          label="Est. wait"
          iconColor="text-[#0284C7]"
        />
      </div>

      {nowCalling !== null && yourTurn !== null ? (
        <div className="space-y-4 border-t border-[#E8E6E0]/60 pt-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#CC5533]" aria-hidden />
            <h4 className="text-[15px] font-bold text-[#1A1F1E]">Queue preview</h4>
          </div>
          <QueueTicketStrip
            nowCalling={nowCalling}
            yourTurn={yourTurn}
            cancelledTicketNumbers={visit.cancelledTicketNumbers ?? []}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E8E6E0]/80 bg-[#F9F8F5]/40 px-6 py-10 text-center">
          <ListOrderedIcon className="mx-auto size-8 text-muted-foreground/60" strokeWidth={1.75} />
          <p className="mt-3 text-[14px] font-medium text-muted-foreground sm:text-[15px]">
            Ticket numbers will appear when the clinic assigns your place in line.
          </p>
        </div>
      )}

      <p className="text-[12px] font-medium leading-relaxed text-muted-foreground sm:text-[13px]">
        Only queue ticket numbers are shown here to protect patient privacy.
      </p>
    </QueuePanel>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="h-7 w-48 sm:h-8" />
        <Skeleton className="mt-1.5 h-4 w-56" />
      </div>
      <div className="flex-1 overflow-auto px-6 py-4 sm:px-8">
        <div className="space-y-5 sm:space-y-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="space-y-5 lg:col-span-2 lg:space-y-6">
              <Skeleton className="h-[420px] w-full rounded-2xl" />
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            </div>
            <div className="space-y-5 lg:space-y-6">
              <Skeleton className="h-[180px] w-full rounded-2xl" />
              <Skeleton className="h-[240px] w-full rounded-2xl" />
              <Skeleton className="h-[220px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export type PatientQueueProps = {
  patientDisplayName: string
  page: PatientQueuePageContext | null | undefined
  visit: PatientQueueVisit | null | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  isFetching: boolean
}

export function PatientQueue({
  patientDisplayName,
  page,
  visit,
  isLoading,
  isError,
  error,
  onRetry,
  isFetching,
}: PatientQueueProps) {
  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#F9F8F5] p-6 sm:p-8">
        <Alert variant="destructive" className="max-w-lg rounded-2xl">
          <AlertTitle className="text-[15px] sm:text-[16px]">Could not load queue status</AlertTitle>
          <AlertDescription className="text-[13px] sm:text-[14px]">{error?.message ?? "Something went wrong."}</AlertDescription>
          <Button type="button" variant="outline" size="sm" className={cn("mt-4", queueOutlineButtonClassName, "w-auto")} onClick={onRetry}>
            <RefreshCwIcon className="size-4" />
            Try again
          </Button>
        </Alert>
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#F9F8F5] p-6 sm:p-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[#E8E6E0]/80 bg-white px-6 py-10 text-center sm:py-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EEF5F3] sm:size-20">
            <ListOrderedIcon className="size-7 text-[#1A5345] sm:size-8" strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 font-serif text-[20px] font-bold text-[#1A1F1E] sm:text-[22px]">No clinic queue entry today</h2>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            When you have an in-person visit added to today&apos;s queue, your ticket and wait estimate will appear here.
          </p>
          <Button asChild size="sm" className={cn("mt-8", queuePrimaryButtonClassName, "w-auto px-6")}>
            <Link href="/appointments">
              View appointments
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (visit.status === "cancelled") {
    return (
      <div className="p-3 sm:p-4 lg:p-5">
        <Alert className="max-w-lg border-[#E8E6E0] bg-[#FAFAF8]">
          <AlertTitle className="text-[11px] text-[#1A1F1E] sm:text-[13px]">Visit cancelled</AlertTitle>
          <AlertDescription className="text-[10px] text-muted-foreground sm:text-[11px]">
            This queue entry is no longer active. Check your appointments for updates or reschedule if needed.
          </AlertDescription>
          <Button asChild variant="outline" size="sm" className="mt-3 text-[11px]">
            <Link href="/appointments">Go to appointments</Link>
          </Button>
        </Alert>
      </div>
    )
  }

  if (visit.status === "no-show") {
    return (
      <div className="p-3 sm:p-4 lg:p-5">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle className="text-[11px] sm:text-[13px]">Marked as missed visit</AlertTitle>
          <AlertDescription className="text-[10px] sm:text-[11px]">
            Please contact the clinic if you still need care today.
          </AlertDescription>
          <Button asChild variant="outline" size="sm" className="mt-3 text-[11px]">
            <Link href="/appointments">Appointments</Link>
          </Button>
        </Alert>
      </div>
    )
  }

  const ctx = resolvePageContext(page, visit)
  const stages = visit.stages ?? []
  const instructions = visit.instructions ?? []

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Clinic queue
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px]">
                Clinic queue
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {formatTodayHeaderDate()}
                {visit.yourTurnNumber !== null ? (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="font-bold text-[#1A5345]">Ticket {visit.yourTurnNumber}</span>
                  </>
                ) : null}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Refresh queue"
              aria-label="Refresh queue"
              className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-transparent hover:text-[#1A5345] sm:size-9"
              onClick={onRetry}
              disabled={isFetching}
            >
              <RefreshCwIcon className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full space-y-5 pb-8 pt-4 sm:space-y-6">
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-5 lg:col-span-2 lg:space-y-6">
            <QueueStatusMainCard visit={visit} />
            {stages.length > 0 ? <VisitStagesCard stages={stages} /> : null}
          </div>

          <aside className="space-y-5 lg:space-y-6">
            <SidebarVisitCard patientDisplayName={patientDisplayName} ctx={ctx} visit={visit} />
            <SidebarDoctorCard visit={visit} />
            <SidebarStatsCard visit={visit} />
            <SidebarAlertsCard note={visit.alertsNote} visit={visit} />
          </aside>
        </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: queueScrollbarCss() }} />
    </div>
  )
}
