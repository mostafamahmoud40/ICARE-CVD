"use client"

import { useState, type ElementType } from "react"
import Link from "next/link"
import {
  ClipboardListIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PillIcon,
  PrinterIcon,
  RefreshCwIcon,
} from "lucide-react"
import { showIcareToast } from "@/components/shared/icare-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { QueueVisitOutcomes, VisitOutcomeStatus } from "./assistantQueue.visitOutcomes.types"
import { useAssistantQueueVisitOutcomes } from "./useAssistantQueueVisitOutcomes"

type PatientVisitOutcomesSectionProps = {
  queueEntryId: string
  patientName: string
}

function OutcomeStatusBadge({ status }: { status: VisitOutcomeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold text-white shadow-sm",
        status === "ready" ? "bg-emerald-600" : "bg-amber-500",
      )}
    >
      {status === "ready" ? "Ready" : "Needs prep"}
    </span>
  )
}

function OutcomeCard({
  title,
  description,
  status,
  icon: Icon,
  onPrimaryAction,
  primaryLabel,
  primaryVariant = "default",
}: {
  title: string
  description: string
  status: VisitOutcomeStatus
  icon: ElementType
  onPrimaryAction: () => void
  primaryLabel: string
  primaryVariant?: "default" | "outline"
}) {
  return (
    <div className="rounded-lg border border-[#E8E6E0] bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className="mt-0.5 size-4 shrink-0 text-[#1A5345]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#102F27] sm:text-[12px]">{title}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{description}</p>
          </div>
        </div>
        <OutcomeStatusBadge status={status} />
      </div>
      <Button
        type="button"
        size="sm"
        variant={primaryVariant === "outline" ? "outline" : "default"}
        className={cn(
          "h-8 w-full gap-1.5 text-[10px] sm:text-[11px]",
          primaryVariant === "default" &&
            "bg-[#1A5345] text-white hover:bg-[#133F34]",
          primaryVariant === "outline" &&
            "border-[#D6E6DF] bg-white text-[#1A5345] hover:bg-[#F6FBF9]",
        )}
        onClick={onPrimaryAction}
      >
        {primaryLabel}
      </Button>
    </div>
  )
}

function PrescriptionViewDialog({
  outcomes,
  patientName,
  open,
  onOpenChange,
}: {
  outcomes: QueueVisitOutcomes
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { prescription, doctorName, doctorSpecialty } = outcomes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-[#E8E6E0] bg-white p-0">
        <DialogTitle className="sr-only">Prescription for {patientName}</DialogTitle>
        <div className="border-b border-[#E8E6E0]/70 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-[#1A1F1E]">Prescription</p>
              <p className="text-[11px] text-muted-foreground">
                {doctorName} · {doctorSpecialty}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 border-0 bg-transparent text-[11px] font-bold text-[#1A5345] shadow-none hover:bg-[#F6FBF9]"
              onClick={() => window.print()}
            >
              <PrinterIcon className="size-3.5" />
              Print
            </Button>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-5">
          {prescription.items.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No medications were recorded for this visit. Check uploaded documents on the patient chart if a paper Rx was scanned.
            </p>
          ) : (
            prescription.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2.5"
              >
                <p className="text-[12px] font-bold text-[#1A1F1E]">
                  {item.name} {item.dose}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.frequency}
                  {item.duration ? ` · ${item.duration}` : ""}
                </p>
                {item.instructions && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#102F27]">
                    {item.instructions}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportViewDialog({
  outcomes,
  patientName,
  open,
  onOpenChange,
}: {
  outcomes: QueueVisitOutcomes
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { report, doctorName, doctorSpecialty } = outcomes

  const sections = [
    { label: "Chief complaint", value: report.chiefComplaint },
    { label: "History", value: report.historyOfPresentIllness },
    { label: "Physical exam", value: report.physicalExam },
    { label: "Plan", value: report.plan },
    { label: "Notes", value: report.notes },
  ].filter((s) => s.value?.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-[#E8E6E0] bg-white p-0">
        <DialogTitle className="sr-only">Visit report for {patientName}</DialogTitle>
        <div className="border-b border-[#E8E6E0]/70 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-[#1A1F1E]">Visit report</p>
              <p className="text-[11px] text-muted-foreground">
                {doctorName} · {doctorSpecialty}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 border-0 bg-transparent text-[11px] font-bold text-[#1A5345] shadow-none hover:bg-[#F6FBF9]"
              onClick={() => window.print()}
            >
              <PrinterIcon className="size-3.5" />
              Print
            </Button>
          </div>
        </div>
        <div className="space-y-4 px-4 py-4 sm:px-5">
          {report.diagnoses.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold text-muted-foreground">Diagnoses</p>
              <ul className="space-y-1.5">
                {report.diagnoses.map((dx) => (
                  <li
                    key={`${dx.icdCode}-${dx.type}`}
                    className="rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2 text-[11px]"
                  >
                    <span className="font-bold text-[#1A5345]">{dx.icdCode}</span>
                    {" · "}
                    {dx.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-1 text-[10px] font-bold text-muted-foreground">{section.label}</p>
              <p className="text-[12px] leading-relaxed text-[#102F27]">{section.value}</p>
            </div>
          ))}
          {(report.followUpTimeframe || report.followUpInstructions) && (
            <div className="rounded-lg border border-[#E5EEEA] bg-[#F6FBF9] px-3 py-2.5">
              <p className="text-[10px] font-bold text-[#1A5345]">Follow-up</p>
              {report.followUpTimeframe && (
                <p className="mt-1 text-[11px] font-medium text-[#102F27]">{report.followUpTimeframe}</p>
              )}
              {report.followUpInstructions && (
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {report.followUpInstructions}
                </p>
              )}
            </div>
          )}
          {sections.length === 0 && report.diagnoses.length === 0 && (
            <p className="text-[12px] text-muted-foreground">
              The doctor has not finalized the visit report yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PatientVisitOutcomesSection({
  queueEntryId,
  patientName,
}: PatientVisitOutcomesSectionProps) {
  const [showPrescription, setShowPrescription] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const { outcomes, isLoadingOutcomes, isOutcomesError, refetchOutcomes } =
    useAssistantQueueVisitOutcomes(queueEntryId)

  const prescriptionDescription =
    outcomes?.prescription.status === "ready"
      ? outcomes.prescription.medicationCount > 0
        ? `${outcomes.prescription.medicationCount} medication${outcomes.prescription.medicationCount === 1 ? "" : "s"} on file`
        : "Prescription document on chart"
      : "Waiting for the doctor to sign off medications"

  const reportDescription =
    outcomes?.report.status === "ready"
      ? "Visit summary is ready for the patient"
      : "Waiting for the doctor to complete the consultation report"

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2.5 sm:p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-[#102F27] sm:text-[11px]">
            Prescription & report
          </p>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            Hand off visit documents to the patient before they leave.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetchOutcomes()}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1A5345] hover:underline"
          aria-label="Refresh visit outcomes"
        >
          <RefreshCwIcon className="size-3" />
          Refresh
        </button>
      </div>

      {isLoadingOutcomes ? (
        <div className="flex items-center gap-2 py-6 text-[11px] text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading visit documents…
        </div>
      ) : isOutcomesError || !outcomes ? (
        <div className="space-y-2 py-4">
          <p className="text-[11px] text-muted-foreground">
            Could not load prescription and report status.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-[#D6E6DF] text-[11px]"
            onClick={() => void refetchOutcomes()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <OutcomeCard
              title="Prescription"
              description={prescriptionDescription}
              status={outcomes.prescription.status}
              icon={PillIcon}
              primaryLabel={
                outcomes.prescription.status === "ready" ? "View prescription" : "Prepare prescription"
              }
              primaryVariant={outcomes.prescription.status === "ready" ? "default" : "outline"}
              onPrimaryAction={() => {
                if (outcomes.prescription.status === "ready") {
                  setShowPrescription(true)
                } else {
                  showIcareToast({
                    title: "Prescription not ready yet",
                    description: "Refresh after the doctor signs off medications for this visit.",
                  })
                  void refetchOutcomes()
                }
              }}
            />
            <OutcomeCard
              title="Visit report"
              description={reportDescription}
              status={outcomes.report.status}
              icon={FileTextIcon}
              primaryLabel={
                outcomes.report.status === "ready" ? "View report" : "Prepare report"
              }
              primaryVariant={outcomes.report.status === "ready" ? "default" : "outline"}
              onPrimaryAction={() => {
                if (outcomes.report.status === "ready") {
                  setShowReport(true)
                } else {
                  showIcareToast({
                    title: "Report not ready yet",
                    description: "Refresh once the doctor completes and saves the consultation report.",
                  })
                  void refetchOutcomes()
                }
              }}
            />
          </div>

          {outcomes.prescription.status === "pending" || outcomes.report.status === "pending" ? (
            <div className="mt-3 rounded-lg border border-amber-200/70 bg-amber-50/80 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <ClipboardListIcon className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-800 sm:text-[11px]">
                    Still preparing documents
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700/90 sm:text-[11px]">
                    Refresh once the doctor finishes the consultation. You can also open the patient chart for full history.
                  </p>
                  <Link
                    href={`/assistant-patients/${outcomes.patientId}`}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#1A5345] hover:underline sm:text-[11px]"
                  >
                    Open patient chart
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[10px] text-muted-foreground sm:text-[11px]">
              Both documents are ready — print or share with the patient at checkout.
            </p>
          )}

          <PrescriptionViewDialog
            outcomes={outcomes}
            patientName={patientName}
            open={showPrescription}
            onOpenChange={setShowPrescription}
          />
          <ReportViewDialog
            outcomes={outcomes}
            patientName={patientName}
            open={showReport}
            onOpenChange={setShowReport}
          />
        </>
      )}
    </div>
  )
}
