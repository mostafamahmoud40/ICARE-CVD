"use client"

import { useState } from "react"
import type { DiagnosisEntry } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  ClipboardCheckIcon,
  PencilLineIcon,
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

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

const typeBadgeVariant: Record<DiagnosisEntry["type"], string> = {
  primary: "bg-[#1A5345] text-white hover:bg-[#1A5345]",
  secondary: "bg-slate-500 text-white hover:bg-slate-500",
  differential: "bg-amber-500 text-white hover:bg-amber-500",
}

const severityBadgeVariant: Record<DiagnosisEntry["severity"], string> = {
  mild: "bg-emerald-500 text-white hover:bg-emerald-500",
  moderate: "bg-amber-500 text-white hover:bg-amber-500",
  severe: "bg-orange-500 text-white hover:bg-orange-500",
  critical: "bg-red-500 text-white hover:bg-red-500",
}

function DiagnosisCard({
  diagnosis,
  onUpdate,
  onRemove,
}: {
  diagnosis: DiagnosisEntry
  onUpdate: (id: string, entry: DiagnosisEntry) => void
  onRemove: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [icdCode, setIcdCode] = useState(diagnosis.icdCode)
  const [description, setDescription] = useState(diagnosis.description)
  const [type, setType] = useState(diagnosis.type)
  const [severity, setSeverity] = useState(diagnosis.severity)
  const [notes, setNotes] = useState(diagnosis.notes)

  const resetForm = () => {
    setIcdCode(diagnosis.icdCode)
    setDescription(diagnosis.description)
    setType(diagnosis.type)
    setSeverity(diagnosis.severity)
    setNotes(diagnosis.notes)
  }

  const handleSave = () => {
    if (!description.trim()) return
    onUpdate(diagnosis.id, {
      ...diagnosis,
      icdCode: icdCode.trim(),
      description: description.trim(),
      type,
      severity,
      notes: notes.trim(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    resetForm()
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-4">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[15px] font-bold text-[#1A1F1E]">Edit diagnosis</span>
          <Button size="sm" variant="ghost" className="size-8 p-0" onClick={handleCancel}>
            <XIcon className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>ICD-10 code</label>
            <Input
              value={icdCode}
              onChange={(e) => setIcdCode(e.target.value)}
              placeholder="e.g. I10"
              className={cn(INPUT_CLASS, "font-mono")}
            />
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Type</label>
            <Select value={type} onValueChange={(v) => setType(v as DiagnosisEntry["type"])}>
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                {DIAGNOSIS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[14px]">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Severity</label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as DiagnosisEntry["severity"])}>
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-[14px]">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Description *</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Essential (Primary) Hypertension"
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional clinical notes..."
            className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[13px]" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]"
            disabled={!description.trim()}
            onClick={handleSave}
          >
            Save changes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E8E6E0]/60 p-4",
        diagnosis.type === "primary" ? "bg-[#F9F8F5]" : "bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold capitalize shadow-none", typeBadgeVariant[diagnosis.type])}
            >
              {diagnosis.type}
            </Badge>
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold capitalize shadow-none", severityBadgeVariant[diagnosis.severity])}
            >
              {diagnosis.severity}
            </Badge>
            {diagnosis.isAiSuggested && (
              <Badge
                variant="default"
                className="rounded-lg border-0 bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-500"
              >
                <SparklesIcon className="mr-0.5 size-2.5" />
                AI suggested
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold text-[#1A1F1E]">{diagnosis.description}</span>
            {diagnosis.icdCode && (
              <span className="rounded-lg bg-[#F5F5F3] px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{diagnosis.icdCode}</span>
            )}
          </div>
          {diagnosis.notes && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{diagnosis.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0 text-muted-foreground hover:bg-transparent hover:text-[#1A5345]"
            onClick={() => setIsEditing(true)}
          >
            <PencilLineIcon className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-500"
            onClick={() => onRemove(diagnosis.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
      >
        <PlusIcon className="size-4" />
        Add diagnosis
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
    <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[15px] font-bold text-[#1A1F1E]">New diagnosis</span>
        <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>ICD-10 code</label>
          <Input
            value={icdCode}
            onChange={(e) => setIcdCode(e.target.value)}
            placeholder="e.g. I10"
            className={cn(INPUT_CLASS, "font-mono")}
          />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Type</label>
          <Select value={type} onValueChange={(v) => setType(v as DiagnosisEntry["type"])}>
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {DIAGNOSIS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[14px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Severity</label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as DiagnosisEntry["severity"])}>
            <SelectTrigger className={INPUT_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {SEVERITY_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-[14px]">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Description *</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Essential (Primary) Hypertension"
          className={INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional clinical notes..."
          className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[13px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]" disabled={!description.trim()} onClick={handleSubmit}>
          Add diagnosis
        </Button>
      </div>
    </div>
  )
}

export type DiagnosisSectionProps = {
  diagnoses: DiagnosisEntry[]
  onAddDiagnosis: (entry: DiagnosisEntry) => void
  onUpdateDiagnosis: (id: string, entry: DiagnosisEntry) => void
  onRemoveDiagnosis: (id: string) => void
}

export function DiagnosisSection({
  diagnoses,
  onAddDiagnosis,
  onUpdateDiagnosis,
  onRemoveDiagnosis,
}: DiagnosisSectionProps) {
  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ClipboardCheckIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Diagnosis</h3>
        {diagnoses.length > 0 && (
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
          >
            {diagnoses.length}
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {diagnoses.map((d) => (
          <DiagnosisCard
            key={d.id}
            diagnosis={d}
            onUpdate={onUpdateDiagnosis}
            onRemove={onRemoveDiagnosis}
          />
        ))}
        <AddDiagnosisForm onAdd={onAddDiagnosis} />
      </div>
    </div>
  )
}
