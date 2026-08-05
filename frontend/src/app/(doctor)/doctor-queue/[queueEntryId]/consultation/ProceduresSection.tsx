"use client"

import { useState } from "react"
import { ScissorsIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ProcedureDetails, ProcedurePriority } from "./consultation.types"

const PROCEDURE_TYPES = [
  { value: "coronary_artery_bypass", label: "Coronary Artery Bypass Graft (CABG)" },
  { value: "valve_replacement", label: "Valve Replacement" },
  { value: "valve_repair", label: "Valve Repair" },
  { value: "pacemaker_implant", label: "Pacemaker Implantation" },
  { value: "icd_implant", label: "ICD Implantation" },
  { value: "cardiac_catheterization", label: "Cardiac Catheterization" },
  { value: "angioplasty", label: "Percutaneous Coronary Intervention (PCI)" },
  { value: "aortic_repair", label: "Aortic Repair / Replacement" },
  { value: "pericardiectomy", label: "Pericardiectomy" },
  { value: "other", label: "Other" },
]

const SURGICAL_SPECIALTIES = [
  { value: "general_surgery", label: "General surgery" },
  { value: "cardiac_surgery", label: "Cardiac surgery" },
  { value: "vascular_surgery", label: "Vascular surgery" },
  { value: "thoracic_surgery", label: "Thoracic surgery" },
  { value: "neurosurgery", label: "Neurosurgery" },
  { value: "orthopedic", label: "Orthopedic surgery" },
  { value: "urology", label: "Urology" },
  { value: "gynecology", label: "Gynecology" },
]

const OPERATING_ROOMS = [
  { value: "OR-1", label: "OR-1" },
  { value: "OR-2", label: "OR-2" },
  { value: "OR-3", label: "OR-3" },
  { value: "OR-4", label: "OR-4" },
  { value: "Cath-Lab-1", label: "Cath Lab 1" },
  { value: "Cath-Lab-2", label: "Cath Lab 2" },
]

const ANESTHESIA_TYPES = [
  { value: "general", label: "General" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
  { value: "sedation", label: "Sedation / MAC" },
  { value: "spinal", label: "Spinal" },
  { value: "epidural", label: "Epidural" },
]

const ASA_CLASSIFICATIONS = [
  { value: "ASA_I", label: "ASA I" },
  { value: "ASA_II", label: "ASA II" },
  { value: "ASA_III", label: "ASA III" },
  { value: "ASA_IV", label: "ASA IV" },
  { value: "ASA_V", label: "ASA V" },
]

const PRIORITY_OPTIONS: { value: ProcedurePriority; label: string }[] = [
  { value: "elective", label: "Elective" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
]

const DURATION_MIN = 15
const DURATION_MAX = 480
const DURATION_STEP = 15

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 text-[13px] text-[#102F27]",
          "focus:outline-none focus:ring-2 focus:ring-[#1A5345]/25 focus:border-[#1A5345]/40",
          !value && "text-muted-foreground",
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export type ProceduresSectionProps = {
  details: ProcedureDetails
  onDetailsChange: <K extends keyof ProcedureDetails>(key: K, value: ProcedureDetails[K]) => void
}

export function ProceduresSection({ details, onDetailsChange }: ProceduresSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <ScissorsIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Surgical Procedure</h3>
          {!isOpen && (
            <span className="rounded-full bg-[#F6FBF9] px-2.5 py-0.5 text-[10px] font-medium text-[#1A5345] border border-[#E5EEEA]">
              Click to add
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <div className="flex items-center gap-1 rounded-lg bg-[#1A5345]/8 px-2.5 py-1.5">
              <PlusIcon className="size-3.5 text-[#1A5345]" />
              <span className="text-[12px] font-medium text-[#1A5345]">Add Procedure</span>
            </div>
          )}
          {isOpen ? (
            <ChevronUpIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="border-t border-[#E8E6E0] px-5 pb-5 pt-4 space-y-5">
          {/* PROCEDURE DETAILS */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Procedure Details
            </p>

            {/* Row 1: Procedure type + Surgical specialty */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Procedure type"
                value={details.procedureType}
                onChange={(v) => onDetailsChange("procedureType", v)}
                options={PROCEDURE_TYPES}
                placeholder="Select procedure..."
              />
              <SelectField
                label="Surgical specialty"
                value={details.surgicalSpecialty}
                onChange={(v) => onDetailsChange("surgicalSpecialty", v)}
                options={SURGICAL_SPECIALTIES}
              />
            </div>

            {/* Row 2: Surgery date + Start time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Surgery date</label>
                <input
                  type="date"
                  value={details.surgeryDate}
                  onChange={(e) => onDetailsChange("surgeryDate", e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 text-[13px] text-[#102F27]",
                    "focus:outline-none focus:ring-2 focus:ring-[#1A5345]/25 focus:border-[#1A5345]/40",
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Start time</label>
                <input
                  type="time"
                  value={details.startTime}
                  onChange={(e) => onDetailsChange("startTime", e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 text-[13px] text-[#102F27]",
                    "focus:outline-none focus:ring-2 focus:ring-[#1A5345]/25 focus:border-[#1A5345]/40",
                  )}
                />
              </div>
            </div>

            {/* Row 3: OR + Anesthesia + ASA */}
            <div className="grid grid-cols-3 gap-3">
              <SelectField
                label="Operating room"
                value={details.operatingRoom}
                onChange={(v) => onDetailsChange("operatingRoom", v)}
                options={OPERATING_ROOMS}
              />
              <SelectField
                label="Anesthesia type"
                value={details.anesthesiaType}
                onChange={(v) => onDetailsChange("anesthesiaType", v)}
                options={ANESTHESIA_TYPES}
              />
              <SelectField
                label="ASA classification"
                value={details.asaClassification}
                onChange={(v) => onDetailsChange("asaClassification", v)}
                options={ASA_CLASSIFICATIONS}
              />
            </div>

            {/* Row 4: Estimated duration slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground">Estimated duration</label>
                <span className="text-[12px] font-semibold text-[#1A5345]">
                  {formatDuration(details.estimatedDurationMin)}
                </span>
              </div>
              <input
                type="range"
                min={DURATION_MIN}
                max={DURATION_MAX}
                step={DURATION_STEP}
                value={details.estimatedDurationMin}
                onChange={(e) => onDetailsChange("estimatedDurationMin", Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E8E6E0] accent-[#1A5345]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>15 min</span>
                <span>8 hr</span>
              </div>
            </div>
          </div>

          {/* PRIORITY & CLINICAL NOTES */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Priority &amp; Clinical Notes
            </p>

            {/* Priority toggle */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onDetailsChange("priority", opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                      details.priority === opt.value
                        ? opt.value === "emergency"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : opt.value === "urgent"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-[#1A5345]/30 bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-[#FAFAF8] text-[#102F27] hover:bg-[#F0F5F3]",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical notes textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Clinical indication &amp; surgeon&apos;s notes
              </label>
              <Textarea
                value={details.clinicalNotes}
                onChange={(e) => onDetailsChange("clinicalNotes", e.target.value)}
                placeholder="Enter clinical justification, relevant findings, or operative plan..."
                rows={4}
                className="resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[13px] placeholder:text-muted-foreground focus-visible:ring-[#1A5345]/25"
              />
            </div>
          </div>

          {/* Cancel button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-[12px] text-muted-foreground hover:text-[#102F27]"
            >
              Collapse
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
