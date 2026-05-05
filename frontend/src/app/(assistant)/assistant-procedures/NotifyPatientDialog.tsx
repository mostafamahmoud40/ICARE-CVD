"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BellIcon,
  CheckCircle2Icon,
  SendIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

    if (pendingReqs.length > 0) {
      lines.push("")
      lines.push(`Please complete the following before your visit (${pendingReqs.length}):`)
      pendingReqs.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    if (doneReqs.length > 0) {
      lines.push("")
      lines.push(`Already completed (${doneReqs.length}):`)
      doneReqs.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    lines.push("")
    lines.push("If you need help or want to reschedule, please contact us.")
    lines.push("ICARE Cardiology Clinic")

    setMessageDraft(lines.join("\n"))
    setIsGenerating(false)
  }

  const pendingReqs = order.requirements.filter((r) => !r.isDone)
  const doneReqs = order.requirements.filter((r) => r.isDone)
  const defaultMessage = useMemo(() => {
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

    if (pendingReqs.length > 0) {
      lines.push("")
      lines.push(`Pending requirements (${pendingReqs.length}):`)
      pendingReqs.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    if (doneReqs.length > 0) {
      lines.push("")
      lines.push(`Already completed (${doneReqs.length}):`)
      doneReqs.forEach((r) => lines.push(`- ${r.description ?? r.title}`))
    }

    lines.push("")
    lines.push("Please contact us if you have any questions.")
    lines.push("ICARE Cardiology Clinic")

    return lines.join("\n")
  }, [doneReqs, order.patientName, order.procedureName, order.scheduledAt, pendingReqs])

  useEffect(() => {
    if (open) {
      setMessageDraft(defaultMessage)
    }
  }, [defaultMessage, open])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-[#E8E6E0] bg-white p-0">
        <DialogHeader className="border-b border-[#E8E6E0] px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-[13px] font-bold text-[#102F27]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#1A5345]">
              <BellIcon className="size-3.5 text-white" />
            </div>
            Notify Patient
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2Icon className="size-6 text-emerald-500" />
            </div>
            <p className="text-center text-[12px] font-semibold text-[#102F27] sm:text-[13px]">
              Notification sent!
            </p>
            <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">
              {order.patientName} received an SMS and an in-app notification with the requirements list.
            </p>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="mt-1 rounded-lg bg-[#1A5345] px-5 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#0F3D32]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#E5EEEA] bg-[#F6FBF9] px-3 py-2">
                <UserRoundIcon className="size-4 shrink-0 text-[#1A5345]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#102F27]">{order.patientName}</p>
                  {order.patientPhone && (
                    <p className="text-[10px] text-muted-foreground">{order.patientPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Edit message
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAiMessage}
                    disabled={isSending || isGenerating}
                    className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-40 sm:text-[10px]"
                  >
                    <SparklesIcon className="size-3" />
                    {isGenerating ? "Writing..." : "AI Assist"}
                  </button>
                </div>
                <Textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  className="min-h-[140px] resize-y border-[#E5EEEA] bg-white text-[11px] leading-relaxed text-[#1A1F1E] sm:text-[12px]"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-[10px] text-blue-700 sm:text-[11px]">
                <BellIcon className="size-3 shrink-0" />
                Will send: SMS to {order.patientPhone ?? "registered number"} + in-app notification
              </div>
            </div>

            <DialogFooter className="border-t border-[#E8E6E0] px-4 py-3">
              <button
                type="button"
                onClick={() => handleClose(false)}
                disabled={isSending}
                className="rounded-lg border border-[#E5EEEA] px-4 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-[#F5F5F3] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSending}
                className="flex items-center gap-1.5 rounded-lg bg-[#1A5345] px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#0F3D32] disabled:opacity-40"
              >
                {isSending ? (
                  <div className="size-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <SendIcon className="size-3.5" />
                )}
                Send Notification
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
