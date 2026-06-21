"use client"

import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
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
  patientName,
  patientCode,
  isOpen,
  onClose,
}: {
  prescription: AssistantPrescriptionRow | null
  patientName: string
  patientCode: string
  isOpen: boolean
  onClose: () => void
}) {
  if (!prescription) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-[min(94vw,880px)]">
        <DialogTitle className="sr-only">Prescription {prescription.id}</DialogTitle>
        
        {/* Prescription Header Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#F9F8F5] border-b border-[#E8E6E0]/60 print:hidden">
           <div className="flex min-w-0 items-center gap-2">
              <Badge className="shrink-0 bg-[#1A5345] text-white rounded-md px-1.5 py-0 text-[9px] font-black leading-5">OFFICIAL RX</Badge>
              <span className="truncate text-[11px] font-bold text-[#1A1F1E]">{prescription.date}</span>
           </div>
           <div className="flex shrink-0 items-center gap-1.5">
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#1A1F1E] hover:bg-white border border-[#E8E6E0]/40 shadow-none" aria-label="Share prescription">
                 <ShareIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#1A1F1E] hover:bg-white border border-[#E8E6E0]/40 shadow-none" aria-label="Send to patient">
                 <SendIcon className="size-3.5" />
              </Button>
              <Button 
                onClick={() => window.print()}
                size="icon"
                className="size-8 rounded-lg bg-[#1A1F1E] text-white hover:bg-[#1A5345] shadow-sm border-0"
                aria-label="Print prescription"
              >
                 <Printer className="size-3.5" />
              </Button>
           </div>
        </div>

        <div className="relative max-h-[calc(90vh-3rem)] overflow-y-auto p-5 print:p-0 sm:p-6">
           {/* RX Watermark */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
              <span className="text-[220px] font-black italic text-[#1A5345]">Rx</span>
           </div>

           <div className="relative z-10">
              {/* Clinic & physician */}
              <div className="mb-5 overflow-hidden rounded-xl border border-[#E8E6E0] bg-gradient-to-br from-[#FAFAF8] via-white to-[#F3F7F5]">
                 <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div className="min-w-0 space-y-3">
                       <div className="flex items-start gap-3">
                          <HeartPulseIcon className="mt-0.5 size-6 shrink-0 text-[#1A5345]" aria-hidden />
                          <div>
                             <h2 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                                ICARE-CVD
                             </h2>
                             <p className="mt-0.5 text-[13px] font-medium text-[#1A5345]">
                                Advanced cardiac care
                             </p>
                          </div>
                       </div>
                       <div className="space-y-1.5 pl-9 text-[12px] leading-relaxed text-muted-foreground">
                          <p className="flex items-start gap-2">
                             <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]/70" aria-hidden />
                             <span>123 Medical Plaza, Health District, Cairo, Egypt</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                             <span className="inline-flex items-center gap-1.5">
                                <PhoneIcon className="size-3.5 shrink-0 text-[#1A5345]/70" aria-hidden />
                                +20 (02) 1234-5678
                             </span>
                             <span className="inline-flex items-center gap-1.5">
                                <MailIcon className="size-3.5 shrink-0 text-[#1A5345]/70" aria-hidden />
                                clinic@icare-cvd.com
                             </span>
                          </p>
                       </div>
                    </div>

                    <div className="shrink-0 border-t border-[#E8E6E0]/70 pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0 sm:text-right">
                       <p className="text-[11px] font-medium text-muted-foreground">Prescribing physician</p>
                       <p className="mt-1 text-[17px] font-bold leading-snug text-[#1A1F1E]">
                          {prescription.doctor.name}
                       </p>
                       <p className="mt-0.5 text-[13px] font-medium text-[#1A5345]">
                          {prescription.doctor.department} specialist
                       </p>
                       <p className="mt-2 text-[11px] text-muted-foreground">License no. MD-9921-X</p>
                    </div>
                 </div>
              </div>

              {/* Patient summary */}
              <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] p-3.5 sm:grid-cols-3">
                 <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Patient name</p>
                    <p className="text-[14px] font-bold text-[#1A1F1E]">{patientName}</p>
                 </div>
                 <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Patient code</p>
                    <p className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{patientCode}</p>
                 </div>
                 <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Visit date</p>
                    <p className="text-[14px] font-bold text-[#1A1F1E]">{prescription.date}</p>
                 </div>
              </div>

              {/* Prescription List */}
              <div className="mb-5">
                 <div className="mb-4 flex items-center gap-3">
                    <span className="text-[28px] font-black italic text-[#1A5345]">Rx</span>
                    <div className="mt-3 h-px flex-1 bg-[#E8E6E0]" />
                 </div>

                 <div className="flex flex-col gap-6">
                    {prescription.medications.map((med: AssistantPrescriptionMedRow, idx: number) => (
                       <div key={idx} className="flex flex-col gap-3 group">
                          <div className="flex items-start justify-between">
                             <div className="flex items-center gap-4">
                                <span className="text-[18px] font-black text-[#1A1F1E]">{idx + 1}. {med.name}</span>
                                <Badge variant="outline" className="rounded-lg border-[#1A1F1E] bg-white text-[12px] font-black px-3 py-0.5">{med.dosage}</Badge>
                             </div>
                             <div className="text-right">
                                <p className="text-[11px] font-medium text-muted-foreground">Quantity</p>
                                <p className="text-[16px] font-bold text-[#1A5345]">{med.quantity}</p>
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
              <div className="flex items-end justify-between border-t border-[#E8E6E0] pt-6">
                 <div className="flex flex-col gap-2">
                    <div className="flex size-20 items-center justify-center rounded-xl border-2 border-[#E8E6E0] bg-white p-2 opacity-80">
                       <QrCodeIcon className="size-full" />
                    </div>
                    <p className="max-w-[140px] text-[10px] font-medium text-muted-foreground">Scan to verify prescription authenticity</p>
                 </div>
                 <div className="text-center">
                    <div className="mb-3">
                       <p className="font-serif text-[20px] font-bold italic text-[#1A1F1E]">{prescription.doctor.name}</p>
                       <div className="my-1 h-0.5 w-40 bg-[#1A1F1E]" />
                    </div>
                    <p className="text-[12px] font-medium text-[#1A5345]">Doctor&apos;s signature & stamp</p>
                 </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
