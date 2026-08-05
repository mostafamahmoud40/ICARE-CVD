"use client"

import { useCallback } from "react"
import type { PhysicalExamFindings } from "./consultation.types"
import { useSpeechDictation } from "./useSpeechDictation"
import { MicIcon, StethoscopeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  const getText = useCallback((key: keyof PhysicalExamFindings) => exam[key], [exam])
  const setText = useCallback(
    (key: keyof PhysicalExamFindings, value: string) => onExamChange(key, value),
    [onExamChange],
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
            <StethoscopeIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Physical Examination</h3>
          <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#2C6A5B]">
            Cardiovascular Focus
          </span>
          {supported ? (
            <span className="text-[10px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EXAM_FIELDS.map((field) => {
            const listening = activeKey === field.key
            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-medium text-muted-foreground" htmlFor={`physical-exam-${field.key}`}>
                    {field.label}
                  </label>
                  {supported ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          id={`physical-exam-${field.key}-mic`}
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
                  id={`physical-exam-${field.key}`}
                  value={exam[field.key]}
                  onChange={(e) => onExamChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-[56px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
                  aria-describedby={listening && interimText ? `${field.key}-interim` : undefined}
                />
                {listening ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[#B42318]">{formatElapsedTime(elapsedSeconds)}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EEF5F3]">
                      <div
                        className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                        style={{ width: `${Math.max(6, audioLevel)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Voice level</span>
                  </div>
                ) : null}
                {listening && interimText ? (
                  <p id={`${field.key}-interim`} className="text-[11px] leading-snug text-[#6B7280]">
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
