"use client"

import React, { useState } from "react"
import type { MedicationRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  BanIcon,
  PencilIcon,
  PillIcon,
  PlusIcon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

type MedFormData = {
  name: string
  dose: string
  frequency: string
  type: MedicationRecord["type"] | ""
  status: MedicationRecord["status"]
  compliance: NonNullable<MedicationRecord["compliance"]> | "unknown"
  timeOfDay: Array<"morning" | "afternoon" | "evening">
  startDate: string
  durationDays: string
  instructions: string
  sideEffects: string
}

function emptyMedForm(): MedFormData {
  return {
    name: "",
    dose: "",
    frequency: "",
    type: "",
    status: "active",
    compliance: "unknown",
    timeOfDay: ["morning"],
    startDate: new Date().toISOString().slice(0, 10),
    durationDays: "",
    instructions: "",
    sideEffects: "",
  }
}

function toMedForm(m: MedicationRecord): MedFormData {
  return {
    name: m.name,
    dose: m.dose,
    frequency: m.frequency,
    type: m.type,
    status: m.status,
    compliance: m.compliance ?? "unknown",
    timeOfDay: m.timeOfDay?.length ? m.timeOfDay : ["morning"],
    startDate: m.startDate ?? m.prescribedAt,
    durationDays: m.durationDays?.toString() ?? "",
    instructions: m.instructions ?? "",
    sideEffects: m.sideEffects ?? "",
  }
}

type DiscontinueFormData = {
  reason: string
}

function MedicationForm({ initial, onSave, onCancel }: {
  initial: MedFormData
  onSave: (data: MedFormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<MedFormData>(initial)
  const set = (k: keyof MedFormData, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const TYPE_OPTIONS: Array<{ value: MedicationRecord["type"]; label: string }> = [
    { value: "antihypertensives", label: "Antihypertensives" },
    { value: "antiplatelets", label: "Antiplatelets" },
    { value: "anticoagulants", label: "Anticoagulants" },
    { value: "statins", label: "Statins" },
    { value: "antiarrhythmics", label: "Antiarrhythmics" },
    { value: "diuretics", label: "Diuretics" },
    { value: "diabetes_medications", label: "Diabetes Medications" },
    { value: "other", label: "Other" },
  ]

  function toggleTimeOfDay(t: "morning" | "afternoon" | "evening") {
    setForm((f) => ({
      ...f,
      timeOfDay: f.timeOfDay.includes(t) ? f.timeOfDay.filter((x) => x !== t) : [...f.timeOfDay, t],
    }))
  }

  const canSave = !!form.name.trim() && !!form.dose.trim() && !!form.frequency.trim() && !!form.type

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Medication Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amlodipine" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Dose</Label>
          <Input value={form.dose} onChange={(e) => set("dose", e.target.value)} placeholder="e.g. 5 mg" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => set("frequency", v)}>
            <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="Twice daily">Twice daily</SelectItem>
              <SelectItem value="Three times daily">Three times daily</SelectItem>
              <SelectItem value="As needed">As needed (PRN)</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MedFormData["type"] }))}>
            <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as MedFormData["status"] }))}>
            <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Compliance</Label>
          <Select value={form.compliance} onValueChange={(v) => setForm((f) => ({ ...f, compliance: v as MedFormData["compliance"] }))}>
            <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Unknown</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Time of day</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(["morning", "afternoon", "evening"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTimeOfDay(t)}
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-medium transition-colors sm:text-[11px]",
                form.timeOfDay.includes(t)
                  ? "border-[#1A5345]/30 bg-[#EEF5F3] text-[#1A5345]"
                  : "border-[#E5EEEA] bg-white text-muted-foreground hover:border-[#1A5345]/30",
              )}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Start date</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Duration (days)</Label>
          <Input
            type="number"
            min={1}
            value={form.durationDays}
            onChange={(e) => set("durationDays", e.target.value)}
            placeholder="e.g. 30"
            className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"
          />
        </div>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Instructions (optional)</Label>
        <Textarea
          value={form.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          placeholder="How to take, precautions..."
          className="mt-1 min-h-[60px] text-[11px] sm:text-[12px]"
        />
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Side Effects (optional)</Label>
        <Input value={form.sideEffects} onChange={(e) => set("sideEffects", e.target.value)} placeholder="e.g. Mild muscle pain" className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]" />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="text-[10px] sm:text-[11px]">Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]" disabled={!canSave}>
          Save Medication
        </Button>
      </div>
    </div>
  )
}

