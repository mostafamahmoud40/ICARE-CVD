"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

type DeleteConsultationDialogProps = {
  onConfirm: () => void
  isDeleting?: boolean
  triggerClassName?: string
  label?: string
}

export function DeleteConsultationDialog({
  onConfirm,
  isDeleting = false,
  triggerClassName,
  label = "Delete",
}: DeleteConsultationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          className={cn(
            "h-8 gap-1.5 rounded-lg border-0 bg-transparent px-2 text-[12px] font-bold text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700",
            triggerClassName,
          )}
        >
          <Trash2Icon className="size-3.5" aria-hidden />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-[#E8E6E0]/80 bg-white sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            Delete this consultation?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] font-medium leading-relaxed text-muted-foreground">
            This removes the visit report from the patient file. Linked diagnoses, prescriptions,
            and referrals for this visit will also be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isDeleting ? "Deleting…" : "Delete consultation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
