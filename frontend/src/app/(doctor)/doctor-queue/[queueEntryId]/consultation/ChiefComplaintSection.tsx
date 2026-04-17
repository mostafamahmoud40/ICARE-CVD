"use client"

import { MessageSquareTextIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CVD_COMPLAINTS = [
  { value: "chest_pain", label: "Chest Pain" },
  { value: "dyspnea", label: "Shortness of Breath (Dyspnea)" },
  { value: "palpitations", label: "Palpitations" },
  { value: "syncope", label: "Syncope / Near-Syncope" },
  { value: "fatigue", label: "Fatigue" },
  { value: "edema", label: "Peripheral Edema" },
  { value: "dizziness", label: "Dizziness" },
  { value: "orthopnea", label: "Orthopnea" },
  { value: "pnd", label: "Paroxysmal Nocturnal Dyspnea" },
  { value: "claudication", label: "Claudication" },
  { value: "diaphoresis", label: "Diaphoresis" },
  { value: "nausea", label: "Nausea / Vomiting" },
  { value: "jaw_pain", label: "Jaw Pain" },
  { value: "arm_pain", label: "Arm Pain" },
  { value: "back_pain", label: "Back Pain" },
  { value: "epigastric_pain", label: "Epigastric Pain" },
  { value: "other", label: "Other" },
] as const

export type ChiefComplaintSectionProps = {
  complaint: string
  onComplaintChange: (value: string) => void
  structuredComplaint: string
  onStructuredComplaintChange: (value: string) => void
}

export function ChiefComplaintSection({
  complaint,
  onComplaintChange,
  structuredComplaint,
  onStructuredComplaintChange,
}: ChiefComplaintSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <MessageSquareTextIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Chief Complaint</h3>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Structured Complaint</label>
          <Select value={structuredComplaint} onValueChange={onStructuredComplaintChange}>
            <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
              <SelectValue placeholder="Select primary complaint..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {CVD_COMPLAINTS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Detailed Description</label>
          <Textarea
            value={complaint}
            onChange={(e) => onComplaintChange(e.target.value)}
            placeholder="Describe the patient's chief complaint in detail — onset, duration, severity, character, aggravating/relieving factors..."
            className="min-h-[80px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>
    </div>
  )
}
