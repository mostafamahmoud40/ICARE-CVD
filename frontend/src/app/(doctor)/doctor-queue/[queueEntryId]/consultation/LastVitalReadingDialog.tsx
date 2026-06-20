"use client"

import {
  ActivityIcon,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  DropletIcon,
  HeartPulseIcon,
  HomeIcon,
  HospitalIcon,
  ScaleIcon,
  ThermometerIcon,
  WindIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ConsultationVitalReading } from "./consultation.types"

function formatReadingDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function sourceMeta(source: ConsultationVitalReading["source"]) {
  switch (source) {
    case "home":
      return {
        label: "At home",
        icon: HomeIcon,
        className: "bg-blue-50 text-blue-700 border-blue-100",
      }
    case "hospital":
      return {
        label: "In hospital",
        icon: HospitalIcon,
        className: "bg-violet-50 text-violet-700 border-violet-100",
      }
    default:
      return {
        label: "In clinic",
        icon: Building2Icon,
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      }
  }
}

function VitalStat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType
  label: string
  value: number | null
  unit: string
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-3.5 text-[#1A5345]" aria-hidden />
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <p className="text-[18px] font-bold tabular-nums text-[#102F27]">
        {value ?? "—"}
        {value != null ? (
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">{unit}</span>
        ) : null}
      </p>
    </div>
  )
}

export type LastVitalReadingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reading: ConsultationVitalReading
  onApply?: () => void
}

export function LastVitalReadingDialog({
  open,
  onOpenChange,
  reading,
  onApply,
}: LastVitalReadingDialogProps) {
  const source = sourceMeta(reading.source)
  const SourceIcon = source.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-[#E8E6E0]/60 p-0 gap-0 overflow-hidden">
        <DialogHeader className="space-y-1 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/60 px-5 py-4 text-left">
          <DialogTitle className="font-serif text-[17px] font-bold text-[#102F27]">
            Previous visit vitals
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6B7870]">
            Reference only — today&apos;s visit starts with a blank form unless you choose to copy these values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold",
                source.className,
              )}
            >
              <SourceIcon className="size-3.5" aria-hidden />
              {source.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E6E0]/60 bg-white px-3 py-1 text-[12px] font-semibold text-[#6B7870]">
              <CalendarIcon className="size-3.5 text-[#1A5345]" aria-hidden />
              {formatReadingDate(reading.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E6E0]/60 bg-white px-3 py-1 text-[12px] font-semibold text-[#6B7870]">
              <ClockIcon className="size-3.5 text-[#1A5345]" aria-hidden />
              {reading.time}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <VitalStat icon={HeartPulseIcon} label="Systolic BP" value={reading.systolicBP} unit="mmHg" />
            <VitalStat icon={HeartPulseIcon} label="Diastolic BP" value={reading.diastolicBP} unit="mmHg" />
            <VitalStat icon={ActivityIcon} label="Heart rate" value={reading.heartRate} unit="bpm" />
            <VitalStat icon={WindIcon} label="O₂ saturation" value={reading.oxygenSaturation} unit="%" />
            <VitalStat icon={ThermometerIcon} label="Temperature" value={reading.temperature} unit="°C" />
            <VitalStat icon={WindIcon} label="Resp. rate" value={reading.respiratoryRate} unit="/min" />
            <VitalStat icon={ScaleIcon} label="Weight" value={reading.weight} unit="kg" />
            <VitalStat icon={ScaleIcon} label="Height" value={reading.heightCm} unit="cm" />
            <VitalStat icon={DropletIcon} label="Blood sugar" value={reading.bloodSugar} unit="mg/dL" />
          </div>

          {reading.notes ? (
            <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#FFFCFA] px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">Notes</p>
              <p className="mt-1 text-[13px] italic leading-relaxed text-[#374151]">{reading.notes}</p>
            </div>
          ) : null}
        </div>

        {onApply ? (
          <DialogFooter className="border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/40 px-5 py-3 sm:justify-between">
            <p className="text-[12px] text-[#6B7870]">Prefill today&apos;s vitals from this reading</p>
            <Button
              type="button"
              onClick={() => {
                onApply()
                onOpenChange(false)
              }}
              className="rounded-xl bg-[#1A5345] hover:bg-[#154434]"
            >
              Use for this visit
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
