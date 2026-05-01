"use client"

import { useCallback } from "react"
import { CalendarClockIcon, MicIcon } from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <CalendarClockIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Follow-Up</h3>
          {supported ? (
            <span className="text-[10px] text-muted-foreground">Type or use voice dictation</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Next Appointment</label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => onFollowUpDateChange(e.target.value)}
              className="h-9 border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-medium text-muted-foreground" htmlFor="follow-up-notes">
                Follow-Up Instructions
              </label>
              {supported ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      id="follow-up-notes-mic"
                      variant={listening ? "secondary" : "ghost"}
                      size="icon-xs"
                      className={
                        listening
                          ? "shrink-0 text-[#B42318] ring-2 ring-[#B42318]/25"
                          : "shrink-0 text-[#2C6A5B]"
                      }
                      aria-pressed={listening}
                      aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
                      onClick={() => toggle("followUpNotes")}
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
              id="follow-up-notes"
              value={followUpNotes}
              onChange={(e) => onFollowUpNotesChange(e.target.value)}
              placeholder="e.g. Return in 2 weeks for BP check, fasting labs before next visit..."
              className="min-h-[36px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
              aria-describedby={listening && interimText ? "follow-up-notes-interim" : undefined}
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
              <p id="follow-up-notes-interim" className="text-[11px] leading-snug text-[#6B7280]">
                {interimText}
              </p>
            ) : null}
          </div>
        </div>
      </div>
  )
}
