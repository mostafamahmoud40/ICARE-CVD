"use client"

import { useCallback } from "react"
import { FileTextIcon, LockIcon, MicIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const TEXTAREA_CLASS =
  "min-h-[100px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

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
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FileTextIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Clinical notes</h3>
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
                <div className="flex items-center gap-2">
                  <label className={FIELD_LABEL} htmlFor={`clinical-notes-${field.key}`}>
                    {field.label}
                  </label>
                  {field.doctorOnly ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="default"
                          className="gap-1 rounded-lg border-0 bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-rose-500"
                        >
                          <LockIcon className="size-2.5" aria-hidden />
                          Doctor only
                        </Badge>
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
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-8 border-0 bg-transparent shadow-none hover:bg-transparent",
                          listening ? "text-rose-600" : "text-[#1A5345] hover:text-[#133F34]",
                        )}
                        aria-pressed={listening}
                        aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
                        onClick={() => toggle(field.key)}
                      >
                        <MicIcon className="size-4" />
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
                className={TEXTAREA_CLASS}
                aria-describedby={listening && interimText ? `${field.key}-interim` : undefined}
              />
              {listening ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-rose-600">{formatElapsedTime(elapsedSeconds)}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E8E6E0]">
                    <div
                      className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                      style={{ width: `${Math.max(6, audioLevel)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Voice level</span>
                </div>
              ) : null}
              {listening && interimText ? (
                <p id={`${field.key}-interim`} className="text-[12px] leading-snug text-muted-foreground">
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
