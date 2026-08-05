"use client"

import { useState } from "react"
import type { ConsultationVitalReading, VitalSigns } from "./consultation.types"
import { ActivityIcon, ChevronRightIcon, HistoryIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LastVitalReadingDialog } from "./LastVitalReadingDialog"

// BMI calculation and color logic
function calculateBMI(heightCm: string, weightKg: string): number | null {
  const height = parseFloat(heightCm)
  const weight = parseFloat(weightKg)
  
  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    return null
  }
  
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

function getBMIColor(bmi: number | null): string {
  if (bmi === null) return "text-[#152a24]"
  
  if (bmi < 18.5) return "text-blue-600" // Underweight
  if (bmi < 25) return "text-emerald-600" // Normal weight
  if (bmi < 30) return "text-amber-600" // Overweight
  return "text-red-600" // Obese
}

// Age-based reference range calculations
function getHeartRateRange(age: number): { min: number; max: number } {
  if (age < 0.03) return { min: 100, max: 160 } // Newborn
  if (age < 0.25) return { min: 70, max: 170 } // 0-3 months
  if (age < 0.5) return { min: 80, max: 140 } // 6-12 months
  if (age < 3) return { min: 80, max: 130 } // 1-3 years
  if (age < 5) return { min: 80, max: 120 } // 3-5 years
  if (age < 10) return { min: 70, max: 110 } // 6-10 years
  if (age < 14) return { min: 60, max: 105 } // 11-14 years
  return { min: 60, max: 100 } // 15+ years
}

function getRespiratoryRateRange(age: number): { min: number; max: number } {
  if (age < 0.25) return { min: 30, max: 60 } // 0-3 months
  if (age < 0.92) return { min: 25, max: 60 } // 3-11 months
  if (age < 3) return { min: 20, max: 40 } // 1-3 years
  if (age < 6) return { min: 20, max: 40 } // 3-6 years
  if (age < 12) return { min: 14, max: 30 } // 6-12 years
  return { min: 12, max: 20 } // 13+ years
}

function getBloodPressureRange(age: number): { systolicMin: number; systolicMax: number; diastolicMin: number; diastolicMax: number } {
  if (age < 0.25) return { systolicMin: 65, systolicMax: 104, diastolicMin: 37, diastolicMax: 65 } // 0-3 months
  if (age < 0.92) return { systolicMin: 70, systolicMax: 105, diastolicMin: 55, diastolicMax: 75 } // 3-11 months
  if (age < 3) return { systolicMin: 86, systolicMax: 107, diastolicMin: 41, diastolicMax: 78 } // 1-3 years
  if (age < 6) return { systolicMin: 90, systolicMax: 110, diastolicMin: 47, diastolicMax: 75 } // 3-6 years
  if (age < 12) return { systolicMin: 90, systolicMax: 121, diastolicMin: 59, diastolicMax: 80 } // 6-12 years
  return { systolicMin: 90, systolicMax: 120, diastolicMin: 60, diastolicMax: 80 } // 13+ years
}

function getVitalStatus(value: string, range: { min: number; max: number }): { status: 'normal' | 'high' | 'low'; message: string } {
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return { status: 'normal', message: '' }
  
  if (numValue < range.min) return { status: 'low', message: `Low (Normal: ${range.min}-${range.max})` }
  if (numValue > range.max) return { status: 'high', message: `High (Normal: ${range.min}-${range.max})` }
  return { status: 'normal', message: 'Normal' }
}

function getBloodPressureStatus(
  systolic: string,
  diastolic: string,
  age: number,
): {
  systolicStatus: "normal" | "high" | "low"
  diastolicStatus: "normal" | "high" | "low"
  systolicMessage: string
  diastolicMessage: string
} {
  const sysValue = parseFloat(systolic)
  const diaValue = parseFloat(diastolic)
  const range = getBloodPressureRange(age)

  let systolicStatus: "normal" | "high" | "low" = "normal"
  let diastolicStatus: "normal" | "high" | "low" = "normal"
  let systolicMessage = ""
  let diastolicMessage = ""

  if (!isNaN(sysValue)) {
    if (sysValue < range.systolicMin) {
      systolicStatus = "low"
      systolicMessage = `Systolic low (Normal: ${range.systolicMin}-${range.systolicMax})`
    } else if (sysValue > range.systolicMax) {
      systolicStatus = "high"
      systolicMessage = `Systolic high (Normal: ${range.systolicMin}-${range.systolicMax})`
    } else {
      systolicMessage = "Normal"
    }
  }

  if (!isNaN(diaValue)) {
    if (diaValue < range.diastolicMin) {
      diastolicStatus = "low"
      diastolicMessage = `Diastolic low (Normal: ${range.diastolicMin}-${range.diastolicMax})`
    } else if (diaValue > range.diastolicMax) {
      diastolicStatus = "high"
      diastolicMessage = `Diastolic high (Normal: ${range.diastolicMin}-${range.diastolicMax})`
    } else {
      diastolicMessage = "Normal"
    }
  }

  return { systolicStatus, diastolicStatus, systolicMessage, diastolicMessage }
}