type MedicationsPageProps = {
  patientId: string
  patientName: string
  medications: MedicationRecord[]
}

export function MedicationsPage({ patientId, patientName, medications: initialMeds }: MedicationsPageProps) {
  const [meds, setMeds] = useState<MedicationRecord[]>(initialMeds)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MedFormData>(emptyMedForm())
  const [discontinueDialog, setDiscontinueDialog] = useState<string | null>(null)
  const [discontinueReason, setDiscontinueReason] = useState("")

  const active = meds.filter((m) => m.status === "active")
  const discontinued = meds.filter((m) => m.status === "discontinued")
  const paused = meds.filter((m) => m.status === "paused")

  function handleSave(data: MedFormData) {
    const now = new Date().toISOString().slice(0, 10)
    const durationDays = data.durationDays ? Number(data.durationDays) : null
    const compliance = data.compliance === "unknown" ? null : data.compliance
    const type = (data.type || "other") as MedicationRecord["type"]
    const endDate =
      durationDays && data.startDate
        ? new Date(new Date(data.startDate).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null

    if (editingId) {
      setMeds((prev) => prev.map((m) =>
        m.id === editingId
          ? {
            ...m,
            name: data.name,
            dose: data.dose,
            frequency: data.frequency,
            type,
            status: data.status,
            compliance,
            timeOfDay: data.timeOfDay,
            startDate: data.startDate,
            durationDays,
            endDate,
            instructions: data.instructions || null,
            sideEffects: data.sideEffects || null,
            pausedAt: data.status === "paused" ? m.pausedAt ?? new Date().toISOString() : null,
            discontinuedAt: data.status === "discontinued" ? m.discontinuedAt ?? new Date().toISOString() : null,
          }
          : m
      ))
    } else {
      const newMed: MedicationRecord = {
        id: `med-${Date.now()}`,
        name: data.name,
        dose: data.dose,
        frequency: data.frequency,
        type,
        status: data.status,
        compliance,
        timeOfDay: data.timeOfDay,
        startDate: data.startDate,
        durationDays,
        endDate,
        instructions: data.instructions || null,
        pausedAt: data.status === "paused" ? new Date().toISOString() : null,
        discontinuedAt: data.status === "discontinued" ? new Date().toISOString() : null,
        prescribedAt: now,
        prescribedBy: "Dr. Mahmoud",
        adherencePercent: 100,
        sideEffects: data.sideEffects || null,
        lastTakenAt: null,
      }
      setMeds((prev) => [newMed, ...prev])
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  function handleDiscontinue() {
    if (!discontinueDialog) return
    setMeds((prev) => prev.map((m) =>
      m.id === discontinueDialog
        ? { ...m, status: "discontinued" as const, sideEffects: discontinueReason || m.sideEffects }
        : m
    ))
    setDiscontinueDialog(null)
    setDiscontinueReason("")
  }

  function openEdit(m: MedicationRecord) {
    setEditingId(m.id)
    setEditForm(toMedForm(m))
    setDialogOpen(true)
  }

  function openAdd() {
    setEditingId(null)
    setEditForm(emptyMedForm())
    setDialogOpen(true)
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/doctor-patients" className="text-[10px] sm:text-[11px]">Patients</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/doctor-patients/${patientId}`} className="text-[10px] sm:text-[11px]">{patientName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Medications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" onClick={openAdd} className="gap-1 bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">
            <PlusIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Add Medication</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{active.length} Active</span>
          {discontinued.length > 0 && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500 sm:text-[11px]">{discontinued.length} Discontinued</span>}
          {paused.length > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] text-amber-600 sm:text-[11px]">{paused.length} Paused</span>}
        </div>

        {active.length > 0 && (
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                <PillIcon className="size-3 text-[#1A5345] sm:size-3.5" />
              </div>
              <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">Active Medications</h3>
            </div>
            <div className="space-y-2">
              {active.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2 sm:p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#E8F0EE] sm:size-8">
                    <PillIcon className="size-3.5 text-[#1A5345] sm:size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#102F27] sm:text-[13px]">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">{m.dose}</span>
                      <span className="text-[10px] text-muted-foreground">&middot; {m.frequency}</span>
                      <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870]">{m.type}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-[#E8E6E0] sm:w-24">
                        <div
                          className={cn("h-1.5 rounded-full", m.adherencePercent >= 80 ? "bg-[#1A5345]" : m.adherencePercent >= 50 ? "bg-amber-400" : "bg-red-400")}
                          style={{ width: `${m.adherencePercent}%` }}
                        />
                      </div>
                      <span className={cn("text-[9px] font-medium sm:text-[10px]", m.adherencePercent >= 80 ? "text-[#1A5345]" : m.adherencePercent >= 50 ? "text-amber-600" : "text-red-600")}>
                        {m.adherencePercent}% adherence
                      </span>
                    </div>
                    {m.sideEffects && (
                      <p className="mt-1 text-[9px] text-amber-600 sm:text-[10px]">Side effects: {m.sideEffects}</p>
                    )}
                    <p className="mt-1 text-[9px] text-muted-foreground sm:text-[10px]">
                      Prescribed by {m.prescribedBy} &middot; {fmtShort(m.prescribedAt)}
                      {m.lastTakenAt && <> &middot; Last taken {fmtShort(m.lastTakenAt)}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(m)}>
                      <PencilIcon className="size-3 text-muted-foreground hover:text-[#1A5345]" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-red-600" onClick={() => { setDiscontinueDialog(m.id); setDiscontinueReason("") }}>
                      <BanIcon className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {discontinued.length > 0 && (
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-gray-100 sm:size-7">
                <PillIcon className="size-3 text-gray-400 sm:size-3.5" />
              </div>
              <h3 className="text-[12px] font-semibold text-gray-500 sm:text-[13px]">Discontinued</h3>
            </div>
            <div className="space-y-2">
              {discontinued.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-lg border border-[#F5F5F3] bg-gray-50/50 p-2 sm:p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-100 sm:size-8">
                    <PillIcon className="size-3.5 text-gray-300 sm:size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-400 line-through sm:text-[13px]">{m.name}</span>
                      <span className="text-[10px] text-gray-300">{m.dose}</span>
                      <span className="text-[10px] text-gray-300">&middot; {m.frequency}</span>
                    </div>
                    {m.sideEffects && <p className="mt-1 text-[9px] text-gray-400 sm:text-[10px]">Reason: {m.sideEffects}</p>}
                    <p className="mt-1 text-[9px] text-gray-300 sm:text-[10px]">{m.prescribedBy} &middot; {fmtShort(m.prescribedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paused.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-amber-100 sm:size-7">
                <PillIcon className="size-3 text-amber-500 sm:size-3.5" />
              </div>
              <h3 className="text-[12px] font-semibold text-amber-700 sm:text-[13px]">Paused</h3>
            </div>
            <div className="space-y-2">
              {paused.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-white p-2 sm:p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-100 sm:size-8">
                    <PillIcon className="size-3.5 text-amber-500 sm:size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-amber-800 sm:text-[13px]">{m.name}</span>
                      <span className="text-[10px] text-amber-600">{m.dose}</span>
                      <span className="text-[10px] text-amber-600">&middot; {m.frequency}</span>
                    </div>
                    <p className="mt-1 text-[9px] text-amber-600 sm:text-[10px]">{m.prescribedBy} &middot; {fmtShort(m.prescribedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">
                {editingId ? "Edit Medication" : "Add New Medication"}
              </DialogTitle>
            </DialogHeader>
            <MedicationForm initial={editForm} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditingId(null) }} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!discontinueDialog} onOpenChange={(open) => { if (!open) setDiscontinueDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">Discontinue Medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">Are you sure you want to discontinue this medication? This action can be undone later.</p>
              <div>
                <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Reason for discontinuation</Label>
                <Textarea
                  value={discontinueReason}
                  onChange={(e) => setDiscontinueReason(e.target.value)}
                  placeholder="e.g. Side effects, no longer needed..."
                  className="mt-1 min-h-[60px] text-[11px] sm:text-[12px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setDiscontinueDialog(null)} className="text-[10px] sm:text-[11px]">Cancel</Button>
                <Button size="sm" variant="destructive" onClick={handleDiscontinue} className="text-[10px] sm:text-[11px]">Discontinue</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
