"use client"

import { useState } from "react"
import type { PrescriptionEntry, PatientSummary } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckIcon,
  ClockIcon,
  PencilLineIcon,
  PillIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESCRIPTION_TYPES = [
  { value: "antihypertensives", label: "Anti-hypertensives" },
  { value: "antiplatelets", label: "Antiplatelets" },
  { value: "anticoagulants", label: "Anticoagulants" },
  { value: "statins", label: "Statins" },
  { value: "antiarrhythmics", label: "Antiarrhythmics" },
  { value: "diuretics", label: "Diuretics" },
  { value: "diabetes_medications", label: "Diabetes Medications" },
] as const

const FREQUENCY_OPTIONS = [
  { value: "Once daily", label: "Once daily" },
  { value: "Twice daily", label: "Twice daily" },
  { value: "Three times daily", label: "Three times daily" },
  { value: "Every 8 hours", label: "Every 8 hours" },
  { value: "Weekly", label: "Weekly" },
  { value: "As needed (PRN)", label: "As needed (PRN)" },
] as const

const DURATION_OPTIONS = [
  { value: "1 week", label: "1 week" },
  { value: "2 weeks", label: "2 weeks" },
  { value: "1 month", label: "1 month" },
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "Ongoing", label: "Ongoing" },
] as const

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

const TYPE_BADGE_COLORS: Record<string, string> = {
  antihypertensives: "bg-blue-500 text-white hover:bg-blue-500",
  antiplatelets: "bg-violet-500 text-white hover:bg-violet-500",
  anticoagulants: "bg-indigo-500 text-white hover:bg-indigo-500",
  statins: "bg-amber-500 text-white hover:bg-amber-500",
  antiarrhythmics: "bg-rose-500 text-white hover:bg-rose-500",
  diuretics: "bg-teal-500 text-white hover:bg-teal-500",
  diabetes_medications: "bg-emerald-500 text-white hover:bg-emerald-500",
}

type MedicationSuggestion = {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  type: string
  instructions: string
  rationale: string
  caution?: string
}

