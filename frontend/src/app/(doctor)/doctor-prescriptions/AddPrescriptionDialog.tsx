"use client"

import { useState } from "react"
import type { PrescriptionType, TimeOfDay, AddPrescriptionPayload } from "./doctorPrescriptions.types"
import { cn } from "@/lib/utils"
import { PillIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESCRIPTION_TYPES: { value: PrescriptionType; label: string }[] = [
  { value: "antihypertensives", label: "Anti-hypertensives" },
  { value: "antiplatelets", label: "Antiplatelets" },
  { value: "anticoagulants", label: "Anticoagulants" },
  { value: "statins", label: "Statins" },
  { value: "antiarrhythmics", label: "Antiarrhythmics" },
  { value: "diuretics", label: "Diuretics" },
  { value: "diabetes_medications", label: "Diabetes Medications" },
]

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
]

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_4_hours", label: "Every 4 hours" },
  { value: "every_6_hours", label: "Every 6 hours" },
  { value: "every_8_hours", label: "Every 8 hours" },
  { value: "every_12_hours", label: "Every 12 hours" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "prn", label: "As needed (PRN)" },
  { value: "other", label: "Other" },
]

const DURATION_OPTIONS = [
  { value: "3_days", label: "3 days" },
  { value: "5_days", label: "5 days" },
  { value: "1_week", label: "1 week" },
  { value: "2_weeks", label: "2 weeks" },
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "ongoing", label: "Ongoing (no end date)" },
  { value: "other", label: "Other" },
]

type AddPrescriptionDialogProps = {
  open: boolean
  onClose: () => void
  patientName: string
  patientId: string
  onAdd: (payload: AddPrescriptionPayload) => void
}

export function AddPrescriptionDialog({
  open,
  onClose,
  patientName,
  patientId,
  onAdd,
}: AddPrescriptionDialogProps) {
  const [name, setName] = useState("")
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")
  const [type, setType] = useState<PrescriptionType>("statins")
  const [sideEffects, setSideEffects] = useState("")
  const [instructions, setInstructions] = useState("")
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay[]>(["morning"])

  const toggleTime = (tod: TimeOfDay) => {
    setTimeOfDay((prev) =>
      prev.includes(tod) ? prev.filter((t) => t !== tod) : [...prev, tod],
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !dose.trim() || !frequency || !duration) return
    const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency
    const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration
    onAdd({
      patientId,
      name: name.trim(),
      dose: dose.trim(),
      frequency: freqLabel,
      duration: durationLabel,
      type,
      sideEffects: sideEffects.trim() || undefined,
      instructions: instructions.trim() || undefined,
      timeOfDay,
    })
    // Reset form
    setName("")
    setDose("")
    setFrequency("")
    setDuration("")
    setType("statins")
    setSideEffects("")
    setInstructions("")
    setTimeOfDay(["morning"])
    onClose()
  }

  const isValid = name.trim() && dose.trim() && frequency && duration

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PillIcon className="size-5 text-[#1A5345]" />
            Add Prescription
          </DialogTitle>
          <DialogDescription>
            Prescribe a new medication for{" "}
            <span className="font-medium text-[#1A5345]">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Medication Name */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">
              Medication Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Atorvastatin"
              className="h-9 border-[#E8E6E0] text-[13px]"
            />
          </div>

          {/* Dose + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#1A1F1E]">
                Dose <span className="text-red-400">*</span>
              </label>
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 20 mg"
                className="h-9 border-[#E8E6E0] text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#1A1F1E]">
                Frequency <span className="text-red-400">*</span>
              </label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">
              Duration <span className="text-red-400">*</span>
            </label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prescription Type */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESCRIPTION_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    type === pt.value
                      ? "bg-[#1A5345] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                  )}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">Time of Day</label>
            <div className="flex gap-1.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTime(opt.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                    timeOfDay.includes(opt.value)
                      ? "bg-[#1A5345] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">Instructions</label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with food, avoid grapefruit juice..."
              className="min-h-[60px] resize-none border-[#E8E6E0] text-[13px] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Side Effects */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">
              Known Side Effects
            </label>
            <Input
              value={sideEffects}
              onChange={(e) => setSideEffects(e.target.value)}
              placeholder="e.g. Nausea, dizziness"
              className="h-9 border-[#E8E6E0] text-[13px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-1.5 bg-[#1A5345] hover:bg-[#0F3D32]"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            <PillIcon className="size-4" />
            Prescribe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
