"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquareTextIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CVD_COMPLAINTS = [
  { value: "chest_pain", label: "Chest Pain" },
  { value: "dyspnea", label: "Shortness of Breath (Dyspnea)" },
  { value: "palpitations", label: "Palpitations" },
  { value: "syncope", label: "Syncope / Near-Syncope" },
  { value: "fatigue", label: "Fatigue" },
  { value: "edema", label: "Peripheral Edema" },
  { value: "dizziness", label: "Dizziness" },
  { value: "orthopnea", label: "Orthopnea" },
  { value: "pnd", label: "Paroxysmal Nocturnal Dyspnea" },
  { value: "claudication", label: "Claudication" },
  { value: "diaphoresis", label: "Diaphoresis" },
  { value: "nausea", label: "Nausea / Vomiting" },
  { value: "jaw_pain", label: "Jaw Pain" },
  { value: "arm_pain", label: "Arm Pain" },
  { value: "back_pain", label: "Back Pain" },
  { value: "epigastric_pain", label: "Epigastric Pain" },
  { value: "other", label: "Other" },
] as const

const ONSET_OPTIONS = ["Sudden", "Gradual", "Intermittent"] as const
const DURATION_OPTIONS = ["< 24 hours", "1-3 days", "1 week", "> 1 week", "Chronic"] as const
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const
const CHARACTER_OPTIONS = ["Sharp", "Dull", "Pressure-like", "Burning", "Throbbing"] as const
const AGGRAVATING_OPTIONS = ["Exertion", "Stress", "After meals", "Deep breathing", "Lying flat"] as const
const RELIEVING_OPTIONS = ["Rest", "Medication", "Sitting upright", "Hydration", "None"] as const

export type ChiefComplaintSectionProps = {
  complaint: string
  onComplaintChange: (value: string) => void
  structuredComplaint: string
  onStructuredComplaintChange: (value: string) => void
}

export function ChiefComplaintSection({
  complaint,
  onComplaintChange,
  structuredComplaint,
  onStructuredComplaintChange,
}: ChiefComplaintSectionProps) {
  const [onset, setOnset] = useState("")
  const [duration, setDuration] = useState("")
  const [severity, setSeverity] = useState("")
  const [character, setCharacter] = useState("")
  const [aggravating, setAggravating] = useState<string[]>([])
  const [relieving, setRelieving] = useState<string[]>([])

  const complaintLabel = useMemo(
    () => CVD_COMPLAINTS.find((c) => c.value === structuredComplaint)?.label ?? "",
    [structuredComplaint],
  )

  const generatedDescription = useMemo(() => {
    if (!complaintLabel) return ""

    const parts = [
      `Patient presents with ${complaintLabel.toLowerCase()}.`,
      onset ? `Onset: ${onset}.` : "",
      duration ? `Duration: ${duration}.` : "",
      severity ? `Severity: ${severity}.` : "",
      character ? `Character: ${character}.` : "",
      aggravating.length ? `Aggravating factors: ${aggravating.join(", ")}.` : "",
      relieving.length ? `Relieving factors: ${relieving.join(", ")}.` : "",
    ].filter(Boolean)

    return parts.join(" ")
  }, [aggravating, character, complaintLabel, duration, onset, relieving, severity])

  useEffect(() => {
    if (generatedDescription !== complaint) {
      onComplaintChange(generatedDescription)
    }
  }, [generatedDescription, complaint, onComplaintChange])

  const toggleMultiValue = (values: string[], value: string, setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value))
      return
    }
    setter([...values, value])
  }

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <MessageSquareTextIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Chief Complaint</h3>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Structured Complaint</label>
          <Select value={structuredComplaint} onValueChange={onStructuredComplaintChange}>
            <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
              <SelectValue placeholder="Select primary complaint..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {CVD_COMPLAINTS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="cursor-pointer text-[13px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Detailed Description</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={onset} onValueChange={setOnset}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24]">
                <SelectValue placeholder="Onset" />
              </SelectTrigger>
              <SelectContent>
                {ONSET_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24]">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={character} onValueChange={setCharacter}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24]">
                <SelectValue placeholder="Character" />
              </SelectTrigger>
              <SelectContent>
                {CHARACTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 rounded-lg border border-[#E8E6E0] bg-white p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Aggravating factors</p>
            <div className="flex flex-wrap gap-1.5">
              {AGGRAVATING_OPTIONS.map((option) => {
                const active = aggravating.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiValue(aggravating, option, setAggravating)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      active
                        ? "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-[#FAFAF8] text-[#4B5563] hover:border-[#A8C4BC]"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg border border-[#E8E6E0] bg-white p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Relieving factors</p>
            <div className="flex flex-wrap gap-1.5">
              {RELIEVING_OPTIONS.map((option) => {
                const active = relieving.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiValue(relieving, option, setRelieving)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      active
                        ? "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-[#FAFAF8] text-[#4B5563] hover:border-[#A8C4BC]"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          <Textarea
            value={generatedDescription || complaint}
            readOnly
            placeholder="Select complaint options to generate the detailed description."
            className="min-h-[80px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>
    </div>
  )
}
