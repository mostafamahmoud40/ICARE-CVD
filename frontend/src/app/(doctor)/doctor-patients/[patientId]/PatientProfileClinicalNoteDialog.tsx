"use client"

import { Loader2Icon, MessageSquareIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export type PatientProfileClinicalNoteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: string
  setNote: React.Dispatch<React.SetStateAction<string>>
  onSave: () => void | Promise<void>
  isSaving: boolean
}

export function PatientProfileClinicalNoteDialog({
  open,
  onOpenChange,
  note,
  setNote,
  onSave,
  isSaving,
}: PatientProfileClinicalNoteDialogProps) {
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
              <MessageSquareIcon className="size-5 shrink-0 text-[#CC5533] sm:size-6" aria-hidden />
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                Add clinical note
              </DialogTitle>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clinical-note-body" className="text-[12px] font-bold text-[#1A1F1E]">
                Note
              </Label>
              <Textarea
                id="clinical-note-body"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Document observations, follow-up reminders, or care context…"
                className="min-h-[120px] rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] shadow-sm focus-visible:border-[#CC5533] focus-visible:ring-[#CC5533]/20"
              />
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
                disabled={!note.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <PlusIcon className="size-3.5" aria-hidden />
                )}
                Save note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
