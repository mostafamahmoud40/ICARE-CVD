"use client"

import { useEffect, useState } from "react"
import { Loader2Icon, PencilLineIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  FREQUENCY_OPTIONS,
  PRESCRIPTION_TYPES,
  TIME_OPTIONS,
  buildAiInstructions,
  buildAiSideEffects,
  frequencyLabelToValue,
  frequencyValueToLabel,
} from "./prescriptionForm.shared"
import type {
  PatientPrescription,
  PrescriptionCompliance,
  PrescriptionType,
  TimeOfDay,
  UpdatePrescriptionPayload,
} from "./doctorPrescriptions.types"

type EditPrescriptionDialogProps = {
  open: boolean
  onClose: () => void
  prescription: PatientPrescription | null
  onSave: (prescriptionId: string, payload: UpdatePrescriptionPayload) => Promise<void>
}

export function EditPrescriptionDialog({
  open,
  onClose,
  prescription,
  onSave,
}: EditPrescriptionDialogProps) {
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("")
  const [type, setType] = useState<PrescriptionType>("statins")
  const [compliance, setCompliance] = useState<PrescriptionCompliance>("good")
  const [sideEffects, setSideEffects] = useState("")
  const [instructions, setInstructions] = useState("")
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay[]>(["morning"])
  const [isSaving, setIsSaving] = useState(false)
  const [isAiInstructionsLoading, setIsAiInstructionsLoading] = useState(false)
  const [isAiSideEffectsLoading, setIsAiSideEffectsLoading] = useState(false)

  useEffect(() => {
    if (!open || !prescription) return
    setDose(prescription.dose)
    setFrequency(frequencyLabelToValue(prescription.frequency))
    setType(prescription.type)
    setCompliance(prescription.compliance)
    setSideEffects(prescription.sideEffects ?? "")
    setInstructions(prescription.instructions ?? "")
    setTimeOfDay(prescription.timeOfDay.length > 0 ? prescription.timeOfDay : ["morning"])
  }, [open, prescription])

  const toggleTime = (tod: TimeOfDay) => {
    setTimeOfDay((prev) =>
      prev.includes(tod) ? prev.filter((t) => t !== tod) : [...prev, tod],
    )
  }

  const runAiPreview = async (apply: () => void) => {
    await new Promise((resolve) => setTimeout(resolve, 450))
    apply()
    toast.message("AI draft applied", {
      description: "Review before saving changes.",
    })
  }

  const handleAiInstructions = async () => {
    if (!prescription) return
    setIsAiInstructionsLoading(true)
    try {
      await runAiPreview(() => {
        setInstructions(buildAiInstructions(prescription.name, dose, frequency, timeOfDay))
      })
    } finally {
      setIsAiInstructionsLoading(false)
    }
  }

  const handleAiSideEffects = async () => {
    if (!prescription) return
    setIsAiSideEffectsLoading(true)
    try {
      await runAiPreview(() => {
        setSideEffects(buildAiSideEffects(prescription.name, type))
      })
    } finally {
      setIsAiSideEffectsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!prescription || !dose.trim() || !frequency || timeOfDay.length === 0) return
    setIsSaving(true)
    try {
      await onSave(prescription.id, {
        dose: dose.trim(),
        frequency: frequencyValueToLabel(frequency),
        type,
        compliance,
        sideEffects: sideEffects.trim() || undefined,
        instructions: instructions.trim() || undefined,
        timeOfDay,
      })
      toast.success("Prescription updated")
      onClose()
    } catch {
      toast.error("Could not update prescription")
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = Boolean(prescription && dose.trim() && frequency && timeOfDay.length > 0)

  if (!prescription) return null

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLineIcon className="size-5 text-[#1A5345]" aria-hidden />
            Edit prescription
          </DialogTitle>
          <DialogDescription>
            Update <span className="font-medium text-[#1A5345]">{prescription.name}</span> for this
            patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Medication</p>
            <p className="text-[14px] font-bold text-[#1A1F1E]">{prescription.name}</p>
          </div>

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
                <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24]">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="h-10 cursor-pointer text-[13px] text-[#152a24]"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">Compliance note</label>
            <div className="flex gap-1.5">
              {(["good", "poor"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompliance(value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors",
                    compliance === value
                      ? "bg-[#1A5345] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#1A1F1E]">Time of day</label>
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
                className="min-h-[60px] resize-none border-[#E8E6E0] pr-10 text-[13px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Generate instructions with AI"
                aria-label="Generate instructions with AI"
                disabled={isAiInstructionsLoading}
                onClick={() => void handleAiInstructions()}
                className="absolute right-1 top-1 size-8 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#133F34]"
              >
                {isAiInstructionsLoading ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon className="size-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-medium text-[#1A1F1E]">Known side effects</label>
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
                className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 border-0 bg-transparent text-[#1A5345] shadow-none hover:bg-transparent hover:text-[#133F34]"
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

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-1.5 bg-[#1A5345] hover:bg-[#0F3D32]"
            disabled={!isValid || isSaving}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <PencilLineIcon className="size-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
