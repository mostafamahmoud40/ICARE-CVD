"use client"

import {
  DownloadIcon,
  DropletsIcon,
  HeartPulseIcon,
  Printer,
  QrCodeIcon,
  ShareIcon,
  StethoscopeIcon,
  UserIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { AssistantLabReportRow, AssistantLabTestRow } from "./assistantPatientProfile.types"

export function LabReportDialog({
  report,
  isOpen,
  onClose,
}: {
  report: AssistantLabReportRow | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!report) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[min(96vw,1200px)] p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl bg-white">
        <DialogTitle className="sr-only">{report.title} Report</DialogTitle>
        {/* Top Action Bar (Non-printing) */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8 bg-[#F9F8F5] border-b border-[#E8E6E0]/60 print:hidden">
           <div className="flex items-center gap-2">
              <Badge className="bg-[#1A5345]/10 text-[#1A5345] hover:bg-[#1A5345]/20 border-0 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                 Confidential
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">ID: {report.id.toUpperCase()}</span>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[11px] font-bold gap-1.5 hover:bg-white border border-transparent hover:border-[#E8E6E0]">
                 <ShareIcon className="size-3.5" />
                 Share
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[11px] font-bold gap-1.5 hover:bg-white border border-transparent hover:border-[#E8E6E0]">
                 <DownloadIcon className="size-3.5" />
                 Download
              </Button>
              <Button 
                onClick={() => window.print()}
                className="h-8 rounded-lg bg-[#1A5345] text-white hover:bg-[#1A1F1E] text-[11px] font-bold gap-1.5 shadow-lg shadow-[#1A5345]/10"
              >
                 <Printer className="size-3.5" />
                 Print report
              </Button>
           </div>
        </div>

        <div className="relative max-h-[85vh] overflow-y-auto overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-10 print:p-0 custom-scrollbar">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none rotate-[-15deg] select-none">
             <HeartPulseIcon className="size-[500px] text-[#1A5345]" />
          </div>

          {/* Report Content Container */}
          <div className="relative z-10">
            {/* Report Header */}
            <div className="flex justify-between items-start mb-12">
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <div className="bg-[#1A5345] size-11 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#1A5345]/20">
                        <HeartPulseIcon className="size-6" />
                     </div>
                     <div>
                        <span className="text-[22px] font-black tracking-tighter text-[#1A1F1E] leading-none block">ICARE-CVD</span>
                        <span className="mt-1 block text-[10px] font-bold tracking-wide text-[#1A5345]">
                           Advanced diagnostics
                        </span>
                     </div>
                  </div>
                  <div className="mt-2">
                     <p className="text-[11px] font-bold tracking-wide text-[#1A5345]">Requested test</p>
                     <h1 className="mt-1.5 text-[24px] font-black tracking-tight text-[#1A1F1E] sm:text-[26px]">
                        {report.title}
                     </h1>
                  </div>
               </div>
               <div className="text-right flex flex-col gap-2">
                  <div className="bg-[#1A1F1E] text-white px-4 py-2 rounded-xl inline-block mb-2">
                     <p className="text-[12px] font-bold opacity-80">Reference no.</p>
                     <p className="text-[15px] font-mono font-bold">RPT-2026-05-{report.id.split('-')[1]}</p>
                  </div>
                  <div className="text-[12px] font-medium text-muted-foreground leading-relaxed">
                     <p><span className="font-bold text-[#1A1F1E]">Collected:</span> {report.date}, 08:30 AM</p>
                     <p><span className="font-bold text-[#1A1F1E]">Reported:</span> {report.date}, 11:45 AM</p>
                  </div>
               </div>
            </div>

            {/* Patient & Doctor Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
               <div className="bg-[#F9F8F5]/80 border border-[#E8E6E0]/60 rounded-2xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#1A5345]">
                     <UserIcon className="size-3" />
                     Patient information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Name</p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">Ahmed Mohamed</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Patient ID</p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">CVD-98231</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Age / gender</p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">28Y / Male</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Blood group</p>
                        <p className="text-[14px] font-bold text-red-600">O+ve (Rhesus Pos)</p>
                     </div>
                  </div>
               </div>

               <div className="bg-[#F9F8F5]/80 border border-[#E8E6E0]/60 rounded-2xl p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#1A5345]">
                     <StethoscopeIcon className="size-3" />
                     Clinical information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Test ordered</p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">{report.title}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">Category</p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">{report.category}</p>
                     </div>
                     <div className="col-span-2">
                        <p className="text-[10px] font-semibold text-muted-foreground">Requesting physician</p>
                        <div className="flex items-center gap-2 mt-1">
                           <img src={report.doctor.avatar} className="size-6 rounded-full border border-white" alt="" />
                           <p className="text-[14px] font-bold text-[#1A1F1E]">{report.doctor.name}</p>
                           <span className="text-[11px] font-medium text-muted-foreground">({report.doctor.department})</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Analysis Results Table */}
            <div className="mb-12">
               <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                     <DropletsIcon className="size-4 text-[#1A5345]" />
                     Investigation parameters
                  </h2>
                  <span className="text-[11px] font-bold text-muted-foreground">Units in SI system</span>
               </div>
               <div className="rounded-2xl border border-[#E8E6E0] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-[#1A1F1E] text-white">
                           <th className="px-8 py-5 text-left text-[12px] font-bold">Test parameter</th>
                           <th className="px-6 py-5 text-center text-[12px] font-bold">Result</th>
                           <th className="px-6 py-5 text-center text-[12px] font-bold">Reference range</th>
                           <th className="px-8 py-5 text-right text-[12px] font-bold">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#E8E6E0]/60">
                        {report.tests.map((test: AssistantLabTestRow, idx: number) => (
                           <tr key={idx} className="hover:bg-[#F9F8F5]/50 transition-colors group">
                              <td className="px-8 py-5">
                                 <p className="text-[14px] font-bold text-[#1A1F1E]">{test.name}</p>
                                 <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                                    Spectrophotometry method
                                 </p>
                              </td>
                              <td className="px-6 py-5 text-center">
                                 <div className="flex items-baseline justify-center gap-1.5">
                                    <span
                                       className={cn(
                                         "text-[18px] font-black tabular-nums",
                                         test.status === "high" || test.status === "low"
                                           ? "text-red-600"
                                           : "text-[#1A5345]"
                                       )}
                                    >
                                       {test.value}
                                    </span>
                                    <span className="text-[12px] font-bold text-muted-foreground/60">{test.unit}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                 <span className="text-[13px] font-bold text-[#1A1F1E]/70">{test.range}</span>
                                 <span className="text-[11px] font-medium text-muted-foreground ml-1">{test.unit}</span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <span
                                    className={cn(
                                      "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset normal-case",
                                      test.status === "normal"
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                        : "bg-red-50 text-red-700 ring-red-600/10"
                                    )}
                                 >
                                    {test.status.charAt(0).toUpperCase() + test.status.slice(1).toLowerCase()}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="mt-4 px-2">
                  <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
                     * Note: Clinical correlation is required for definitive diagnosis. High/Low values are marked in red and should be reviewed by your physician immediately.
                  </p>
               </div>
            </div>

            {/* Report Footer */}
            <div className="flex justify-between items-end pt-10 border-t-2 border-[#E8E6E0] border-dotted">
               <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                     <div className="size-24 border-2 border-[#E8E6E0] rounded-2xl p-2 bg-white shadow-sm ring-4 ring-[#F9F8F5]">
                        <QrCodeIcon className="size-full text-[#1A1F1E]" />
                     </div>
                     <p className="text-[9px] font-bold text-muted-foreground">Report verification</p>
                  </div>
                  <div className="max-w-[200px]">
                     <p className="text-[10px] font-bold text-[#1A1F1E]">Digital signature verified</p>
                     <p className="text-[9px] font-medium text-muted-foreground leading-tight mt-1">
                        This is a computer-generated report and does not require a physical signature for verification. Scan QR to verify.
                     </p>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end gap-2">
                  <div className="mb-2">
                     <p className="text-[18px] font-black italic text-[#1A1F1E] tracking-tighter">Dr. Sarah Jenkins</p>
                     <div className="h-[2px] w-40 bg-gradient-to-l from-[#1A1F1E] to-transparent my-1" />
                     <p className="text-[11px] font-bold text-[#1A5345]">Chief of Cardiology</p>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground italic">Generated on: {new Date().toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
