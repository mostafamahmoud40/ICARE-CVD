"use client"

import Link from "next/link"
import {
  Activity,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Pill,
  Stethoscope,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { VisitSummary } from "./consultations.types"
import { REPORT_EMPTY_MESSAGES } from "@/lib/consultation-report.mapper"
import { ClinicalOrdersPanel } from "./ClinicalOrdersPanel"
import {
  ConsultationRecordStatusBadge,
  ConsultationVisitTypeBadge,
  getVisitVitalStatProps,
  VisitMedicationStatusBadge,
} from "./consultations.shared"
import { formatConsultationDateLong } from "./consultations.utils"
import { QueueStatCell } from "../queue/patientQueue.shared"

type VisitDetailProps = {
  visit: VisitSummary
}

export function VisitDetail({ visit }: VisitDetailProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[#F4F3EF]">
      {/* Top Breadcrumb Bar */}
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 py-4 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList className="text-[11px]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/consultations" className="font-medium text-[#6B7870] hover:text-[#1A5345]">
                  Consultations
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-[#1A1F1E]">
                Visit Summary
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content Area — full width like consultation list */}
      <div className="relative flex-1 overflow-auto px-5 pb-12 sm:px-6 lg:px-8">
        <div className="w-full min-w-0">
          {/* Controls above the "Paper" */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-serif text-[24px] font-bold text-[#1A1F1E] sm:text-[28px]">
              Clinical Summary
            </h1>
            <div className="flex items-center gap-3">
              <ConsultationRecordStatusBadge status={visit.recordStatus} className="shadow-sm" />
              <Button
                size="sm"
                className="h-9 gap-2 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
              >
                <Download className="size-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* The "Paper" Chart */}
          <div className="overflow-hidden rounded-[24px] border border-[#E8E6E0]/60 bg-white shadow-md">
            {/* Chart Header */}
            <div className="border-b-[3px] border-[#1A5345] bg-[#F9F8F5] px-6 py-8 sm:px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-4 text-left">
                  <Stethoscope className="size-7 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
                  <div>
                    <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.15em] text-[#6B7870]">
                      Attending Physician
                    </p>
                    <p className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                      {visit.doctor.name}
                    </p>
                    <p className="text-[13px] font-medium text-muted-foreground">
                      {visit.doctor.specialty}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#6B7870]">
                    Visit type
                  </p>
                  <ConsultationVisitTypeBadge visitType={visit.visitType} />
                </div>
                <div className="text-left md:text-right">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#6B7870]">
                    Date of Visit
                  </p>
                  <p className="font-serif text-[20px] font-bold text-[#1A1F1E]">
                    {formatConsultationDateLong(visit.scheduledAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vitals — full width above clinical columns */}
            <div className="border-b border-dashed border-[#E8E6E0] px-6 py-6 sm:px-10 sm:py-8">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-[18px] font-bold text-[#1A1F1E]">
                <Activity className="size-5 text-[#6B7870]" />
                Recorded Vitals
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {visit.vitals.map((vital, idx) => (
                  <div
                    key={idx}
                    className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <QueueStatCell {...getVisitVitalStatProps(vital)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Left Column (Main Clinical Info) */}
              <div className="flex-1 border-b border-dashed border-[#E8E6E0] p-6 sm:p-10 lg:border-b-0 lg:border-r">
                {/* Clinical Notes */}
                <div className="mb-10">
                  <h3 className="mb-4 flex items-center gap-2 font-serif text-[18px] font-bold text-[#1A1F1E]">
                    <FileText className="size-5 text-[#6B7870]" />
                    Clinical Notes
                  </h3>
                  <div className="rounded-xl bg-[#F9F8F5] p-5">
                    <p
                      className={cn(
                        "whitespace-pre-line text-[14.5px] leading-relaxed font-medium",
                        visit.doctorNotes === REPORT_EMPTY_MESSAGES.clinicalNotes
                          ? "text-[#6B7870] italic"
                          : "text-[#2D3633]",
                      )}
                    >
                      {visit.doctorNotes}
                    </p>
                  </div>
                </div>

                {/* Orders */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-serif text-[18px] font-bold text-[#1A1F1E]">
                    <ClipboardList className="size-5 text-[#6B7870]" />
                    Orders
                  </h3>
                  <ClinicalOrdersPanel
                    orders={visit.orders}
                    layout="grid"
                    emptyMessage="No orders or follow-up tasks were recorded for this visit."
                  />
                </div>

              </div>

              {/* Right Column (Action Plan) */}
              <div className="w-full shrink-0 bg-[#FAFAFA] p-6 sm:p-10 lg:w-[min(380px,32%)] xl:w-[min(420px,34%)]">
                
                {/* Prescriptions */}
                <div className="mb-10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-serif text-[18px] font-bold text-[#1A1F1E]">
                      <Pill className="size-5 text-[#6B7870]" />
                      Prescriptions
                    </h3>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[12px] text-[#1A5345]" asChild>
                      <Link href="/medications">View all</Link>
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E8E6E0]/60">
                    {visit.medications.length === 0 ? (
                      <p className="px-4 py-5 text-[13px] font-medium italic text-[#6B7870]">
                        No prescriptions were recorded for this visit.
                      </p>
                    ) : (
                    <ul className="divide-y divide-[#E8E6E0]/60">
                      {visit.medications.map((med, idx) => {
                        const isDiscontinued = med.status === "discontinued"

                        return (
                          <li key={idx} className="flex items-start gap-3 px-3 py-3">
                            <Lock
                              className={cn(
                                "mt-0.5 size-4 shrink-0",
                                isDiscontinued ? "text-[#6B7870]" : "text-[#1A5345]",
                              )}
                              strokeWidth={2}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={cn(
                                    "font-serif text-[14px] font-bold leading-snug text-[#1A1F1E]",
                                    isDiscontinued &&
                                      "text-[#6B7870] line-through decoration-[#6B7870]/50",
                                  )}
                                >
                                  {med.name}{" "}
                                  <span className="font-sans text-[12px] font-semibold text-[#6B7870] no-underline">
                                    {med.dosage}
                                  </span>
                                </p>
                                <VisitMedicationStatusBadge status={med.status} />
                              </div>
                              <p className="mt-0.5 text-[12px] text-[#6B7870]">{med.schedule}</p>
                              {med.note ? (
                                <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7870]">
                                  {med.note}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
