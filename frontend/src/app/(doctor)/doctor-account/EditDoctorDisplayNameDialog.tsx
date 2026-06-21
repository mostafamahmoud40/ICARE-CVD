"use client"

import { useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type EditDoctorDisplayNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onSubmit: (fullName: string) => Promise<void>
  isPending: boolean
}

export function EditDoctorDisplayNameDialog({
  open,
  onOpenChange,
  initialName,
  onSubmit,
  isPending,
}: EditDoctorDisplayNameDialogProps) {
  const [fullName, setFullName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFullName(initialName)
      setError(null)
    }
  }, [open, initialName])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = fullName.trim()
    if (trimmed.length < 2) {
      setError("Enter at least 2 characters.")
      return
    }
    setError(null)
    await onSubmit(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white p-0 sm:max-w-[440px]">
        <DialogHeader className="px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            Edit display name
          </DialogTitle>
          <DialogDescription className="text-[13px] font-medium text-muted-foreground">
            This is the name shown in the app header, sidebar, and on consultation reports.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="doctor-display-name" className="text-[12px] font-bold text-[#1A1F1E]">
              Full name
            </Label>
            <Input
              id="doctor-display-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              autoFocus
            />
            {error ? (
              <p className="text-[12px] font-medium text-rose-600">{error}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-9 rounded-lg border-0 bg-[#1A5345] text-white hover:bg-[#133F34]"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save name"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
