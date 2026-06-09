"use client"

import { useCallback } from "react"
import { FileTextIcon, MicIcon, LockIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type NotesKey = "clinicalNotes" | "assessmentAndPlan"

const NOTE_FIELDS: { key: NotesKey; label: string; placeholder: string; doctorOnly?: boolean }[] = [
  {
    key: "clinicalNotes",
    label: "Notes",
    placeholder: "Document the consultation details, observations, and relevant findings...",
  },
  {
    key: "assessmentAndPlan",
    label: "Assessment & Plan",
    placeholder: "Clinical assessment, treatment plan, and next steps...",
    doctorOnly: true,
  },
]

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
  const getText = useCallback(
    (key: NotesKey) => (key === "clinicalNotes" ? clinicalNotes : assessmentAndPlan),
    [clinicalNotes, assessmentAndPlan],
  )
  const setText = useCallback(
    (key: NotesKey, value: string) => {
      if (key === "clinicalNotes") onClinicalNotesChange(value)
      else onAssessmentAndPlanChange(value)
    },
    [onClinicalNotesChange, onAssessmentAndPlanChange],
  )

  const { supported, activeKey, interimText, audioLevel, elapsedSeconds, toggle } = useSpeechDictation({
    getText,
    setText,
  })

  const formatElapsedTime = useCallback((totalSeconds: number) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
    const ss = String(totalSeconds % 60).padStart(2, "0")
    return `${mm}:${ss}`
  }, [])

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <FileTextIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="font-serif text-[16px] font-bold text-[#102F27]">Clinical Notes</h3>
          {supported ? (
            <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>

        <div className="space-y-4">
          {NOTE_FIELDS.map((field) => {
            const listening = activeKey === field.key
            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-semibold text-muted-foreground" htmlFor={`clinical-notes-${field.key}`}>
                      {field.label}
                    </label>
                    {field.doctorOnly ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5">
                            <LockIcon className="size-2.5 text-red-600" />
                            <span className="text-[11px] font-medium text-red-600">Doctor only</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          This field is not visible to the patient
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  {supported ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          id={`clinical-notes-${field.key}-mic`}
                          variant={listening ? "secondary" : "ghost"}
                          size="icon-xs"
                          className={
                            listening
                              ? "shrink-0 text-[#B42318] ring-2 ring-[#B42318]/25"
                              : "shrink-0 text-[#2C6A5B]"
                          }
                          aria-pressed={listening}
                          aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
                          onClick={() => toggle(field.key)}
                        >
                          <MicIcon className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-center">
                        {listening ? "Stop dictation" : "Voice dictation"}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <Textarea
                  id={`clinical-notes-${field.key}`}
                  value={field.key === "clinicalNotes" ? clinicalNotes : assessmentAndPlan}
                  onChange={(e) => {
                    if (field.key === "clinicalNotes") onClinicalNotesChange(e.target.value)
                    else onAssessmentAndPlanChange(e.target.value)
                  }}
                  placeholder={field.placeholder}
                  className="min-h-[100px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-[#9CA3AF]"
                  aria-describedby={listening && interimText ? `${field.key}-interim` : undefined}
                />
                {listening ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#B42318]">{formatElapsedTime(elapsedSeconds)}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EEF5F3]">
                      <div
                        className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                        style={{ width: `${Math.max(6, audioLevel)}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-muted-foreground">Voice level</span>
                  </div>
                ) : null}
                {listening && interimText ? (
                  <p id={`${field.key}-interim`} className="text-[13px] leading-snug text-[#6B7280]">
                    {interimText}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
  )
}
