"use client"

import { useEffect, useRef, useState } from "react"
import { FileUpIcon, Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import type { ConsentSignerType, ProcedureOrder } from "./assistantProcedures.types"
import { findConsentRequirement } from "./procedureConsent.shared"
import type { ProcedureConsentSavePayload } from "./ProcedureConsentDialog"

const ACCEPTED_TYPES = ".pdf,.png,.jpg,.jpeg,.webp"

type ProcedureConsentUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: ProcedureOrder
  onSave: (payload: ProcedureConsentSavePayload) => Promise<void>
  isSaving: boolean
}

export function ProcedureConsentUploadDialog({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving,
}: ProcedureConsentUploadDialogProps) {
  const { t } = useAssistantPageTranslations("procedures")
  const consentReq = findConsentRequirement(order)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [signerType, setSignerType] = useState<ConsentSignerType>("patient")
  const [signerName, setSignerName] = useState(order.patientName)
  const [guardianRelationship, setGuardianRelationship] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const existing = order.consent
    setSignerType(existing?.signerType ?? "patient")
    setSignerName(existing?.signerName ?? order.patientName)
    setGuardianRelationship(existing?.guardianRelationship ?? "")
    setSelectedFile(null)
    setError(null)
  }, [open, order])

  const canSubmit =
    selectedFile != null &&
    signerName.trim().length > 0 &&
    (signerType === "patient" || guardianRelationship.trim().length > 0) &&
    consentReq != null

  const handleSave = async () => {
    if (!consentReq || !selectedFile) {
      setError(t("consent.errors.uploadRequired"))
      return
    }
    if (signerType === "guardian" && !guardianRelationship.trim()) {
      setError(t("consent.errors.guardianRelationship"))
      return
    }

    setError(null)
    try {
      await onSave({
        consent: {
          requirementId: consentReq.id,
          signerType,
          signerName: signerName.trim(),
          guardianRelationship: signerType === "guardian" ? guardianRelationship.trim() : null,
          collectionMethod: "upload",
          signatureDataUrl: null,
          attachmentUrl: null,
          attachmentName: selectedFile.name,
          signedAt: new Date().toISOString(),
        },
        file: selectedFile,
      })
      onOpenChange(false)
    } catch {
      setError(t("consent.errors.uploadFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E8E6E0] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            {t("consent.uploadDialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {t("consent.uploadDialogDescription", { name: order.patientName })}
          </DialogDescription>
        </DialogHeader>

        {!consentReq ? (
          <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-[13px] font-medium text-amber-800">
            {t("consent.noRequirement")}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">{t("consent.signerType")}</Label>
              <div className="flex flex-wrap gap-2">
                {(["patient", "guardian"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSignerType(type)
                      if (type === "patient") {
                        setSignerName(order.patientName)
                        setGuardianRelationship("")
                      }
                    }}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-[12px] font-bold transition-colors",
                      signerType === type
                        ? "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-white text-muted-foreground hover:border-[#1A5345]/30 hover:text-[#1A1F1E]",
                    )}
                  >
                    {t(`consent.signerTypes.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consent-upload-signer" className="text-[12px] font-bold text-[#1A1F1E]">
                {signerType === "guardian" ? t("consent.guardianName") : t("consent.patientName")}
              </Label>
              <Input
                id="consent-upload-signer"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="h-9 border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
              />
            </div>

            {signerType === "guardian" ? (
              <div className="space-y-2">
                <Label htmlFor="consent-upload-rel" className="text-[12px] font-bold text-[#1A1F1E]">
                  {t("consent.guardianRelationship")}
                </Label>
                <Input
                  id="consent-upload-rel"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  placeholder={t("consent.guardianRelationshipPlaceholder")}
                  className="h-9 border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">{t("consent.uploadFile")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setSelectedFile(file)
                  setError(null)
                }}
              />
              {selectedFile ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/80 bg-[#FAFAF8] px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileUpIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                    <span className="truncate text-[13px] font-semibold text-[#1A1F1E]">{selectedFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-rose-600"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    aria-label={t("consent.removeFile")}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-4 py-8 text-center transition-colors hover:border-[#1A5345]/30 hover:bg-[#E8F0EE]/30"
                >
                  <FileUpIcon className="size-8 text-[#1A5345]/50" aria-hidden />
                  <span className="text-[13px] font-bold text-[#1A5345]">{t("consent.chooseFile")}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{t("consent.uploadFormats")}</span>
                </button>
              )}
            </div>

            {error ? <p className="text-[12px] font-bold text-rose-600">{error}</p> : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("consent.cancel")}
          </Button>
          <Button
            type="button"
            className="h-9 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
            onClick={() => void handleSave()}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                {t("consent.saving")}
              </>
            ) : (
              t("consent.uploadSave")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