function SuggestionCard({
  suggestion,
  onAccept,
}: {
  suggestion: MedicationSuggestion
  onAccept: (entry: PrescriptionEntry) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [dose, setDose] = useState(suggestion.dose)
  const [frequency, setFrequency] = useState(suggestion.frequency)
  const [duration, setDuration] = useState(suggestion.duration)
  const [instructions, setInstructions] = useState(suggestion.instructions)

  const typeLabel = PRESCRIPTION_TYPES.find((t) => t.value === suggestion.type)?.label ?? suggestion.type
  const typeBadgeClass = TYPE_BADGE_COLORS[suggestion.type] ?? "bg-slate-500 text-white hover:bg-slate-500"

  const handleAccept = () => {
    onAccept({
      id: `rx-ai-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: suggestion.name,
      dose,
      frequency,
      duration,
      type: suggestion.type,
      instructions,
    })
    setIsEditing(false)
  }

  return (
    <article className="space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm", typeBadgeClass)}
          >
            {typeLabel}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600/70">
            <SparklesIcon className="size-3 text-violet-500" aria-hidden />
            AI suggested
          </span>
        </div>
        <PillIcon className="size-4 shrink-0 text-violet-600/70" aria-hidden />
      </div>

      <div>
        <h4 className="text-[14px] font-bold text-[#1A1F1E]">
          {suggestion.name}{" "}
          <span className="font-semibold text-[#1A5345]">{dose}</span>
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-lg border-[#E8E6E0]/80 bg-white px-2 py-0.5 text-[11px] font-medium text-[#374151]">
            {frequency}
          </Badge>
          <Badge variant="outline" className="gap-1 rounded-lg border-[#E8E6E0]/80 bg-white px-2 py-0.5 text-[11px] font-medium text-[#374151]">
            <ClockIcon className="size-3" aria-hidden />
            {duration}
          </Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-violet-900/75">{suggestion.rationale}</p>
        {suggestion.caution ? (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
            <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-[11px] leading-relaxed text-amber-800">{suggestion.caution}</p>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-3 rounded-xl border border-[#E8E6E0]/60 bg-white/80 p-3">
          <p className="text-[12px] font-semibold text-[#1A1F1E]">Adjust before adding</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Dose</label>
              <Input value={dose} onChange={(e) => setDose(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Frequency</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-[14px]">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-[14px]">{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground">Instructions</label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsEditing((prev) => !prev)}
          className="h-8 flex-1 rounded-lg border-[#E8E6E0] bg-white text-[11px] font-bold shadow-sm hover:bg-[#F9F8F5]"
        >
          <PencilLineIcon className="size-3.5" aria-hidden />
          {isEditing ? "Close" : "Edit"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAccept}
          className="h-8 flex-1 rounded-lg border-0 bg-[#1A5345] text-[11px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          <CheckIcon className="size-3.5" aria-hidden />
          Add to list
        </Button>
      </div>
    </article>
  )
}

function buildMedicationSuggestions(
  patientSummary: PatientSummary,
  structuredComplaint: string,
  existingPrescriptions: PrescriptionEntry[],
): MedicationSuggestion[] {
  const existingLower = new Set(existingPrescriptions.map((rx) => rx.name.toLowerCase()))
  const hasCondition = (needle: string) =>
    patientSummary.existingConditions.some((c) => c.name.toLowerCase().includes(needle))
  const hasAllergy = (needle: string) =>
    patientSummary.allergies.some((a) => a.allergen.toLowerCase().includes(needle))

  const suggestions: MedicationSuggestion[] = []

  if (hasCondition("hypertension")) {
    suggestions.push({
      id: "rx-ai-lisinopril",
      name: "Lisinopril",
      dose: "10 mg",
      frequency: "Once daily",
      duration: "Ongoing",
      type: "antihypertensives",
      instructions: "Start low dose and titrate based on BP and renal function.",
      rationale: "Supports BP control and provides renal/cardiovascular protection in high-risk patients.",
    })
  }

  if (hasCondition("diabetes")) {
    suggestions.push({
      id: "rx-ai-empagliflozin",
      name: "Empagliflozin",
      dose: "10 mg",
      frequency: "Once daily",
      duration: "Ongoing",
      type: "diabetes_medications",
      instructions: "Ensure hydration and monitor renal function.",
      rationale: "Improves glycemic profile with additional cardiovascular benefit in T2DM.",
    })
  }

  if (hasCondition("dyslipidemia")) {
    suggestions.push({
      id: "rx-ai-atorvastatin-up",
      name: "Atorvastatin",
      dose: "40 mg",
      frequency: "Once daily",
      duration: "Ongoing",
      type: "statins",
      instructions: "Night dosing preferred; monitor liver enzymes and myalgia.",
      rationale: "Intensified lipid lowering is appropriate with persistent CVD risk profile.",
    })
  }

  if (structuredComplaint === "chest_pain" && !hasAllergy("aspirin")) {
    suggestions.push({
      id: "rx-ai-aspirin",
      name: "Aspirin",
      dose: "81 mg",
      frequency: "Once daily",
      duration: "Ongoing",
      type: "antiplatelets",
      instructions: "Use after food if gastritis risk; assess bleeding risk.",
      rationale: "Antiplatelet support is considered in ischemic-symptom context and high ASCVD risk.",
      caution: "Confirm no active bleeding risk or aspirin intolerance.",
    })
  }

  return suggestions.filter((s) => !existingLower.has(s.name.toLowerCase()))
}

function PrescriptionCard({
  prescription,
  onRemove,
}: {
  prescription: PrescriptionEntry
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PillIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="text-[14px] font-bold text-[#1A1F1E]">{prescription.name}</span>
            <span className="text-[13px] text-muted-foreground">{prescription.dose}</span>
            <Badge
              variant="default"
              className={cn(
                "rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none",
                TYPE_BADGE_COLORS[prescription.type] ?? "bg-slate-500 text-white hover:bg-slate-500",
              )}
            >
              {PRESCRIPTION_TYPES.find((t) => t.value === prescription.type)?.label ?? prescription.type}
            </Badge>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[13px] text-muted-foreground">
            <span>{prescription.frequency}</span>
            {prescription.duration && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3.5" />
                {prescription.duration}
              </span>
            )}
          </div>
          {prescription.instructions && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{prescription.instructions}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-500"
          onClick={() => onRemove(prescription.id)}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function AddPrescriptionForm({ onAdd }: { onAdd: (entry: PrescriptionEntry) => void }) {
  const [name, setName] = useState("")
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")
  const [type, setType] = useState("antihypertensives")
  const [instructions, setInstructions] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
      >
        <PlusIcon className="size-4" />
        Add prescription
      </button>
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || !dose.trim()) return
    onAdd({
      id: `rx-${Date.now()}`,
      name: name.trim(),
      dose: dose.trim(),
      frequency,
      duration,
      type,
      instructions: instructions.trim(),
    })
    setName("")
    setDose("")
    setFrequency("")
    setDuration("")
    setType("antihypertensives")
    setInstructions("")
    setIsOpen(false)
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[15px] font-bold text-[#1A1F1E]">New prescription</span>
        <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Medication name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lisinopril" className={INPUT_CLASS} />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Dose *</label>
          <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 10 mg" className={INPUT_CLASS} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Frequency</label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-[14px]">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Duration</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-[14px]">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {PRESCRIPTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[14px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Instructions</label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Take with food in the morning..." className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[13px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]" disabled={!name.trim() || !dose.trim()} onClick={handleSubmit}>Add prescription</Button>
      </div>
    </div>
  )
}

export type PrescriptionsSectionProps = {
  prescriptions: PrescriptionEntry[]
  onAddPrescription: (entry: PrescriptionEntry) => void
  onRemovePrescription: (id: string) => void
  patientSummary: PatientSummary
  structuredComplaint: string
}

export function PrescriptionsSection({
  prescriptions,
  onAddPrescription,
  onRemovePrescription,
  patientSummary,
  structuredComplaint,
}: PrescriptionsSectionProps) {
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const suggestions = buildMedicationSuggestions(patientSummary, structuredComplaint, prescriptions)

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PillIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Prescriptions</h3>
          {prescriptions.length > 0 && (
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
            >
              {prescriptions.length}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAiSuggestions((prev) => !prev)}
          className="h-9 gap-1.5 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold text-[#1A5345] hover:bg-[#F9F8F5]"
        >
          <SparklesIcon className="size-4" />
          AI med suggestions
        </Button>
      </div>

      {showAiSuggestions ? (
        <section className="mb-4 space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/30 to-[#F9F8F5] p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuitIcon className="size-4 text-violet-600" aria-hidden />
                <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E]">Suggested medications</h4>
                {suggestions.length > 0 ? (
                  <Badge
                    variant="default"
                    className="rounded-lg border-0 bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
                  >
                    {suggestions.length}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Based on patient profile, complaint, and current prescriptions.
              </p>
            </div>
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
            >
              AI · Groq
            </Badge>
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={onAddPrescription}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-white/70 px-4 py-8 text-center">
              <SparklesIcon className="mx-auto mb-2 size-5 text-violet-400/50" aria-hidden />
              <p className="text-[12px] font-medium text-muted-foreground">
                No new medication suggestion right now based on current profile and existing prescriptions.
              </p>
            </div>
          )}
        </section>
      ) : null}

      <div className="space-y-3">
        {prescriptions.map((rx) => (
          <PrescriptionCard key={rx.id} prescription={rx} onRemove={onRemovePrescription} />
        ))}
        <AddPrescriptionForm onAdd={onAddPrescription} />
      </div>
    </div>
  )
}
