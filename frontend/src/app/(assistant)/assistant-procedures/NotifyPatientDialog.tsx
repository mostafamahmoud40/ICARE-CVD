"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BellIcon,
  CheckCircle2Icon,
  MessageSquareTextIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProcedureOrder } from "./assistantProcedures.types"

type NotifyPatientDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: ProcedureOrder
  onConfirm: () => Promise<void>
  isSending: boolean
}

export function NotifyPatientDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isSending,
}: NotifyPatientDialogProps) {
  const [sent, setSent] = useState(false)
  const [messageDraft, setMessageDraft] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const requirementsFingerprint = useMemo(
    () =>
      order.requirements
        .map((r) => `${r.id}:${r.isDone}:${r.description ?? r.title}`)
        .join("|"),
    [order.requirements],
  )

  const defaultMessage = useMemo(() => {
    const pend = order.requirements.filter((r) => !r.isDone)
    const done = order.requirements.filter((r) => r.isDone)

    const lines: string[] = [
      `Dear ${order.patientName},`,
      "",
      `This is a reminder from ICARE Clinic regarding your upcoming ${order.procedureName}.`,
    ]

    if (order.scheduledAt) {
      lines.push(
        `Scheduled: ${new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(order.scheduledAt))}`,
      )
    }

    if (pend.length > 0) {
      lines.push("")
      lines.push(`Pending requirements (${pend.length}):`)
      pend.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    if (done.length > 0) {
      lines.push("")
      lines.push(`Already completed (${done.length}):`)
      done.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    lines.push("")
    lines.push("Please contact us if you have any questions.")
    lines.push("ICARE Cardiology Clinic")

    return lines.join("\n")
  }, [order.patientName, order.procedureName, order.scheduledAt, requirementsFingerprint])

  const handleGenerateAiMessage = () => {
    setIsGenerating(true)

    const lines: string[] = [
      `Dear ${order.patientName},`,
      "",
      `We are reaching out from ICARE Cardiology Clinic to help you prepare for your upcoming ${order.procedureName}.`,
    ]

    if (order.scheduledAt) {
      lines.push(
        `Appointment time: ${new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(order.scheduledAt))}.`,
      )
    }

    const pend = order.requirements.filter((r) => !r.isDone)
    const done = order.requirements.filter((r) => r.isDone)

    if (pend.length > 0) {
      lines.push("")
      lines.push(`Please complete the following before your visit (${pend.length}):`)
      pend.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    if (done.length > 0) {
      lines.push("")
      lines.push(`Already completed (${done.length}):`)
      done.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    lines.push("")
    lines.push("If you need help or want to reschedule, please contact us.")
    lines.push("ICARE Cardiology Clinic")

    setMessageDraft(lines.join("\n"))
    setIsGenerating(false)
  }

  const handleConfirm = async () => {
    await onConfirm()
    setSent(true)
  }

  const handleClose = (v: boolean) => {
    if (!isSending) {
      onOpenChange(v)
      if (!v) setSent(false)
    }
  }

  useEffect(() => {
    if (open) {
      setMessageDraft(defaultMessage)
    }
  }, [defaultMessage, open])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[32px] border-0 bg-white p-0 shadow-2xl sm:max-w-lg",
        )}
      >
        <button
          type="button"
          onClick={() => handleClose(false)}
          disabled={isSending}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg border border-[#E8E6E0]/60 bg-white/90 text-muted-foreground shadow-sm transition-colors hover:bg-[#F9F8F5] hover:text-[#102F27] disabled:pointer-events-none disabled:opacity-40 sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <XIcon className="size-3.5" />
        </button>

        {/* Header Section */}
        <div className="relative border-b border-[#E8E6E0]/50 bg-[#F9F8F5]/60 px-4 pb-3 pt-4 pr-12 text-left sm:px-5 sm:pb-3.5 sm:pt-4 sm:pr-14">
          <DialogHeader className="gap-0 space-y-0">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1A5345] text-white shadow-sm shadow-[#1A5345]/15">
                <BellIcon className="size-[18px]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="font-serif text-[15px] font-semibold leading-tight tracking-tight text-[#1A1F1E] sm:text-[16px]">
                  Clinical dispatch
                </DialogTitle>
                <DialogDescription className="text-[11px] font-normal leading-snug text-muted-foreground sm:text-[12px]">
                  Notification summary
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-6 px-8 py-14 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100/50" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                <CheckCircle2Icon className="size-10 text-emerald-600" aria-hidden />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-serif text-[22px] font-bold text-[#102F27]">Message dispatched</p>
              <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground font-medium">
                The checklist summary has been sent to <span className="text-[#1A5345] font-bold">{order.patientName}</span> via SMS and in-app alert.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleClose(false)}
              className="mt-2 h-12 w-full max-w-[200px] rounded-2xl bg-[#1A5345] px-8 text-[14px] font-bold text-white shadow-xl shadow-[#1A5345]/10 transition-all hover:bg-[#133F34] active:scale-95"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              {/* Message Composer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-message" className="text-[12px] font-semibold text-[#102F27]/80">
                    Message content
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateAiMessage}
                    disabled={isSending || isGenerating}
                    className="flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-1.5 text-[11px] font-bold text-violet-700 transition-all hover:bg-violet-100 hover:text-violet-800 active:scale-95 disabled:opacity-40"
                  >
                    <SparklesIcon className="size-3.5" aria-hidden />
                    {isGenerating ? "Refining..." : "AI Enhancement"}
                  </button>
                </div>
                <Textarea
                  id="notify-message"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Draft your clinical update here..."
                  className="min-h-[160px] resize-none rounded-[24px] border-[#E8E6E0] bg-[#F9F8F5]/30 p-5 text-[14px] font-medium leading-relaxed text-[#1A1F1E] placeholder:text-muted-foreground/40 focus-visible:ring-[#1A5345]/10 sm:min-h-[180px]"
                />
              </div>

              {/* Delivery Info */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-3 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#1A5345] shadow-sm ring-1 ring-[#E8E6E0]/50">
                  <MessageSquareTextIcon className="size-3.5" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5 pt-0.5">
                  <p className="text-[11px] font-semibold leading-none text-[#102F27] sm:text-[12px]">
                    Multi-channel delivery
                  </p>
                  <p className="text-[10px] font-medium leading-snug text-muted-foreground sm:text-[11px]">
                    Sent by{" "}
                    <span className="font-semibold text-[#1A5345]">secure SMS</span>
                    {" "}and{" "}
                    <span className="font-semibold text-[#1A5345]">in-app notification</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 sm:gap-2.5 sm:px-5 sm:py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
                disabled={isSending}
                className="h-9 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-semibold text-muted-foreground hover:bg-[#FAFAF9] hover:text-[#102F27]"
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={isSending || !messageDraft.trim()}
                className="h-9 gap-1.5 rounded-lg bg-[#1A5345] px-4 text-[12px] font-semibold text-white shadow-sm shadow-[#1A5345]/15 hover:bg-[#133F34] disabled:opacity-40"
              >
                {isSending ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <SendIcon className="size-3.5 shrink-0" aria-hidden />
                )}
                Dispatch
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
