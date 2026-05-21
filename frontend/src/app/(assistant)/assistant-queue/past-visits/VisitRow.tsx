"use client"

import Image from "next/image"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  LogInIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  SparklesIcon,
  StethoscopeIcon,
  TimerIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { QueuePatient } from "../assistantQueue.types"
import { PRIORITY_CONFIG, VISIT_TYPE_CONFIG } from "../assistantQueue.config"
import {
  formatShortDate,
  formatShortTime,
  formatVisitDate,
} from "../assistantQueue.liveBoard"
import { StatusBadge } from "../shared/StatusBadge"

type VisitRowProps = {
  patient: QueuePatient
  onSelect: (id: string) => void
  onMarkArrived?: (id: string) => void
}

const iconBtn =
  "rounded-md p-1.5 text-[#6B7870] transition-colors hover:bg-black/[0.04] hover:text-[#1A5345]"
const iconBtnAi = "text-violet-500 hover:bg-violet-50 hover:text-violet-600"
const iconBtnStrong = "text-[#1A5345] hover:bg-[#E8F0EE]"

export function VisitRow({ patient, onSelect, onMarkArrived }: VisitRowProps) {
  const isCompleted = patient.status === "completed"
  const isNoShow = patient.status === "no-show"
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? {
    label: patient.visitType,
    style: "bg-gray-50 text-gray-600",
  }

  const duration =
    patient.startedAt && patient.completedAt
      ? Math.round((Date.parse(patient.completedAt) - Date.parse(patient.startedAt)) / 60000)
      : null

  const aiInsights = patient.aiInsights
  const aiReviewed = Boolean(aiInsights?.reviewed)
  const aiNote = aiInsights?.note?.trim()

  return (
    <article className="group relative rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#1A5345]/30 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-10 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0] bg-[#F5F5F3]">
            <Image
              src={patient.avatarUrl || `https://i.pravatar.cc/150?u=${patient.id}`}
              alt={patient.fullName}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="truncate text-[15px] font-bold text-[#102F27] group-hover:text-[#1A5345] transition-colors">{patient.fullName}</h4>
              <span className="shrink-0 rounded-md bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7870] ring-1 ring-inset ring-[#E8E6E0]/80">{patient.age}y</span>
              {aiReviewed && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                  title="Visit reviewed by AI"
                >
                  <SparklesIcon className="size-3 shrink-0" />
                  AI reviewed
                </span>
              )}
              {aiNote && (
                <span
                  className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                  title={aiNote}
                >
                  <MessageSquareTextIcon className="size-3 shrink-0" />
                  <span className="truncate">AI note</span>
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset ring-black/5",
                  visitCfg.style,
                )}
              >
                {visitCfg.label}
              </span>
              {patient.priority !== "normal" && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
                    PRIORITY_CONFIG[patient.priority].style.replace('bg-', 'bg-').replace('text-', 'text-'),
                  )}
                >
                  {PRIORITY_CONFIG[patient.priority].label}
                </span>
              )}
              {patient.hasAllergies && (
                <span className="flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 ring-1 ring-inset ring-red-500/10">
                  Allergies
                </span>
              )}
              {patient.vitalAlerts > 0 && (
                <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-inset ring-amber-500/10">
                  <AlertTriangleIcon className="size-2.5" />
                  {patient.vitalAlerts} Alert{patient.vitalAlerts > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      {/* Meta */}
      <div className="mt-3 space-y-1.5 text-[11px] text-[#6B7870]">
        <p className="flex items-center gap-1.5">
          <StethoscopeIcon className="size-3.5 shrink-0 text-[#1A5345]" />
          <span className="font-medium text-[#102F27]">{patient.assignedDoctor}</span>
          <span className="text-[#E8E6E0]">·</span>
          <span>{patient.assignedDoctorDepartment}</span>
        </p>
        {patient.condition && (
          <p className="truncate text-[11px] text-muted-foreground">{patient.condition}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1">
            <CalendarClockIcon className="size-3.5 shrink-0" />
            <span className="sm:hidden">{formatShortDate(patient.scheduledTime)}</span>
            <span className="hidden sm:inline">{formatVisitDate(patient.scheduledTime)}</span>
            <span className="text-[#E8E6E0]">·</span>
            <ClockIcon className="size-3 shrink-0" />
            {formatShortTime(patient.scheduledTime)}
          </span>
          {isCompleted && patient.completedAt && (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2Icon className="size-3.5" />
              Ended {formatShortTime(patient.completedAt)}
            </span>
          )}
          {duration != null && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <TimerIcon className="size-3.5" />
              {duration} min
            </span>
          )}
          {patient.roomNumber && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              Room {patient.roomNumber}
            </span>
          )}
          {isNoShow && patient.phoneNumber && (
            <span className="flex items-center gap-1">
              <PhoneIcon className="size-3.5" />
              {patient.phoneNumber}
            </span>
          )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isNoShow ? (
              <>
                {patient.phoneNumber && (
                  <a
                    href={`tel:${patient.phoneNumber.replace(/\s/g, "")}`}
                    className={iconBtn}
                    title="Call patient"
                    aria-label="Call patient"
                  >
                    <PhoneIcon className="size-4" />
                  </a>
                )}
                <button
                  type="button"
                  className={iconBtn}
                  title="Reschedule visit"
                  aria-label="Reschedule visit"
                >
                  <CalendarClockIcon className="size-4" />
                </button>
                {onMarkArrived && (
                  <button
                    type="button"
                    onClick={() => onMarkArrived(patient.queueEntryId)}
                    className={cn(iconBtn, iconBtnStrong)}
                    title="Mark arrived late"
                    aria-label="Mark arrived late"
                  >
                    <LogInIcon className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(patient.queueEntryId)}
                  className={iconBtn}
                  title="Open visit details"
                  aria-label="Open visit details"
                >
                  <ArrowRightIcon className="size-4" />
                </button>
              </>
            ) : (
              <>
                {isCompleted && (
                  <>
                    <button
                      type="button"
                      className={iconBtn}
                      title="View visit report"
                      aria-label="View visit report"
                    >
                      <FileTextIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={cn(iconBtn, iconBtnAi)}
                      title="AI visit summary"
                      aria-label="AI visit summary"
                    >
                      <SparklesIcon className="size-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(patient.queueEntryId)}
                  className={iconBtn}
                  title="Open visit details"
                  aria-label="Open visit details"
                >
                  <ArrowRightIcon className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
