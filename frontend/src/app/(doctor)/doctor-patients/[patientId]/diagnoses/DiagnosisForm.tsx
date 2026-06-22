"use client"

import { useState } from "react"
import {
  ActivityIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  HeartPulseIcon,
  StickyNoteIcon,
  TagsIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  DiagnosisFormValues,
  DiagnosisSeverity,
  DiagnosisStatus,
  DiagnosisType,
  DiagnosisCategory,
  Laterality,
  NyhaClass,
} from "./diagnosisForm.types"
import { DIAGNOSIS_CATEGORY_LABELS } from "../../doctorPatients.types"

type DiagnosisFormProps = {
  initial: DiagnosisFormValues
  onCancel: () => void
  onSubmit: (values: DiagnosisFormValues) => void | Promise<void>
  isSubmitting?: boolean
}

const inputClassName =
  "h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] sm:text-[14px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20 shadow-sm"
const selectTriggerClassName =
  "h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] sm:text-[14px] shadow-sm focus-visible:ring-[#1A5345]/20"
const labelClassName = "text-[11px] font-bold uppercase tracking-wider text-[#6B7870] sm:text-[12px] mb-1.5"
const sectionTitleClassName = "mb-1 font-serif text-[18px] font-bold text-[#1A1F1E]"
const sectionDescClassName = "mb-4 text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]"

type FormSection = "details" | "classification" | "severity" | "cardiac" | "notes"

const FORM_SECTIONS: {
  id: FormSection
  label: string
  icon: React.ElementType
}[] = [
  { id: "details", label: "Diagnosis details", icon: FileTextIcon },
  { id: "classification", label: "Classification", icon: TagsIcon },
  { id: "severity", label: "Severity & status", icon: ActivityIcon },
  { id: "cardiac", label: "Cardiac fields", icon: HeartPulseIcon },
  { id: "notes", label: "Clinical notes", icon: StickyNoteIcon },
]

function YesNoPicker({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: boolean
  onChange: (v: boolean) => void
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div className="inline-flex rounded-xl bg-[#F4F3ED] p-1 w-full max-w-xs shadow-sm">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 h-8 rounded-lg text-[12px] font-bold transition-all",
          value
            ? "bg-white text-[#1A5345] shadow-sm"
            : "text-[#6B7870] hover:text-[#1A1F1E]",
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 h-8 rounded-lg text-[12px] font-bold transition-all",
          !value
            ? "bg-white text-[#1A5345] shadow-sm"
            : "text-[#6B7870] hover:text-[#1A1F1E]",
        )}
      >
        {noLabel}
      </button>
    </div>
  )
}

