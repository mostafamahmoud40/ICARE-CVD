"use client"

import { useState } from "react"
import { ArrowRightLeftIcon, PlusIcon, Trash2Icon, UserRoundIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ReferralEntry } from "./consultation.types"

const SECTION_CARD = "overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"

const REFERRAL_SPECIALTIES = [
  "Cardiology",
  "Cardiac Surgery",
  "Vascular Surgery",
  "Endocrinology",
  "Nephrology",
  "Pulmonology",
  "Gastroenterology",
  "Neurology",
  "General Surgery",
  "Dietitian / Nutrition",
  "Cardiac Rehabilitation",
  "Psychiatry",
  "Rheumatology",
  "Oncology",
  "Other",
]

export type ReferralsSectionProps = {
  referrals: ReferralEntry[]
  onAddReferral: (entry: ReferralEntry) => void
  onRemoveReferral: (id: string) => void
}

export function ReferralsSection({
  referrals,
  onAddReferral,
  onRemoveReferral,
}: ReferralsSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [specialty, setSpecialty] = useState("")
  const [reason, setReason] = useState("")
  const [urgency, setUrgency] = useState<ReferralEntry["urgency"]>("routine")

  const resetForm = () => {
    setSpecialty("")
    setReason("")
    setUrgency("routine")
    setIsAdding(false)
  }

  const handleSubmit = () => {
    if (!specialty.trim() || !reason.trim()) return
    onAddReferral({
      id: crypto.randomUUID(),
      specialty: specialty.trim(),
      reason: reason.trim(),
      urgency,
    })
    resetForm()
  }

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeftIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Specialist referrals</h3>
          {referrals.length > 0 && (
            <Badge className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]">
              {referrals.length}
            </Badge>
          )}
        </div>
        {!isAdding ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="h-9 gap-1.5 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold text-[#1A5345] hover:bg-[#F9F8F5]"
          >
            <PlusIcon className="size-4" />
            Add referral
          </Button>
        ) : null}
      </div>

      {referrals.length === 0 && !isAdding ? (
        <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-8 text-center">
          <ArrowRightLeftIcon className="mx-auto mb-2 size-5 text-[#1A5345]/40" aria-hidden />
          <p className="text-[13px] font-medium text-[#6B7870]">
            No specialist referrals yet. Refer the patient to another doctor when needed.
          </p>
        </div>
      ) : null}

      {referrals.length > 0 ? (
        <div className="mb-4 space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0EE]/80 px-2 py-1 text-[11px] font-bold text-[#1A5345]">
                      <UserRoundIcon className="size-3" aria-hidden />
                      {referral.specialty}
                    </span>
                    <span
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-bold shadow-sm",
                        referral.urgency === "urgent"
                          ? "bg-red-600 text-white"
                          : "bg-emerald-600 text-white",
                      )}
                    >
                      {referral.urgency === "urgent" ? "Urgent" : "Routine"}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#1A1F1E]">
                    <span className="font-bold text-[#6B7870]">Reason: </span>
                    {referral.reason}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => onRemoveReferral(referral.id)}
                  aria-label={`Remove ${referral.specialty} referral`}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isAdding ? (
        <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Specialty / doctor type</label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_SPECIALTIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Reason for referral</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clinical reason and what you need the specialist to assess..."
              className="min-h-[88px] resize-none rounded-xl border-[#E8E6E0] bg-white text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Urgency</label>
            <Select
              value={urgency}
              onValueChange={(value) => setUrgency(value as ReferralEntry["urgency"])}
            >
              <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 flex-1 rounded-lg text-[13px]"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]"
              disabled={!specialty.trim() || !reason.trim()}
              onClick={handleSubmit}
            >
              Add referral
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
