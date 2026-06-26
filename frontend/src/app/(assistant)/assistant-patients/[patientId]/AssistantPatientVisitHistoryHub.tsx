"use client"

import { DownloadIcon, FileTextIcon, MoreVerticalIcon, PlusIcon, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import type { AssistantVisitHistoryRow } from "./assistantPatientProfile.types"

type AssistantPatientVisitHistoryHubProps = {
  visitHistory: AssistantVisitHistoryRow[]
  emptyHubMessage: (section: string) => string
}

export function AssistantPatientVisitHistoryHub({
  visitHistory,
  emptyHubMessage,
}: AssistantPatientVisitHistoryHubProps) {
  return (
<div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Visit History</h2>
      <p className="text-[13px] font-medium text-muted-foreground mt-1">
        Timeline of {visitHistory.length} clinical encounter{visitHistory.length === 1 ? "" : "s"}
      </p>
    </div>
    <div className="flex items-center gap-3">
       <div className="hidden sm:flex items-center bg-white border border-[#E8E6E0] rounded-xl px-1.5 h-10">
          <button className="px-3 py-1.5 text-[12px] font-bold text-[#1A5345] bg-[#F9F8F5] rounded-lg">All</button>
          <button className="px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-[#1A1F1E]">Completed</button>
          <button className="px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-[#1A1F1E]">Cancelled</button>
       </div>
       <Button className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#0F3D32] border-0">
          <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
          New Visit
       </Button>
    </div>
  </div>

  <div className="relative flex flex-col gap-12 pt-4">
    {/* Vertical Timeline Line */}
    <div className="absolute left-[144px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#E8E6E0] via-[#E8E6E0] to-transparent hidden md:block"></div>

    {visitHistory.length === 0 ? (
      <p className="rounded-2xl border border-[#E8E6E0]/80 bg-white px-6 py-10 text-center text-[14px] font-medium text-muted-foreground">
        {emptyHubMessage("visit history")}
      </p>
              ) : visitHistory.map((visit) => (
      <div key={visit.id} className="relative flex flex-col md:flex-row gap-6 md:gap-14 group">
        {/* Date & Node Panel */}
        <div className="md:w-[130px] shrink-0 md:text-right pt-1 relative">
          <p className="text-[17px] font-bold text-[#1A1F1E] leading-tight">{visit.date}</p>
          <p className="text-[13px] font-medium text-muted-foreground mt-1.5">{visit.timeAgo}</p>
          <div className="mt-4 flex md:justify-end">
            <Badge variant="outline" className="rounded-lg border-[#E8E6E0] bg-[#F9F8F5]/80 px-2.5 py-1 text-[11px] font-bold text-[#1A5345] shadow-sm">
              {visit.type}
            </Badge>
          </div>

          {/* Timeline Node */}
          <div className="hidden md:flex absolute -right-[23px] top-[14px] size-5 items-center justify-center">
             <div className="size-3.5 rounded-full border-2 border-white bg-[#1A5345] shadow-[0_0_0_2px_rgba(26,83,69,0.1)] group-hover:scale-125 transition-transform duration-300"></div>
          </div>
        </div>

        {/* Main Card Content */}
        <div className="flex-1 rounded-xl border border-[#ECEAE4] bg-white p-5 md:p-6 shadow-none hover:border-[#DDD9D0]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                 <div className="size-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-sm ring-1 ring-[#E8E6E0]/50">
                    <PatientAvatar
                      name={visit.doctor.name}
                      avatarUrl={visit.doctor.avatar}
                      sizes="44px"
                      initialsClassName="text-[12px]"
                    />
                 </div>
                 <div>
                    <p className="text-[16px] font-bold text-[#1A1F1E] flex items-center gap-1.5 group-hover:text-[#1A5345] transition-colors">
                       {visit.doctor.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <div className="text-[14px] font-bold text-[#1A1F1E]">
                          {visit.doctor.department}
                       </div>
                       <span className="size-1 rounded-full bg-muted-foreground/30"></span>
                       <span className="text-[12px] font-bold text-[#1A5345]/80">Primary Care</span>
                    </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A1F1E]">
                    <DownloadIcon className="size-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A1F1E]">
                    <MoreVerticalIcon className="size-4" />
                 </Button>
              </div>
            </div>

            <div className="relative">
               <Quote className="absolute -left-1 -top-1 size-8 text-[#1A5345]/5 opacity-20" />
               <p className="text-[15px] text-[#1A1F1E]/90 leading-relaxed font-medium pl-2">
                  {visit.summary}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E8E6E0]/40">
               <div className="flex flex-wrap gap-2">
                  {visit.tags.map((tag, idx) => (
                     <div key={idx} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all hover:scale-105 cursor-pointer shadow-sm", tag.color)}>
                        <tag.icon className="size-3" />
                        {tag.label}
                     </div>
                  ))}
               </div>
              <Button className="h-8 gap-1.5 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]">
                <FileTextIcon className="size-3.5" strokeWidth={2.5} />
                  View full visit
               </Button>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
  )
}
