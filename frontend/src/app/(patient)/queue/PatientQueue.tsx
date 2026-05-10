"use client"

import Image from "next/image"
import Link from "next/link"

import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ArrowRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  HeartPulseIcon,
  InfoIcon,
  ListOrderedIcon,
  MessageCircleIcon,
  RefreshCwIcon,
  ShieldIcon,
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
  PATIENT_QUEUE_ALERT_AHEAD_MAX,
  PATIENT_QUEUE_ALERT_AHEAD_MIN,
  usePatientQueueAlertThreshold,
} from "./usePatientQueueAlertThreshold"

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

function doctorInitials(name: string) {
  const parts = name.replace(/^Dr\.\s*/i, "").split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ""
  const b = parts[1]?.[0] ?? ""
  return `${a}${b}`.toUpperCase() || "DR"
}

function InstructionIcon({ kind }: { kind: PatientQueueInstructionIcon }) {
  const cls = "size-4 text-[#1A5345] sm:size-[18px]"
  switch (kind) {
    case "shield":
      return <ShieldIcon className={cls} />
    case "file":
      return <FileTextIcon className={cls} />
    case "clock":
      return <ClockIcon className={cls} />
    case "heart":
      return <HeartPulseIcon className={cls} />
    default:
      return <InfoIcon className={cls} />
  }
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
  cancelled: "border-2 border-dashed border-red-300 bg-red-50 shadow-inner ring-1 ring-red-100",
  completed: "border-muted bg-muted/35 text-muted-foreground",
  calling: "border-[#1A5345] bg-[#1A5345] text-white shadow-sm ring-2 ring-[#1A5345]/25",
  waiting: "border-amber-200 bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-100",
  yours: "border-[#1A5345] bg-[#EEF5F3] text-[#1A5345] shadow-sm ring-2 ring-[#1A5345]/40",
  queued: "border-[#E8E6E0] bg-[#FBFDFC] text-muted-foreground",
}

const TICKET_STRIP_NUMBER: Record<TicketStripKind, string> = {
  cancelled: "text-red-800",
  completed: "text-muted-foreground",
  calling: "text-white",
  waiting: "text-amber-950",
  yours: "text-[#1A5345]",
  queued: "text-muted-foreground",
}

