"use client"

import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  LogInIcon,
  MapPinIcon,
  PhoneIcon,
  PillIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TimerIcon,
  UserRoundIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QueuePatient } from "../assistantQueue.types"
import { PRIORITY_CONFIG, VISIT_TYPE_CONFIG } from "../assistantQueue.config"
import { formatShortTime } from "../assistantQueue.liveBoard"
import { PatientStudiesUploadSection } from "../PatientStudiesUploadSection"
import { StatusBadge } from "./StatusBadge"

export function PatientDetailView({
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
    { key: "scheduled",    done: true,                label: "Scheduled", icon: CalendarDaysIcon },
    { key: "arrived",      done: !!patient.arrivedAt, label: "Arrived", icon: LogInIcon },
    { key: "waiting",      done: !!patient.waitingSince, label: "Waiting", icon: ClockIcon },
    { key: "consultation", done: !!patient.startedAt, label: "Consultation", icon: StethoscopeIcon },
    { key: "done",         done: !!patient.completedAt, label: "Completed", icon: TimerIcon },
  ]
  const currentIdx = steps.findLastIndex((s) => s.done)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      {/* Header — professional gradient style matching dashboard */}
      <div className="relative shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345] md:hidden"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="size-4" />
          </button>

          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1A5345] shadow-sm">
            <UserRoundIcon className="size-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-[16px] font-bold text-[#1A1F1E] sm:text-[18px]">{patient.fullName}</h3>
            <p className="text-[12px] text-muted-foreground">{patient.age} years · <span className="capitalize">{patient.gender}</span> · {patient.condition}</p>
          </div>

          <StatusBadge status={patient.status} />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {patient.priority !== "normal" && (
            <span className={cn("rounded-md border px-2.5 py-1 text-[10px] font-bold", priorityCfg.style)}>
              {priorityCfg.label}
            </span>
          )}
          <span className={cn("rounded-md border px-2.5 py-1 text-[10px] font-bold", visitCfg.style)}>
            {VISIT_TYPE_CONFIG[patient.visitType]?.label ?? patient.visitType}
          </span>
          {patient.hasAllergies && (
            <span className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
              <ShieldAlertIcon className="size-3.5" />Allergies
            </span>
          )}
          {patient.vitalAlerts > 0 && (
            <span className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
              <AlertTriangleIcon className="size-3.5" />{patient.vitalAlerts} alert{patient.vitalAlerts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Doctor card — prominent */}
        <div className="rounded-xl border border-[#E5EEEA] bg-white p-4 shadow-sm">
          <p className="mb-2 text-[10px] font-bold text-muted-foreground">Assigned doctor</p>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#1A5345] shadow-sm">
              <StethoscopeIcon className="size-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1A1F1E]">{patient.assignedDoctor}</p>
              <p className="text-[12px] text-muted-foreground">{patient.assignedDoctorDepartment}</p>
            </div>
          </div>
        </div>

        {/* Timeline — larger and more visible */}
        <div className="rounded-xl border border-[#E8E6E0] bg-white p-4 shadow-sm">
          <p className="mb-4 text-[10px] font-bold text-muted-foreground">Visit progress</p>
          <div className="flex items-center">
            {steps.map((step, idx) => {
              const StepIcon = step.icon
              const isCurrent = idx === currentIdx && !patient.completedAt
              const isDone = step.done
              const isLast = idx === steps.length - 1

              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  {/* Connector line */}
                  <div className="flex w-full items-center">
                    <div className="flex flex-1 justify-end">
                      {idx > 0 && (
                        <div className={cn("h-[2px] w-full", isDone ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
                      )}
                    </div>

                    {/* Step circle */}
                    <div
                      className={cn(
                        "mx-1 flex size-8 shrink-0 items-center justify-center rounded-full sm:mx-2 sm:size-10",
                        isCurrent
                          ? "bg-[#1A5345] text-white shadow-md ring-4 ring-[#1A5345]/20"
                          : isDone
                            ? "bg-[#1A5345] text-white"
                            : "bg-[#F4F3EF] text-[#9CA3AF]"
                      )}
                    >
                      <StepIcon className="size-3.5 sm:size-4" />
                    </div>

                    <div className="flex flex-1 justify-start">
                      {!isLast && (
                        <div className={cn("h-[2px] w-full", isDone && steps[idx + 1]?.done ? "bg-[#1A5345]" : "bg-[#E8E6E0]")} />
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "mt-2 text-center text-[10px] font-semibold sm:text-[11px]",
                    isCurrent ? "text-[#1A5345]" : isDone ? "text-[#1A1F1E]" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Details grid — 2 cols on mobile, 3 on larger screens */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {patient.scheduledTime && (
            <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDaysIcon className="size-3.5" />
                <p className="text-[10px] font-semibold">Scheduled</p>
              </div>
              <p className="mt-1 text-[14px] font-bold text-[#1A1F1E]">{formatShortTime(patient.scheduledTime)}</p>
            </div>
          )}
          {patient.arrivedAt && (
            <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <LogInIcon className="size-3.5" />
                <p className="text-[10px] font-semibold">Arrived</p>
              </div>
              <p className="mt-1 text-[14px] font-bold text-blue-600">{formatShortTime(patient.arrivedAt)}</p>
            </div>
          )}
          {patient.roomNumber && (
            <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPinIcon className="size-3.5" />
                <p className="text-[10px] font-semibold">Room</p>
              </div>
              <p className="mt-1 text-[14px] font-bold text-[#1A1F1E]">{patient.roomNumber}</p>
            </div>
          )}
          <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TimerIcon className="size-3.5" />
              <p className="text-[10px] font-bold">Est. duration</p>
            </div>
            <p className="mt-1 text-[14px] font-bold text-[#1A1F1E]">~{patient.estimatedDurationMin} min</p>
          </div>
          {patient.activeMedications > 0 && (
            <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <PillIcon className="size-3.5" />
                <p className="text-[10px] font-bold">Medications</p>
              </div>
              <p className="mt-1 text-[14px] font-bold text-[#1A1F1E]">{patient.activeMedications} active</p>
            </div>
          )}
          <div className="rounded-xl border border-[#E8E6E0] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <PhoneIcon className="size-3.5" />
              <p className="text-[10px] font-bold">Phone</p>
            </div>
            <p className="mt-1 text-[14px] font-bold text-[#1A1F1E]">{patient.phoneNumber}</p>
          </div>
        </div>

        <PatientStudiesUploadSection queueEntryId={patient.queueEntryId} />

        {patient.notes && (
          <div className="rounded-xl border border-[#E8E6E0] bg-white p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-bold text-muted-foreground">Notes</p>
            <p className="text-[13px] leading-relaxed text-[#1A1F1E]">{patient.notes}</p>
          </div>
        )}

        {/* Action buttons — Redesigned to be simpler, horizontal and less prominent */}
        {patient.status !== "completed" && patient.status !== "cancelled" && patient.status !== "in-consultation" && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
            <div className="flex flex-wrap items-center gap-2">
              {patient.status === "scheduled" && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 shadow-none border border-blue-200/60"
                    onClick={() => onMarkArrived(patient.queueEntryId)}
                  >
                    <LogInIcon className="size-3.5" /> Mark arrived
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onNoShow(patient.queueEntryId)}
                  >
                    <XCircleIcon className="size-3.5" /> No show
                  </Button>
                </>
              )}
              {patient.status === "arrived" && (
                <Button
                  size="sm"
                  className="gap-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 shadow-none border border-amber-200/60"
                  onClick={() => onMoveToWaiting(patient.queueEntryId)}
                >
                  <ClockIcon className="size-3.5" /> Move to waiting
                </Button>
              )}
              {patient.status === "waiting" && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                  <ClockIcon className="size-3.5" />
                  Waiting for doctor
                  <span className="ml-1 inline-block size-1.5 animate-ping rounded-full bg-amber-600" />
                </div>
              )}
              {patient.status === "no-show" && (
                <Button
                  size="sm"
                  className="gap-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 shadow-none border border-blue-200/60"
                  onClick={() => onMarkArrived(patient.queueEntryId)}
                >
                  <LogInIcon className="size-3.5" /> Patient arrived late
                </Button>
              )}
            </div>
          </div>
        )}
        {patient.status === "in-consultation" && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
            <div className="flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
              <StethoscopeIcon className="size-3.5" />
              With {patient.assignedDoctor}
              <span className="ml-1 inline-block size-1.5 animate-ping rounded-full bg-emerald-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
