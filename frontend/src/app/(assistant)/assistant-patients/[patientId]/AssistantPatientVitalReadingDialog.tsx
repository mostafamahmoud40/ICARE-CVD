"use client"

import type { LucideIcon } from "lucide-react"
import {
  ActivityIcon,
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  DropletsIcon,
  GaugeIcon,
  HeartPulseIcon,
  ScaleIcon,
  ThermometerIcon,
  WindIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { AssistantVitalsHistoryRow } from "./assistantPatientProfile.types"
import {
  copyAssistantPatientRowToClipboard as copyToClipboard,
  vitalsRecorderInitials,
  vitalsRowClipboardText,
} from "./assistantPatientProfile.clipboard"

type AssistantPatientVitalReadingDialogProps = {
  reading: AssistantVitalsHistoryRow | null
  patientName: string
  onClose: () => void
}

export function AssistantPatientVitalReadingDialog({
  reading,
  patientName,
  onClose,
}: AssistantPatientVitalReadingDialogProps) {
  return (
    <Dialog open={reading != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl border-[#E8E6E0] p-0 shadow-lg sm:max-w-[520px]"
      >
        {reading && (
          <>
            <div className="relative border-b border-[#E8E6E0] bg-white px-5 pb-5 pt-5 sm:px-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3 z-10 size-9 rounded-lg text-muted-foreground hover:bg-[#F5F5F3] hover:text-[#1A1F1E]"
                  aria-label="Close"
                >
                  <XIcon className="size-4" />
                </Button>
              </DialogClose>
              <div className="flex items-start gap-3 pr-8">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] text-[#1A5345]">
                  <ActivityIcon className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <DialogTitle className="border-0 p-0 font-sans text-lg font-semibold leading-snug tracking-tight text-[#1A1F1E] shadow-none">
                    Vitals reading
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Vital signs for {reading.date} at {reading.time}. Blood pressure, heart rate,
                    temperature, oxygen saturation, glucose, and weight. Recorded by {reading.takenBy}.
                  </DialogDescription>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                      {reading.date}
                    </span>
                    <span className="text-[#D4D1C9]" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums text-[#1A1F1E]">
                      <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      {reading.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FAFAF8] px-5 py-4 sm:px-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Measurements
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {(
                  [
                    {
                      label: "Blood pressure",
                      value: reading.bp,
                      unit: "mmHg",
                      Icon: GaugeIcon,
                      accent: true,
                    },
                    {
                      label: "Heart rate",
                      value: reading.hr,
                      unit: "bpm",
                      Icon: HeartPulseIcon,
                    },
                    {
                      label: "Temperature",
                      value: reading.temp,
                      unit: "°C",
                      Icon: ThermometerIcon,
                    },
                    {
                      label: "SpO₂",
                      value: reading.spo2,
                      unit: "%",
                      Icon: WindIcon,
                    },
                    {
                      label: "Glucose",
                      value: reading.glucose,
                      unit: "mg/dL",
                      Icon: DropletsIcon,
                    },
                    {
                      label: "Weight",
                      value: reading.weight,
                      unit: "kg",
                      Icon: ScaleIcon,
                    },
                  ] satisfies ReadonlyArray<{
                    label: string
                    value: string
                    unit: string
                    Icon: LucideIcon
                    accent?: boolean
                  }>
                ).map(({ label, value, unit, Icon, accent = false }) => (
                  <div key={label} className="rounded-lg border border-[#E8E6E0] bg-white p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded-md border",
                          accent
                            ? "border-[#1A5345]/15 bg-[#F3F8F6] text-[#1A5345]"
                            : "border-[#E8E6E0] bg-[#FAFAF8] text-muted-foreground"
                        )}
                      >
                        <Icon className="size-3" strokeWidth={2} aria-hidden />
                      </div>
                      <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "font-sans text-[18px] font-semibold tabular-nums leading-none tracking-tight sm:text-[19px]",
                        accent ? "text-[#1A5345]" : "text-[#1A1F1E]"
                      )}
                    >
                      {value}
                      <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                        {unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#E8E6E0] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E8E6E0] bg-[#F9F8F5] text-[10px] font-bold text-[#1A1F1E]"
                  aria-hidden
                >
                  {vitalsRecorderInitials(reading.takenBy)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Recorded by
                  </p>
                  <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                    {reading.takenBy}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold text-[#1A1F1E] hover:bg-[#F9F8F5]"
                  onClick={() =>
                    void copyToClipboard("Vitals copied", vitalsRowClipboardText(reading, patientName))
                  }
                >
                  <CopyIcon className="mr-1.5 size-3.5" />
                  Copy
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    className="h-9 rounded-lg bg-[#1A5345] px-4 text-[12px] font-semibold text-white hover:bg-[#133F34]"
                  >
                    Done
                  </Button>
                </DialogClose>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