const TICKET_STRIP_LABEL: Record<TicketStripKind, string> = {
  cancelled: "text-red-600",
  completed: "text-muted-foreground",
  calling: "text-[#1A5345]",
  waiting: "text-amber-800",
  yours: "text-[#1A5345]",
  queued: "text-muted-foreground",
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
    <div className="flex min-h-[92px] items-center gap-2 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 sm:min-h-[100px]">
      {tickets.map((n) => {
        const v = ticketStripVisual(n, nowCalling, yourTurn, cancelled)
        const circleClass = TICKET_STRIP_CIRCLE[v.kind]
        const showCallingPulse = v.kind === "calling"

        return (
          <div
            key={n}
            className="flex w-[50px] shrink-0 flex-col items-center gap-0.5 sm:w-[54px]"
            aria-label={`Ticket ${n}, ${v.label}`}
          >
            <div
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full border-2 text-[11px] font-bold tabular-nums transition-colors sm:size-11 sm:text-[12px]",
                circleClass,
              )}
              aria-current={v.kind === "yours" ? "step" : undefined}
            >
              <span className={cn("tabular-nums", TICKET_STRIP_NUMBER[v.kind])}>{n}</span>
              {showCallingPulse ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[#1A5345] shadow-sm ring-2 ring-[#1A5345]/20">
                  <CheckIcon className="size-2.5 sm:size-3" aria-hidden />
                </span>
              ) : null}
            </div>
            <span className={cn("tabular-nums text-[11px] font-bold leading-none sm:text-[12px]", TICKET_STRIP_LABEL[v.kind])}>
              {n}
            </span>
            <span
              className={cn(
                "max-w-[52px] text-center text-[10px] font-semibold leading-tight sm:max-w-[56px] sm:text-[11px]",
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

function StageDot({ status }: { status: PatientVisitStageStatus }) {
  if (status === "done") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1A5345] text-white shadow-sm ring-2 ring-[#1A5345]/20">
        <CheckIcon className="size-4" />
      </div>
    )
  }
  if (status === "in-progress") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-amber-700 shadow-sm">
        <ClockIcon className="size-4" />
      </div>
    )
  }
  return <div className="size-8 shrink-0 rounded-full border-2 border-[#E5EEEA] bg-white shadow-inner" />
}

function StageStatusBadge({ status }: { status: PatientVisitStageStatus }) {
  if (status === "done") {
    return (
      <Badge className="border-0 bg-emerald-50 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-50 sm:text-[10px]">
        Done
      </Badge>
    )
  }
  if (status === "in-progress") {
    return (
      <Badge className="border-0 bg-amber-50 text-[9px] font-semibold text-amber-700 hover:bg-amber-50 sm:text-[10px]">
        In progress
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-[9px] font-semibold text-muted-foreground sm:text-[10px]">
      Pending
    </Badge>
  )
}

function VisitStagesCard({ stages }: { stages: PatientVisitStage[] }) {
  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">Your visit stages</CardTitle>
        <CardDescription className="text-[10px] sm:text-[11px]">Track each step of today&apos;s pathway through the clinic.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-0">
          {stages.map((stage, i) => (
            <li key={stage.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StageDot status={stage.status} />
                {i < stages.length - 1 ? (
                  <div className="my-1 min-h-[28px] w-px flex-1 bg-[#E5EEEA] sm:min-h-[36px]" aria-hidden />
                ) : null}
              </div>
              <div className={cn("min-w-0 flex-1", i < stages.length - 1 ? "pb-5 sm:pb-6" : "")}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{stage.title}</p>
                  <StageStatusBadge status={stage.status} />
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{stage.detail}</p>
                {(stage.timeLabel || stage.locationLabel) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground sm:text-[10px]">
                    {stage.timeLabel ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#102F27]/80">
                        <ClockIcon className="size-3 shrink-0" />
                        {stage.timeLabel}
                      </span>
                    ) : null}
                    {stage.locationLabel ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#102F27]/80">
                        <ListOrderedIcon className="size-3 shrink-0" />
                        {stage.locationLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function InstructionsCard({ items }: { items: PatientQueueInstruction[] }) {
  if (!items.length) return null
  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">Important reminders</CardTitle>
        <CardDescription className="text-[10px] sm:text-[11px]">Stay comfortable and prepared while you wait.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/80 p-3 sm:p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3] sm:size-10">
              <InstructionIcon kind={item.icon} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{item.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{item.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SidebarDoctorCard({ visit }: { visit: PatientQueueVisit }) {
  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-bold text-[#1A1F1E] sm:text-[12px]">Your clinician today</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Avatar size="lg" className="ring-2 ring-[#E5EEEA]">
          <AvatarFallback className="bg-[#EEF5F3] text-[11px] font-bold text-[#1A5345]">
            {doctorInitials(visit.doctorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{visit.doctorName}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{visit.doctorTitle ?? visit.visitTypeLabel}</p>
          <p className="mt-2 text-[10px] leading-snug text-[#102F27]/85 sm:text-[11px]">
            {visit.doctorLocationDetail ??
              ([visit.roomNumber, visit.department].filter(Boolean).join(" · ") || "Location confirmed at check-in")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SidebarStatsCard({ visit }: { visit: PatientQueueVisit }) {
  const rows: { label: string; value: string }[] = [
    { label: "Now calling", value: visit.nowCallingNumber !== null ? String(visit.nowCallingNumber) : "—" },
    { label: "Your number", value: visit.yourTurnNumber !== null ? String(visit.yourTurnNumber) : "—" },
    { label: "People ahead", value: visit.peopleAhead !== null ? String(visit.peopleAhead) : "—" },
    {
      label: "Avg. visit length",
      value: visit.averageExamMin !== null ? `~${visit.averageExamMin} min` : "—",
    },
    {
      label: "Est. wait",
      value: visit.estimatedWaitMin !== null ? `~${visit.estimatedWaitMin} min` : "—",
    },
    {
      label: "Est. finish",
      value: visit.estimatedFinishTime ? formatIsoTime(visit.estimatedFinishTime, true) : "—",
    },
  ]

  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-bold text-[#1A1F1E] sm:text-[12px]">Queue snapshot</CardTitle>
        <CardDescription className="text-[10px] sm:text-[11px]">Numbers only — identities stay private.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[10px] sm:text-[11px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums text-[#102F27]">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SidebarAlertsCard({ note }: { note: string | null | undefined }) {
  const { aheadThreshold, setAheadThreshold } = usePatientQueueAlertThreshold()

  const thresholdHint =
    aheadThreshold <= 1
      ? "We'll remind you when you're next (at most one patient still ahead)."
      : `We'll remind you when there are ${aheadThreshold} or fewer patients ahead of you.`

  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-[11px] font-bold text-[#1A1F1E] sm:text-[12px]">Alerts & actions</CardTitle>
        <CardDescription className="text-[10px] leading-relaxed sm:text-[11px]">{thresholdHint}</CardDescription>
        {note ? (
          <p className="text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{note}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="patient-queue-alert-ahead" className="text-[10px] font-semibold text-[#102F27] sm:text-[11px]">
            Notify when ahead count is at most
          </Label>
          <Select value={String(aheadThreshold)} onValueChange={(v) => setAheadThreshold(Number.parseInt(v, 10))}>
            <SelectTrigger
              id="patient-queue-alert-ahead"
              className="h-9 border-[#E5EEEA] bg-[#FBFDFC] text-[11px] font-medium text-[#102F27]"
            >
              <SelectValue placeholder="Choose threshold" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: PATIENT_QUEUE_ALERT_AHEAD_MAX - PATIENT_QUEUE_ALERT_AHEAD_MIN + 1 }, (_, i) => {
                const n = PATIENT_QUEUE_ALERT_AHEAD_MIN + i
                const label =
                  n === 1
                    ? "1 patient ahead (you're almost up)"
                    : `${n} patients ahead or fewer`
                return (
                  <SelectItem key={n} value={String(n)} className="text-[11px]">
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
            Preference is saved on this device. Push alerts still require clinic integration.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto justify-start gap-2 border-[#E5EEEA] py-2 text-left text-[11px] hover:bg-[#F6FBF9]"
          onClick={() =>
            toast.success(`Reminder armed — we'll notify when you're down to ${aheadThreshold} ahead or fewer.`)
          }
        >
          <BellIcon className="size-4 shrink-0 text-[#1A5345]" />
          Alert me when my turn is close
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto justify-start gap-2 border-[#E5EEEA] py-2 text-left text-[11px] hover:bg-[#F6FBF9]"
          onClick={() => toast.message("Message routing will be available when messaging is enabled.")}
        >
          <MessageCircleIcon className="size-4 shrink-0 text-[#1A5345]" />
          Question or note for my clinician
        </Button>
      </CardContent>
    </Card>
  )
}

function QueueStatusMainCard({ visit }: { visit: PatientQueueVisit }) {
  const nowCalling = visit.nowCallingNumber
  const yourTurn = visit.yourTurnNumber
  const peopleAhead = visit.peopleAhead
  const waitMin = visit.estimatedWaitMin
  const callingRoom = visit.callingLocationLabel

  return (
    <Card className="border-[#E5EEEA] bg-white shadow-sm">
      <CardHeader className="space-y-2 pb-3 sm:pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">Your place in line</CardTitle>
            <CardDescription className="mt-1 text-[10px] sm:text-[11px]">
              Live ticket updates for today&apos;s clinic queue.
            </CardDescription>
          </div>
          {nowCalling !== null ? (
            <Badge className="border-0 bg-[#1A5345] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#1A5345] sm:text-[11px]">
              Now calling: {nowCalling}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] px-3 py-3 sm:px-4">
          <p className="text-[11px] font-semibold leading-snug text-[#102F27] sm:text-[12px]">
            {nowCalling !== null ? (
              <>
                Now calling number <span className="tabular-nums">{nowCalling}</span>
                {callingRoom ? (
                  <>
                    {" "}
                    — <span className="font-normal text-muted-foreground">{callingRoom}</span>
                  </>
                ) : null}
              </>
            ) : (
              "Waiting for the clinic to publish the next ticket."
            )}
          </p>
          {yourTurn !== null ? (
            <p className="mt-2 text-[10px] text-muted-foreground sm:text-[11px]">
              Your turn number is <span className="font-semibold tabular-nums text-[#102F27]">{yourTurn}</span>
              {peopleAhead !== null ? (
                <>
                  {" "}
                  — <span className="tabular-nums">{peopleAhead}</span> {peopleAhead === 1 ? "person" : "people"} ahead of you
                </>
              ) : null}
              .
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 flex-col justify-center rounded-xl border border-[#E5EEEA] bg-[#EEF5F3]/70 px-4 py-5 text-center lg:w-[148px]">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">Est. wait</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#1A5345] sm:text-3xl">{waitMin !== null ? `${waitMin}` : "—"}</p>
            {waitMin !== null ? (
              <p className="text-[10px] font-medium text-[#102F27]/80 sm:text-[11px]">minutes</p>
            ) : (
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">Unavailable</p>
            )}
          </div>

          <div className="min-w-0 flex-1 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] px-3 py-4 sm:px-4">
            {nowCalling !== null && yourTurn !== null ? (
              <>
                <QueueTicketStrip
                  nowCalling={nowCalling}
                  yourTurn={yourTurn}
                  cancelledTicketNumbers={visit.cancelledTicketNumbers ?? []}
                />
                <p className="mt-3 border-t border-[#E8E6E0] pt-3 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  Each ticket shows its state: <span className="font-medium text-[#102F27]/85">Finished</span> (already seen),{" "}
                  <span className="font-medium text-[#102F27]/85">Calling now</span>,{" "}
                  <span className="font-medium text-[#102F27]/85">Waiting here</span> (in clinic, not yet called),{" "}
                  <span className="font-medium text-[#102F27]/85">Your ticket</span>,{" "}
                  <span className="font-medium text-[#102F27]/85">Queued</span> (later today),{" "}
                  <span className="font-medium text-red-700/90">Cancelled</span> (visit dropped off the queue).
                </p>
              </>
            ) : (
              <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">Ticket visualization appears when numbers are assigned.</p>
            )}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
          Only queue ticket numbers are shown to protect patient privacy — names stay visible only on your profile above.
        </p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-3 sm:p-4 lg:p-5">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[240px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[160px] w-full rounded-xl" />
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
      <div className="p-3 sm:p-4 lg:p-5">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle className="text-[11px] sm:text-[13px]">Could not load queue status</AlertTitle>
          <AlertDescription className="text-[10px] sm:text-[11px]">{error?.message ?? "Something went wrong."}</AlertDescription>
          <Button type="button" variant="outline" size="sm" className="mt-3 text-[11px]" onClick={onRetry}>
            <RefreshCwIcon className="size-3.5" />
            Try again
          </Button>
        </Alert>
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="mx-auto max-w-lg rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 text-center sm:py-12">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
            <ListOrderedIcon className="size-5 text-muted-foreground sm:size-6" />
          </div>
          <h2 className="mt-4 text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">No clinic queue entry today</h2>
          <p className="mx-auto mt-2 max-w-sm px-4 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
            When you have an in-person visit added to today&apos;s queue, your ticket and wait estimate will appear here.
          </p>
          <Button
            asChild
            className="mt-6 bg-[#1A5345] text-[11px] hover:bg-[#0F3D32] sm:text-[12px]"
            size="sm"
          >
            <Link href="/appointments">
              View appointments
              <ArrowRightIcon className="size-3.5" />
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F5] pb-8">
      {/* Top clinic strip */}
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-[#E5EEEA] sm:size-10">
              <Image src="/images/logo/logo.png" alt="ICARE-CVD" width={40} height={40} className="size-9 object-cover sm:size-10" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">{ctx.clinicName}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">{ctx.departmentLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="secondary" className="border border-[#E5EEEA] bg-white text-[10px] font-semibold text-[#102F27]">
              File {ctx.fileNumber}
            </Badge>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[#E5EEEA] bg-white px-2 py-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <CalendarDaysIcon className="size-3.5 shrink-0 text-[#1A5345]" />
              {formatTodayHeaderDate()}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#E5EEEA] text-[11px]"
              onClick={onRetry}
              disabled={isFetching}
            >
              <RefreshCwIcon className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-4 px-3 pt-4 sm:space-y-5 sm:px-4 lg:px-5 lg:pt-5">
        {/* Patient identity strip */}
        <Card className="overflow-hidden border-[#E5EEEA] bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-[17px] font-bold tracking-tight text-[#1A1F1E] sm:text-[20px] lg:text-[22px]">{patientDisplayName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
                  <span>
                    File <span className="font-semibold text-[#102F27]">{ctx.fileNumber}</span>
                  </span>
                  <Separator orientation="vertical" className="hidden !h-3 sm:block" />
                  <span>{ctx.genderLabel}</span>
                  <Separator orientation="vertical" className="hidden !h-3 sm:block" />
                  <span>{ctx.age > 0 ? `${ctx.age} yrs` : "—"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="border-0 bg-[#EEF5F3] text-[10px] font-semibold text-[#1A5345] hover:bg-[#EEF5F3]">{visit.visitTypeLabel}</Badge>
                <Badge variant="secondary" className="border border-[#E5EEEA] bg-white text-[10px] font-semibold text-[#102F27]">
                  {visit.doctorName}
                  {visit.doctorTitle ? ` · ${visit.doctorTitle}` : ""}
                </Badge>
              </div>
            </div>
            {visit.yourTurnNumber !== null ? (
              <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#1A5345]/35 bg-[#EEF5F3]/80 px-6 py-4 text-center shadow-sm sm:min-w-[112px]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#1A5345]/90">Your ticket</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-[#1A5345] sm:text-3xl">{visit.yourTurnNumber}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Two-column dashboard */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="space-y-4 lg:col-span-2 lg:space-y-5">
            <QueueStatusMainCard visit={visit} />
            {stages.length > 0 ? <VisitStagesCard stages={stages} /> : null}
            {instructions.length > 0 ? <InstructionsCard items={instructions} /> : null}
          </div>

          <aside className="space-y-4 lg:space-y-5">
            <SidebarDoctorCard visit={visit} />
            <SidebarStatsCard visit={visit} />
            <SidebarAlertsCard note={visit.alertsNote} />
          </aside>
        </div>
      </div>
    </div>
  )
}