function SeverityPicker({
  value,
  onChange,
}: {
  value: DiagnosisSeverity
  onChange: (v: DiagnosisSeverity) => void
}) {
  const styles: Record<DiagnosisSeverity, { active: string; inactive: string }> = {
    mild: {
      active: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10 border-transparent",
      inactive: "border-emerald-100 hover:border-emerald-300 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-50",
    },
    moderate: {
      active: "bg-amber-500 text-white shadow-sm shadow-amber-500/10 border-transparent",
      inactive: "border-amber-100 hover:border-amber-300 text-amber-700 bg-amber-50/40 hover:bg-amber-50",
    },
    severe: {
      active: "bg-orange-500 text-white shadow-sm shadow-orange-500/10 border-transparent",
      inactive: "border-orange-100 hover:border-orange-300 text-orange-700 bg-orange-50/40 hover:bg-orange-50",
    },
    critical: {
      active: "bg-red-600 text-white shadow-sm shadow-red-600/10 border-transparent",
      inactive: "border-red-100 hover:border-red-300 text-red-700 bg-red-50/40 hover:bg-red-50",
    },
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(["mild", "moderate", "severe", "critical"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "h-10 rounded-xl border text-[13px] font-bold capitalize transition-all",
            value === s ? styles[s].active : cn("border-[#E8E6E0] bg-white", styles[s].inactive),
          )}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function CardiacFields({
  nyhaClass,
  laterality,
  onNyhaChange,
  onLateralityChange,
}: {
  nyhaClass: NyhaClass
  laterality: Laterality
  onNyhaChange: (v: NyhaClass) => void
  onLateralityChange: (v: Laterality) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel className={labelClassName}>NYHA class</FieldLabel>
        <Select value={nyhaClass} onValueChange={(v) => onNyhaChange(v as NyhaClass)}>
          <SelectTrigger className={selectTriggerClassName}>
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
            <SelectItem value="I" className="cursor-pointer text-[13px] sm:text-[14px]">
              Class I — No limitation
            </SelectItem>
            <SelectItem value="II" className="cursor-pointer text-[13px] sm:text-[14px]">
              Class II — Mild limitation
            </SelectItem>
            <SelectItem value="III" className="cursor-pointer text-[13px] sm:text-[14px]">
              Class III — Marked limitation
            </SelectItem>
            <SelectItem value="IV" className="cursor-pointer text-[13px] sm:text-[14px]">
              Class IV — Symptoms at rest
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className={labelClassName}>Laterality / region</FieldLabel>
        <Select value={laterality} onValueChange={(v) => onLateralityChange(v as Laterality)}>
          <SelectTrigger className={selectTriggerClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
            <SelectItem value="unspecified" className="cursor-pointer text-[13px] sm:text-[14px]">
              Unspecified
            </SelectItem>
            <SelectItem value="left" className="cursor-pointer text-[13px] sm:text-[14px]">
              Left
            </SelectItem>
            <SelectItem value="right" className="cursor-pointer text-[13px] sm:text-[14px]">
              Right
            </SelectItem>
            <SelectItem value="bilateral" className="cursor-pointer text-[13px] sm:text-[14px]">
              Bilateral
            </SelectItem>
            <SelectItem value="other" className="cursor-pointer text-[13px] sm:text-[14px]">
              Other
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

export function DiagnosisForm({ initial, onCancel, onSubmit, isSubmitting = false }: DiagnosisFormProps) {
  const [form, setForm] = useState<DiagnosisFormValues>(initial)
  const [activeSection, setActiveSection] = useState<FormSection>("details")
  const set = <K extends keyof DiagnosisFormValues>(k: K, v: DiagnosisFormValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const canSubmit = form.icdCode.trim().length > 0 && form.description.trim().length > 0

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit(form)
      }}
    >
      <div className="flex min-h-[400px] max-h-[min(68vh,520px)]">
        <nav
          className="flex w-[172px] shrink-0 flex-col gap-1.5 border-r border-[#E8E6E0]/60 bg-[#FAFAF8] p-3.5 sm:w-[198px]"
          aria-label="Diagnosis form sections"
        >
          {FORM_SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer",
                  isActive
                    ? "bg-[#EEF5F3] text-[#1A5345] border-[#1A5345]/15 shadow-sm"
                    : "border-transparent text-muted-foreground hover:bg-white hover:text-[#1A1F1E]",
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-[#1A5345]" : "")} aria-hidden />
                <span className={cn("text-[12px] leading-snug sm:text-[13px]", isActive ? "font-bold" : "font-semibold")}>
                  {section.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 custom-scrollbar">
          {activeSection === "details" ? (
            <div>
              <h3 className={sectionTitleClassName}>Diagnosis details</h3>
              <p className={sectionDescClassName}>ICD-10 code, short description, and disease category.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className={labelClassName}>
                    ICD-10 code <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    value={form.icdCode}
                    onChange={(e) => set("icdCode", e.target.value)}
                    placeholder="e.g. I50.9"
                    className={inputClassName}
                  />
                </Field>
                <Field>
                  <FieldLabel className={labelClassName}>
                    Short description <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="e.g. Heart failure, unspecified"
                    className={inputClassName}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel className={labelClassName}>Category</FieldLabel>
                  <Select value={form.category} onValueChange={(v) => set("category", v as DiagnosisCategory)}>
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                      {(Object.entries(DIAGNOSIS_CATEGORY_LABELS) as [DiagnosisCategory, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="cursor-pointer text-[13px] sm:text-[14px]">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {activeSection === "classification" ? (
            <div>
              <h3 className={sectionTitleClassName}>Classification</h3>
              <p className={sectionDescClassName}>Problem list type, chronic/infectious flags, confirmation, and onset date.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className={labelClassName}>Type</FieldLabel>
                  <Select value={form.type} onValueChange={(v) => set("type", v as DiagnosisType)}>
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                      <SelectItem value="primary" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Primary
                      </SelectItem>
                      <SelectItem value="secondary" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Secondary
                      </SelectItem>
                      <SelectItem value="differential" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Differential
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel className={labelClassName}>Chronic disease?</FieldLabel>
                  <YesNoPicker value={form.chronicFlag} onChange={(v) => set("chronicFlag", v)} />
                </Field>
                <Field>
                  <FieldLabel className={labelClassName}>Infectious disease?</FieldLabel>
                  <YesNoPicker value={form.infectiousFlag} onChange={(v) => set("infectiousFlag", v)} />
                </Field>
                <Field>
                  <FieldLabel className={labelClassName}>Confirmation</FieldLabel>
                  <Select
                    value={form.confirmation}
                    onValueChange={(v) => set("confirmation", v as DiagnosisFormValues["confirmation"])}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                      <SelectItem value="confirmed" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Confirmed
                      </SelectItem>
                      <SelectItem value="unconfirmed" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Unconfirmed
                      </SelectItem>
                      <SelectItem value="presumed" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Presumed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel className={labelClassName}>Onset date</FieldLabel>
                  <Input
                    type="date"
                    value={form.onsetDate}
                    onChange={(e) => set("onsetDate", e.target.value)}
                    className={cn(inputClassName, "max-w-xs")}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {activeSection === "severity" ? (
            <div>
              <h3 className={sectionTitleClassName}>Severity &amp; status</h3>
              <p className={sectionDescClassName}>Clinical severity and current problem status.</p>
              <div className="space-y-4">
                <Field>
                  <FieldLabel className={labelClassName}>Severity</FieldLabel>
                  <SeverityPicker value={form.severity} onChange={(v) => set("severity", v)} />
                </Field>
                <Field>
                  <FieldLabel className={labelClassName}>Status</FieldLabel>
                  <Select value={form.status} onValueChange={(v) => set("status", v as DiagnosisStatus)}>
                    <SelectTrigger className={cn(selectTriggerClassName, "max-w-xs")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                      <SelectItem value="active" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Active
                      </SelectItem>
                      <SelectItem value="chronic" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Chronic
                      </SelectItem>
                      <SelectItem value="resolved" className="cursor-pointer text-[13px] sm:text-[14px]">
                        Resolved
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {activeSection === "cardiac" ? (
            <div>
              <h3 className={sectionTitleClassName}>Cardiac-specific fields</h3>
              <p className={sectionDescClassName}>Optional NYHA class and laterality for cardiac diagnoses.</p>
              <CardiacFields
                nyhaClass={form.nyhaClass}
                laterality={form.laterality}
                onNyhaChange={(v) => set("nyhaClass", v)}
                onLateralityChange={(v) => set("laterality", v)}
              />
            </div>
          ) : null}

          {activeSection === "notes" ? (
            <div>
              <h3 className={sectionTitleClassName}>Clinical notes</h3>
              <p className={sectionDescClassName}>Free-text context, plan, and follow-up for this diagnosis.</p>
              <Textarea
                value={form.clinicalNotes}
                onChange={(e) => set("clinicalNotes", e.target.value)}
                placeholder="e.g. EF 35%, on Carvedilol + Furosemide. Refer for echo in 3 months."
                rows={8}
                className="min-h-[200px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] leading-relaxed shadow-sm focus-visible:border-[#1A5345]/40 focus-visible:bg-white focus-visible:ring-[#1A5345]/20 sm:text-[14px]"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#E8E6E0]/60 bg-[#FAFAF8] px-6 py-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 rounded-xl border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit || isSubmitting}
          className="h-8 gap-1.5 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34] disabled:opacity-50"
        >
          <ClipboardCheckIcon className="size-3.5" aria-hidden />
          Save diagnosis
        </Button>
      </div>
    </form>
  )
}
