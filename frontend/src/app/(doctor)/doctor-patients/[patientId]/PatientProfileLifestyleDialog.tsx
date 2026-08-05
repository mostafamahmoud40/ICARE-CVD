"use client"

import { CigaretteIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PATIENT_SMOKING_STATUSES } from "../patientProfile.constants"

export type PatientProfileLifestyleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lifestyle: { smokingStatus: string; bmi: number | null }
  setLifestyle: React.Dispatch<React.SetStateAction<{ smokingStatus: string; bmi: number | null }>>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileLifestyleDialog({
  open,
  onOpenChange,
  lifestyle,
  setLifestyle,
  onSave,
  isSaving,
}: PatientProfileLifestyleDialogProps) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
        >
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <CigaretteIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Edit lifestyle
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lifestyle-smoking" className="text-[12px] font-bold text-[#1A1F1E]">
                  Smoking status
                </Label>
                <Select
                  value={lifestyle.smokingStatus || "unset"}
                  onValueChange={(value) =>
                    setLifestyle((l) => ({
                      ...l,
                      smokingStatus: value === "unset" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger
                    id="lifestyle-smoking"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                  >
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]">
                    <SelectItem value="unset">Not set</SelectItem>
                    {PATIENT_SMOKING_STATUSES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {lifestyle.bmi != null ? (
                <p className="text-[12px] text-muted-foreground">
                  BMI is calculated from height and weight in vitals ({lifestyle.bmi}).
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#FAFAF8]"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
                onClick={() => void onSave()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
