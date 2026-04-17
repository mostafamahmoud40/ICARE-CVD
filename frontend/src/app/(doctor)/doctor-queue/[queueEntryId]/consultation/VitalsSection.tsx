"use client"

import type { VitalSigns } from "./consultation.types"
import { ActivityIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

const VITAL_FIELDS = [
  { key: "systolicBP" as const, label: "Systolic BP", placeholder: "120", unit: "mmHg" },
  { key: "diastolicBP" as const, label: "Diastolic BP", placeholder: "80", unit: "mmHg" },
  { key: "heartRate" as const, label: "Heart Rate", placeholder: "72", unit: "bpm" },
  { key: "temperature" as const, label: "Temperature", placeholder: "37.0", unit: "°C" },
  { key: "respiratoryRate" as const, label: "Resp. Rate", placeholder: "16", unit: "/min" },
  { key: "oxygenSaturation" as const, label: "O₂ Saturation", placeholder: "98", unit: "%" },
  { key: "heightCm" as const, label: "Height", placeholder: "170", unit: "cm" },
  { key: "weightKg" as const, label: "Weight", placeholder: "80", unit: "kg" },
]

export type VitalsSectionProps = {
  vitals: VitalSigns
  onVitalChange: (key: keyof VitalSigns, value: string) => void
}

export function VitalsSection({ vitals, onVitalChange }: VitalsSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <ActivityIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Vital Signs</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {VITAL_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
            <div className="relative">
              <Input
                value={vitals[field.key]}
                onChange={(e) => onVitalChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-8 border-[#E8E6E0] bg-[#FAFAF8] pr-10 text-[13px]"
                type="text"
                inputMode="decimal"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {field.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
