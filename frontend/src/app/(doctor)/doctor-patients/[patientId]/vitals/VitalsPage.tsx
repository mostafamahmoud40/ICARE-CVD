"use client"

import React, { useState } from "react"
import type { VitalReading } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ActivityIcon,
  DropletIcon,
  HeartPulseIcon,
  PlusIcon,
  PencilIcon,
  ScaleIcon,
  ThermometerIcon,
  WindIcon,
  HomeIcon,
  XIcon,
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

function bpStatus(sys: number | null): "normal" | "high" | "critical" | undefined {
  if (!sys) return undefined
  if (sys >= 180) return "critical"
  if (sys >= 140) return "high"
  return "normal"
}

function bsStatus(bs: number | null): "normal" | "high" | "low" | undefined {
  if (!bs) return undefined
  if (bs >= 200) return "high"
  if (bs > 100) return "high"
  if (bs < 70) return "low"
  return "normal"
}

function VitalMiniCard({ icon: Icon, label, value, unit, status }: {
  icon: React.ElementType
  label: string
  value: string | number | null
  unit: string
  status?: "normal" | "high" | "low" | "critical"
}) {
  const statusStyles: Record<string, string> = {
    normal: "border-emerald-200 bg-emerald-50/50",
    high: "border-red-200 bg-red-50/50",
    low: "border-amber-200 bg-amber-50/50",
    critical: "border-red-400 bg-red-100/60 ring-1 ring-red-300",
  }
  const valStyles: Record<string, string> = { normal: "text-emerald-700", high: "text-red-700", low: "text-amber-700", critical: "text-red-700" }
  return (
    <div className={cn("rounded-lg border p-2 sm:p-2.5", status ? statusStyles[status] : "border-[#E5EEEA] bg-[#FBFDFC]")}>
      <div className="flex items-center gap-1">
        <Icon className="size-2.5 text-muted-foreground sm:size-3" />
        <span className="text-[8px] text-muted-foreground sm:text-[9px]">{label}</span>
      </div>
      <div className="mt-0.5">
        <span className={cn("text-[14px] font-bold sm:text-[16px]", status ? valStyles[status] : "text-[#102F27]")}>
          {value ?? "\u2014"}
        </span>
        <span className="ml-0.5 text-[8px] text-muted-foreground sm:text-[9px]">{unit}</span>
      </div>
    </div>
  )
}

type VitalFormData = {
  date: string
  time: string
  source: "clinic" | "home" | "hospital"
  systolicBP: string
  diastolicBP: string
  heartRate: string
  oxygenSaturation: string
  temperature: string
  weight: string
  bloodSugar: string
  notes: string
}

function emptyForm(): VitalFormData {
  const now = new Date()
  return {
    date: now.toISOString().slice(0, 10),
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    source: "clinic",
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    oxygenSaturation: "",
    temperature: "",
    weight: "",
    bloodSugar: "",
    notes: "",
  }
}

function toForm(v: VitalReading): VitalFormData {
  return {
    date: v.date,
    time: v.time,
    source: v.source,
    systolicBP: v.systolicBP?.toString() ?? "",
    diastolicBP: v.diastolicBP?.toString() ?? "",
    heartRate: v.heartRate?.toString() ?? "",
    oxygenSaturation: v.oxygenSaturation?.toString() ?? "",
    temperature: v.temperature?.toString() ?? "",
    weight: v.weight?.toString() ?? "",
    bloodSugar: v.bloodSugar?.toString() ?? "",
    notes: v.notes,
  }
}

