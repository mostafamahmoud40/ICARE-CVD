"use client"

import { cn } from "@/lib/utils"
import { FileTextIcon } from "lucide-react"
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
  const selectedReason = commonReasons.find(r => r.label === value)?.id || "other"
  const isOther = selectedReason === "other" && !commonReasons.some(r => r.label === value)

  return (
    <div className="rounded-2xl border border-[#cfd9d5] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <FileTextIcon className="size-4 text-[#00392D]" />
        </div>
        <h3 className="text-lg font-bold text-[#152a24]">Reason for Visit</h3>
      </div>

      {/* Reason Dropdown */}
      <div className="mb-4">
        <Select
          value={selectedReason}
          onValueChange={(v) => {
            const reason = commonReasons.find(r => r.id === v)
            if (reason) onChange(reason.label)
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
            <SelectValue placeholder="Select reason for visit" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
            {commonReasons.map((reason) => (
              <SelectItem 
                key={reason.id} 
                value={reason.id} 
                className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10"
              >
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Input */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#152a24]">
          Describe your symptoms or reason
        </label>
        <textarea
          value={isOther ? value : value === commonReasons.find(r => r.id === selectedReason)?.label ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Please describe what brings you in today..."
          rows={3}
          className="w-full resize-none rounded-xl border border-[#cfd9d5] bg-white p-3 text-[14px] text-[#152a24] placeholder:text-[#9CA3AF] focus:border-[#d9e5e1] focus:outline-none"
        />
      </div>
    </div>
  )
}

export default BookingReason
