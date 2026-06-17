"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  FilePenLineIcon,
  FileUpIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import type { ProcedureOrder } from "./assistantProcedures.types"
import {
  downloadConsentForm,
  findConsentRequirement,
} from "./procedureConsent.shared"
import {
  ProcedureConsentDialog,
  type ProcedureConsentSavePayload,
} from "./ProcedureConsentDialog"
import { ProcedureConsentUploadDialog } from "./ProcedureConsentUploadDialog"

type ProcedureConsentCardProps = {
  order: ProcedureOrder
  onSaveConsent: (payload: ProcedureConsentSavePayload) => Promise<void>
  isSavingConsent: boolean
}

export function ProcedureConsentCard({
  order,
  onSaveConsent,
  isSavingConsent,
}: ProcedureConsentCardProps) {
  const { t } = useAssistantPageTranslations("procedures")
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const consentReq = findConsentRequirement(order)
  const consent = order.consent
  const isSigned = consent != null && consentReq?.isDone

  const attachmentUrl = consent?.attachmentUrl ?? consentReq?.attachmentUrl ?? null
  const attachmentName = consent?.attachmentName ?? consentReq?.attachmentName ?? null

  const signedAtLabel = consent?.signedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(consent.signedAt),
      )
    : null

  const formContent = useMemo(
    () => ({
      title: t("consent.formDocumentTitle"),
      body: t("consent.formBody", {
        patientName: order.patientName,
        procedureName: order.procedureName,
        doctorName: order.doctorName,
      }),
      patientName: order.patientName,
      patientId: order.patientId,
      patientAge: order.patientAge,
      procedureName: order.procedureName,
      doctorName: order.doctorName,
      scheduledLabel: order.scheduledAt
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
            new Date(order.scheduledAt),
          )
        : t("consent.notScheduled"),
      labels: {
        patient: t("consent.formLabels.patient"),
        procedure: t("consent.formLabels.procedure"),
        physician: t("consent.formLabels.physician"),
        patientSignature: t("consent.formLabels.patientSignature"),
        guardianSignature: t("consent.formLabels.guardianSignature"),
        guardianRelationship: t("consent.formLabels.guardianRelationship"),
        date: t("consent.formLabels.date"),
        footer: t("consent.formLabels.footer"),
      },
    }),
    [order, t],
  )

  const downloadFilename = `consent-${order.patientId}-${order.id}.html`

  const workflowSteps = [
    t("consent.workflow.download"),
    t("consent.workflow.sign"),
    t("consent.workflow.upload"),
  ]

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border p-4 shadow-sm sm:p-5",
          isSigned
            ? "border-[#1A5345]/25 bg-white"
            : "border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white",
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheckIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
              <h3 className="font-serif text-[17px] font-bold text-[#1A1F1E] sm:text-[18px]">
                {t("consent.cardTitle")}
              </h3>
              <Badge
                className={cn(
                  "rounded-lg border-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-none",
                  isSigned ? "bg-emerald-600 text-white" : "bg-amber-500 text-white",
                )}
              >
                {isSigned ? t("consent.statusSigned") : t("consent.statusPending")}
              </Badge>
              {isSigned && consent ? (
                <Badge className="rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1A5345] shadow-none">
                  {t(`consent.methods.${consent.collectionMethod}`)}
                </Badge>
              ) : null}
            </div>

            <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {t("consent.cardHintWorkflow")}
            </p>

            {!isSigned && consentReq ? (
              <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                {workflowSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 text-[12px] font-semibold text-[#1A5345]"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] text-[10px] font-bold">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            ) : null}

            {isSigned && consent ? (
              <div className="space-y-2 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#6B7870]">
                  <UserRoundIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                  <span className="font-bold text-[#1A1F1E]">{consent.signerName}</span>
                  <span>·</span>
                  <span>{t(`consent.signerTypes.${consent.signerType}`)}</span>
                  {consent.guardianRelationship ? (
                    <>
                      <span>·</span>
                      <span>{consent.guardianRelationship}</span>
                    </>
                  ) : null}
                </div>
                {signedAtLabel ? (
                  <p className="text-[11px] font-bold text-[#1A5345]">
                    {t("consent.signedAt", { date: signedAtLabel })}
                  </p>
                ) : null}
                {consent.collectionMethod === "signature" && consent.signatureDataUrl ? (
                  <div className="overflow-hidden rounded-lg border border-[#E8E6E0]/60 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={consent.signatureDataUrl}
                      alt=""
                      className="mx-auto h-14 max-w-full object-contain"
                    />
                  </div>
                ) : null}
                {attachmentUrl ? (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1A5345] hover:underline"
                  >
                    <ExternalLinkIcon className="size-3.5" aria-hidden />
                    {attachmentName ?? t("consent.viewDocument")}
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-3.5 py-2.5">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                <p className="text-[12px] font-medium leading-relaxed text-amber-800">
                  {consentReq ? t("consent.pendingHintWorkflow") : t("consent.noRequirement")}
                </p>
              </div>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px]">
            <Button
              type="button"
              size="sm"
              className="h-9 w-full rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
              onClick={() => downloadConsentForm(formContent, downloadFilename)}
              disabled={!consentReq}
            >
              <DownloadIcon className="mr-2 size-4" aria-hidden />
              {t("consent.downloadForm")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 w-full rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#E8F0EE]"
              onClick={() => setUploadDialogOpen(true)}
              disabled={!consentReq || isSavingConsent}
            >
              <FileUpIcon className="mr-2 size-4" aria-hidden />
              {isSigned && consent?.collectionMethod === "upload"
                ? t("consent.replaceUpload")
                : t("consent.uploadSignedForm")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-full border-0 bg-transparent px-2 text-[11px] font-bold text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
              onClick={() => setSignatureDialogOpen(true)}
              disabled={!consentReq || isSavingConsent}
            >
              <FilePenLineIcon className="mr-1.5 size-3.5" aria-hidden />
              {t("consent.orSignOnScreen")}
            </Button>
          </div>
        </div>
      </div>

      <ProcedureConsentDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        order={order}
        onSave={onSaveConsent}
        isSaving={isSavingConsent}
      />
      <ProcedureConsentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        order={order}
        onSave={onSaveConsent}
        isSaving={isSavingConsent}
      />
    </>
  )
}
