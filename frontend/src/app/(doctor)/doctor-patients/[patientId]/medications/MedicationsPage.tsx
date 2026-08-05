"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { MedicationRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  BanIcon,
  PencilIcon,
  PillIcon,
  PlusIcon,
  LayoutGridIcon,
  ClockIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  StethoscopeIcon,
  CalendarIcon,
  ActivityIcon,
  FlagIcon,
  AlertTriangleIcon,
  ZapIcon,
  ActivityIcon as SubstanceIcon,
  BrainCircuitIcon,
  TrendingUpIcon,
  InfoIcon,
  SparklesIcon,
  CheckCircle2Icon as AdherenceIcon,
  SunriseIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  XCircleIcon,
  DropletsIcon,
  TruckIcon,
  ArrowRightIcon,
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Medication Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amlodipine" className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]" />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Dose</Label>
          <Input value={form.dose} onChange={(e) => set("dose", e.target.value)} placeholder="e.g. 5 mg" className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => set("frequency", v)}>
            <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] text-[14px]">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="Twice daily">Twice daily</SelectItem>
              <SelectItem value="Three times daily">Three times daily</SelectItem>
              <SelectItem value="As needed">As needed (PRN)</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Category</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MedFormData["type"] }))}>
            <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] text-[14px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as MedFormData["status"] }))}>
            <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              <SelectItem value="active">Active Regimen</SelectItem>
              <SelectItem value="paused">Paused / Hold</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Patient Compliance</Label>
          <Select value={form.compliance} onValueChange={(v) => setForm((f) => ({ ...f, compliance: v as MedFormData["compliance"] }))}>
            <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              <SelectItem value="unknown">Not Observed</SelectItem>
              <SelectItem value="good">Good Adherence</SelectItem>
              <SelectItem value="poor">Poor Compliance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[12px] font-bold text-[#102F27]">Administration Schedule</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "morning", label: "Morning", icon: SunriseIcon, color: "text-amber-600", bg: "bg-amber-50" },
            { id: "afternoon", label: "Afternoon", icon: SunIcon, color: "text-orange-500", bg: "bg-orange-50" },
            { id: "evening", label: "Evening", icon: MoonIcon, color: "text-blue-600", bg: "bg-blue-50" },
          ].map((t) => {
            const isActive = form.timeOfDay.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTimeOfDay(t.id as any)}
                className={cn(
                  "flex items-center justify-center gap-2.5 rounded-xl border py-3 transition-all",
                  isActive
                    ? `border-[#1A5345] bg-[#EEF5F3] text-[#1A5345] shadow-sm`
                    : "border-[#E8E6E0] bg-white text-[#6B7870] hover:bg-slate-50"
                )}
              >
                <t.icon className={cn("size-4", isActive ? "text-[#1A5345]" : t.color)} />
                <span className="text-[13px] font-bold">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Start Date</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="h-10 rounded-xl border-[#E8E6E0] pl-10 text-[14px] focus:ring-[#1A5345]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Duration (Days)</Label>
          <Input
            type="number"
            min={1}
            value={form.durationDays}
            onChange={(e) => set("durationDays", e.target.value)}
            placeholder="e.g. 30"
            className="h-10 rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Special Instructions</Label>
          <Textarea
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="e.g. Take with food..."
            className="min-h-[90px] rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px] font-bold text-[#102F27]">Known Side Effects</Label>
          <Textarea
            value={form.sideEffects}
            onChange={(e) => set("sideEffects", e.target.value)}
            placeholder="e.g. Dizziness..."
            className="min-h-[90px] rounded-xl border-[#E8E6E0] text-[14px] focus:ring-[#1A5345]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="h-9 px-5 rounded-xl font-bold text-[13px] border-[#E8E6E0] text-[#1A1F1E] hover:bg-slate-50">Discard Changes</Button>
        <Button onClick={() => onSave(form)} className="h-9 px-7 rounded-xl bg-[#1A5345] font-bold text-white text-[13px] hover:bg-[#133F34] shadow-md disabled:opacity-50" disabled={!canSave}>
          Confirm Medication
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

function ClinicalIntelligence({ meds }: { meds: MedicationRecord[] }) {
  const avgAdherence = Math.round(meds.reduce((acc, m) => acc + m.adherencePercent, 0) / (meds.length || 1))
  
  return (
    <div className="grid gap-4 lg:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* 30-Day Adherence Performance */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="size-4 text-[#1A5345]" />
            <h3 className="text-[13px] font-bold text-[#1A1F1E]">30-day performance</h3>
          </div>
          <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold", avgAdherence >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {avgAdherence >= 80 ? "Optimal" : "Needs Review"}
          </span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-[#102F27] tabular-nums">{avgAdherence}%</span>
          <span className="text-[12px] font-medium text-[#6B7870]">Overall Adherence</span>
        </div>

        {/* Simplified 30-day mini-chart (dots representation) */}
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "size-1.5 rounded-full",
                i > 25 ? "bg-[#E8E6E0]" : (i % 7 === 0 ? "bg-rose-400" : "bg-emerald-400")
              )} 
            />
          ))}
        </div>
        <p className="text-[11px] font-medium text-[#6B7870]">
          Last 30 days: <span className="text-[#102F27] font-bold">2 missed doses</span> detected across all active regimens.
        </p>
      </div>

      {/* AI Clinical Insights */}
      <div className="lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/30 to-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-700">
            <BrainCircuitIcon className="size-4" />
            <h3 className="text-[13px] font-bold text-violet-700">AI clinical insights</h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
            <SparklesIcon className="size-3" /> Smart Analysis
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-violet-100/50 bg-white/60 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <AdherenceIcon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#102F27]">Refill Efficiency</p>
              <p className="text-[11px] text-[#6B7870] leading-relaxed">Patient is proactive with refills. No gaps predicted in next 60 days.</p>
            </div>
          </div>
          
          <div className="flex gap-3 rounded-xl border border-violet-100/50 bg-white/60 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ZapIcon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#102F27]">Interaction Risk</p>
              <p className="text-[11px] text-[#6B7870] leading-relaxed">Statins & Grapefruit juice warning was flagged last week by patient.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-violet-600 px-4 py-2.5 flex items-center justify-between">
          <p className="text-[12px] font-bold text-white italic">"Overall clinical status is stable. Adherence has improved by 4% since the last visit."</p>
          <Button variant="ghost" size="sm" className="h-7 text-white hover:bg-white/10 text-[11px] font-bold">View History</Button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: MedicationRecord["status"] }) {
  const styles = {
    active: "bg-emerald-500 text-white shadow-sm font-bold",
    paused: "bg-amber-500 text-white shadow-sm font-bold",
    discontinued: "bg-red-500 text-white shadow-sm font-bold",
  }
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-bold capitalize", styles[status])}>
      {status}
    </span>
  )
}

