"use client"

import { useCallback } from "react"
import type { PhysicalExamFindings } from "./consultation.types"
import { useSpeechDictation } from "./useSpeechDictation"
import { MicIcon, StethoscopeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StethoscopeIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Physical examination</h3>
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
          >
            Cardiovascular focus
          </Badge>
          {supported ? (
            <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXAM_FIELDS.map((field) => {
            const listening = activeKey === field.key
            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[#374151]" htmlFor={`physical-exam-${field.key}`}>
                    {field.label}
                  </label>
                  {supported ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          id={`physical-exam-${field.key}-mic`}
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
                  id={`physical-exam-${field.key}`}
                  value={exam[field.key]}
                  onChange={(e) => onExamChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
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
