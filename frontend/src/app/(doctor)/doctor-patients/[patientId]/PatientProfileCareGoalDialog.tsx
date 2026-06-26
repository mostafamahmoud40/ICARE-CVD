"use client"

import { Loader2Icon, PlusIcon, TargetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PatientCareGoal } from "../doctorPatients.types"
import { CARE_GOAL_STATUS_OPTIONS } from "./patientProfile.types"

export type PatientProfileCareGoalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  newCareGoal: { metric: string; target: string; current: string; status: PatientCareGoal["status"] }
  setNewCareGoal: React.Dispatch<React.SetStateAction<{ metric: string; target: string; current: string; status: PatientCareGoal["status"] }>>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileCareGoalDialog({
  open,
  onOpenChange,
  newCareGoal,
  setNewCareGoal,
  onSave,
  isSaving,
}: PatientProfileCareGoalDialogProps) {
  return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent
          aria-describedby={undefined}
          className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[520px]"
        >
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <TargetIcon className="size-5 shrink-0 text-[#CC5533] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Add care goal
              </DialogTitle>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="care-goal-metric" className="text-[12px] font-bold text-[#1A1F1E]">
                  Metric
                </Label>
                <Input
                  id="care-goal-metric"
                  value={newCareGoal.metric}
                  onChange={(e) => setNewCareGoal((prev) => ({ ...prev, metric: e.target.value }))}
                  placeholder="e.g. HbA1c, Blood pressure"
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="care-goal-target" className="text-[12px] font-bold text-[#1A1F1E]">
                  Target
                </Label>
                <Input
                  id="care-goal-target"
                  value={newCareGoal.target}
                  onChange={(e) => setNewCareGoal((prev) => ({ ...prev, target: e.target.value }))}
                  placeholder="e.g. < 7%"
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="care-goal-current" className="text-[12px] font-bold text-[#1A1F1E]">
                  Current (optional)
                </Label>
                <Input
                  id="care-goal-current"
                  value={newCareGoal.current}
                  onChange={(e) => setNewCareGoal((prev) => ({ ...prev, current: e.target.value }))}
                  placeholder="e.g. 7.4%"
                  className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Status</Label>
                <Select
                  value={newCareGoal.status}
                  onValueChange={(value) =>
                    setNewCareGoal((prev) => ({
                      ...prev,
                      status: value as PatientCareGoal["status"],
                    }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]">
                    {CARE_GOAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-[#E8E6E0]/80 px-3.5 text-[12px] font-semibold"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-0 bg-[#CC5533] px-4 text-[12px] font-bold text-white hover:bg-[#B84A2D] disabled:opacity-50"
                onClick={() => void onSave()}
                disabled={
                  !newCareGoal.metric.trim() ||
                  !newCareGoal.target.trim() ||
                  isSaving
                }
              >
                {isSaving ? (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <PlusIcon className="size-3.5" aria-hidden />
                )}
                Save goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
