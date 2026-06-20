"use client"

import { useCallback, useState, type ReactNode } from "react"
import {
  AlertTriangleIcon,
  AppleIcon,
  HeartPulseIcon,
  Loader2Icon,
  MicIcon,
  SparklesIcon,
  StethoscopeIcon,
} from "lucide-react"
import type { ClinicalNotesAiContext } from "./clinicalNotesAiSuggestions"
import { buildPatientInstructionsDraft } from "./patientInstructionsAiSuggestions"
import { useSpeechDictation } from "./useSpeechDictation"
import { showIcareToast } from "@/components/shared/icare-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const TEXTAREA_CLASS =
  "min-h-[100px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

const AI_GENERATE_MS = 700

type PatientInstructionFieldKey =
  | "patientDiagnosisSummary"
  | "patientLifestyleAdvice"
  | "patientDangerSigns"

const PATIENT_INSTRUCTION_FIELDS: Array<{
  key: PatientInstructionFieldKey
  id: string
  label: ReactNode
  placeholder: string
  textareaClass: string
}> = [
  {
    key: "patientDiagnosisSummary",
    id: "patient-diagnosis-summary",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <StethoscopeIcon className="size-4 text-[#1A5345]" aria-hidden />
        Diagnosis (patient-friendly)
      </span>
    ),
    placeholder: "Explain the diagnosis in simple terms the patient can understand…",
    textareaClass: TEXTAREA_CLASS,
  },
  {
    key: "patientLifestyleAdvice",
    id: "patient-lifestyle-advice",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <AppleIcon className="size-4 text-[#1A5345]" aria-hidden />
        Lifestyle & diet guidance
      </span>
    ),
    placeholder: "Diet, exercise, medication habits, sleep, smoking cessation…",
    textareaClass:
      "min-h-[120px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20",
  },
  {
    key: "patientDangerSigns",
    id: "patient-danger-signs",
    label: (
      <span className="inline-flex items-center gap-1.5 text-red-700">
        <AlertTriangleIcon className="size-4" aria-hidden />
        When to go to emergency immediately
      </span>
    ),
    placeholder: "List red-flag symptoms — chest pain at rest, fainting, severe breathlessness…",
    textareaClass:
      "min-h-[120px] resize-none rounded-xl border-red-200/80 bg-red-50/30 text-[14px] placeholder:text-red-900/40 focus-visible:border-red-400 focus-visible:ring-red-400/20",
  },
]

export type PatientInstructionsSectionProps = {
  patientDiagnosisSummary: string
  onPatientDiagnosisSummaryChange: (value: string) => void
  patientLifestyleAdvice: string
  onPatientLifestyleAdviceChange: (value: string) => void
  patientDangerSigns: string
  onPatientDangerSignsChange: (value: string) => void
  aiContext: ClinicalNotesAiContext
}

export function PatientInstructionsSection({
  patientDiagnosisSummary,
  onPatientDiagnosisSummaryChange,
  patientLifestyleAdvice,
  onPatientLifestyleAdviceChange,
  patientDangerSigns,
  onPatientDangerSignsChange,
  aiContext,
}: PatientInstructionsSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const values: Record<PatientInstructionFieldKey, string> = {
    patientDiagnosisSummary,
    patientLifestyleAdvice,
    patientDangerSigns,
  }

  const getText = useCallback((key: PatientInstructionFieldKey) => values[key], [values])

  const setText = useCallback(
    (key: PatientInstructionFieldKey, value: string) => {
      if (key === "patientDiagnosisSummary") onPatientDiagnosisSummaryChange(value)
      else if (key === "patientLifestyleAdvice") onPatientLifestyleAdviceChange(value)
      else onPatientDangerSignsChange(value)
    },
    [onPatientDangerSignsChange, onPatientDiagnosisSummaryChange, onPatientLifestyleAdviceChange],
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

  const runAiDraft = useCallback(() => {
    if (isGenerating) return
    setIsGenerating(true)
    window.setTimeout(() => {
      const draft = buildPatientInstructionsDraft(aiContext)
      onPatientDiagnosisSummaryChange(draft.patientDiagnosisSummary)
      onPatientLifestyleAdviceChange(draft.patientLifestyleAdvice)
      onPatientDangerSignsChange(draft.patientDangerSigns)
      setIsGenerating(false)
      showIcareToast({
        title: "Patient instructions drafted",
        description: "Review and edit before completing the visit — these appear on the patient report.",
      })
    }, AI_GENERATE_MS)
  }, [
    aiContext,
    isGenerating,
    onPatientDangerSignsChange,
    onPatientDiagnosisSummaryChange,
    onPatientLifestyleAdviceChange,
  ])

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <HeartPulseIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Patient instructions</h3>
          <Badge
            variant="outline"
            className="rounded-lg border-[#E8E6E0] bg-[#F9F8F5] px-2 py-0.5 text-[10px] font-semibold text-[#6B7870]"
          >
            Shown on patient report
          </Badge>
          {supported ? (
            <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isGenerating}
              onClick={runAiDraft}
              className="size-8 border-0 bg-transparent text-violet-600 shadow-none hover:bg-transparent hover:text-violet-800"
              aria-label="Generate patient instructions draft"
            >
              {isGenerating ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <SparklesIcon className="size-4" aria-hidden />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-center">
            {isGenerating ? "Drafting instructions…" : "AI draft — diagnosis, lifestyle & emergency signs"}
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">
        Plain-language guidance for the patient — separate from internal clinical notes and assessment.
      </p>

      <div className="space-y-4">
        {PATIENT_INSTRUCTION_FIELDS.map((field) => {
          const listening = activeKey === field.key
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className={FIELD_LABEL} htmlFor={field.id}>
                  {field.label}
                </label>
                {supported ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        id={`${field.id}-mic`}
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
                id={field.id}
                value={values[field.key]}
                onChange={(e) => setText(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={field.textareaClass}
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
