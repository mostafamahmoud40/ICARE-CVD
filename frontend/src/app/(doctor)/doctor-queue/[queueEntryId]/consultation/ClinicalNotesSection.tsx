"use client"

import { useCallback, useState } from "react"
import { FileTextIcon, Loader2Icon, LockIcon, MicIcon, SparklesIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import {
  buildAssessmentAndPlanDraft,
  buildClinicalNotesDraft,
  type ClinicalNotesAiContext,
} from "./clinicalNotesAiSuggestions"
import { cn } from "@/lib/utils"
import { showIcareToast } from "@/components/shared/icare-toast"
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
    label: "Assessment & Plan (Doctor only)",
    placeholder:
      "Internal physician reasoning — clinical suspicion, differential weighting, and why management choices were made (not shared with the patient)...",
    doctorOnly: true,
  },
]

const AI_GENERATE_MS = 700

function mergeDraft(current: string, draft: string) {
  const trimmed = current.trim()
  if (!trimmed) return draft
  return `${trimmed}\n\n${draft}`
}

export type ClinicalNotesSectionProps = {
  clinicalNotes: string
  onClinicalNotesChange: (value: string) => void
  assessmentAndPlan: string
  onAssessmentAndPlanChange: (value: string) => void
  aiContext: ClinicalNotesAiContext
}

export function ClinicalNotesSection({
  clinicalNotes,
  onClinicalNotesChange,
  assessmentAndPlan,
  onAssessmentAndPlanChange,
  aiContext,
}: ClinicalNotesSectionProps) {
  const [generatingKey, setGeneratingKey] = useState<NotesKey | null>(null)

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

  const runAiDraft = useCallback(
    (key: NotesKey) => {
      if (generatingKey) return
      setGeneratingKey(key)
      window.setTimeout(() => {
        const draft =
          key === "clinicalNotes"
            ? buildClinicalNotesDraft(aiContext)
            : buildAssessmentAndPlanDraft(aiContext)
        const current = getText(key)
        setText(key, mergeDraft(current, draft))
        setGeneratingKey(null)
        showIcareToast({
          title: "AI draft inserted",
          description:
            key === "clinicalNotes"
              ? "Review and edit the clinical notes before saving."
              : "Review internal reasoning — this stays doctor-only and is not patient-facing.",
        })
      }, AI_GENERATE_MS)
    },
    [aiContext, generatingKey, getText, setText],
  )

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FileTextIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Clinical notes</h3>
          {supported ? (
            <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>
        <Badge
          variant="default"
          className="gap-1 rounded-lg border-0 bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
        >
          <SparklesIcon className="size-3" aria-hidden />
          AI · Groq
        </Badge>
      </div>

      <div className="space-y-4">
        {NOTE_FIELDS.map((field) => {
          const listening = activeKey === field.key
          const generating = generatingKey === field.key
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
                      <TooltipContent side="top" className="max-w-[240px]">
                        Doctor-only internal reasoning — not shown to the patient
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={generatingKey !== null}
                        className={cn(
                          "size-8 border-0 bg-transparent shadow-none hover:bg-transparent",
                          generating
                            ? "text-violet-600"
                            : "text-violet-600 hover:text-violet-800",
                        )}
                        aria-label={
                          field.key === "clinicalNotes"
                            ? "Generate AI clinical notes draft"
                            : "Generate AI assessment and plan draft"
                        }
                        onClick={() => runAiDraft(field.key)}
                      >
                        {generating ? (
                          <Loader2Icon className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <SparklesIcon className="size-4" aria-hidden />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-center">
                      {generating
                        ? "Generating draft…"
                        : field.key === "clinicalNotes"
                          ? "AI draft — clinical notes"
                          : "AI draft — internal assessment, differentials & rationale"}
                    </TooltipContent>
                  </Tooltip>
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
              </div>
              <div className="relative">
                <Textarea
                  id={`clinical-notes-${field.key}`}
                  value={field.key === "clinicalNotes" ? clinicalNotes : assessmentAndPlan}
                  onChange={(e) => {
                    if (field.key === "clinicalNotes") onClinicalNotesChange(e.target.value)
                    else onAssessmentAndPlanChange(e.target.value)
                  }}
                  placeholder={field.placeholder}
                  className={cn(
                    TEXTAREA_CLASS,
                    generating && "border-violet-200 ring-1 ring-violet-100",
                  )}
                  aria-describedby={listening && interimText ? `${field.key}-interim` : undefined}
                />
                {generating ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-b-xl border-t border-violet-100 bg-violet-50/80 px-3 py-2">
                    <SparklesIcon className="size-3.5 text-violet-600" aria-hidden />
                    <span className="text-[11px] font-medium text-violet-800">
                      AI drafting from consultation data…
                    </span>
                  </div>
                ) : null}
              </div>
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
