"use client"

import React from "react"
import type { VisitRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FileTextIcon,
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

function fmtFull(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

type ConsultationsPageProps = {
  patientId: string
  patientName: string
  visits: VisitRecord[]
}

export function ConsultationsPage({ patientId, patientName, visits }: ConsultationsPageProps) {
  const typeStyles: Record<string, string> = {
    "follow-up": "bg-[#EEF5F3] text-[#2C6A5B]",
    "new": "bg-blue-50 text-blue-600",
    "walk-in": "bg-amber-50 text-amber-600",
    "post-procedure": "bg-violet-50 text-violet-600",
    "urgent": "bg-red-50 text-red-600",
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
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
              <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Consultation History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{visits.length} consultations</span>
        </div>

        <div className="space-y-2">
          {visits.map((v, idx) => (
            <Link key={v.id} href={`/doctor-patients/${patientId}/consultations/${v.id}`} className="group block">
              <div className="flex items-start gap-3 rounded-xl border border-[#E5EEEA] bg-white p-3 transition-colors group-hover:border-[#1A5345]/30 group-hover:bg-[#F6FBF9] sm:gap-4 sm:p-4">
                <div className="flex flex-col items-center">
                  <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold sm:size-8 sm:text-[10px]", idx === 0 ? "bg-[#1A5345] text-white" : "bg-[#E8F0EE] text-[#1A5345]")}>
                    {idx + 1}
                  </div>
                  {idx < visits.length - 1 && <div className="w-px flex-1 bg-[#E8E6E0]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-semibold text-[#102F27] sm:text-[13px]">{fmtFull(v.date)}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize", typeStyles[v.type] ?? "bg-[#F5F5F3] text-[#6B7870]")}>
                      {v.type.replace("-", " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{v.doctorName}</span>
                    <span className="text-[10px] text-muted-foreground">&middot; {v.durationMin} min</span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium text-[#102F27] sm:text-[12px]">{v.chiefComplaint}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">{v.diagnosisSummary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden items-center gap-1 text-[9px] font-medium text-[#1A5345] sm:flex sm:text-[10px]">
                    <FileTextIcon className="size-3" />
                    Report
                  </span>
                  <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#1A5345]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
