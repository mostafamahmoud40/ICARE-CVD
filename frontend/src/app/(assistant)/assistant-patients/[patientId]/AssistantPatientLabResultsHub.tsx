"use client"

import { DownloadIcon, DropletsIcon, PlusIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import type { AssistantLabReportRow, AssistantPatientSummary } from "./assistantPatientProfile.types"
import { LabReportDialog } from "./LabReportDialog"

type AssistantPatientLabResultsHubProps = {
  labResults: AssistantLabReportRow[]
  patient: Pick<AssistantPatientSummary, "name" | "mrn">
  selectedLabReport: AssistantLabReportRow | null
  onSelectedLabReportChange: (report: AssistantLabReportRow | null) => void
  emptyHubMessage: (section: string) => string
}

export function AssistantPatientLabResultsHub({
  labResults,
  patient,
  selectedLabReport,
  onSelectedLabReportChange,
  emptyHubMessage,
}: AssistantPatientLabResultsHubProps) {
  return (
<div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Lab Results</h2>
      <p className="text-[13px] font-medium text-muted-foreground mt-1">Sytematic record of laboratory investigations</p>
    </div>
    <div className="flex items-center gap-3">
       <Button variant="outline" className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none">
          <RefreshCwIcon className="size-4 mr-2" />
          Sync Lab
       </Button>
       <Button className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#0F3D32] border-0">
          <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
          Add Result
       </Button>
    </div>
  </div>

  <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
    {/* Table Header Row */}
    <div className="normal-case hidden md:grid grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-6 py-3.5 bg-[#FAFAF8] border-b border-[#E8E6E0]/80">
      <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Analysis title</span>
      <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Category</span>
      <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Date</span>
      <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Requested by</span>
      <span className="sr-only">Actions</span>
    </div>

    <div className="divide-y divide-[#E8E6E0]/60">
      {labResults.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white px-6 py-10 text-center text-[14px] font-medium text-muted-foreground">
          {emptyHubMessage("lab results")}
        </div>
      ) : labResults.map((report) => (
        <div key={report.id} className="group transition-all duration-200">
          {/* Report Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-6 py-5 items-center hover:bg-[#F9F8F5]/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center">
                <DropletsIcon className="size-6 text-[#1A5345] stroke-[2.5]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1A1F1E] truncate">{report.title}</h3>
            </div>

            <div className="hidden md:block">
              <Badge className="rounded-lg border-0 bg-[#E8F0EE] text-[11px] font-bold text-[#1A5345] px-2.5 py-1">
                {report.category}
              </Badge>
            </div>

            <div className="hidden md:block">
              <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{report.date}</span>
            </div>

            <div className="hidden md:flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
                 <PatientAvatar
                   name={report.doctor.name}
                   avatarUrl={report.doctor.avatar}
                   sizes="32px"
                   initialsClassName="text-[10px]"
                 />
              </div>
              <div className="flex flex-col min-w-0">
                 <p className="font-serif text-[14px] font-bold text-[#1A5345] truncate">
                   {report.doctor.name}
                 </p>
                 <p className="text-[10px] font-medium text-muted-foreground">{report.doctor.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button 
                onClick={() => onSelectedLabReportChange(report)}
                variant="outline" 
                className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none"
              >
                View Report
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A5345]">
                <DownloadIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Expandable details removed in favor of Dialog */}
        </div>
      ))}
    </div>
  </div>

  {/* Lab Report Formal Dialog */}
  <LabReportDialog 
    report={selectedLabReport}
    patientName={patient.name}
    patientCode={patient.mrn}
    isOpen={!!selectedLabReport} 
    onClose={() => onSelectedLabReportChange(null)} 
  />
</div>
  )
}