function getVitalStatusColor(status: 'normal' | 'high' | 'low'): string {
  switch (status) {
    case 'normal': return 'text-emerald-600'
    case 'high': return 'text-red-600'
    case 'low': return 'text-blue-600'
  }
}

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
  onApplyLastReading?: (reading: ConsultationVitalReading) => void
  patientAge: number
  lastVitalReading?: ConsultationVitalReading | null
}

function lastReadingSourceLabel(source: ConsultationVitalReading["source"]) {
  if (source === "home") return "Home"
  if (source === "hospital") return "Hospital"
  return "Clinic"
}

export function VitalsSection({
  vitals,
  onVitalChange,
  onApplyLastReading,
  patientAge,
  lastVitalReading,
}: VitalsSectionProps) {
  const [lastReadingOpen, setLastReadingOpen] = useState(false)
  const bmi = calculateBMI(vitals.heightCm, vitals.weightKg)
  const bmiColor = getBMIColor(bmi)

  // Calculate vital statuses based on age
  const heartRateRange = getHeartRateRange(patientAge)
  const heartRateStatus = getVitalStatus(vitals.heartRate, heartRateRange)
  
  const respiratoryRateRange = getRespiratoryRateRange(patientAge)
  const respiratoryRateStatus = getVitalStatus(vitals.respiratoryRate, respiratoryRateRange)
  
  const bloodPressureStatus = getBloodPressureStatus(vitals.systolicBP, vitals.diastolicBP, patientAge)

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <ActivityIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="font-serif text-[16px] font-bold text-[#102F27]">Vital Signs</h3>
        </div>

        {lastVitalReading ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLastReadingOpen(true)}
              className="h-8 gap-2 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] px-3 text-[12px] font-semibold text-[#1A5345] hover:bg-[#F0F4F2]"
            >
              <HistoryIcon className="size-3.5" aria-hidden />
              Last reading
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                  lastVitalReading.source === "home"
                    ? "bg-blue-50 text-blue-700"
                    : lastVitalReading.source === "hospital"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-emerald-50 text-emerald-700",
                )}
              >
                {lastReadingSourceLabel(lastVitalReading.source)}
              </span>
              <ChevronRightIcon className="size-3.5 text-[#9CA3AF]" aria-hidden />
            </Button>
            <LastVitalReadingDialog
              open={lastReadingOpen}
              onOpenChange={setLastReadingOpen}
              reading={lastVitalReading}
              onApply={onApplyLastReading ? () => onApplyLastReading(lastVitalReading) : undefined}
            />
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {VITAL_FIELDS.map((field) => {
          let statusMessage = ''
          let statusColor = 'text-emerald-600'
          
          if (field.key === 'heartRate') {
            statusMessage = heartRateStatus.message
            statusColor = getVitalStatusColor(heartRateStatus.status)
          } else if (field.key === 'respiratoryRate') {
            statusMessage = respiratoryRateStatus.message
            statusColor = getVitalStatusColor(respiratoryRateStatus.status)
          } else if (field.key === 'systolicBP') {
            statusMessage = bloodPressureStatus.systolicMessage
            statusColor = getVitalStatusColor(bloodPressureStatus.systolicStatus)
          } else if (field.key === 'diastolicBP') {
            statusMessage = bloodPressureStatus.diastolicMessage
            statusColor = getVitalStatusColor(bloodPressureStatus.diastolicStatus)
          } else if (field.key === 'temperature') {
            const tempValue = parseFloat(vitals.temperature)
            if (!isNaN(tempValue)) {
              if (tempValue < 36.5) {
                statusMessage = 'Low (Normal: 36.5-37.3°C)'
                statusColor = 'text-blue-600'
              } else if (tempValue > 37.3) {
                statusMessage = 'High (Normal: 36.5-37.3°C)'
                statusColor = 'text-red-600'
              } else {
                statusMessage = 'Normal'
                statusColor = 'text-emerald-600'
              }
            }
          } else if (field.key === 'oxygenSaturation') {
            const o2Value = parseFloat(vitals.oxygenSaturation)
            if (!isNaN(o2Value)) {
              if (o2Value < 95) {
                statusMessage = 'Low (Normal: 95-100%)'
                statusColor = 'text-red-600'
              } else {
                statusMessage = 'Normal'
                statusColor = 'text-emerald-600'
              }
            }
          }
          
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-[13px] font-semibold text-muted-foreground">{field.label}</label>
              <div className="relative">
                <Input
                  value={vitals[field.key]}
                  onChange={(e) => onVitalChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 border-[#E8E6E0] bg-[#FAFAF8] pr-10 text-[14px]"
                  type="text"
                  inputMode="decimal"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                  {field.unit}
                </span>
              </div>
              {statusMessage && (
                <div className={`text-[11.5px] ${statusColor} font-semibold`}>
                  {statusMessage}
                </div>
              )}
            </div>
          )
        })}
        <div className="space-y-1">
          <label className="text-[13px] font-semibold text-muted-foreground">BMI</label>
          <div className="relative">
            <div className="h-8 w-full rounded-lg border-[#E8E6E0] bg-[#FAFAF8] px-2.5 py-1 flex items-center">
              <span className={`text-[14px] font-bold ${bmiColor}`}>
                {bmi || "-"}
              </span>
              <span className="ml-1 text-[12px] text-muted-foreground">kg/m²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
