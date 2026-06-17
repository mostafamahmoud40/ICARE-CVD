"use client"

import { useEffect, useMemo, useState } from "react"
import { FileTextIcon, Loader2Icon } from "lucide-react"

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
import type { ConsentSignerType, ProcedureConsent, ProcedureOrder } from "./assistantProcedures.types"
import { findConsentRequirement, dataUrlToFile } from "./procedureConsent.shared"
import { ProcedureSignaturePad } from "./ProcedureSignaturePad"

export type ProcedureConsentSavePayload = {
  consent: ProcedureConsent
  file: File
}

type ProcedureConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: ProcedureOrder
  onSave: (payload: ProcedureConsentSavePayload) => Promise<void>
  isSaving: boolean
}

export function ProcedureConsentDialog({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving,
}: ProcedureConsentDialogProps) {
  const { t } = useAssistantPageTranslations("procedures")
  const consentReq = findConsentRequirement(order)

  const [signerType, setSignerType] = useState<ConsentSignerType>("patient")
  const [signerName, setSignerName] = useState(order.patientName)
  const [guardianRelationship, setGuardianRelationship] = useState("")
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const existing = order.consent
    setSignerType(existing?.signerType ?? "patient")
    setSignerName(existing?.signerName ?? order.patientName)
    setGuardianRelationship(existing?.guardianRelationship ?? "")
    setSignatureDataUrl(existing?.signatureDataUrl ?? null)
    setError(null)
  }, [open, order])

  const consentBody = useMemo(
    () =>
      t("consent.formBody", {
        patientName: order.patientName,
        procedureName: order.procedureName,
        doctorName: order.doctorName,
      }),
    [order.doctorName, order.patientName, order.procedureName, t],
  )

  const canSubmit =
    signerName.trim().length > 0 &&
    signatureDataUrl != null &&
    (signerType === "patient" || guardianRelationship.trim().length > 0) &&
    consentReq != null

  const handleSave = async () => {
    if (!consentReq || !signatureDataUrl) {
      setError(t("consent.errors.incomplete"))
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
          collectionMethod: "signature",
          signatureDataUrl,
          attachmentUrl: null,
          attachmentName: null,
          signedAt: new Date().toISOString(),
        },
        file: dataUrlToFile(signatureDataUrl, `consent-signature-${order.id}.png`),
      })
      onOpenChange(false)
    } catch {
      setError(t("consent.errors.incomplete"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E8E6E0] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            {t("consent.dialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {t("consent.dialogDescription", { name: order.patientName })}
          </DialogDescription>
        </DialogHeader>

        {!consentReq ? (
          <p className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-[13px] font-medium text-amber-800">
            {t("consent.noRequirement")}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileTextIcon className="size-4 text-[#1A5345]" aria-hidden />
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#1A5345]">
                  {t("consent.formPreview")}
                </p>
              </div>
              <p className="text-[13px] leading-relaxed text-[#1A1F1E]">{consentBody}</p>
            </div>

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
              <Label htmlFor="consent-signer-name" className="text-[12px] font-bold text-[#1A1F1E]">
                {signerType === "guardian" ? t("consent.guardianName") : t("consent.patientName")}
              </Label>
              <Input
                id="consent-signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="h-9 border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
              />
            </div>

            {signerType === "guardian" ? (
              <div className="space-y-2">
                <Label htmlFor="consent-guardian-rel" className="text-[12px] font-bold text-[#1A1F1E]">
                  {t("consent.guardianRelationship")}
                </Label>
                <Input
                  id="consent-guardian-rel"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  placeholder={t("consent.guardianRelationshipPlaceholder")}
                  className="h-9 border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">{t("consent.signature")}</Label>
              <ProcedureSignaturePad
                onChange={setSignatureDataUrl}
                clearLabel={t("consent.clearSignature")}
              />
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
              t("consent.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
