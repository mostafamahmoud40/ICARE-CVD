"use client"

import { FileTextIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export type ClinicalNotesSectionProps = {
  clinicalNotes: string
  onClinicalNotesChange: (value: string) => void
  assessmentAndPlan: string
  onAssessmentAndPlanChange: (value: string) => void
}

export function ClinicalNotesSection({
  clinicalNotes,
  onClinicalNotesChange,
  assessmentAndPlan,
  onAssessmentAndPlanChange,
}: ClinicalNotesSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <FileTextIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Clinical Notes</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Notes</label>
          <Textarea
            value={clinicalNotes}
            onChange={(e) => onClinicalNotesChange(e.target.value)}
            placeholder="Document the consultation details, observations, and relevant findings..."
            className="min-h-[100px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Assessment & Plan</label>
          <Textarea
            value={assessmentAndPlan}
            onChange={(e) => onAssessmentAndPlanChange(e.target.value)}
            placeholder="Clinical assessment, treatment plan, and next steps..."
            className="min-h-[100px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>
    </div>
  )
}
