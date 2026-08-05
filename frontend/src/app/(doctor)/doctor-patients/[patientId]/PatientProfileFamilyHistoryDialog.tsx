"use client"

import { PlusIcon, UsersIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FamilyHistoryEntry } from "../doctorPatients.types"
import { FAMILY_RELATIONSHIP_OPTIONS, type FamilyHistoryForm } from "./patientProfile.types"

export type PatientProfileFamilyHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyHistory: FamilyHistoryEntry[]
  setFamilyHistory: React.Dispatch<React.SetStateAction<FamilyHistoryEntry[]>>
  newFamily: FamilyHistoryForm
  setNewFamily: React.Dispatch<React.SetStateAction<FamilyHistoryForm>>
  onAddEntry: () => void
}

export function PatientProfileFamilyHistoryDialog({
  open,
  onOpenChange,
  familyHistory,
  setFamilyHistory,
  newFamily,
  setNewFamily,
  onAddEntry,
}: PatientProfileFamilyHistoryDialogProps) {
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
              <UsersIcon className="size-5 shrink-0 text-[#1A5345] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Manage family history
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Recorded conditions</Label>
                {familyHistory.length > 0 ? (
                  <div className="space-y-2">
                    {familyHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]">
                              {entry.relationship}
                            </Badge>
                            <span className="text-[13px] font-bold text-[#1A1F1E]">{entry.condition}</span>
                          </div>
                          {entry.details ? (
                            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{entry.details}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFamilyHistory((prev) => prev.filter((item) => item.id !== entry.id))}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${entry.relationship} — ${entry.condition}`}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] font-medium text-muted-foreground">No family history recorded.</p>
                )}
              </div>

              <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                <p className="mb-3 text-[13px] font-bold text-[#1A1F1E]">Add family member</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="family-relationship" className="text-[12px] font-bold text-[#1A1F1E]">
                        Relationship
                      </Label>
                      <Select
                        value={newFamily.relationship}
                        onValueChange={(value) => setNewFamily((prev) => ({ ...prev, relationship: value }))}
                      >
                        <SelectTrigger
                          id="family-relationship"
                          className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                        >
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[#E8E6E0]">
                          {FAMILY_RELATIONSHIP_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="family-condition" className="text-[12px] font-bold text-[#1A1F1E]">
                        Condition
                      </Label>
                      <Input
                        id="family-condition"
                        value={newFamily.condition}
                        onChange={(e) => setNewFamily((prev) => ({ ...prev, condition: e.target.value }))}
                        placeholder="e.g. Diabetes"
                        className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="family-details" className="text-[12px] font-bold text-[#1A1F1E]">
                      Additional details <span className="font-medium text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="family-details"
                      value={newFamily.details}
                      onChange={(e) => setNewFamily((prev) => ({ ...prev, details: e.target.value }))}
                      placeholder="e.g. Diagnosed at age 52"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                    onClick={onAddEntry}
                    disabled={!newFamily.relationship.trim() || !newFamily.condition.trim()}
                  >
                    <PlusIcon className="size-3.5" aria-hidden />
                    Add family member
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
