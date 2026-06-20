"use client"

import { useState } from "react"
import { ActivityIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateVitalReadingInput } from "./vitals.types"

export interface AddVitalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateVitalReadingInput) => Promise<void>
  isSubmitting?: boolean
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value == null || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function AddVitalsDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: AddVitalsDialogProps) {
  const [formKey, setFormKey] = useState(0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const values: CreateVitalReadingInput = {
      systolicBp: parseOptionalNumber(formData.get("systolic")),
      diastolicBp: parseOptionalNumber(formData.get("diastolic")),
      heartRate: parseOptionalNumber(formData.get("heartRate")),
      oxygenSaturation: parseOptionalNumber(formData.get("spo2")),
      weight: parseOptionalNumber(formData.get("weight")),
      temperature: parseOptionalNumber(formData.get("temperature")),
    }

    const hasAnyValue = Object.values(values).some((value) => value != null)
    if (!hasAnyValue) {
      toast.error("Enter at least one measurement")
      return
    }

    if (
      (values.systolicBp != null && values.diastolicBp == null) ||
      (values.systolicBp == null && values.diastolicBp != null)
    ) {
      toast.error("Blood pressure needs both systolic and diastolic values")
      return
    }

    try {
      await onSubmit(values)
      setFormKey((key) => key + 1)
      onOpenChange(false)
    } catch {
      // Error toast is handled by the mutation hook.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:bg-[#133F34]"
        >
          <PlusIcon className="size-3.5" aria-hidden />
          Add vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <ActivityIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 space-y-1">
              <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                Add vitals reading
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-[#6B7870]">
                Enter your latest measurements to keep your health tracking up to date.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit}>
          <div className="grid gap-4 px-5 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="systolic" className="text-[11px] font-bold text-[#6B7870]">
                  Systolic (mmHg)
                </Label>
                <Input
                  id="systolic"
                  name="systolic"
                  placeholder="120"
                  type="number"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diastolic" className="text-[11px] font-bold text-[#6B7870]">
                  Diastolic (mmHg)
                </Label>
                <Input
                  id="diastolic"
                  name="diastolic"
                  placeholder="80"
                  type="number"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="heartRate" className="text-[11px] font-bold text-[#6B7870]">
                  Heart rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  name="heartRate"
                  placeholder="72"
                  type="number"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spo2" className="text-[11px] font-bold text-[#6B7870]">
                  SpO₂ (%)
                </Label>
                <Input
                  id="spo2"
                  name="spo2"
                  placeholder="98"
                  type="number"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-[11px] font-bold text-[#6B7870]">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  placeholder="75.5"
                  type="number"
                  step="0.1"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temperature" className="text-[11px] font-bold text-[#6B7870]">
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  name="temperature"
                  placeholder="36.8"
                  type="number"
                  step="0.1"
                  className="h-10 rounded-xl border-[#E8E6E0] text-[13px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-[#E8E6E0]/60 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save reading"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
