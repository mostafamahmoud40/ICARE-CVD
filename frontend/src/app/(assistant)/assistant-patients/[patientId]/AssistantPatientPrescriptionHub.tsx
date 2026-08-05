"use client"

import { useState } from "react"
import { DownloadIcon, FileTextIcon, MoreVerticalIcon, PillIcon, PlusIcon, ShareIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import type { AssistantPatientSummary, AssistantPrescriptionRow } from "./assistantPatientProfile.types"
import { PrescriptionDialog } from "./PrescriptionDialog"

type AssistantPatientPrescriptionHubProps = {
  prescriptions: AssistantPrescriptionRow[]
  patient: Pick<AssistantPatientSummary, "name" | "mrn">
  selectedPrescription: AssistantPrescriptionRow | null
  onSelectedPrescriptionChange: (prescription: AssistantPrescriptionRow | null) => void
  emptyHubMessage: (section: string) => string
}

export function AssistantPatientPrescriptionHub({
  prescriptions,
  patient,
  selectedPrescription,
  onSelectedPrescriptionChange,
  emptyHubMessage,
}: AssistantPatientPrescriptionHubProps) {
  const [prescriptionView, setPrescriptionView] = useState<"table" | "timeline">("timeline")

  return (
<div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Prescriptions</h2>
      <p className="text-[13px] font-medium text-muted-foreground mt-1">Manage and track patient medication orders</p>
    </div>
    <div className="flex items-center gap-3">
       <div className="hidden sm:flex items-center bg-white border border-[#E8E6E0] rounded-xl px-1.5 h-10">
          <button 
            onClick={() => setPrescriptionView("table")}
            className={cn(
              "px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all",
              prescriptionView === "table" ? "text-[#1A5345] bg-[#F9F8F5]" : "text-muted-foreground hover:text-[#1A1F1E]"
            )}
          >
            Table
          </button>
          <button 
            onClick={() => setPrescriptionView("timeline")}
            className={cn(
              "px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all",
              prescriptionView === "timeline" ? "text-[#1A5345] bg-[#F9F8F5]" : "text-muted-foreground hover:text-[#1A1F1E]"
            )}
          >
            Timeline
          </button>
       </div>
       <Button variant="outline" className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none">
          <DownloadIcon className="size-4 mr-2" />
          Export All
       </Button>
       <Button className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#0F3D32] border-0">
          <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
          New Prescription
       </Button>
    </div>
  </div>

  {prescriptionView === "table" ? (
    <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
      {/* Table Header Row */}
      <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-[#F9F8F5] border-b border-[#E8E6E0]/80">
        <span className="text-[13px] font-bold text-[#1A1F1E]">Prescription title</span>
        <span className="text-[13px] font-bold text-[#1A1F1E]">Prescribed by</span>
        <span className="text-[13px] font-bold text-[#1A1F1E]">Department</span>
        <span className="text-[13px] font-bold text-[#1A1F1E]">Date</span>
        <span className="text-[13px] font-bold text-[#1A1F1E]">Status</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="divide-y divide-[#E8E6E0]/60">
        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white px-6 py-10 text-center text-[14px] font-medium text-muted-foreground">
            {emptyHubMessage("prescriptions")}
          </div>
        ) : prescriptions.map((pres) => (
          <div key={pres.id} className="group transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-5 items-center hover:bg-[#F9F8F5]/40 transition-colors">
              {/* Title Column */}
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center">
                  <PillIcon className="size-6 text-[#1A5345] stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-[#1A1F1E] truncate">Medication Order #{pres.id.split('-')[1]}</h3>
                  <p className="text-[11px] font-medium text-muted-foreground">{pres.medications.length} items prescribed</p>
                </div>
              </div>

              {/* Prescribed By Column */}
              <div className="hidden md:flex items-center gap-3 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
                   <PatientAvatar
                     name={pres.doctor.name}
                     avatarUrl={pres.doctor.avatar}
                     sizes="32px"
                     initialsClassName="text-[10px]"
                   />
                </div>
                <p className="font-serif text-[14px] font-bold text-[#1A5345] truncate">
                  {pres.doctor.name}
                </p>
              </div>

              {/* Department Column */}
              <div className="hidden md:flex items-center text-[14px] font-bold text-[#1A1F1E]">
                 {pres.doctor.department}
              </div>

              {/* Date Column */}
              <div className="hidden md:block">
                <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{pres.date}</span>
              </div>

              {/* Status Column */}
              <div className="hidden md:block">
                <Badge className={cn(
                  "rounded-lg px-2.5 py-0.5 text-[10px] font-bold shadow-sm",
                  pres.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"
                )}>
                  {pres.status}
                </Badge>
              </div>

              {/* Actions Column */}
              <div className="flex items-center gap-2 justify-end">
                <Button 
                  onClick={() => onSelectedPrescriptionChange(pres)}
                  variant="outline" 
                  className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none"
                >
                  View RX
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A5345]">
                  <ShareIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="relative flex flex-col gap-10 pt-4">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[144px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#E8E6E0] via-[#E8E6E0] to-transparent hidden md:block"></div>

      {Object.entries(
        prescriptions.reduce((acc, pres) => {
          if (!acc[pres.date]) acc[pres.date] = []
          acc[pres.date].push(pres)
          return acc
        }, {} as Record<string, typeof prescriptions>)
      ).map(([date, prescriptions]) => (
        <div key={date} className="relative flex flex-col md:flex-row gap-6 md:gap-14 group">
          {/* Date & Node Panel */}
          <div className="md:w-[130px] shrink-0 md:text-right pt-1 relative">
            <p className="text-[17px] font-bold tabular-nums text-[#1A1F1E] leading-tight">{date}</p>
            <p className="text-[12px] font-medium text-muted-foreground mt-1.5">{prescriptions.length} order{prescriptions.length > 1 ? 's' : ''}</p>

            {/* Timeline Node */}
            <div className="hidden md:flex absolute -right-[23px] top-[14px] size-5 items-center justify-center">
               <div className="size-3.5 rounded-full border-2 border-white bg-[#1A5345] shadow-[0_0_0_2px_rgba(26,83,69,0.1)] group-hover:scale-125 transition-transform duration-300"></div>
            </div>
          </div>

          {/* Stack of Cards for this Date */}
          <div className="flex-1 flex flex-col gap-4">
            {prescriptions.map((pres) => (
              <div key={pres.id} className="rounded-xl border border-[#ECEAE4] bg-white p-4 shadow-none hover:border-[#DDD9D0] transition-all">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                       <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] overflow-hidden">
                          <PatientAvatar
                            name={pres.doctor.name}
                            avatarUrl={pres.doctor.avatar}
                            sizes="40px"
                            initialsClassName="text-[11px]"
                          />
                       </div>
                       <div>
                          <p className="font-serif text-[15px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
                             {pres.doctor.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <div className="text-[13px] font-bold text-[#1A1F1E]">
                                {pres.doctor.department}
                             </div>
                             <span className="size-1 rounded-full bg-muted-foreground/30"></span>
                             <span className="text-[11px] font-bold text-[#1A5345]">{pres.medications.length} items</span>
                             <Badge className={cn(
                                "ml-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                                pres.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"
                              )}>
                                {pres.status}
                              </Badge>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-1.5">
                       <Button 
                         onClick={() => onSelectedPrescriptionChange(pres)}
                         variant="ghost" 
                         size="icon" 
                         className="size-8 rounded-lg hover:bg-[#F9F8F5] text-[#1A5345] hover:text-[#0F3D32]"
                         title="View RX"
                       >
                          <FileTextIcon className="size-4" strokeWidth={2.5} />
                       </Button>
                       <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A5345]">
                          <ShareIcon className="size-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A1F1E]">
                          <MoreVerticalIcon className="size-4" />
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Prescription Formal Dialog */}
  <PrescriptionDialog 
    prescription={selectedPrescription}
    patientName={patient.name}
    patientCode={patient.mrn}
    isOpen={!!selectedPrescription} 
    onClose={() => onSelectedPrescriptionChange(null)} 
  />
</div>
  )
}
