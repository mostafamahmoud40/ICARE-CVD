"use client"

import { useState } from "react"
import type { PrescriptionType, TimeOfDay, AddPrescriptionPayload } from "./doctorPrescriptions.types"
import { cn } from "@/lib/utils"
import { Loader2Icon, PillIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import {
  DURATION_OPTIONS,
  FREQUENCY_OPTIONS,
  PRESCRIPTION_TYPES,
  TIME_OPTIONS,
  buildAiInstructions,
  buildAiSideEffects,
  frequencyValueToLabel,
} from "./prescriptionForm.shared"
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
  const [isAiInstructionsLoading, setIsAiInstructionsLoading] = useState(false)
  const [isAiSideEffectsLoading, setIsAiSideEffectsLoading] = useState(false)

  const runAiPreview = async (apply: () => void) => {
    await new Promise((resolve) => setTimeout(resolve, 450))
    apply()
    toast.message("AI draft applied", {
      description: "Preview — connect the prescribing API when ready.",
    })
  }

  const handleAiInstructions = async () => {
    setIsAiInstructionsLoading(true)
    try {
      await runAiPreview(() => {
        setInstructions(buildAiInstructions(name, dose, frequency, timeOfDay))
      })
    } finally {
      setIsAiInstructionsLoading(false)
    }
  }

  const handleAiSideEffects = async () => {
    setIsAiSideEffectsLoading(true)
    try {
      await runAiPreview(() => {
        setSideEffects(buildAiSideEffects(name, type))
      })
    } finally {
      setIsAiSideEffectsLoading(false)
    }
  }

  const toggleTime = (tod: TimeOfDay) => {
    setTimeOfDay((prev) =>
      prev.includes(tod) ? prev.filter((t) => t !== tod) : [...prev, tod],
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !dose.trim() || !frequency || !duration) return
    const freqLabel = frequencyValueToLabel(frequency)
    onAdd({
      patientId,
      name: name.trim(),
      dose: dose.trim(),
      frequency: freqLabel,
      durationDays: duration === "ongoing" ? undefined : Number(duration),
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
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-medium text-[#1A1F1E]">Instructions</label>
              <span className="text-[10px] font-medium text-muted-foreground">AI-assisted</span>
            </div>
            <div className="relative">
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Take with food, avoid grapefruit juice..."
                className="min-h-[60px] resize-none border-[#E8E6E0] pr-10 text-[13px] placeholder:text-[#9CA3AF]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Generate instructions with AI"
                aria-label="Generate instructions with AI"
                disabled={isAiInstructionsLoading}
                onClick={() => void handleAiInstructions()}
                className="absolute right-1 top-1 size-8 border-0 bg-transparent text-[#1A5345] shadow-none transition-colors hover:bg-transparent hover:text-[#133F34] disabled:opacity-50"
              >
                {isAiInstructionsLoading ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon className="size-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>

          {/* Side Effects */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-medium text-[#1A1F1E]">Known Side Effects</label>
              <span className="text-[10px] font-medium text-muted-foreground">AI-assisted</span>
            </div>
            <div className="relative">
              <Input
                value={sideEffects}
                onChange={(e) => setSideEffects(e.target.value)}
                placeholder="e.g. Nausea, dizziness"
                className="h-9 border-[#E8E6E0] pr-10 text-[13px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Suggest side effects with AI"
                aria-label="Suggest side effects with AI"
                disabled={isAiSideEffectsLoading}
                onClick={() => void handleAiSideEffects()}
                className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 border-0 bg-transparent text-[#1A5345] shadow-none transition-colors hover:bg-transparent hover:text-[#133F34] disabled:opacity-50"
              >
                {isAiSideEffectsLoading ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon className="size-4" aria-hidden />
                )}
              </Button>
            </div>
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