function VitalForm({ initial, onSave, onCancel }: {
  initial: VitalFormData
  onSave: (data: VitalFormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<VitalFormData>(initial)
  const set = (k: keyof VitalFormData, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const fields: { key: keyof VitalFormData; label: string; unit?: string; placeholder?: string }[][] = [
    [
      { key: "date", label: "Date", placeholder: "YYYY-MM-DD" },
      { key: "time", label: "Time", placeholder: "HH:MM" },
    ],
    [
      { key: "systolicBP", label: "Systolic BP", unit: "mmHg" },
      { key: "diastolicBP", label: "Diastolic BP", unit: "mmHg" },
      { key: "heartRate", label: "Heart Rate", unit: "bpm" },
      { key: "oxygenSaturation", label: "SpO\u2082", unit: "%" },
    ],
    [
      { key: "temperature", label: "Temperature", unit: "\u00B0C" },
      { key: "weight", label: "Weight", unit: "kg" },
      { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL" },
    ],
  ]

  return (
    <div className="space-y-4">
      {fields.map((row, ri) => (
        <div key={ri} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {row.map((f) => (
            <div key={f.key}>
              <Label className="text-[10px] text-muted-foreground sm:text-[11px]">{f.label}{f.unit ? ` (${f.unit})` : ""}</Label>
              <Input
                value={form[f.key] as string}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]"
              />
            </div>
          ))}
        </div>
      ))}
      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Source</Label>
        <Select value={form.source} onValueChange={(v) => set("source", v)}>
          <SelectTrigger className="mt-1 h-8 text-[11px] sm:h-9 sm:text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clinic">Clinic</SelectItem>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground sm:text-[11px]">Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes..."
          className="mt-1 min-h-[60px] text-[11px] sm:text-[12px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="text-[10px] sm:text-[11px]">Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} className="bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">Save Reading</Button>
      </div>
    </div>
  )
}

type VitalsPageProps = {
  patientId: string
  patientName: string
  latestVitals: VitalReading | null
  vitalReadings: VitalReading[]
}

export function VitalsPage({ patientId, patientName, latestVitals, vitalReadings: initialReadings }: VitalsPageProps) {
  const [readings, setReadings] = useState<VitalReading[]>(initialReadings)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<VitalFormData>(emptyForm())

  function handleSave(data: VitalFormData) {
    const num = (v: string) => v ? Number(v) : null
    if (editingId) {
      setReadings((prev) => prev.map((r) =>
        r.id === editingId
          ? { ...r, date: data.date, time: data.time, source: data.source as VitalReading["source"], systolicBP: num(data.systolicBP), diastolicBP: num(data.diastolicBP), heartRate: num(data.heartRate), oxygenSaturation: num(data.oxygenSaturation), temperature: num(data.temperature), weight: num(data.weight), bloodSugar: num(data.bloodSugar), notes: data.notes }
          : r
      ))
    } else {
      const newReading: VitalReading = {
        id: `vr-${Date.now()}`,
        date: data.date,
        time: data.time,
        source: data.source as VitalReading["source"],
        systolicBP: num(data.systolicBP),
        diastolicBP: num(data.diastolicBP),
        heartRate: num(data.heartRate),
        oxygenSaturation: num(data.oxygenSaturation),
        temperature: num(data.temperature),
        weight: num(data.weight),
        bloodSugar: num(data.bloodSugar),
        notes: data.notes,
      }
      setReadings((prev) => [newReading, ...prev])
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  function openEdit(v: VitalReading) {
    setEditingId(v.id)
    setEditForm(toForm(v))
    setDialogOpen(true)
  }

  function openAdd() {
    setEditingId(null)
    setEditForm(emptyForm())
    setDialogOpen(true)
  }

  const latest = readings[0] ?? null

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
                <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Vitals & Readings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button size="sm" onClick={openAdd} className="gap-1 bg-[#1A5345] text-[10px] hover:bg-[#0F3D32] sm:text-[11px]">
            <PlusIcon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Add Reading</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {latest && (
          <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                  <ActivityIcon className="size-3 text-[#1A5345] sm:size-3.5" />
                </div>
                <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">Latest Vitals</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground sm:text-[10px]">{latest.date} {latest.time} &middot; {latest.source === "home" ? "Home" : "Clinic"}</span>
                {latest.source !== "home" && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(latest)}>
                    <PencilIcon className="size-3 text-muted-foreground hover:text-[#1A5345]" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              <VitalMiniCard icon={HeartPulseIcon} label="Systolic" value={latest.systolicBP} unit="mmHg" status={bpStatus(latest.systolicBP)} />
              <VitalMiniCard icon={HeartPulseIcon} label="Diastolic" value={latest.diastolicBP} unit="mmHg" status={latest.systolicBP && latest.systolicBP >= 140 ? "high" : "normal"} />
              <VitalMiniCard icon={ActivityIcon} label="HR" value={latest.heartRate} unit="bpm" />
              <VitalMiniCard icon={WindIcon} label="SpO\u2082" value={latest.oxygenSaturation} unit="%" />
              <VitalMiniCard icon={ThermometerIcon} label="Temp" value={latest.temperature} unit="\u00B0C" />
              <VitalMiniCard icon={ScaleIcon} label="Weight" value={latest.weight} unit="kg" />
              <VitalMiniCard icon={DropletIcon} label="Sugar" value={latest.bloodSugar} unit="mg/dL" status={bsStatus(latest.bloodSugar)} />
              <VitalMiniCard icon={HomeIcon} label="Source" value={latest.source === "home" ? "Home" : "Clinic"} unit="" />
            </div>
            {latest.notes && (
              <p className="mt-2 text-[10px] text-muted-foreground sm:text-[11px]">{latest.notes}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-7">
                <ActivityIcon className="size-3 text-[#1A5345] sm:size-3.5" />
              </div>
              <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[13px]">All Readings</h3>
            </div>
            <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[9px] font-medium text-[#2C6A5B]">{readings.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-[12px]">
              <thead>
                <tr className="border-b border-[#E8E6E0] text-[#102F27]">
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Date</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Time</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Source</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">BP</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">HR</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">SpO\u2082</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Temp</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Sugar</th>
                  <th className="hidden px-2 py-2.5 text-left text-[11px] font-semibold sm:table-cell sm:text-[12px]">Weight</th>
                  <th className="hidden px-2 py-2.5 text-left text-[11px] font-semibold lg:table-cell lg:text-[12px]">Notes</th>
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold sm:text-[12px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((v) => (
                  <tr key={v.id} className="border-b border-[#F5F5F3]">
                    <td className="px-2 py-2 font-medium text-[#102F27]">
                      {new Date(v.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{v.time}</td>
                    <td className="px-2 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", v.source === "home" ? "bg-blue-50 text-blue-600" : "bg-[#EEF5F3] text-[#2C6A5B]")}>
                        {v.source === "home" ? "Home" : "Clinic"}
                      </span>
                    </td>
                    <td className={cn("px-2 py-2 font-medium", v.systolicBP && v.systolicBP >= 140 ? "text-red-600" : "text-[#102F27]")}>
                      {v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : "\u2014"}
                    </td>
                    <td className="px-2 py-2">{v.heartRate ?? "\u2014"}</td>
                    <td className="px-2 py-2">{v.oxygenSaturation ? `${v.oxygenSaturation}%` : "\u2014"}</td>
                    <td className="px-2 py-2">{v.temperature ? `${v.temperature}\u00B0C` : "\u2014"}</td>
                    <td className={cn("px-2 py-2 font-medium", v.bloodSugar && v.bloodSugar > 100 ? "text-red-600" : "text-[#102F27]")}>
                      {v.bloodSugar ?? "\u2014"}
                    </td>
                    <td className="hidden px-2 py-2 sm:table-cell">{v.weight ? `${v.weight} kg` : "\u2014"}</td>
                    <td className="hidden max-w-[200px] truncate px-2 py-2 text-muted-foreground lg:table-cell">{v.notes || "\u2014"}</td>
                    <td className="px-2 py-2">
                      {v.source !== "home" && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(v)}>
                          <PencilIcon className="size-3.5 text-muted-foreground hover:text-[#1A5345]" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[14px]">
                {editingId ? "Edit Reading" : "Add New Reading"}
              </DialogTitle>
            </DialogHeader>
            <VitalForm
              initial={editForm}
              onSave={handleSave}
              onCancel={() => { setDialogOpen(false); setEditingId(null) }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
