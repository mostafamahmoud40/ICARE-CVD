"use client"

import type { PatientPrescription } from "./doctorPrescriptions.types"
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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const TYPE_LABELS: Record<string, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

const TIME_ICONS: Record<string, React.ElementType> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

type PrescriptionDetailDialogProps = {
  prescription: PatientPrescription | null
  onClose: () => void
}

export function PrescriptionDetailDialog({ prescription, onClose }: PrescriptionDetailDialogProps) {
  if (!prescription) return null

  return (
    <Dialog open={!!prescription} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PillIcon className="size-5 text-[#1A5345]" />
            {prescription.name}
          </DialogTitle>
          <DialogDescription>
            {prescription.dose} &middot; {prescription.frequency}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status & Type */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                prescription.status === "active"
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : prescription.status === "paused"
                    ? "bg-[#F6EFE4] text-[#9A6B2F]"
                    : "bg-[#EEF2EF] text-[#738678]",
              )}
            >
              {prescription.status}
            </span>
            <span className="rounded-full bg-[#F5F5F3] px-2.5 py-0.5 text-xs text-[#6B7870]">
              {TYPE_LABELS[prescription.type] ?? prescription.type}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                prescription.compliance === "good"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500",
              )}
            >
              {prescription.compliance === "good" ? "Good compliance" : "Poor compliance"}
            </span>
          </div>

          {/* Adherence */}
          <div className="rounded-lg border border-[#E8E6E0] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Adherence Rate</span>
              <span
                className={cn(
                  "text-lg font-bold",
                  prescription.adherencePercent >= 80
                    ? "text-[#1A5345]"
                    : prescription.adherencePercent >= 50
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              >
                {prescription.adherencePercent}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#E8E6E0]">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  prescription.adherencePercent >= 80
                    ? "bg-[#1A5345]"
                    : prescription.adherencePercent >= 50
                      ? "bg-amber-400"
                      : "bg-red-400",
                )}
                style={{ width: `${prescription.adherencePercent}%` }}
              />
            </div>
          </div>

          {/* Prescribed & Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <CalendarIcon className="size-3" />
                Prescribed
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#1A1F1E]">
                {formatDate(prescription.prescribedAt)}
              </p>
            </div>
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <ClockIcon className="size-3" />
                Time of Day
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {prescription.timeOfDay.map((tod) => {
                  const Icon = TIME_ICONS[tod]
                  return (
                    <span
                      key={tod}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium",
                        tod === "morning"
                          ? "bg-amber-50 text-amber-600"
                          : tod === "afternoon"
                            ? "bg-orange-50 text-orange-500"
                            : "bg-indigo-50 text-indigo-500",
                      )}
                    >
                      <Icon className="size-3" />
                      {tod.charAt(0).toUpperCase() + tod.slice(1)}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Last Taken */}
          {prescription.lastTakenAt && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <CheckCircle2Icon className="size-3" />
                Last Taken by Patient
              </div>
              <p className="mt-1 text-[13px] font-medium text-[#1A1F1E]">
                {formatDateTime(prescription.lastTakenAt)}
              </p>
            </div>
          )}

          {/* Instructions */}
          {prescription.instructions && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <FileTextIcon className="size-3.5" />
                Instructions
              </div>
              <p className="mt-1 text-[13px] text-[#1A1F1E]">{prescription.instructions}</p>
            </div>
          )}

          {/* Side Effects */}
          {prescription.sideEffects && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <AlertTriangleIcon className="size-3.5" />
                Known Side Effects
              </div>
              <p className="mt-1 text-[13px] text-[#1A1F1E]">{prescription.sideEffects}</p>
            </div>
          )}

          {/* Paused / Discontinued notice */}
          {prescription.status === "paused" && (
            <div className="rounded-lg bg-[#F6EFE4] p-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 text-[#9A6B2F]" />
                <p className="text-[12px] font-medium text-[#9A6B2F]">
                  This prescription is paused. Patient should not resume without approval.
                </p>
              </div>
            </div>
          )}
          {prescription.status === "discontinued" && (
            <div className="rounded-lg bg-[#EEF2EF] p-3">
              <p className="text-[12px] text-[#738678]">
                This prescription has been discontinued.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
