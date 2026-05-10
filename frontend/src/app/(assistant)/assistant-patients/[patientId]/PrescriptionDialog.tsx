"use client"

import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  HeartPulseIcon,
  Printer,
  QrCodeIcon,
  SendIcon,
  ShareIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

import type {
  AssistantPrescriptionMedRow,
  AssistantPrescriptionRow,
} from "./assistantPatientProfile.types"

export function PrescriptionDialog({
  prescription,
  isOpen,
  onClose,
}: {
  prescription: AssistantPrescriptionRow | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!prescription) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[min(96vw,1200px)] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-white">
        <DialogTitle className="sr-only">Prescription {prescription.id}</DialogTitle>
        
        {/* Prescription Header Actions */}
        <div className="flex items-center justify-between px-10 py-5 bg-[#F9F8F5] border-b border-[#E8E6E0]/60 print:hidden">
           <div className="flex items-center gap-3">
              <Badge className="bg-[#1A5345] text-white rounded-lg px-2 py-0.5 text-[10px] font-black">OFFICIAL RX</Badge>
              <span className="text-[12px] font-bold text-[#1A1F1E]">Date: {prescription.date}</span>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 rounded-xl text-[12px] font-bold gap-2 hover:bg-white border border-[#E8E6E0]/40">
                 <ShareIcon className="size-4" />
                 Share
              </Button>
              <Button variant="ghost" size="sm" className="h-9 rounded-xl text-[12px] font-bold gap-2 hover:bg-white border border-[#E8E6E0]/40">
                 <SendIcon className="size-4" />
                 Send to Patient
              </Button>
              <Button 
                onClick={() => window.print()}
                className="h-9 rounded-xl bg-[#1A1F1E] text-white hover:bg-[#1A5345] text-[12px] font-bold gap-2 shadow-lg"
              >
                 <Printer className="size-4" />
                 Print RX
              </Button>
           </div>
        </div>

        <div className="p-12 relative overflow-hidden print:p-0 max-h-[85vh] overflow-y-auto custom-scrollbar">
           {/* RX Watermark */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
              <span className="text-[300px] font-black italic text-[#1A5345]">Rx</span>
           </div>

           <div className="relative z-10">
              {/* Hospital Branding */}
              <div className="flex justify-between items-start mb-14 border-b-2 border-[#1A1F1E] pb-8">
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                       <div className="bg-[#1A5345] size-12 rounded-2xl flex items-center justify-center text-white shadow-xl">
                          <HeartPulseIcon className="size-7" />
                       </div>
                       <div>
                          <span className="text-[26px] font-black tracking-tighter text-[#1A1F1E] leading-none">ICARE-CVD</span>
                          <span className="text-[11px] font-bold text-[#1A5345] uppercase tracking-widest mt-1 block">Advanced Cardiac Care</span>
                       </div>
                    </div>
                    <p className="text-[13px] font-medium text-muted-foreground mt-2 max-w-[300px]">
                       123 Medical Plaza, Health District, Cairo, Egypt<br />
                       Phone: +20 (02) 1234-5678 | Email: clinic@icare-cvd.com
                    </p>
                 </div>
                 <div className="text-right">
                    <h2 className="text-[20px] font-black text-[#1A1F1E] uppercase tracking-widest mb-1">{prescription.doctor.name}</h2>
                    <p className="text-[14px] font-bold text-[#1A5345]">{prescription.doctor.department} Specialist</p>
                    <p className="text-[12px] font-medium text-muted-foreground mt-1">Reg No: #MD-9921-X</p>
                 </div>
              </div>

              {/* Patient Details Row */}
              <div className="grid grid-cols-4 gap-8 mb-14 bg-[#F9F8F5] p-6 rounded-2xl border border-[#E8E6E0]">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Patient Name</p>
                    <p className="text-[15px] font-black text-[#1A1F1E]">Ahmed Mohamed</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Age / Gender</p>
                    <p className="text-[15px] font-bold text-[#1A1F1E]">28 Years / Male</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-[15px] font-bold text-[#1A1F1E]">78 Kg</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                    <p className="text-[15px] font-bold text-[#1A1F1E]">{prescription.date}</p>
                 </div>
              </div>

              {/* Prescription List */}
              <div className="mb-14 min-h-[400px]">
                 <div className="flex items-center gap-3 mb-8">
                    <span className="text-[40px] font-black italic text-[#1A5345]">Rx</span>
                    <div className="h-px flex-1 bg-[#E8E6E0] mt-4" />
                 </div>

                 <div className="flex flex-col gap-10">
                    {prescription.medications.map((med: AssistantPrescriptionMedRow, idx: number) => (
                       <div key={idx} className="flex flex-col gap-3 group">
                          <div className="flex items-start justify-between">
                             <div className="flex items-center gap-4">
                                <span className="text-[18px] font-black text-[#1A1F1E]">{idx + 1}. {med.name}</span>
                                <Badge variant="outline" className="rounded-lg border-[#1A1F1E] bg-white text-[12px] font-black px-3 py-0.5">{med.dosage}</Badge>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quantity</p>
                                <p className="text-[16px] font-black text-[#1A5345]">{med.quantity}</p>
                             </div>
                          </div>
                          <div className="pl-6 flex flex-wrap gap-x-12 gap-y-2">
                             <div className="flex items-center gap-2">
                                <ClockIcon className="size-4 text-muted-foreground" />
                                <span className="text-[14px] font-bold text-[#1A1F1E]">{med.frequency}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <CalendarIcon className="size-4 text-muted-foreground" />
                                <span className="text-[14px] font-bold text-[#1A1F1E]">{med.duration}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <FileTextIcon className="size-4 text-[#1A5345]" />
                                <span className="text-[14px] font-medium text-muted-foreground">{med.instructions}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Signature Section */}
              <div className="flex justify-between items-end pt-12 border-t border-[#E8E6E0]">
                 <div className="flex flex-col gap-4">
                    <div className="size-24 border-2 border-[#E8E6E0] rounded-2xl p-2 bg-white flex items-center justify-center opacity-80">
                       <QrCodeIcon className="size-full" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground max-w-[150px]">Scan to verify prescription authenticity</p>
                 </div>
                 <div className="text-center">
                    <div className="mb-4">
                       <p className="text-[22px] font-black italic text-[#1A1F1E] font-serif">Sarah Jenkins</p>
                       <div className="h-0.5 w-48 bg-[#1A1F1E] my-1" />
                    </div>
                    <p className="text-[12px] font-bold text-[#1A5345] uppercase tracking-widest">Doctor's Signature & Stamp</p>
                 </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
