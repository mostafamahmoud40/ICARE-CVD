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
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  TrendingUpIcon,
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
    normal: "border-[#E8E6E0]/40 bg-white",
    high: "border-red-100 bg-red-50/30",
    low: "border-amber-100 bg-amber-50/30",
    critical: "border-red-200 bg-red-50 ring-1 ring-red-100",
  }
  
  const iconColors: Record<string, string> = {
    normal: "text-[#1A5345]",
    high: "text-red-600",
    low: "text-amber-600",
    critical: "text-red-600",
  }

  return (
    <div className={cn("flex flex-col gap-1 rounded-xl border p-2.5 transition-all duration-300 hover:shadow-sm", status ? statusStyles[status] : "border-[#E8E6E0]/60 bg-white")}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3", status ? iconColors[status] : "text-[#1A5345]")} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className={cn("text-[16px] font-bold tabular-nums", status ? iconColors[status] : "text-[#102F27]")}>
          {value ?? "\u2014"}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase">{unit}</span>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Time</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Systolic (mmHg)</Label>
          <Input
            value={form.systolicBP}
            onChange={(e) => set("systolicBP", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Diastolic (mmHg)</Label>
          <Input
            value={form.diastolicBP}
            onChange={(e) => set("diastolicBP", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Heart Rate (bpm)</Label>
          <Input
            value={form.heartRate}
            onChange={(e) => set("heartRate", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">SpO₂ (%)</Label>
          <Input
            value={form.oxygenSaturation}
            onChange={(e) => set("oxygenSaturation", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Temp (°C)</Label>
          <Input
            value={form.temperature}
            onChange={(e) => set("temperature", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Weight (kg)</Label>
          <Input
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Blood Sugar (mg/dL)</Label>
          <Input
            value={form.bloodSugar}
            onChange={(e) => set("bloodSugar", e.target.value)}
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Source</Label>
          <Select value={form.source} onValueChange={(v) => set("source", v)}>
            <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              <SelectItem value="clinic">Clinic</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[12px] font-bold text-[#102F27]">Clinical Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional context..."
          className="min-h-[90px] rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="h-9 px-5 rounded-xl font-bold text-[13px] border-[#E8E6E0] text-[#1A1F1E] hover:bg-slate-50 transition-colors">Discard</Button>
        <Button onClick={() => onSave(form)} className="h-9 px-7 rounded-xl bg-[#1A5345] font-bold text-white text-[13px] hover:bg-[#133F34] shadow-md transition-all">
          Save Reading
        </Button>
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
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5]">
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-6 pb-4 pt-5 sm:px-8">
          <div className="mb-2.5 flex items-center gap-2">
            <Breadcrumb>
              <BreadcrumbList className="text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-patients" className="font-medium text-muted-foreground hover:text-[#1A1F1E]">Patients</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/doctor-patients/${patientId}`} className="font-medium text-muted-foreground hover:text-[#1A1F1E]">{patientName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold text-[#102F27]">Vitals & Readings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[28px]">
                Vitals Monitoring
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground">
                Track and analyze physiological parameters for <span className="text-[#102F27] font-bold">{patientName}</span>.
              </p>
            </div>
            <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 rounded-lg bg-[#1A5345] px-4 text-[11px] font-bold text-white shadow-sm border-0 hover:bg-[#133F34] transition-all">
              <PlusIcon className="size-3.5" />
              Add Record
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12 pt-8 sm:px-8">
        <div className="max-w-7xl space-y-10">
          
          {latest && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="size-4 text-[#CC5533]" />
                  <h3 className="text-[13px] font-bold text-[#102F27] uppercase tracking-wider">Latest Assessment</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#6B7870] shadow-sm border border-[#E8E6E0]/60">
                    <CalendarIcon className="size-3.5 text-[#1A5345]" />
                    {new Date(latest.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="mx-0.5 text-[#E8E6E0]">&bull;</span>
                    <ClockIcon className="size-3.5 text-[#1A5345]" />
                    {latest.time}
                  </div>
                  {latest.source !== "home" && (
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white hover:shadow-sm" onClick={() => openEdit(latest)}>
                      <PencilIcon className="size-3.5 text-muted-foreground hover:text-[#1A5345]" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-8">
                <VitalMiniCard icon={HeartPulseIcon} label="Systolic" value={latest.systolicBP} unit="mmHg" status={bpStatus(latest.systolicBP)} />
                <VitalMiniCard icon={HeartPulseIcon} label="Diastolic" value={latest.diastolicBP} unit="mmHg" status={latest.systolicBP && latest.systolicBP >= 140 ? "high" : "normal"} />
                <VitalMiniCard icon={ActivityIcon} label="Pulse" value={latest.heartRate} unit="bpm" />
                <VitalMiniCard icon={WindIcon} label="Oxygen" value={latest.oxygenSaturation} unit="%" />
                <VitalMiniCard icon={ThermometerIcon} label="Temp" value={latest.temperature} unit="\u00B0C" />
                <VitalMiniCard icon={ScaleIcon} label="Weight" value={latest.weight} unit="kg" />
                <VitalMiniCard icon={DropletIcon} label="Glucose" value={latest.bloodSugar} unit="mg/dL" status={bsStatus(latest.bloodSugar)} />
                <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <HomeIcon className="size-3 text-[#1A5345]" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Context</span>
                  </div>
                  <div className="mt-1">
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold", latest.source === "home" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700")}>
                      {latest.source === "home" ? "At Home" : "In Clinic"}
                    </span>
                  </div>
                </div>
              </div>

              {latest.notes && (
                <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#FFFCFA] p-3.5">
                  <div className="flex gap-2.5 text-[13px] leading-relaxed text-[#6B7870]">
                    <span className="font-bold text-[#102F27] uppercase text-[10px] tracking-wider mt-0.5 shrink-0">Clinical Notes:</span>
                    <p className="italic">"{latest.notes}"</p>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <LayoutGridIcon className="size-4 text-[#CC5533]" />
                <h3 className="text-[13px] font-bold text-[#102F27] uppercase tracking-wider">Historical Timeline</h3>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{readings.length} Assessment Records</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9F8F5]/80 border-b border-[#E8E6E0]/60">
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Assessment Date</th>
                      <th className="px-4 py-4 text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Context</th>
                      <th className="px-4 py-4 text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Vital Signs (BP/HR)</th>
                      <th className="px-4 py-4 text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Oxygen/Temp</th>
                      <th className="px-4 py-4 text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Glucose</th>
                      <th className="px-4 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-[#102F27]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E0]/40">
                    {readings.map((v) => (
                      <tr key={v.id} className="group hover:bg-[#F9F8F5]/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#EEF5F3] text-[#1A5345]">
                              <CalendarIcon className="size-4" />
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#102F27]">
                                {new Date(v.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground">{v.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold", v.source === "home" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700")}>
                            {v.source === "home" ? <HomeIcon className="size-3" /> : <ActivityIcon className="size-3" />}
                            {v.source === "home" ? "Home" : "Clinic"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className={cn("text-[14px] font-bold tabular-nums", v.systolicBP && v.systolicBP >= 140 ? "text-red-600" : "text-[#102F27]")}>
                              {v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : "\u2014"} <span className="text-[10px] font-normal text-muted-foreground ml-0.5">mmHg</span>
                            </p>
                            <p className="text-[11px] font-medium text-[#6B7870]">
                              HR: <span className="font-bold text-[#102F27]">{v.heartRate ?? "\u2014"}</span> bpm
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#102F27]">
                          <div className="space-y-1">
                            <p className="text-[13px] font-medium">SpO\u2082: <span className="font-bold">{v.oxygenSaturation ? `${v.oxygenSaturation}%` : "\u2014"}</span></p>
                            <p className="text-[13px] font-medium text-[#6B7870]">Temp: <span className="font-bold text-[#102F27]">{v.temperature ? `${v.temperature}\u00B0C` : "\u2014"}</span></p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={cn("inline-flex rounded-lg px-3 py-1 text-[13px] font-bold tabular-nums", v.bloodSugar && v.bloodSugar > 100 ? "bg-red-50 text-red-700" : "bg-slate-50 text-[#102F27]")}>
                            {v.bloodSugar ?? "\u2014"} <span className="text-[9px] font-normal ml-1 mt-0.5">mg/dL</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {v.source !== "home" && (
                              <Button size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-[#1A5345]" onClick={() => openEdit(v)}>
                                <PencilIcon className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
        <DialogContent className="max-w-xl rounded-2xl border-[#E8E6E0] p-0 shadow-2xl bg-white">
          <div className="px-6 py-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-[22px] font-bold text-[#102F27]">
                {editingId ? "Modify Clinical Assessment" : "Record New Vital Signs"}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-8">
            <VitalForm
              initial={editForm}
              onSave={handleSave}
              onCancel={() => { setDialogOpen(false); setEditingId(null) }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
