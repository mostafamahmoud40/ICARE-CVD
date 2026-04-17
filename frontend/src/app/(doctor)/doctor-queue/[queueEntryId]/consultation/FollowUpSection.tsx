"use client"

import { CalendarClockIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <CalendarClockIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Follow-Up</h3>
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
          <label className="text-[11px] font-medium text-muted-foreground">Follow-Up Instructions</label>
          <Textarea
            value={followUpNotes}
            onChange={(e) => onFollowUpNotesChange(e.target.value)}
            placeholder="e.g. Return in 2 weeks for BP check, fasting labs before next visit..."
            className="min-h-[36px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>
    </div>
  )
}
