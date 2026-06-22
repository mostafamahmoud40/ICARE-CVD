"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ActivityIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  PencilIcon,
  StethoscopeIcon,
  StickyNoteIcon,
} from "lucide-react"
import type { DiagnosisRecord, DoctorPatientsPagePatient, VisitRecord } from "../../../doctorPatients.types"
import { DIAGNOSIS_CATEGORY_LABELS } from "../../../doctorPatients.types"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DiagnosisForm } from "../DiagnosisForm"
import type { DiagnosisFormValues } from "../diagnosisForm.types"
import {
  DiagnosedByCell,
  SeverityBadge,
  StatusBadge,
  TypeBadge,
  diagnosesScrollbarCss,
  findRelatedConsultationVisits,
  fmtDateTime,
  fmtShort,
  parseDiagnosisNotes,
  toDiagnosisForm,
  visitTypeStyles,
  yesNoLabel,
} from "../diagnosis.shared"
import { useDoctorPatientDiagnoses } from "../../../useDoctorPatientDiagnoses"
import { cn } from "@/lib/utils"

type DiagnosisDetailPageProps = {
  patient: DoctorPatientsPagePatient
  diagnosis: DiagnosisRecord
  visits: VisitRecord[]
}

export function DiagnosisDetailPage({ patient, diagnosis, visits }: DiagnosisDetailPageProps) {
  const { updateDiagnosis, isSaving } = useDoctorPatientDiagnoses(patient.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<DiagnosisFormValues>(toDiagnosisForm(diagnosis))

  const parsed = parseDiagnosisNotes(diagnosis.notes)
  const relatedVisits = findRelatedConsultationVisits(diagnosis.icdCode, visits)
  const basePath = `/doctor-patients/${patient.id}`

  async function handleSave(data: DiagnosisFormValues) {
    await updateDiagnosis({ diagnosisId: diagnosis.id, values: data })
    setDialogOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="mb-3 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="h-8 gap-1.5 rounded-lg px-2 text-[12px] font-bold text-[#6B7870] hover:bg-white hover:text-[#1A5345]"
            >
              <Link href={`${basePath}/diagnoses`}>
                <ArrowLeftIcon className="size-3.5" aria-hidden />
                Back to list
              </Link>
            </Button>
          </div>

          <Breadcrumb>
            <BreadcrumbList className="text-[11px] sm:text-[12px]">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[11px] font-medium sm:text-[12px]">
                    Patients
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={basePath} className="text-[11px] font-medium sm:text-[12px]">
                    {patient.fullName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`${basePath}/diagnoses`} className="text-[11px] font-medium sm:text-[12px]">
                    Diagnoses &amp; Conditions
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[240px] truncate text-[11px] font-medium sm:max-w-none sm:text-[12px]">
                  {diagnosis.description}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <StethoscopeIcon className="mt-1 size-5 shrink-0 text-[#1A5345] sm:size-6" strokeWidth={2.5} aria-hidden />
              <div className="min-w-0">
                <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                  {diagnosis.description}
                </h1>
                
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-medium text-[#6B7870] sm:text-[13px]">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#1A1F1E]">Patient:</span>
                    <span>{patient.fullName}</span>
                  </div>
                  <span className="hidden text-[#E8E6E0] sm:inline" aria-hidden>•</span>
                  <div className="flex items-center gap-1 rounded bg-[#E8F0EE]/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#1A5345]">
                    <span>ICD-10:</span>
                    <span>{diagnosis.icdCode}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <TypeBadge type={diagnosis.type} />
                  <StatusBadge status={diagnosis.status} />
                  <SeverityBadge severity={diagnosis.severity} />
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditForm(toDiagnosisForm(diagnosis))
                setDialogOpen(true)
              }}
              className="h-8 gap-2 self-start rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            >
              <PencilIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              Edit diagnosis
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 custom-scrollbar">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            
            {/* Left side: Main Content (Clinical Notes + Visit Reports) */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* Clinical Notes Section */}
              <section className="space-y-3">
                <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                  <StickyNoteIcon className="size-4 text-[#1A5345]" aria-hidden />
                  Clinical notes
                </h2>
                <div className="relative overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6 transition-all hover:shadow-md">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1A5345] to-[#E8F0EE]" aria-hidden />
                  {parsed.clinicalNotes ? (
                    <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[#1A1F1E] sm:text-[14px]">
                      {parsed.clinicalNotes}
                    </p>
                  ) : (
                    <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px] italic">No clinical notes recorded.</p>
                  )}
                </div>
              </section>

              {/* Related Visit Reports Section */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <FileTextIcon className="size-4 text-[#1A5345]" aria-hidden />
                    Related visit reports
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-7 rounded-lg border-[#E8E6E0] bg-white px-2.5 text-[11px] font-bold text-[#1A5345] hover:bg-[#F9F8F5]"
                  >
                    <Link href={`${basePath}/consultations`}>All consultations</Link>
                  </Button>
                </div>

                {relatedVisits.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 sm:py-12 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                      <FileTextIcon className="size-6 text-[#9CA3AF]" aria-hidden />
                    </div>
                    <p className="text-[13px] font-bold text-[#1A1F1E] sm:text-[14px]">No linked visit reports</p>
                    <p className="mt-1 text-[12px] font-medium text-[#6B7870] sm:text-[13px]">
                      This ICD code has not appeared in a documented consultation report yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedVisits.map((visit) => (
                      <Link
                        key={visit.id}
                        href={`${basePath}/consultations/${visit.id}`}
                        className="group block overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-4 shadow-sm transition-all hover:border-[#1A5345]/30 hover:shadow-md sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-bold text-[#1A1F1E] sm:text-[14px]">
                                {fmtShort(visit.date)}
                              </span>
                              <span className={cn("rounded-lg px-2 py-0.5 text-[9px] font-bold capitalize", visitTypeStyles[visit.type])}>
                                {visit.type.replace("-", " ")}
                              </span>
                              {visit.hasFullReport ? (
                                <span className="rounded-lg bg-[#1A5345] px-2 py-0.5 text-[9px] font-bold text-white">
                                  Full report
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-[12px] font-bold text-[#1A5345] sm:text-[13px]">
                              {visit.doctorName}
                            </p>
                            <p className="mt-1 text-[12px] font-medium text-[#6B7870] sm:text-[13px]">
                              <span className="font-bold text-[#1A1F1E]">Chief complaint:</span> {visit.chiefComplaint}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-relaxed text-[#6B7870] sm:text-[13px]">
                              <span className="font-bold text-[#1A1F1E]">Summary:</span> {visit.diagnosisSummary}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 self-start text-[11px] font-bold text-[#1A5345] transition-colors group-hover:text-[#133F34]">
                            Open report
                            <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right side: Sidebar metadata (Condition Overview + Record info) */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Condition Overview Card */}
              <section className="space-y-3">
                <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                  <ActivityIcon className="size-4 text-[#1A5345]" aria-hidden />
                  Condition overview
                </h2>
                <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3 divide-y divide-[#E8E6E0]/40">
                    <div className="flex justify-between items-center py-1.5 first:pt-0">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Category</span>
                      <span className="text-[13px] font-bold text-[#1A1F1E]">{DIAGNOSIS_CATEGORY_LABELS[diagnosis.category]}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Problem type</span>
                      <TypeBadge type={diagnosis.type} />
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Severity</span>
                      <SeverityBadge severity={diagnosis.severity} />
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Status</span>
                      <StatusBadge status={diagnosis.status} />
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Chronic disease</span>
                      <span className={cn("text-[13px] font-bold", diagnosis.chronicFlag ? "text-[#1A5345]" : "text-[#6B7870]")}>
                        {yesNoLabel(diagnosis.chronicFlag)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 last:pb-0">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Infectious disease</span>
                      <span className={cn("text-[13px] font-bold", diagnosis.infectiousFlag ? "text-red-600" : "text-[#6B7870]")}>
                        {yesNoLabel(diagnosis.infectiousFlag)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Diagnosis Record Card */}
              <section className="space-y-3">
                <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                  <ClipboardCheckIcon className="size-4 text-[#1A5345]" aria-hidden />
                  Diagnosis record
                </h2>
                <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3 divide-y divide-[#E8E6E0]/40">
                    <div className="flex justify-between items-center py-1.5 first:pt-0">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Diagnosed on</span>
                      <span className="text-[13px] font-bold text-[#1A1F1E]">{fmtShort(diagnosis.diagnosedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Diagnosed by</span>
                      <DiagnosedByCell name={diagnosis.diagnosedBy} />
                    </div>
                    {parsed.confirmation && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[12px] font-bold text-[#1A1F1E]">Confirmation</span>
                        <span className="text-[13px] font-bold text-[#1A1F1E] capitalize">{parsed.confirmation}</span>
                      </div>
                    )}
                    {parsed.onsetDate && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[12px] font-bold text-[#1A1F1E]">Onset date</span>
                        <span className="text-[13px] font-bold text-[#1A1F1E]">{fmtShort(parsed.onsetDate)}</span>
                      </div>
                    )}
                    {parsed.nyhaClass && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[12px] font-bold text-[#1A1F1E]">NYHA class</span>
                        <span className="text-[13px] font-bold text-[#1A1F1E]">Class {parsed.nyhaClass}</span>
                      </div>
                    )}
                    {parsed.laterality && parsed.laterality !== "unspecified" && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[12px] font-bold text-[#1A1F1E]">Laterality / region</span>
                        <span className="text-[13px] font-bold text-[#1A1F1E] capitalize">{parsed.laterality}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Created at</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{fmtDateTime(diagnosis.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 last:pb-0">
                      <span className="text-[12px] font-bold text-[#1A1F1E]">Updated at</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{fmtDateTime(diagnosis.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[720px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              Edit diagnosis
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Update ICD code, category, flags, severity, status, and clinical notes.
            </DialogDescription>
          </DialogHeader>
          <DiagnosisForm
            initial={editForm}
            onSubmit={handleSave}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: diagnosesScrollbarCss }} />
    </div>
  )
}
