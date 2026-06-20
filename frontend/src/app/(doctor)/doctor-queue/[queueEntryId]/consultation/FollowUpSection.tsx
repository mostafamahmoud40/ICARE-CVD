"use client"

import { useCallback } from "react"
import { CalendarClockIcon, MicIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
const TEXTAREA_CLASS =
  "min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

export type FollowUpSectionProps = {
  followUpDate: string
  onFollowUpDateChange: (value: string) => void
  followUpNotes: string
  onFollowUpNotesChange: (value: string) => void
}

export function FollowUpSection({
  followUpDate,
  onFollowUpDateChange,
  followUpNotes,
  onFollowUpNotesChange,
}: FollowUpSectionProps) {
  const getText = useCallback(() => followUpNotes, [followUpNotes])
  const setText = useCallback(
    (_key: "followUpNotes", value: string) => onFollowUpNotesChange(value),
    [onFollowUpNotesChange],
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

  const listening = activeKey === "followUpNotes"

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CalendarClockIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Follow-up</h3>
        {supported ? (
          <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL} htmlFor="follow-up-date">
            Next appointment
          </label>
          <Input
            id="follow-up-date"
            type="date"
            value={followUpDate}
            onChange={(e) => onFollowUpDateChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className={FIELD_LABEL} htmlFor="follow-up-notes">
              Follow-up instructions
            </label>
            {supported ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    id="follow-up-notes-mic"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 border-0 bg-transparent shadow-none hover:bg-transparent",
                      listening ? "text-rose-600" : "text-[#1A5345] hover:text-[#133F34]",
                    )}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
                    onClick={() => toggle("followUpNotes")}
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
            id="follow-up-notes"
            value={followUpNotes}
            onChange={(e) => onFollowUpNotesChange(e.target.value)}
            placeholder="e.g. Return in 2 weeks for BP check, fasting labs before next visit..."
            className={TEXTAREA_CLASS}
            aria-describedby={listening && interimText ? "follow-up-notes-interim" : undefined}
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
            <p id="follow-up-notes-interim" className="text-[12px] leading-snug text-muted-foreground">
              {interimText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
