"use client"

import { useState } from "react"
import type { DiagnosisEntry } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  ClipboardCheckIcon,
  PlusIcon,
  SparklesIcon,
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

const DIAGNOSIS_TYPES = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "differential", label: "Differential" },
] as const

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "critical", label: "Critical" },
] as const

const typeStyles: Record<DiagnosisEntry["type"], string> = {
  primary: "bg-[#1A5345] text-white",
  secondary: "bg-[#E8F0EE] text-[#1A5345]",
  differential: "bg-[#F6EFE4] text-[#9A6B2F]",
}

const severityStyles: Record<DiagnosisEntry["severity"], string> = {
  mild: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-700",
  severe: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
}

function DiagnosisCard({
  diagnosis,
  onRemove,
}: {
  diagnosis: DiagnosisEntry
  onRemove: (id: string) => void
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 p-3",
        diagnosis.type === "primary" ? "border-[#1A5345]/20 bg-[#F6FBF9]" : "border-[#E5EEEA] bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", typeStyles[diagnosis.type])}>
              {diagnosis.type}
            </span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", severityStyles[diagnosis.severity])}>
              {diagnosis.severity}
            </span>
            {diagnosis.isAiSuggested && (
              <span className="flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                <SparklesIcon className="size-2.5" />
                AI Suggested
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#102F27]">{diagnosis.description}</span>
            {diagnosis.icdCode && (
              <span className="rounded bg-[#F5F5F3] px-1 py-0.5 text-[10px] font-mono text-[#6B7870]">{diagnosis.icdCode}</span>
            )}
          </div>
          {diagnosis.notes && (
            <p className="mt-1 text-[11px] text-muted-foreground">{diagnosis.notes}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:text-red-500 hover:bg-red-50"
          onClick={() => onRemove(diagnosis.id)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddDiagnosisForm({ onAdd }: { onAdd: (entry: DiagnosisEntry) => void }) {
  const [icdCode, setIcdCode] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<DiagnosisEntry["type"]>("primary")
  const [severity, setSeverity] = useState<DiagnosisEntry["severity"]>("moderate")
  const [notes, setNotes] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#E5EEEA] py-2.5 text-[12px] font-medium text-[#6B7870] transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9] hover:text-[#1A5345]"
      >
        <PlusIcon className="size-3.5" />
        Add Diagnosis
      </button>
    )
  }

  const handleSubmit = () => {
    if (!description.trim()) return
    onAdd({
      id: `diag-${Date.now()}`,
      icdCode: icdCode.trim(),
      description: description.trim(),
      type,
      severity,
      notes: notes.trim(),
      isAiSuggested: false,
    })
    setIcdCode("")
    setDescription("")
    setType("primary")
    setSeverity("moderate")
    setNotes("")
    setIsOpen(false)
  }

  return (
    <div className="rounded-lg border-2 border-[#1A5345]/20 bg-[#F6FBF9] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#1A5345]">New Diagnosis</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">ICD-10 Code</label>
          <Input
            value={icdCode}
            onChange={(e) => setIcdCode(e.target.value)}
            placeholder="e.g. I10"
            className="h-8 border-[#E8E6E0] bg-white text-[12px] font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Type</label>
          <Select value={type} onValueChange={(v) => setType(v as DiagnosisEntry["type"])}>
            <SelectTrigger className="h-8 w-full rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {DIAGNOSIS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[12px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Severity</label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as DiagnosisEntry["severity"])}>
            <SelectTrigger className="h-8 w-full rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {SEVERITY_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-[12px]">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Description *</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Essential (Primary) Hypertension"
          className="h-8 border-[#E8E6E0] bg-white text-[12px]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional clinical notes..."
          className="min-h-[40px] resize-none border-[#E8E6E0] bg-white text-[12px] placeholder:text-[#9CA3AF]"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="flex-1 bg-[#1A5345] hover:bg-[#0F3D32] text-[11px]" disabled={!description.trim()} onClick={handleSubmit}>
          Add Diagnosis
        </Button>
      </div>
    </div>
  )
}

export type DiagnosisSectionProps = {
  diagnoses: DiagnosisEntry[]
  onAddDiagnosis: (entry: DiagnosisEntry) => void
  onRemoveDiagnosis: (id: string) => void
}

export function DiagnosisSection({ diagnoses, onAddDiagnosis, onRemoveDiagnosis }: DiagnosisSectionProps) {
  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <ClipboardCheckIcon className="size-4 text-[#1A5345]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#102F27]">Diagnosis</h3>
        {diagnoses.length > 0 && (
          <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#2C6A5B]">
            {diagnoses.length}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {diagnoses.map((d) => (
          <DiagnosisCard key={d.id} diagnosis={d} onRemove={onRemoveDiagnosis} />
        ))}
        <AddDiagnosisForm onAdd={onAddDiagnosis} />
      </div>
    </div>
  )
}
