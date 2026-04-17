"use client"

import type { PhysicalExamFindings } from "./consultation.types"
import { StethoscopeIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const EXAM_FIELDS = [
  { key: "heartSounds" as const, label: "Heart Sounds", placeholder: "e.g. Normal S1/S2, no gallop..." },
  { key: "murmurs" as const, label: "Murmurs", placeholder: "e.g. No audible murmurs, or describe grade, location, radiation..." },
  { key: "jvp" as const, label: "Jugular Venous Pressure (JVP)", placeholder: "e.g. Not elevated, ~8 cm H₂O..." },
  { key: "peripheralEdema" as const, label: "Peripheral Edema", placeholder: "e.g. No lower extremity edema, or describe pitting grade..." },
  { key: "lungAuscultation" as const, label: "Lung Auscultation", placeholder: "e.g. Clear bilaterally, no crackles or wheezing..." },
  { key: "additionalFindings" as const, label: "Additional Findings", placeholder: "Any other examination findings..." },
]

export type PhysicalExamSectionProps = {
  exam: PhysicalExamFindings
  onExamChange: (key: keyof PhysicalExamFindings, value: string) => void
}

export function PhysicalExamSection({ exam, onExamChange }: PhysicalExamSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <StethoscopeIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Physical Examination</h3>
        <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#2C6A5B]">Cardiovascular Focus</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {EXAM_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
            <Textarea
              value={exam[field.key]}
              onChange={(e) => onExamChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[56px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
