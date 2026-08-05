"use client"

import { formatDistanceToNow } from "date-fns"
import { FileTextIcon, Trash2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { AddPatientDraft } from "./addPatient.drafts"

type AddPatientDraftsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  drafts: AddPatientDraft[]
  activeDraftId: string | null
  onRestore: (draftId: string) => void
  onDelete: (draftId: string) => void
}

export function AddPatientDraftsDialog({
  open,
  onOpenChange,
  drafts,
  activeDraftId,
  onRestore,
  onDelete,
}: AddPatientDraftsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-[#F9F8F5] p-0 sm:max-w-[480px]">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            Saved drafts
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Restore a draft to continue registering a patient. Uploaded files are not saved in
            drafts.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-4">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-white px-6 py-10 text-center">
              <FileTextIcon className="size-8 text-slate-300" aria-hidden />
              <p className="text-[14px] font-semibold text-[#1A1F1E]">No saved drafts yet</p>
              <p className="text-[12px] text-muted-foreground">
                Use &quot;Save draft&quot; to keep your progress and return later.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {drafts.map((draft) => {
                const isActive = draft.id === activeDraftId
                return (
                  <li
                    key={draft.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors",
                      isActive
                        ? "border-[#1A5345]/40 ring-1 ring-[#1A5345]/10"
                        : "border-[#E8E6E0]/80",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[#1A1F1E]">
                        {draft.label}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Saved{" "}
                        {formatDistanceToNow(new Date(draft.savedAt), { addSuffix: true })}
                        {draft.snapshot.values.email.trim()
                          ? ` · ${draft.snapshot.values.email.trim()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full border-[#E8E6E0] px-3 text-[12px] font-semibold text-[#1A5345] hover:bg-[#1A5345]/5"
                        onClick={() => onRestore(draft.id)}
                      >
                        Restore
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-red-600"
                        aria-label={`Delete draft ${draft.label}`}
                        onClick={() => onDelete(draft.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
