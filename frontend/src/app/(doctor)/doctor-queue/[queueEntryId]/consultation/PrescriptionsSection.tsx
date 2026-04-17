"use client"

import { useState } from "react"
import type { PrescriptionEntry } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  ClockIcon,
  PillIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
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
}

export function PrescriptionsSection({ prescriptions, onAddPrescription, onRemovePrescription }: PrescriptionsSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
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
      <div className="space-y-2">
        {prescriptions.map((rx) => (
          <PrescriptionCard key={rx.id} prescription={rx} onRemove={onRemovePrescription} />
        ))}
        <AddPrescriptionForm onAdd={onAddPrescription} />
      </div>
    </div>
  )
}
