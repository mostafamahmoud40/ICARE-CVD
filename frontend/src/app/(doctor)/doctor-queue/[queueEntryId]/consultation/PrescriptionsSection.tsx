"use client"

import { useState } from "react"
import type { PrescriptionEntry, PatientSummary } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  ClockIcon,
  PillIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
  AlertTriangleIcon,
} from "lucide-react"
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

const TYPE_COLORS: Record<string, string> = {
  antihypertensives: "bg-blue-50 text-blue-700",
  antiplatelets: "bg-purple-50 text-purple-700",
  anticoagulants: "bg-indigo-50 text-indigo-700",
  statins: "bg-amber-50 text-amber-700",
  antiarrhythmics: "bg-rose-50 text-rose-700",
  diuretics: "bg-teal-50 text-teal-700",
  diabetes_medications: "bg-emerald-50 text-emerald-700",
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
    <div className="rounded-md border border-[#E8E6E0] bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#102F27]">
            {suggestion.name} <span className="font-normal text-muted-foreground">{dose}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{frequency} • {duration}</p>
          <p className="mt-1 text-[11px] text-[#102F27]">{suggestion.rationale}</p>
          {suggestion.caution ? (
            <p className="mt-1 flex items-start gap-1 text-[10px] text-amber-700">
              <AlertTriangleIcon className="mt-0.5 size-3 shrink-0" />
              <span>{suggestion.caution}</span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditing((prev) => !prev)}
            className="h-7 border-[#cfd9d5] px-2.5 text-[10px]"
          >
            {isEditing ? "Close" : "Edit"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAccept}
            className="h-7 bg-[#1A5345] px-2.5 text-[10px] hover:bg-[#0F3D32]"
          >
            Add
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 grid gap-2 rounded-md border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:grid-cols-2">
          <Input value={dose} onChange={(e) => setDose(e.target.value)} className="h-8 border-[#cfd9d5] bg-white text-[11px]" />
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-[11px]">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-[11px]">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:col-span-2">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[56px] resize-none border-[#cfd9d5] bg-white text-[11px]"
            />
          </div>
        </div>
      ) : null}
    </div>
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
    <div className="rounded-lg border border-[#E5EEEA] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex size-6 items-center justify-center rounded-md bg-[#E8F0EE]">
              <PillIcon className="size-3 text-[#1A5345]" />
            </div>
            <span className="text-[13px] font-semibold text-[#102F27]">{prescription.name}</span>
            <span className="text-[12px] text-muted-foreground">{prescription.dose}</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLORS[prescription.type] ?? "bg-[#F5F5F3] text-[#6B7870]")}>
              {PRESCRIPTION_TYPES.find((t) => t.value === prescription.type)?.label ?? prescription.type}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{prescription.frequency}</span>
            {prescription.duration && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {prescription.duration}
              </span>
            )}
          </div>
          {prescription.instructions && (
            <p className="mt-1 text-[11px] text-muted-foreground">{prescription.instructions}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:text-red-500 hover:bg-red-50"
          onClick={() => onRemove(prescription.id)}
        >
          <Trash2Icon className="size-3.5" />
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
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#E5EEEA] py-2.5 text-[12px] font-medium text-[#6B7870] transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9] hover:text-[#1A5345]"
      >
        <PlusIcon className="size-3.5" />
        Add Prescription
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
    <div className="rounded-lg border-2 border-[#1A5345]/20 bg-[#F6FBF9] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#1A5345]">New Prescription</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Medication Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lisinopril" className="h-8 border-[#E8E6E0] bg-white text-[12px]" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Dose *</label>
          <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 10 mg" className="h-8 border-[#E8E6E0] bg-white text-[12px]" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Frequency</label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-[12px]">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Duration</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-[12px]">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {PRESCRIPTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[12px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Instructions</label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Take with food in the morning..." className="min-h-[36px] resize-none border-[#E8E6E0] bg-white text-[12px] placeholder:text-[#9CA3AF]" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="flex-1 bg-[#1A5345] hover:bg-[#0F3D32] text-[11px]" disabled={!name.trim() || !dose.trim()} onClick={handleSubmit}>Add Prescription</Button>
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
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <PillIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Prescriptions</h3>
          {prescriptions.length > 0 && (
            <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#2C6A5B]">
              {prescriptions.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowAiSuggestions((prev) => !prev)}
          className="h-8 gap-1.5 border-[#cfd9d5] bg-white text-[11px] text-[#1A5345] hover:bg-[#E8F0EE]"
        >
          <SparklesIcon className="size-3.5" />
          AI Med Suggestions
        </Button>
      </div>

      {showAiSuggestions ? (
        <div className="mb-3 space-y-2 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-3">
          <p className="text-[11px] font-semibold text-[#102F27]">Suggested medications for this case</p>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAddPrescription}
              />
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No new medication suggestion right now based on current profile and existing prescriptions.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        {prescriptions.map((rx) => (
          <PrescriptionCard key={rx.id} prescription={rx} onRemove={onRemovePrescription} />
        ))}
        <AddPrescriptionForm onAdd={onAddPrescription} />
      </div>
    </div>
  )
}
