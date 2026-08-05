"use client"

import React from "react"
import type { ConsultationReport } from "../../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  DropletIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  PillIcon,
  ScaleIcon,
  StethoscopeIcon,
  ThermometerIcon,
  UserRoundIcon,
  WindIcon,
  PrinterIcon,
  ArrowRightLeftIcon,
  ClockIcon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { doctorAvatarUrl } from "../../diagnoses/diagnosis.shared"

function fmtFull(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

export const visitTypeStyles: Record<string, string> = {
  "follow-up": "bg-[#EEF5F3] text-[#1A5345]",
  new: "bg-blue-50 text-blue-700",
  "walk-in": "bg-amber-50 text-amber-700",
  "post-procedure": "bg-violet-50 text-violet-700",
  urgent: "bg-red-50 text-red-700",
}

function Section({ title, icon: Icon, children, action, className }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-[#E8F0EE]/60">
            <Icon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1A1F1E]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function VitalMiniCard({ icon: Icon, label, value, unit }: {
  icon: React.ElementType
  label: string
  value: string | number
  unit: string
}) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3 shadow-sm transition-all hover:bg-white hover:border-[#1A5345]/20">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-bold text-[#1A1F1E]">{value}</span>
          <span className="text-[11px] font-semibold text-[#6B7870]">{unit}</span>
        </div>
      </div>
      <Icon className="size-4 text-[#1A5345]" aria-hidden />
    </div>
  )
}

type ConsultationReportPageProps = {
  patientId: string
  patientName: string
  report: ConsultationReport
}

export function ConsultationReportPage({ patientId, patientName, report }: ConsultationReportPageProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] px-4 py-6 sm:px-8 sm:py-8 custom-scrollbar">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-patients" className="text-[13px] font-medium text-muted-foreground hover:text-[#1A1F1E]">Patients</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/doctor-patients/${patientId}`} className="text-[13px] font-medium text-muted-foreground hover:text-[#1A1F1E]">{patientName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/doctor-patients/${patientId}/consultations`} className="text-[13px] font-medium text-muted-foreground hover:text-[#1A1F1E]">Consultations</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[13px] font-bold text-[#1A1F1E]">{fmtFull(report.date)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="font-serif text-[24px] font-bold tracking-tight text-[#1A1F1E] sm:text-[28px]">
              Consultation Report
            </h1>
          </div>
          <Button variant="outline" className="h-9 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[13px] font-bold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]">
            <PrinterIcon className="size-4" />
            <span>Print Report</span>
          </Button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          
          {/* Left Column - Primary Content (2/3) */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            
            {/* Metadata Card */}
            <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-bold text-[#1A1F1E]">{fmtFull(report.date)}</span>
                    <span className={cn("rounded-lg px-2.5 py-1 text-[10px] font-bold capitalize shadow-sm", visitTypeStyles[report.type] ?? "bg-slate-500 text-white")}>
                      {report.type.replace("-", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EE]/60 px-2 py-1 font-mono text-[10px] font-bold text-[#1A5345]">
                      <ClockIcon className="size-3" />
                      {report.durationMin} mins
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#E8F0EE]">
                      <img src={doctorAvatarUrl(report.doctorName)} alt="" className="size-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#1A5345]">
                        {report.doctorName}
                      </p>
                      <p className="text-[12px] font-semibold text-muted-foreground">{report.doctorSpecialty}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Context Badge */}
                <div className="flex items-center gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-2.5 sm:text-right">
                  <div className="hidden sm:block">
                    <p className="text-[13px] font-bold text-[#1A1F1E]">{patientName}</p>
                    <p className="text-[11px] font-semibold text-[#6B7870]">MRN: {patientId}</p>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F0EE]/60 text-[#1A5345] sm:hidden">
                    <UserRoundIcon className="size-4" />
                  </div>
                  <div className="sm:hidden">
                    <p className="text-[13px] font-bold text-[#1A1F1E]">{patientName}</p>
                    <p className="text-[11px] font-semibold text-[#6B7870]">MRN: {patientId}</p>
                  </div>
                </div>
              </div>
            </div>

            <Section title="Chief Complaint" icon={FileTextIcon}>
              <div className="relative">
                <p className="pl-3 border-l-2 border-[#1A5345]/30 text-[14px] font-medium leading-relaxed text-[#1A1F1E] md:text-[15px]">
                  {report.chiefComplaint}
                </p>
              </div>
            </Section>

            <Section title="History of Present Illness" icon={ClipboardCheckIcon}>
              <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E] md:text-[14px] whitespace-pre-wrap">
                {report.historyOfPresentIllness}
              </p>
            </Section>

            <Section title="Physical Examination" icon={StethoscopeIcon}>
              <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E] md:text-[14px] whitespace-pre-wrap">
                {report.physicalExam}
              </p>
            </Section>

            <Section title="Plan & Instructions" icon={ClipboardCheckIcon}>
              <div className="space-y-2">
                {report.plan.split("\n").map((line, i) => (
                  <p key={i} className="text-[13px] font-medium leading-relaxed text-[#1A1F1E] md:text-[14px] flex items-start gap-2">
                     <span className="text-[#1A5345] mt-1.5 size-1.5 rounded-full bg-[#1A5345]/40 shrink-0"></span>
                     <span>{line}</span>
                  </p>
                ))}
              </div>
            </Section>

            {report.prescriptions.length > 0 && (
              <Section title="Prescriptions" icon={PillIcon} className="overflow-hidden">
                <div className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6 overflow-x-auto custom-scrollbar border-t border-[#E8E6E0]/60 mt-2">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#F9F8F5] border-b border-[#E8E6E0]/60">
                      <tr>
                        <th className="px-5 sm:px-6 py-3 font-semibold text-[#1A1F1E]">Medication</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Dose</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Frequency</th>
                        <th className="px-4 py-3 font-semibold text-[#1A1F1E]">Duration</th>
                        <th className="px-5 sm:px-6 py-3 font-semibold text-[#1A1F1E]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E6E0]/60">
                      {report.prescriptions.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-[#F9F8F5]/50 group">
                          <td className="px-5 sm:px-6 py-4 font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">{p.name}</td>
                          <td className="px-4 py-4 font-medium text-muted-foreground">{p.dose}</td>
                          <td className="px-4 py-4 font-medium text-muted-foreground">{p.frequency}</td>
                          <td className="px-4 py-4 font-medium text-muted-foreground">{p.duration}</td>
                          <td className="px-5 sm:px-6 py-4">
                            {p.isNew ? (
                              <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20">New</span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-[#F3F2F0] px-2 py-0.5 text-[10px] font-bold text-[#6B7870] ring-1 ring-inset ring-gray-500/10">Continued</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {report.notes && (
              <Section title="Additional Clinical Notes" icon={FileTextIcon}>
                <div className="rounded-xl border border-[#E5EEEA]/60 bg-[#FAFAF8] p-4 shadow-sm">
                  <p className="text-[13px] font-medium leading-relaxed text-[#6B7870] md:text-[14px] whitespace-pre-wrap">
                    {report.notes}
                  </p>
                </div>
              </Section>
            )}

          </div>

          {/* Right Column - Context & Stats (1/3) */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            
            {report.vitals && (
              <Section title="Vitals at Visit" icon={HeartPulseIcon}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <VitalMiniCard icon={HeartPulseIcon} label="Blood Pressure" value={`${report.vitals.systolicBP}/${report.vitals.diastolicBP}`} unit="mmHg" />
                  <VitalMiniCard icon={ActivityIcon} label="Heart Rate" value={report.vitals.heartRate} unit="bpm" />
                  <VitalMiniCard icon={ThermometerIcon} label="Temperature" value={report.vitals.temperature} unit="°C" />
                  <VitalMiniCard icon={WindIcon} label="SpO₂" value={report.vitals.oxygenSaturation} unit="%" />
                  <VitalMiniCard icon={ScaleIcon} label="Weight" value={report.vitals.weight} unit="kg" />
                  {report.vitals.bloodSugar !== null && (
                    <VitalMiniCard icon={DropletIcon} label="Blood Sugar" value={report.vitals.bloodSugar} unit="mg/dL" />
                  )}
                </div>
              </Section>
            )}

            {report.diagnoses.length > 0 && (
              <Section title="Diagnoses Discussed" icon={ClipboardCheckIcon}>
                <div className="flex flex-col gap-3">
                  {report.diagnoses.map((d, i) => (
                    <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3 transition-colors hover:border-[#1A5345]/20 hover:bg-white">
                      <div className="flex items-center justify-between gap-2">
                         <span className="font-mono text-[11px] font-bold text-[#6B7870]">{d.icdCode}</span>
                         <span className={cn("rounded-lg px-2 py-0.5 text-[9px] font-bold capitalize", d.type === "primary" ? "bg-[#1A5345] text-white" : "bg-blue-600 text-white")}>
                           {d.type}
                         </span>
                      </div>
                      <span className="text-[13px] font-bold text-[#1A1F1E] leading-snug">{d.description}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {report.labOrders.length > 0 && (
              <Section title="Lab Orders" icon={FlaskConicalIcon}>
                <div className="flex flex-wrap gap-2">
                  {report.labOrders.map((test, i) => (
                    <span key={i} className="rounded-lg bg-[#E8F0EE]/80 px-2.5 py-1.5 text-[12px] font-bold text-[#1A5345] border border-[#1A5345]/10 shadow-sm transition-all hover:bg-[#1A5345]/10 cursor-default">
                      {test}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {report.referrals.length > 0 && (
              <Section title="Referrals Issued" icon={ArrowRightLeftIcon}>
                <div className="flex flex-col gap-3">
                  {report.referrals.map((ref, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3.5 transition-colors hover:bg-white hover:border-[#1A5345]/20">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 rounded-lg bg-[#E8F0EE]/80 px-2 py-1 text-[11px] font-bold text-[#1A5345]">
                          <UserRoundIcon className="size-3" />
                          {ref.specialty}
                        </span>
                        <span className={cn("rounded-lg px-2 py-1 text-[9px] font-bold shadow-sm", ref.urgency === "urgent" ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}>
                          {ref.urgency === "urgent" ? "Urgent" : "Routine"}
                        </span>
                      </div>
                      <p className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]">
                        <span className="font-bold text-[#6B7870] mr-1">Reason:</span>
                        {ref.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Follow-Up Schedule" icon={CalendarDaysIcon}>
              <div className="flex flex-col gap-2 rounded-xl border border-[#1A5345]/15 bg-[#E8F0EE]/30 p-4">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="size-4 text-[#1A5345]" />
                  <span className="text-[13px] font-bold text-[#1A1F1E]">{report.followUp.timeframe}</span>
                </div>
                <p className="text-[12px] font-medium leading-relaxed text-[#6B7870] mt-1 pl-6">
                  {report.followUp.instructions}
                </p>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </main>
  )
}
