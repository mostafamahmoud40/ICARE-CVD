"use client"

import { appointmentsBookingCardClassName, StepHeading } from "./shared"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BookingReasonProps {
  value: string
  onChange: (value: string) => void
}

const commonReasons = [
  { id: "checkup", label: "Routine Checkup" },
  { id: "symptoms", label: "New Symptoms" },
  { id: "followup", label: "Follow-up Visit" },
  { id: "prescription", label: "Prescription Refill" },
  { id: "results", label: "Discuss Test Results" },
  { id: "other", label: "Other" },
]

export function BookingReason({ value, onChange }: BookingReasonProps) {
  const selectedReason = commonReasons.find((r) => r.label === value)?.id || "other"
  const isOther = selectedReason === "other" && !commonReasons.some((r) => r.label === value)

  return (
    <div className={appointmentsBookingCardClassName}>
      <StepHeading step={2} title="Reason for visit" />

      <div className="mb-4">
        <Select
          value={selectedReason}
          onValueChange={(v) => {
            const reason = commonReasons.find((r) => r.id === v)
            if (reason) onChange(reason.label)
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E6E0]/80 bg-[#F9F8F5] text-[13px] font-medium text-[#1A1F1E] focus:ring-2 focus:ring-[#1A5345]/12">
            <SelectValue placeholder="Select reason for visit" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#E8E6E0]/80 bg-white">
            {commonReasons.map((reason) => (
              <SelectItem
                key={reason.id}
                value={reason.id}
                className="cursor-pointer text-[13px] font-medium"
              >
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-bold text-[#1A1F1E]">
          Describe your symptoms or reason
        </label>
        <textarea
          value={
            isOther
              ? value
              : value === commonReasons.find((r) => r.id === selectedReason)?.label
                ? ""
                : value
          }
          onChange={(e) => onChange(e.target.value)}
          placeholder="Please describe what brings you in today…"
          rows={3}
          className="w-full resize-none rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/50 p-3 text-[14px] font-medium text-[#1A1F1E] placeholder:text-muted-foreground/55 focus:border-[#1A5345]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A5345]/12"
        />
      </div>
    </div>
  )
}

export default BookingReason
