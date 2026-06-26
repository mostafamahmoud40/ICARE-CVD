"use client"

import { Loader2Icon, UserRoundIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PATIENT_MARITAL_STATUSES } from "../patientProfile.constants"

export type PatientProfilePersonalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  personal: { maritalStatus: string; occupation: string; nationalId: string }
  setPersonal: React.Dispatch<React.SetStateAction<{ maritalStatus: string; occupation: string; nationalId: string }>>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfilePersonalDialog({
  open,
  onOpenChange,
  personal,
  setPersonal,
  onSave,
  isSaving,
}: PatientProfilePersonalDialogProps) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[480px]"
        >
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <UserRoundIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Edit personal info
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="personal-marital" className="text-[12px] font-bold text-[#1A1F1E]">
                  Marital status
                </Label>
                <Select
                  value={personal.maritalStatus || "unset"}
                  onValueChange={(value) =>
                    setPersonal((prev) => ({
                      ...prev,
                      maritalStatus: value === "unset" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger
                    id="personal-marital"
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                  >
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]">
                    <SelectItem value="unset">Not set</SelectItem>
                    {PATIENT_MARITAL_STATUSES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="personal-occupation" className="text-[12px] font-bold text-[#1A1F1E]">
                  Occupation
                </Label>
                <Input
                  id="personal-occupation"
                  value={personal.occupation}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, occupation: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="personal-national-id" className="text-[12px] font-bold text-[#1A1F1E]">
                  National ID
                </Label>
                <Input
                  id="personal-national-id"
                  value={personal.nationalId}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, nationalId: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>
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
