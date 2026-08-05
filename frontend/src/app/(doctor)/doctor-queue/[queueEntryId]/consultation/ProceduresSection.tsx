"use client"

import { useState } from "react"
import { ChevronDownIcon, PlusIcon, ScissorsIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ProcedureDetails, ProcedurePriority } from "./consultation.types"

const SECTION_CARD = "overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 w-full rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] px-3 text-[14px] text-[#1A1F1E] focus:outline-none focus:border-[#1A5345] focus:ring-2 focus:ring-[#1A5345]/20"
const SECTION_LABEL = "text-[13px] font-semibold text-[#1A1F1E]"

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
      <label className={FIELD_LABEL}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_CLASS, !value && "text-muted-foreground")}
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
    <div className={SECTION_CARD}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FAFAF8]"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ScissorsIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Surgical procedure</h3>
          {!isOpen ? (
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-slate-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-slate-500"
            >
              Optional
            </Badge>
          ) : null}
        </div>
        <ChevronDownIcon
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      {!isOpen ? (
        <div className="border-t border-[#E8E6E0]/60 px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
          >
            <PlusIcon className="size-4" aria-hidden />
            Add procedure
          </button>
        </div>
      ) : null}

      {isOpen ? (
        <div className="space-y-5 border-t border-[#E8E6E0]/60 px-5 pb-5 pt-4">
          <div className="space-y-4">
            <p className={SECTION_LABEL}>Procedure details</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={FIELD_LABEL}>Surgery date</label>
                <input
                  type="date"
                  value={details.surgeryDate}
                  onChange={(e) => onDetailsChange("surgeryDate", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={FIELD_LABEL}>Start time</label>
                <input
                  type="time"
                  value={details.startTime}
                  onChange={(e) => onDetailsChange("startTime", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={FIELD_LABEL}>Estimated duration</label>
                <span className="text-[13px] font-semibold text-[#1A5345]">
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
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>15 min</span>
                <span>8 hr</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className={SECTION_LABEL}>Priority & clinical notes</p>

            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDetailsChange("priority", opt.value)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors",
                    details.priority === opt.value
                      ? opt.value === "emergency"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : opt.value === "urgent"
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-[#1A5345]/30 bg-[#E8F0EE] text-[#1A5345]"
                      : "border-[#E8E6E0] bg-[#FAFAF8] text-[#1A1F1E] hover:bg-[#F0F5F3]",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Clinical indication & surgeon&apos;s notes</label>
              <Textarea
                value={details.clinicalNotes}
                onChange={(e) => onDetailsChange("clinicalNotes", e.target.value)}
                placeholder="Enter clinical justification, relevant findings, or operative plan..."
                rows={4}
                className="resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-10 rounded-lg text-[13px]"
            >
              Collapse
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
