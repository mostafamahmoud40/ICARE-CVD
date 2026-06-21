"use client"

import type { ConsultationData } from "./consultation.types"
import { answerPatientConsultationQuery } from "./consultationPatientQueryEngine"
import { useCallback, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, MessageCircleIcon, MicIcon, SendHorizontalIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PatientQueryDraftKey = "patientQueryDraft"

/** Set to `true` when the floating patient query bar should be visible. */
export const CONSULTATION_FLOATING_QUERY_BAR_ENABLED = false

export type ConsultationFloatingPatientQueryBarProps = {
  data: ConsultationData
}

export function ConsultationFloatingPatientQueryBar({ data }: ConsultationFloatingPatientQueryBarProps) {
  if (!CONSULTATION_FLOATING_QUERY_BAR_ENABLED) return null
  const [draft, setDraft] = useState("")
  const [lastQuery, setLastQuery] = useState<string | null>(null)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const getText = useCallback(
    (_key: PatientQueryDraftKey) => draft,
    [draft],
  )
  const setText = useCallback((_key: PatientQueryDraftKey, value: string) => {
    setDraft(value)
  }, [])

  const { supported, activeKey, interimText, audioLevel, elapsedSeconds, toggle } = useSpeechDictation({
    getText,
    setText,
  })

  const listening = activeKey === "patientQueryDraft"

  const formatElapsedTime = useCallback((totalSeconds: number) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
    const ss = String(totalSeconds % 60).padStart(2, "0")
    return `${mm}:${ss}`
  }, [])

  const submit = useCallback(() => {
    const q = draft.trim()
    const reply = answerPatientConsultationQuery(q || " ", data)
    setLastQuery(q || "(empty)")
    setLastReply(reply)
    setPanelOpen(true)
    setDraft("")
  }, [data, draft])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 sm:px-4",
        "bottom-[max(2.5rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="pointer-events-auto w-full max-w-xl">
        {lastReply && panelOpen ? (
          <div
            className="mb-2 max-h-[min(40vh,280px)] overflow-hidden rounded-2xl border border-white/10 bg-transparent shadow-none backdrop-blur-sm"
            aria-live="polite"
          >
            <div className="flex max-h-[min(40vh,280px)] flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-transparent px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MessageCircleIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                  <span className="truncate text-[11px] font-medium text-[#102F27]">
                    {lastQuery ? `Q: ${lastQuery}` : "Answer"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Collapse answer"
                >
                  <ChevronDownIcon className="size-4" />
                </Button>
              </div>
              <div className="scrollbar-hide overflow-y-auto px-3 py-2.5">
                <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[#1A1F1E]">
                  {lastReply}
                </pre>
              </div>
            </div>
          </div>
        ) : null}

        {!panelOpen && lastReply ? (
          <div className="mb-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-full border border-white/10 bg-transparent px-2.5 text-[11px] backdrop-blur-sm"
              onClick={() => setPanelOpen(true)}
            >
              <ChevronUpIcon className="size-3.5" />
              Show last answer
            </Button>
          </div>
        ) : null}

        {listening ? (
          <div className="mb-2 rounded-2xl border border-white/10 bg-transparent px-3 py-2 shadow-none backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[#B42318]">{formatElapsedTime(elapsedSeconds)}</span>
              <div className="h-1.5 min-w-0 flex-1 max-w-[140px] overflow-hidden rounded-full bg-[#EEF5F3]">
                <div
                  className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                  style={{ width: `${Math.max(6, audioLevel)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">Voice level</span>
            </div>
            {interimText ? (
              <p id="patient-query-draft-interim" className="mt-1.5 text-[11px] leading-snug text-[#6B7280]">
                {interimText}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-transparent p-1.5 pl-2 shadow-none backdrop-blur-sm">
          <MessageCircleIcon className="size-4 shrink-0 text-[#1A5345]/80" aria-hidden />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about this patient (vitals, meds, allergies, compare…)"
            className="h-9 flex-1 border-0 bg-transparent text-[13px] shadow-none focus-visible:ring-0"
            aria-label="Ask about this patient"
            aria-describedby={listening && interimText ? "patient-query-draft-interim" : undefined}
          />
          {supported ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  id="patient-query-floating-mic"
                  variant={listening ? "secondary" : "ghost"}
                  size="icon-sm"
                  className={cn(
                    "shrink-0 hover:bg-transparent",
                    listening
                      ? "text-[#B42318] ring-2 ring-[#B42318]/25"
                      : "text-[#1A5345]/70 hover:text-[#1A5345]",
                  )}
                  aria-pressed={listening}
                  aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
                  onClick={() => toggle("patientQueryDraft")}
                >
                  <MicIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                {listening ? "Stop dictation" : "Voice dictation"}
              </TooltipContent>
            </Tooltip>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            className="shrink-0 rounded-xl bg-[#1A5345] hover:bg-[#0F3D32]"
            onClick={submit}
            aria-label="Send question"
          >
            <SendHorizontalIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