function MedicationMetric({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md">
      <Icon className={cn("size-5 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-bold text-[#1A1F1E] sm:text-[20px] leading-none">{value}</div>
        <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function AdherenceTracker({ pct, history }: { pct: number; history?: boolean[][] }) {
  // Fallback history: generate nested array based on pct if not provided
  const safeHistory = history || Array.from({ length: 7 }, () => [true]);
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          {safeHistory.map((day, i) => {
            const allTaken = day.every(v => v);
            const someTaken = day.some(v => v);
            return (
              <div 
                key={i} 
                className={cn(
                  "size-2 rounded-full",
                  allTaken ? "bg-emerald-500" : (someTaken ? "bg-amber-400" : "bg-rose-50 border border-rose-200")
                )} 
              />
            )
          })}
        </div>
        <div className="h-1 w-full rounded-full bg-[#E8E6E0]/60 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-700", pct >= 80 ? "bg-emerald-500" : "bg-amber-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className={cn("text-[11px] font-bold tabular-nums", pct >= 80 ? "text-emerald-600" : "text-amber-600")}>
        {pct}%
      </span>
    </div>
  )
}

function MedicationRow({ m, onEdit, onStop, onFlag }: { m: MedicationRecord; onEdit: (m: MedicationRecord) => void; onStop: (m: MedicationRecord) => void; onFlag: (m: MedicationRecord) => void }) {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string
  
  const alerts = [
    { id: "compliance", active: m.compliance === "poor" || m.adherencePercent < 80, icon: AlertTriangleIcon, color: "text-amber-600", bg: "bg-amber-50", label: "Adherence" },
    { id: "flag", active: !!m.flagReason, icon: FlagIcon, color: "text-rose-600", bg: "bg-rose-50", label: "Clinical Flag" },
    { id: "substance", active: m.sideEffects?.toLowerCase().includes("allergy") || m.name.toLowerCase().includes("warn"), icon: SubstanceIcon, color: "text-violet-600", bg: "bg-violet-50", label: "Substance/Interaction" },
  ].filter(a => a.active)

  const getSpecialty = (type: MedicationRecord["type"]) => {
    const cardiology = ["antihypertensives", "antiplatelets", "anticoagulants", "statins", "antiarrhythmics", "diuretics"]
    const internal = ["diabetes_medications"]
    if (cardiology.includes(type)) return { label: "Cardiology", emoji: "🫀", color: "text-[#4A5568]" }
    if (internal.includes(type)) return { label: "Internal Med", emoji: "🩺", color: "text-[#4A5568]" }
    return { label: "General", emoji: "🧪", color: "text-[#4A5568]" }
  }

  const specialty = getSpecialty(m.type)

  return (
    <div className="group relative flex flex-col rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Main Row Content (Clickable) */}
      <div 
        className="flex cursor-pointer flex-col gap-3 p-3 sm:p-3.5 lg:flex-row lg:items-center lg:justify-between"
        onClick={() => router.push(`/doctor-patients/${patientId}/medications/${m.id}`)}
      >
        {/* Left: Core Info */}
        <div className="flex items-start gap-3 min-w-0 lg:w-[28%]">
          <PillIcon className="size-5 shrink-0 text-[#1A5345] mt-0.5" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-[14px] font-bold text-[#102F27] truncate">{m.name}</h4>
              <StatusBadge status={m.status} />
              {alerts.length > 0 && (
                <div className="flex -space-x-1.5 ml-1">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={cn("flex size-4 items-center justify-center rounded-full ring-2 ring-white", alert.bg)}>
                      <alert.icon className={cn("size-2.5", alert.color, alert.id === "flag" && "fill-current")} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#CC5533]">
              <span>{m.dose}</span>
              <span className="text-[#E8E6E0]">&bull;</span>
              <span>{m.frequency}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Specialty */}
        <div className="hidden lg:block lg:w-[15%]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground">Specialty</p>
            <div className={cn("flex items-center gap-1.5 font-serif text-[13px] font-medium", specialty.color)}>
              <span className="text-[14px]">{specialty.emoji}</span>
              <span>{specialty.label}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Adherence */}
        <div className="lg:w-[20%]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground">Adherence</p>
            <AdherenceTracker pct={m.adherencePercent} history={m.adherenceHistory7d} />
          </div>
        </div>

        {/* Right: Metadata & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 lg:w-[35%] lg:justify-end">
          <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1 rounded-md bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
              <StethoscopeIcon className="size-3" /> {m.prescribedBy}
            </div>
            <div className="flex items-center gap-1 rounded-md bg-[#F9F8F5] px-2 py-0.5 text-[10px] font-medium text-[#6B7870]">
              <ClockIcon className="size-3" /> {m.timeOfDay?.join(", ")}
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-7 rounded-lg text-[#1A5345] hover:bg-[#EEF5F3]" onClick={() => onEdit(m)} title="Adjust dosage">
              <PencilIcon className="size-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("size-7 rounded-lg", m.flagReason ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "text-[#102F27] hover:bg-slate-50")} 
              onClick={() => onFlag(m)} 
              title="Flag for review"
            >
              <FlagIcon className={cn("size-3.5", m.flagReason && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 rounded-lg text-red-600 hover:bg-red-50" onClick={() => onStop(m)} title="Stop medication">
              <BanIcon className="size-3.5" />
            </Button>
            <ArrowRightIcon className="size-4 text-[#102F27] ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Flags & Instructions (Always visible at bottom of row if present) */}
      {(m.flagReason || m.instructions) && (
        <div className="flex flex-col gap-1.5 px-3.5 pb-3 border-t border-[#E8E6E0]/40 pt-2 bg-[#FAFAFA]/40 rounded-b-xl">
          {m.flagReason && (
            <div className="flex items-center gap-2 text-[11px] text-rose-700 bg-rose-50/50 px-2 py-1 rounded-lg">
              <FlagIcon className="size-3 fill-rose-600 shrink-0" />
              <span className="shrink-0 text-[11px] font-bold text-rose-700">Flag:</span>
              <p className="truncate italic">\"{m.flagReason}\"</p>
            </div>
          )}
          {m.instructions && (
            <div className="flex items-center gap-2 text-[11px] text-[#6B7870] bg-[#FFFCFA] px-2 py-1 rounded-lg">
              <span className="shrink-0 text-[11px] font-bold text-[#1A1F1E]">Note:</span>
              <p className="truncate italic">\"{m.instructions}\"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MedicationsPage({ patientId, patientName, medications: initialMeds }: MedicationsPageProps) {
  const router = useRouter()
  const [meds, setMeds] = useState<MedicationRecord[]>(initialMeds)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MedFormData>(emptyMedForm())
  const [discontinueDialog, setDiscontinueDialog] = useState<string | null>(null)
  const [discontinueReason, setDiscontinueReason] = useState("")
  const [flagDialog, setFlagDialog] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState("")

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

  function handleFlag() {
    if (!flagDialog) return
    setMeds((prev) => prev.map((m) =>
      m.id === flagDialog
        ? { ...m, flagReason: flagReason.trim() || null }
        : m
    ))
    setFlagDialog(null)
    setFlagReason("")
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-700">
      
      {/* Premium Medical Header */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
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

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] flex items-center gap-2">
                Medication Management
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Comprehensive pharmaceutical record and adherence tracking for {patientName}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button 
                size="sm" 
                onClick={openAdd} 
                className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-[#133F34]"
              >
                <PlusIcon className="size-3.5" />
                Add Medication
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="w-full min-w-0 space-y-8">
          
          {/* Clinical Intelligence Dashboard */}
          <ClinicalIntelligence meds={active} />

          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <MedicationMetric label="Active regimen" value={active.length} icon={PillIcon} color="text-emerald-600" />
            <MedicationMetric label="Paused treatment" value={paused.length} icon={ClockIcon} color="text-amber-600" />
            <MedicationMetric label="Discontinued" value={discontinued.length} icon={BanIcon} color="text-red-600" />
          </div>

          {/* Active Regimen Section */}
          {active.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <LayoutGridIcon className="size-4 text-[#CC5533]" />
                  <h3 className="text-[13px] font-bold text-[#1A1F1E]">Active regimen</h3>
                </div>
                <p className="text-[12px] font-medium text-muted-foreground">{active.length} current medications</p>
              </div>
              <div className="space-y-3">
                {active.map((m) => (
                  <MedicationRow 
                    key={m.id} 
                    m={m} 
                    onEdit={openEdit} 
                    onStop={(med) => { setDiscontinueDialog(med.id); setDiscontinueReason("") }} 
                    onFlag={(med) => { setFlagDialog(med.id); setFlagReason(med.flagReason || "") }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused & Discontinued grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {paused.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <ClockIcon className="size-4 text-amber-600" />
                  <h3 className="text-[13px] font-bold text-[#1A1F1E]">Paused treatments</h3>
                </div>
                <div className="space-y-3">
                  {paused.map((m) => (
                    <div key={m.id} className="group flex items-center gap-4 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <ClockIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-bold text-[#1A1F1E]">{m.name}</h4>
                          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Paused</span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground">{m.dose} &middot; {m.frequency}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => openEdit(m)}>
                        <PencilIcon className="size-3.5 text-muted-foreground hover:text-[#1A5345]" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {discontinued.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <BanIcon className="size-4 text-red-600" />
                  <h3 className="text-[13px] font-bold text-[#1A1F1E]">Discontinued</h3>
                </div>
                <div className="space-y-3">
                  {discontinued.map((m) => (
                    <div key={m.id} className="group flex items-center gap-4 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <BanIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-bold text-gray-400 line-through">{m.name}</h4>
                          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">Stopped</span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground">{m.sideEffects ? `Reason: ${m.sideEffects}` : "Inactive Treatment"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs remain functional but can be styled slightly more if needed, though they are usually standard */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0 border-[#E8E6E0] rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 bg-white px-6 py-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-[22px] font-bold text-[#102F27]">
                {editingId ? "Modify Medication Record" : "New Medication Prescription"}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-8">
            <MedicationForm initial={editForm} onSave={handleSave} onCancel={() => { setDialogOpen(false); setEditingId(null) }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!flagDialog} onOpenChange={(open) => { if (!open) setFlagDialog(null) }}>
        <DialogContent className="max-w-md p-6 rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-[18px] font-bold text-[#102F27]">Flag Medication for Review</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-5">
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 flex gap-3">
              <FlagIcon className="size-5 text-rose-600 shrink-0 fill-rose-600" />
              <p className="text-[12px] font-medium leading-relaxed text-rose-800">
                Flagging this medication will highlight it for special attention. Useful for potential interactions, side effects, or adherence issues.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Clinical reason / warning</Label>
              <Textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe the concern or risk..."
                className="min-h-[100px] text-[13px] rounded-xl border-[#E8E6E0] focus:ring-[#1A5345]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFlagDialog(null)} className="flex-1 h-8 rounded-lg font-bold text-[11px] border-[#E8E6E0] text-[#1A1F1E]">Cancel</Button>
              <Button onClick={handleFlag} className="flex-1 h-8 rounded-lg font-bold text-[11px] bg-rose-600 text-white hover:bg-rose-700 shadow-sm">
                {flagReason.trim() ? "Apply Flag" : "Remove Flag"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!discontinueDialog} onOpenChange={(open) => { if (!open) setDiscontinueDialog(null) }}>
        <DialogContent className="max-w-md p-6 rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-[18px] font-bold text-[#102F27]">Discontinue Treatment</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-5">
            <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex gap-3">
              <AlertCircleIcon className="size-5 text-red-600 shrink-0" />
              <p className="text-[12px] font-medium leading-relaxed text-red-800">
                You are about to stop this treatment. This will move the medication to the inactive archive. Please provide a clinical reason.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Clinical justification</Label>
              <Textarea
                value={discontinueReason}
                onChange={(e) => setDiscontinueReason(e.target.value)}
                placeholder="Side effects, target reached, or alternative therapy..."
                className="min-h-[100px] text-[13px] rounded-xl border-[#E8E6E0] focus:ring-[#1A5345]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDiscontinueDialog(null)} className="flex-1 h-8 rounded-lg font-bold text-[11px] border-[#E8E6E0] text-[#1A1F1E]">Cancel</Button>
              <Button onClick={handleDiscontinue} className="flex-1 h-8 rounded-lg font-bold text-[11px] bg-red-600 text-white hover:bg-red-700 shadow-sm">
                Confirm Stopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
