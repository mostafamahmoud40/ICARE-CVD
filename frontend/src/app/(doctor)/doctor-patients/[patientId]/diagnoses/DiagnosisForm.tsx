"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Laterality,
  NyhaClass,
} from "./diagnosisForm.types"

type DiagnosisFormProps = {
  initial: DiagnosisFormValues
  onCancel: () => void
  onSubmit: (values: DiagnosisFormValues) => void
}

function SeverityPicker({
  value,
  onChange,
}: {
  value: DiagnosisSeverity
  onChange: (v: DiagnosisSeverity) => void
}) {
  const styles: Record<DiagnosisSeverity, { base: string; active: string }> = {
    mild: {
      base: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50/80",
      active: "ring-2 ring-emerald-300",
    },
    moderate: {
      base: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50/80",
      active: "ring-2 ring-amber-300",
    },
    severe: {
      base: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50/80",
      active: "ring-2 ring-orange-300",
    },
    critical: {
      base: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50/80",
      active: "ring-2 ring-red-300",
    },
  }

  return (
    <div className="mt-1 grid grid-cols-4 gap-2">
      {(["mild", "moderate", "severe", "critical"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "h-9 rounded-md border text-[11px] font-medium transition-shadow sm:text-[12px]",
            styles[s].base,
            value === s ? styles[s].active : "opacity-80 hover:opacity-100",
          )}
        >
          {s[0].toUpperCase() + s.slice(1)}
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
    <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 sm:p-4">
      <p className="text-[11px] font-semibold text-blue-700 sm:text-[12px]">Cardiac-specific fields</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">NYHA Class</Label>
          <Select value={nyhaClass} onValueChange={(v) => onNyhaChange(v as NyhaClass)}>
            <SelectTrigger className="mt-1 h-9 bg-white text-[11px] sm:text-[12px]">
              <SelectValue placeholder="— Select —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">Class I — No limitation</SelectItem>
              <SelectItem value="II">Class II — Mild limitation</SelectItem>
              <SelectItem value="III">Class III — Marked limitation</SelectItem>
              <SelectItem value="IV">Class IV — Symptoms at rest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Laterality / Region</Label>
          <Select
            value={laterality}
            onValueChange={(v) => onLateralityChange(v as Laterality)}
          >
            <SelectTrigger className="mt-1 h-9 bg-white text-[11px] sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">— Unspecified —</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="bilateral">Bilateral</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function DiagnosisForm({ initial, onCancel, onSubmit }: DiagnosisFormProps) {
  const [form, setForm] = useState<DiagnosisFormValues>(initial)
  const set = <K extends keyof DiagnosisFormValues>(k: K, v: DiagnosisFormValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const canSubmit = form.icdCode.trim().length > 0 && form.description.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">
            ICD-10 Code <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.icdCode}
            onChange={(e) => set("icdCode", e.target.value)}
            placeholder="e.g. I50.9"
            className="mt-1 h-9 text-[11px] sm:text-[12px]"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Heart Failure, unspecified"
            className="mt-1 h-9 text-[11px] sm:text-[12px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v as DiagnosisType)}>
            <SelectTrigger className="mt-1 h-9 text-[11px] sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="differential">Differential</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Confirmation</Label>
          <Select
            value={form.confirmation}
            onValueChange={(v) => set("confirmation", v as DiagnosisFormValues["confirmation"])}
          >
            <SelectTrigger className="mt-1 h-9 text-[11px] sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              <SelectItem value="presumed">Presumed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Onset date</Label>
          <Input
            type="date"
            value={form.onsetDate}
            onChange={(e) => set("onsetDate", e.target.value)}
            className="mt-1 h-9 text-[11px] sm:text-[12px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Severity</Label>
          <SeverityPicker value={form.severity} onChange={(v) => set("severity", v)} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as DiagnosisStatus)}>
            <SelectTrigger className="mt-1 h-9 text-[11px] sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="chronic">Chronic</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardiacFields
        nyhaClass={form.nyhaClass}
        laterality={form.laterality}
        onNyhaChange={(v) => set("nyhaClass", v)}
        onLateralityChange={(v) => set("laterality", v)}
      />

      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Clinical notes</Label>
        <Textarea
          value={form.clinicalNotes}
          onChange={(e) => set("clinicalNotes", e.target.value)}
          placeholder="e.g. EF 35%, on Carvedilol + Furosemide. Refer for echo in 3 months."
          className="mt-1 min-h-[90px] text-[11px] sm:text-[12px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="text-[10px] sm:text-[11px]"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSubmit(form)}
          className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]"
          disabled={!canSubmit}
        >
          Save diagnosis
        </Button>
      </div>
    </div>
  )
}

