"use client"

import React, { useState } from "react"
import type { DiagnosisRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ClipboardCheckIcon,
  PlusIcon,
  PencilIcon,
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
import { DiagnosisForm } from "./DiagnosisForm"
import type { DiagnosisFormValues } from "./diagnosisForm.types"

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

function emptyDiagnosisForm(): DiagnosisFormValues {
  return {
    icdCode: "",
    description: "",
    type: "secondary",
    confirmation: "confirmed",
    onsetDate: "",
    severity: "moderate",
    status: "active",
    nyhaClass: "",
    laterality: "unspecified",
    clinicalNotes: "",
  }
}

function toDiagnosisForm(d: DiagnosisRecord): DiagnosisFormValues {
  return {
    icdCode: d.icdCode,
    description: d.description,
    type: d.type,
    confirmation: "confirmed",
    onsetDate: "",
    severity: d.severity,
    status: d.status,
    nyhaClass: "",
    laterality: "unspecified",
    clinicalNotes: d.notes,
  }
}

type DiagnosesPageProps = {
  patientId: string
  patientName: string
  diagnoses: DiagnosisRecord[]
}

export function DiagnosesPage({ patientId, patientName, diagnoses: initialDiagnoses }: DiagnosesPageProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>(initialDiagnoses)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<DiagnosisFormValues>(emptyDiagnosisForm())

  const primary = diagnoses.filter((d) => d.type === "primary")
  const secondary = diagnoses.filter((d) => d.type === "secondary")
  const differential = diagnoses.filter((d) => d.type === "differential")

  const sevStyles: Record<string, string> = {
    mild: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    severe: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
  }
  const statusStyles: Record<string, string> = {
    active: "bg-[#E8F0EE] text-[#1A5345]",
    chronic: "bg-violet-50 text-violet-600",
    resolved: "bg-gray-50 text-gray-500",
  }

  function handleSave(data: DiagnosisFormValues) {
    const now = new Date().toISOString().slice(0, 10)
    const extra: string[] = []
    if (data.confirmation) extra.push(`Confirmation: ${data.confirmation}`)
    if (data.onsetDate) extra.push(`Onset: ${data.onsetDate}`)
    if (data.nyhaClass) extra.push(`NYHA: ${data.nyhaClass}`)
    if (data.laterality && data.laterality !== "unspecified") extra.push(`Laterality/Region: ${data.laterality}`)
    const notes = [data.clinicalNotes.trim(), extra.length ? `\n\n${extra.join(" • ")}` : ""].join("").trim()

    if (editingId) {
      setDiagnoses((prev) => prev.map((d) =>
        d.id === editingId
          ? { ...d, icdCode: data.icdCode, description: data.description, type: data.type, severity: data.severity, status: data.status, notes }
          : d
      ))
    } else {
      const newDiagnosis: DiagnosisRecord = {
        id: `dx-${Date.now()}`,
        icdCode: data.icdCode || "N/A",
        description: data.description,
        type: data.type,
        severity: data.severity,
        diagnosedAt: now,
        diagnosedBy: "Dr. Mahmoud",
        status: data.status,
        notes,
      }
      setDiagnoses((prev) => [newDiagnosis, ...prev])
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  function openEdit(d: DiagnosisRecord) {
    setEditingId(d.id)
    setEditForm(toDiagnosisForm(d))
    setDialogOpen(true)
  }

  function openAdd() {
    setEditingId(null)
    setEditForm(emptyDiagnosisForm())
    setDialogOpen(true)
  }

  function DiagnosisCard({ d }: { d: DiagnosisRecord }) {
    return (
      <div className="rounded-lg border border-[#E5EEEA] p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 font-mono text-[9px] text-[#6B7870]">{d.icdCode}</span>
              <span className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{d.description}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", sevStyles[d.severity])}>{d.severity}</span>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", statusStyles[d.status])}>{d.status}</span>
              <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870]">{d.type}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 p-0" onClick={() => openEdit(d)}>
            <PencilIcon className="size-3 text-muted-foreground hover:text-[#1A5345]" />
          </Button>
        </div>
        {d.notes && <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{d.notes}</p>}
        <p className="mt-1.5 text-[9px] text-muted-foreground">{d.diagnosedBy} &middot; {fmtShort(d.diagnosedAt)}</p>
      </div>
    )
  }

  function renderSection(title: string, items: DiagnosisRecord[], iconBg: string, iconColor: string) {
    if (items.length === 0) return null
    return (
      <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className={cn("flex size-6 items-center justify-center rounded-lg sm:size-7", iconBg)}>
            <ClipboardCheckIcon className={cn("size-3 sm:size-3.5", iconColor)} />
          </div>
          <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">{title}</h3>
        </div>
        <div className="space-y-2">
          {items.map((d) => <DiagnosisCard key={d.id} d={d} />)}
        </div>
      </div>
    )
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
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Diagnoses & Conditions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" onClick={openAdd} className="gap-1 bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">
            <PlusIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Add Diagnosis</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-1 text-[10px] font-semibold text-[#1A5345] sm:text-[11px]">{diagnoses.length} on record</span>
        </div>

        {renderSection("Primary Diagnoses", primary, "bg-[#E8F0EE]", "text-[#1A5345]")}
        {renderSection("Secondary Diagnoses", secondary, "bg-[#E8F0EE]", "text-[#1A5345]")}
        {differential.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-amber-100 sm:size-7">
                <ClipboardCheckIcon className="size-3 text-amber-500 sm:size-3.5" />
              </div>
              <h3 className="text-[12px] font-semibold text-amber-700 sm:text-[13px]">Differential Diagnoses</h3>
            </div>
            <div className="space-y-2">
              {differential.map((d) => <DiagnosisCard key={d.id} d={d} />)}
            </div>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">
                {editingId ? "Edit Diagnosis" : "Add New Diagnosis"}
              </DialogTitle>
            </DialogHeader>
            <DiagnosisForm
              initial={editForm}
              onSubmit={handleSave}
              onCancel={() => { setDialogOpen(false); setEditingId(null) }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
