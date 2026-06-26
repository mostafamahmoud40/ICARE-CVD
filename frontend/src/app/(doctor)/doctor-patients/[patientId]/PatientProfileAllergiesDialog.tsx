"use client"

import { PlusIcon, ShieldAlertIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PatientAllergyEntry } from "../doctorPatients.types"
import { ALLERGY_CATEGORY_LABELS, type AllergyForm } from "./patientProfile.types"

export type PatientProfileAllergiesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  allergies: PatientAllergyEntry[]
  setAllergies: React.Dispatch<React.SetStateAction<PatientAllergyEntry[]>>
  newAllergy: AllergyForm
  setNewAllergy: React.Dispatch<React.SetStateAction<AllergyForm>>
  onAddEntry: () => void
}

export function PatientProfileAllergiesDialog({
  open,
  onOpenChange,
  allergies,
  setAllergies,
  newAllergy,
  setNewAllergy,
  onAddEntry,
}: PatientProfileAllergiesDialogProps) {
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
              <ShieldAlertIcon className="size-5 shrink-0 text-rose-600 sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Manage allergies
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Current allergies</Label>
                {allergies.length > 0 ? (
                  <div className="space-y-2">
                    {allergies.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-lg border-0 bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-600">
                              {entry.allergen}
                            </Badge>
                            <span className="text-[11px] font-medium text-rose-600/80">
                              {ALLERGY_CATEGORY_LABELS[entry.category]}
                            </span>
                          </div>
                          {entry.reaction ? (
                            <p className="mt-1 text-[12px] leading-relaxed text-rose-700">{entry.reaction}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAllergies((prev) => prev.filter((item) => item.id !== entry.id))}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${entry.allergen}`}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] font-medium text-muted-foreground">No allergies recorded.</p>
                )}
              </div>

              <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                <p className="mb-3 text-[13px] font-bold text-[#1A1F1E]">Add allergy</p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="allergy-category" className="text-[12px] font-bold text-[#1A1F1E]">
                        Category
                      </Label>
                      <Select
                        value={newAllergy.category}
                        onValueChange={(value) =>
                          setNewAllergy((prev) => ({
                            ...prev,
                            category: value as PatientAllergyEntry["category"],
                          }))
                        }
                      >
                        <SelectTrigger
                          id="allergy-category"
                          className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus:ring-[#1A5345]/20"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[#E8E6E0]">
                          <SelectItem value="drug">Drug</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="allergy-allergen" className="text-[12px] font-bold text-[#1A1F1E]">
                        Allergen
                      </Label>
                      <Input
                        id="allergy-allergen"
                        value={newAllergy.allergen}
                        onChange={(e) => setNewAllergy((prev) => ({ ...prev, allergen: e.target.value }))}
                        placeholder="e.g. Penicillin"
                        className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="allergy-reaction" className="text-[12px] font-bold text-[#1A1F1E]">
                      Reaction <span className="font-medium text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="allergy-reaction"
                      value={newAllergy.reaction}
                      onChange={(e) => setNewAllergy((prev) => ({ ...prev, reaction: e.target.value }))}
                      placeholder="e.g. Anaphylaxis, rash"
                      className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-white text-[12px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
                    onClick={onAddEntry}
                    disabled={!newAllergy.allergen.trim()}
                  >
                    <PlusIcon className="size-3.5" aria-hidden />
                    Add allergy
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
