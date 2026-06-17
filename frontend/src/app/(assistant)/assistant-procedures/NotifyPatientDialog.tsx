"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProcedureOrder } from "./assistantProcedures.types"
import { useAssistantPageTranslations } from "../use-assistant-i18n"

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
  const { t } = useAssistantPageTranslations("procedures")
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
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[460px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <MessageCircleIcon className="size-6 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E]">
                {t("notifyDialog.title")}
              </DialogTitle>
              <DialogDescription className="text-left text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                {t("notifyDialog.description", { name: order.patientName })}
                {order.patientPhone ? <> · {order.patientPhone}</> : null}
              </DialogDescription>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-8 sm:py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2Icon className="size-8 text-emerald-600" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                {t("notifyDialog.sentTitle")}
              </p>
              <p className="max-w-xs text-[13px] font-medium leading-relaxed text-muted-foreground">
                {t("notifyDialog.sentBody", { name: order.patientName })}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleClose(false)}
              className="mt-1 h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            >
              {t("notifyDialog.done")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="notify-message" className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("notifyDialog.messageLabel")}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-violet-600 sm:size-9"
                    onClick={handleGenerateAiMessage}
                    disabled={isSending || isGenerating}
                    aria-label={t("notifyDialog.aiEnhance")}
                    title={t("notifyDialog.aiEnhance")}
                  >
                    <SparklesIcon className="size-5" aria-hidden />
                    <span className="sr-only">{t("notifyDialog.aiEnhance")}</span>
                  </Button>
                </div>
                <Textarea
                  id="notify-message"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  rows={6}
                  className="min-h-[120px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:bg-white focus-visible:ring-[#1A5345] sm:min-h-[140px]"
                  placeholder={t("notifyDialog.messagePlaceholder")}
                />
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
                <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70 sm:size-4" aria-hidden />
                <p>{t("notifyDialog.deliveryHint")}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-5 py-3 sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
                onClick={() => handleClose(false)}
                disabled={isSending}
              >
                {t("notifyDialog.cancel")}
              </Button>
              <Button
                type="button"
                className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#133F34] disabled:opacity-50 disabled:shadow-none"
                onClick={() => void handleConfirm()}
                disabled={isSending || !messageDraft.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2Icon className="mr-2 size-3.5 animate-spin" aria-hidden />
                    {t("notifyDialog.sending")}
                  </>
                ) : (
                  t("notifyDialog.send")
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
