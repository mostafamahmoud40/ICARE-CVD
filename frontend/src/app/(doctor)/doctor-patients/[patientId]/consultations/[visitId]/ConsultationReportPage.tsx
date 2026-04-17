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
import { Separator } from "@/components/ui/separator"

function fmtFull(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

const typeStyles: Record<string, string> = {
  "follow-up": "bg-[#EEF5F3] text-[#2C6A5B]",
  "new": "bg-blue-50 text-blue-600",
  "walk-in": "bg-amber-50 text-amber-600",
  "post-procedure": "bg-violet-50 text-violet-600",
  "urgent": "bg-red-50 text-red-600",
}

function Section({ title, icon: Icon, children, action }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
            <Icon className="size-3 text-[#1A5345] sm:size-3.5" />
          </div>
          <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function VitalRow({ icon: Icon, label, value, unit }: {
  icon: React.ElementType
  label: string
  value: string | number
  unit: string
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className="size-3 text-muted-foreground sm:size-3.5" />
      <span className="text-[10px] text-muted-foreground sm:text-[11px]">{label}:</span>
      <span className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{value}</span>
      <span className="text-[9px] text-muted-foreground">{unit}</span>
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
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[10px] sm:text-[11px]">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}`} className="text-[10px] sm:text-[11px]">{patientName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}/consultations`} className="text-[10px] sm:text-[11px]">Consultations</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">{fmtFull(report.date)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" variant="outline" className="gap-1.5 text-[10px] sm:text-[11px]">
            <PrinterIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Print Report</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>

        <div className="rounded-xl border border-[#E5EEEA] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[15px] font-bold text-[#102F27] sm:text-[18px]">Consultation Report</h1>
                <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", typeStyles[report.type] ?? "bg-[#F5F5F3] text-[#6B7870]")}>
                  {report.type.replace("-", " ")}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-[11px]">
                <span>{fmtFull(report.date)}</span>
                <span>&middot;</span>
                <span>{report.time}</span>
                <span>&middot;</span>
                <span>{report.durationMin} min</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <StethoscopeIcon className="size-3 text-muted-foreground" />
                <span className="font-medium text-[#102F27]">{report.doctorName}</span>
                <span className="text-muted-foreground">&middot; {report.doctorSpecialty}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-[#E8F0EE] px-3 py-1.5">
              <UserRoundIcon className="size-3.5 text-[#1A5345]" />
              <div>
                <p className="text-[10px] font-semibold text-[#102F27] sm:text-[11px]">{patientName}</p>
                <p className="text-[9px] text-[#6B7870]">ID: {patientId}</p>
              </div>
            </div>
          </div>
        </div>

        <Section title="Chief Complaint" icon={FileTextIcon}>
          <p className="text-[11px] leading-relaxed text-[#102F27] sm:text-[12px]">{report.chiefComplaint}</p>
        </Section>

        <Section title="History of Present Illness" icon={FileTextIcon}>
          <p className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{report.historyOfPresentIllness}</p>
        </Section>

        {report.vitals && (
          <Section title="Vitals at Visit" icon={HeartPulseIcon}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              <VitalRow icon={HeartPulseIcon} label="BP" value={`${report.vitals.systolicBP}/${report.vitals.diastolicBP}`} unit="mmHg" />
              <VitalRow icon={ActivityIcon} label="HR" value={report.vitals.heartRate} unit="bpm" />
              <VitalRow icon={WindIcon} label="SpO\u2082" value={report.vitals.oxygenSaturation} unit="%" />
              <VitalRow icon={ThermometerIcon} label="Temp" value={report.vitals.temperature} unit="\u00B0C" />
              <VitalRow icon={ScaleIcon} label="Weight" value={report.vitals.weight} unit="kg" />
              {report.vitals.bloodSugar !== null && (
                <VitalRow icon={DropletIcon} label="Blood Sugar" value={report.vitals.bloodSugar} unit="mg/dL" />
              )}
            </div>
          </Section>
        )}

        <Section title="Physical Examination" icon={StethoscopeIcon}>
          <p className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{report.physicalExam}</p>
        </Section>

        {report.diagnoses.length > 0 && (
          <Section title="Diagnoses" icon={ClipboardCheckIcon}>
            <div className="space-y-2">
              {report.diagnoses.map((d, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 font-mono text-[9px] text-[#6B7870]">{d.icdCode}</span>
                  <span className="text-[11px] font-medium text-[#102F27] sm:text-[12px]">{d.description}</span>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize", d.type === "primary" ? "bg-[#EEF5F3] text-[#1A5345]" : "bg-gray-50 text-gray-500")}>
                    {d.type}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {report.prescriptions.length > 0 && (
          <Section title="Prescriptions" icon={PillIcon}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[9px] sm:text-[10px]">
                <thead>
                  <tr className="border-b border-[#E8E6E0] text-muted-foreground">
                    <th className="px-2 py-1.5 font-medium">Medication</th>
                    <th className="px-2 py-1.5 font-medium">Dose</th>
                    <th className="px-2 py-1.5 font-medium">Frequency</th>
                    <th className="px-2 py-1.5 font-medium">Duration</th>
                    <th className="px-2 py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.prescriptions.map((p) => (
                    <tr key={p.id} className="border-b border-[#F5F5F3]">
                      <td className="px-2 py-1.5 font-medium text-[#102F27]">{p.name}</td>
                      <td className="px-2 py-1.5">{p.dose}</td>
                      <td className="px-2 py-1.5">{p.frequency}</td>
                      <td className="px-2 py-1.5">{p.duration}</td>
                      <td className="px-2 py-1.5">
                        {p.isNew ? (
                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">New</span>
                        ) : (
                          <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870]">Continued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {report.labOrders.length > 0 && (
          <Section title="Lab Orders" icon={FlaskConicalIcon}>
            <div className="flex flex-wrap gap-1.5">
              {report.labOrders.map((test, i) => (
                <span key={i} className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#1A5345] sm:text-[11px]">{test}</span>
              ))}
            </div>
          </Section>
        )}

        {report.referrals.length > 0 && (
          <Section title="Referrals" icon={ArrowRightLeftIcon}>
            <div className="space-y-2">
              {report.referrals.map((ref, i) => (
                <div key={i} className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2.5 sm:p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">
                      <StethoscopeIcon className="size-3" />
                      {ref.specialty} Specialist
                    </span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", ref.urgency === "urgent" ? "bg-amber-50 text-amber-600" : "bg-[#F5F5F3] text-[#6B7870]")}>
                      {ref.urgency === "urgent" ? "Urgent" : "Routine"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{ref.reason}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Plan" icon={ClipboardCheckIcon}>
          <div className="space-y-1.5">
            {report.plan.split("\n").map((line, i) => (
              <p key={i} className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{line}</p>
            ))}
          </div>
        </Section>

        <Section title="Follow-Up" icon={CalendarDaysIcon}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground sm:text-[11px]">Timeframe:</span>
              <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{report.followUp.timeframe}</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{report.followUp.instructions}</p>
          </div>
        </Section>

        {report.notes && (
          <Section title="Additional Notes" icon={FileTextIcon}>
            <div className="rounded-lg bg-[#F9F8F5] p-2.5">
              <p className="text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">{report.notes}</p>
            </div>
          </Section>
        )}
      </div>
    </main>
  )
}
