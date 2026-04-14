"use client"

import { useState } from "react"
import type { Medication, TimeOfDay } from "./medications.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  MoonIcon,
  PillIcon,
  SunriseIcon,
  SunIcon,
  UserRoundIcon,
  RefreshCcwIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

const TYPE_LABELS: Record<string, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

const TIME_ICONS: Record<TimeOfDay, React.ElementType> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

type MedicationDetailProps = {
  medication: Medication | null
  onClose: () => void
}

export function MedicationDetail({ medication, onClose }: MedicationDetailProps) {
  if (!medication) return null

  const isActive = medication.status === "active"
  const isPaused = medication.status === "paused"

  return (
    <Dialog open={!!medication} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PillIcon className="size-5 text-[#1A5345]" />
            {medication.name}
          </DialogTitle>
          <DialogDescription>
            {medication.dose} &middot; {medication.frequency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status & Type */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                medication.status === "active"
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : medication.status === "paused"
                    ? "bg-[#F6EFE4] text-[#9A6B2F]"
                    : "bg-[#EEF2EF] text-[#738678]",
              )}
            >
              {medication.status}
            </span>
            <span className="rounded-full bg-[#F5F5F3] px-2.5 py-0.5 text-xs text-[#6B7870]">
              {TYPE_LABELS[medication.type] ?? medication.type}
            </span>
            {medication.compliance && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  medication.compliance === "good"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500",
                )}
              >
                {medication.compliance === "good" ? "Good compliance" : "Poor compliance"}
              </span>
            )}
          </div>

          {/* Prescribed By */}
          <div className="flex items-start gap-3 rounded-lg bg-[#F9F8F5] p-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#E8F0EE]">
              <UserRoundIcon className="size-4 text-[#1A5345]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#1A1F1E]">
                {medication.prescribedBy}
              </p>
              <p className="text-[12px] text-[#6B7870]">
                Prescribed on {formatDate(medication.prescribedAt)}
              </p>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <ClockIcon className="size-3" />
                Time of Day
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {medication.timeOfDay.map((tod) => {
                  const Icon = TIME_ICONS[tod]
                  return (
                    <span
                      key={tod}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium",
                        tod === "morning"
                          ? "bg-amber-50 text-amber-600"
                          : tod === "afternoon"
                            ? "bg-orange-50 text-orange-500"
                            : "bg-indigo-50 text-indigo-500",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {tod.charAt(0).toUpperCase() + tod.slice(1)}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <RefreshCcwIcon className="size-3" />
                Refills
              </div>
              <p className="mt-1 text-[15px] font-semibold text-[#1A1F1E]">
                {medication.remainingRefills} remaining
              </p>
              {medication.remainingRefills <= 2 && (
                <p className="mt-0.5 text-[11px] text-amber-600">
                  {medication.remainingRefills === 0
                    ? "No refills left — contact your doctor"
                    : "Running low — consider requesting a refill"}
                </p>
              )}
            </div>
          </div>

          {/* Last Taken / Next Dose */}
          <div className="grid grid-cols-2 gap-3">
            {medication.lastTakenAt && (
              <div className="rounded-lg border border-[#E8E6E0] p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                  <CheckCircle2Icon className="size-3" />
                  Last Taken
                </div>
                <p className="mt-1 text-[13px] font-medium text-[#1A1F1E]">
                  {formatDateTime(medication.lastTakenAt)}
                </p>
              </div>
            )}
            {medication.nextDoseAt && isActive && (
              <div className="rounded-lg border border-[#E8E6E0] p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                  <CalendarIcon className="size-3" />
                  Next Dose
                </div>
                <p className="mt-1 text-[13px] font-medium text-[#1A1F1E]">
                  {formatDateTime(medication.nextDoseAt)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Instructions */}
          {medication.instructions && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <FileTextIcon className="size-3.5" />
                Instructions
              </div>
              <p className="mt-1 text-[13px] text-[#1A1F1E]">{medication.instructions}</p>
            </div>
          )}

          {/* Side Effects */}
          {medication.sideEffects && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <AlertTriangleIcon className="size-3.5" />
                Side Effects
              </div>
              <p className="mt-1 text-[13px] text-[#1A1F1E]">{medication.sideEffects}</p>
            </div>
          )}

          {/* Paused Notice */}
          {isPaused && (
            <div className="rounded-lg bg-[#F6EFE4] p-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 text-[#9A6B2F]" />
                <p className="text-[12px] font-medium text-[#9A6B2F]">
                  This medication is paused. Do not resume without your doctor&apos;s approval.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
