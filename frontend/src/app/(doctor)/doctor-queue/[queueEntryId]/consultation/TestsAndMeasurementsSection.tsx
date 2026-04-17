"use client"

import { useState } from "react"
import type { TestOrder, HomeMeasurement } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  BeakerIcon,
  CalendarClockIcon,
  ClockIcon,
  FlaskConicalIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  SunriseIcon,
  SunIcon,
  TargetIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TEST_TYPES = [
  { value: "blood" as const, label: "Blood Work", icon: FlaskConicalIcon },
  { value: "imaging" as const, label: "Imaging", icon: BeakerIcon },
  { value: "ecg" as const, label: "ECG", icon: HeartIcon },
  { value: "echocardiogram" as const, label: "Echocardiogram", icon: HeartIcon },
  { value: "stress_test" as const, label: "Stress Test", icon: HeartIcon },
  { value: "cardiac_catheterization" as const, label: "Cardiac Catheterization", icon: HeartIcon },
  { value: "pulmonary_function" as const, label: "Pulmonary Function", icon: HeartIcon },
  { value: "urinalysis" as const, label: "Urinalysis", icon: FlaskConicalIcon },
  { value: "other" as const, label: "Other", icon: BeakerIcon },
]

const URGENCY_CONFIG = {
  routine: { label: "Routine", style: "bg-[#E8F0EE] text-[#1A5345]" },
  urgent: { label: "Urgent", style: "bg-amber-50 text-amber-700" },
  stat: { label: "STAT", style: "bg-red-50 text-red-700" },
}

const TEST_TYPE_BADGES: Record<TestOrder["testType"], string> = {
  blood: "bg-violet-50 text-violet-700",
  imaging: "bg-blue-50 text-blue-700",
  ecg: "bg-emerald-50 text-emerald-700",
  echocardiogram: "bg-teal-50 text-teal-700",
  stress_test: "bg-orange-50 text-orange-700",
  cardiac_catheterization: "bg-rose-50 text-rose-700",
  pulmonary_function: "bg-cyan-50 text-cyan-700",
  urinalysis: "bg-amber-50 text-amber-700",
  other: "bg-gray-50 text-gray-700",
}

const METRIC_OPTIONS = [
  { value: "blood_pressure" as const, label: "Blood Pressure" },
  { value: "heart_rate" as const, label: "Heart Rate" },
  { value: "weight" as const, label: "Weight" },
  { value: "blood_sugar" as const, label: "Blood Sugar" },
  { value: "oxygen_saturation" as const, label: "O₂ Saturation" },
  { value: "temperature" as const, label: "Temperature" },
  { value: "other" as const, label: "Other" },
]

const METRIC_BADGES: Record<HomeMeasurement["metric"], string> = {
  blood_pressure: "bg-red-50 text-red-700",
  heart_rate: "bg-rose-50 text-rose-700",
  weight: "bg-amber-50 text-amber-700",
  blood_sugar: "bg-violet-50 text-violet-700",
  oxygen_saturation: "bg-blue-50 text-blue-700",
  temperature: "bg-orange-50 text-orange-700",
  other: "bg-gray-50 text-gray-700",
}

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning", icon: SunriseIcon },
  { value: "afternoon", label: "Afternoon", icon: SunIcon },
  { value: "evening", label: "Evening", icon: MoonIcon },
]

const FREQUENCY_OPTIONS = [
  { value: "Once daily", label: "Once daily" },
  { value: "Twice daily", label: "Twice daily" },
  { value: "Three times daily", label: "Three times daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Every other day", label: "Every other day" },
  { value: "After meals", label: "After meals" },
]

const DURATION_OPTIONS = [
  { value: "1 week", label: "1 week" },
  { value: "2 weeks", label: "2 weeks" },
  { value: "1 month", label: "1 month" },
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "Ongoing", label: "Ongoing" },
]

type Tab = "tests" | "measurements"

function TestOrderCard({
  order,
  onRemove,
}: {
  order: TestOrder
  onRemove: (id: string) => void
}) {
  const urgency = URGENCY_CONFIG[order.urgency]
  const typeLabel = TEST_TYPES.find((t) => t.value === order.testType)?.label ?? order.testType
  const typeBadge = TEST_TYPE_BADGES[order.testType]

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", typeBadge)}>
              {typeLabel}
            </span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", urgency.style)}>
              {urgency.label}
            </span>
            {order.fastingRequired && (
              <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                Fasting Required
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-[#102F27]">{order.testName}</p>
          {order.notes && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{order.notes}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {order.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3" />
                {order.location}
              </span>
            )}
            {order.scheduledDate && (
              <span className="flex items-center gap-1">
                <CalendarClockIcon className="size-3" />
                {order.scheduledDate}
                {order.scheduledTime && ` at ${order.scheduledTime}`}
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:text-red-500 hover:bg-red-50"
          onClick={() => onRemove(order.id)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddTestOrderForm({ onAdd }: { onAdd: (entry: TestOrder) => void }) {
  const [testType, setTestType] = useState<TestOrder["testType"]>("blood")
  const [testName, setTestName] = useState("")
  const [urgency, setUrgency] = useState<TestOrder["urgency"]>("routine")
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [fastingRequired, setFastingRequired] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#E5EEEA] py-2.5 text-[12px] font-medium text-[#6B7870] transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9] hover:text-[#1A5345]"
      >
        <PlusIcon className="size-3.5" />
        Order Test
      </button>
    )
  }

  const handleSubmit = () => {
    if (!testName.trim()) return
    onAdd({
      id: `test-${Date.now()}`,
      testType,
      testName: testName.trim(),
      urgency,
      notes: notes.trim(),
      location: location.trim(),
      scheduledDate,
      scheduledTime,
      fastingRequired,
    })
    setTestType("blood")
    setTestName("")
    setUrgency("routine")
    setNotes("")
    setLocation("")
    setScheduledDate("")
    setScheduledTime("")
    setFastingRequired(false)
    setIsOpen(false)
  }

  return (
    <div className="rounded-lg border-2 border-[#1A5345]/20 bg-[#F6FBF9] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#1A5345]">New Test Order</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Test Type</label>
          <Select value={testType} onValueChange={(v) => setTestType(v as TestOrder["testType"])}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {TEST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[12px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Urgency</label>
          <Select value={urgency} onValueChange={(v) => setUrgency(v as TestOrder["urgency"])}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-[12px]">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Test Name *</label>
        <Input
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g. Complete Blood Count, Lipid Panel, Chest X-Ray..."
          className="h-8 border-[#E8E6E0] bg-white text-[12px]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Clinical Notes / Reason</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Check HbA1c control, Evaluate cardiac enzymes..."
          className="min-h-[36px] resize-none border-[#E8E6E0] bg-white text-[12px] placeholder:text-[#9CA3AF]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Facility / Location</label>
        <div className="relative">
          <MapPinIcon className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Main Lab - Floor 2, Cardiology Imaging Center..."
            className="h-8 border-[#E8E6E0] bg-white pl-7 text-[12px]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Preferred Date</label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="h-8 border-[#E8E6E0] bg-white text-[12px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Preferred Time</label>
          <Input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="h-8 border-[#E8E6E0] bg-white text-[12px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="fasting"
          checked={fastingRequired}
          onCheckedChange={(checked) => setFastingRequired(checked === true)}
          className="border-[#cfd9d5]"
        />
        <label htmlFor="fasting" className="text-[11px] font-medium text-muted-foreground">
          Fasting required (8-12 hours)
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="flex-1 bg-[#1A5345] hover:bg-[#0F3D32] text-[11px]" disabled={!testName.trim()} onClick={handleSubmit}>
          Order Test
        </Button>
      </div>
    </div>
  )
}

function MeasurementCard({
  measurement,
  onRemove,
}: {
  measurement: HomeMeasurement
  onRemove: (id: string) => void
}) {
  const metricLabel = METRIC_OPTIONS.find((m) => m.value === measurement.metric)?.label ?? measurement.metricLabel
  const metricBadge = METRIC_BADGES[measurement.metric]

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", metricBadge)}>
              {metricLabel}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[#E8F0EE] px-1.5 py-0.5 text-[10px] font-medium text-[#1A5345]">
              <ClockIcon className="size-2.5" />
              {measurement.frequency}
            </span>
            {measurement.duration && (
              <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[10px] text-[#6B7870]">
                {measurement.duration}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-[#102F27]">When:</span>
            {measurement.timesOfDay.map((tod) => (
              <span key={tod} className="flex items-center gap-0.5 rounded-full bg-[#F6FBF9] px-2 py-0.5 text-[10px] text-[#2C6A5B] ring-1 ring-[#DCE9E4]">
                {tod}
              </span>
            ))}
          </div>
          {measurement.targetRange && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              <TargetIcon className="size-3 text-[#1A5345]" />
              <span className="text-muted-foreground">Target:</span>
              <span className="font-medium text-[#102F27]">{measurement.targetRange}</span>
            </div>
          )}
          {measurement.instructions && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{measurement.instructions}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:text-red-500 hover:bg-red-50"
          onClick={() => onRemove(measurement.id)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddMeasurementForm({ onAdd }: { onAdd: (entry: HomeMeasurement) => void }) {
  const [metric, setMetric] = useState<HomeMeasurement["metric"]>("blood_pressure")
  const [customLabel, setCustomLabel] = useState("")
  const [frequency, setFrequency] = useState("")
  const [timesOfDay, setTimesOfDay] = useState<string[]>(["morning", "evening"])
  const [duration, setDuration] = useState("")
  const [targetRange, setTargetRange] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#E5EEEA] py-2.5 text-[12px] font-medium text-[#6B7870] transition-colors hover:border-[#1A5345]/30 hover:bg-[#F6FBF9] hover:text-[#1A5345]"
      >
        <PlusIcon className="size-3.5" />
        Add Measurement
      </button>
    )
  }

  const toggleTimeOfDay = (tod: string) => {
    setTimesOfDay((prev) =>
      prev.includes(tod) ? prev.filter((t) => t !== tod) : [...prev, tod],
    )
  }

  const handleSubmit = () => {
    const label = metric === "other" ? customLabel.trim() : (METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? metric)
    if (!label) return
    onAdd({
      id: `meas-${Date.now()}`,
      metric,
      metricLabel: label,
      frequency: frequency || "As prescribed",
      timesOfDay,
      duration: duration || "Ongoing",
      targetRange: targetRange.trim(),
      instructions: instructions.trim(),
    })
    setMetric("blood_pressure")
    setCustomLabel("")
    setFrequency("")
    setTimesOfDay(["morning", "evening"])
    setDuration("")
    setTargetRange("")
    setInstructions("")
    setIsOpen(false)
  }

  const isValid = metric !== "other" || customLabel.trim()

  return (
    <div className="rounded-lg border-2 border-[#1A5345]/20 bg-[#F6FBF9] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#1A5345]">New Home Measurement</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Metric</label>
          <Select value={metric} onValueChange={(v) => setMetric(v as HomeMeasurement["metric"])}>
            <SelectTrigger className="h-8 rounded-lg border-[#cfd9d5] bg-white text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {METRIC_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-[12px]">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>
      {metric === "other" && (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Custom Metric Name *</label>
          <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. Peak Flow Rate" className="h-8 border-[#E8E6E0] bg-white text-[12px]" />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">When to Measure</label>
        <div className="flex gap-1.5">
          {TIME_OF_DAY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTimeOfDay(opt.value)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  timesOfDay.includes(opt.value)
                    ? "bg-[#1A5345] text-white"
                    : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                )}
              >
                <Icon className="size-3" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
          <label className="text-[10px] font-medium text-muted-foreground">Target Range</label>
          <Input
            value={targetRange}
            onChange={(e) => setTargetRange(e.target.value)}
            placeholder="e.g. <130/80 mmHg"
            className="h-8 border-[#E8E6E0] bg-white text-[12px]"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground">Instructions</label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Sit for 5 min before measuring. Take 2 readings each time, 1 min apart..."
          className="min-h-[36px] resize-none border-[#E8E6E0] bg-white text-[12px] placeholder:text-[#9CA3AF]"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-[11px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="flex-1 bg-[#1A5345] hover:bg-[#0F3D32] text-[11px]" disabled={!isValid} onClick={handleSubmit}>
          Add Measurement
        </Button>
      </div>
    </div>
  )
}

export type TestsAndMeasurementsSectionProps = {
  testOrders: TestOrder[]
  onAddTestOrder: (entry: TestOrder) => void
  onRemoveTestOrder: (id: string) => void
  homeMeasurements: HomeMeasurement[]
  onAddMeasurement: (entry: HomeMeasurement) => void
  onRemoveMeasurement: (id: string) => void
}

export function TestsAndMeasurementsSection({
  testOrders,
  onAddTestOrder,
  onRemoveTestOrder,
  homeMeasurements,
  onAddMeasurement,
  onRemoveMeasurement,
}: TestsAndMeasurementsSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>("tests")

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <FlaskConicalIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Tests & Measurements</h3>
        </div>
        <div className="inline-flex rounded-full border border-[#D6E6DF] bg-[#F8FCFA] p-0.5">
          <button
            onClick={() => setActiveTab("tests")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              activeTab === "tests" ? "bg-[#1A5345] text-white" : "text-[#4F6D64] hover:bg-[#E8F0EE]",
            )}
          >
            <span className="flex items-center gap-1.5">
              <FlaskConicalIcon className="size-3" />
              Lab Orders
              {testOrders.length > 0 && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px]",
                  activeTab === "tests" ? "bg-white/20 text-white" : "bg-[#E8F0EE] text-[#1A5345]",
                )}>
                  {testOrders.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("measurements")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              activeTab === "measurements" ? "bg-[#1A5345] text-white" : "text-[#4F6D64] hover:bg-[#E8F0EE]",
            )}
          >
            <span className="flex items-center gap-1.5">
              <HomeIcon className="size-3" />
              Home Monitoring
              {homeMeasurements.length > 0 && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px]",
                  activeTab === "measurements" ? "bg-white/20 text-white" : "bg-[#E8F0EE] text-[#1A5345]",
                )}>
                  {homeMeasurements.length}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "tests" ? (
        <div className="space-y-2">
          {testOrders.length === 0 && (
            <div className="mb-2 rounded-lg bg-[#FAFAF8] px-3 py-2 text-center text-[11px] text-muted-foreground">
              No tests ordered yet. Order blood work, imaging, ECG, or other investigations.
            </div>
          )}
          {testOrders.map((order) => (
            <TestOrderCard key={order.id} order={order} onRemove={onRemoveTestOrder} />
          ))}
          <AddTestOrderForm onAdd={onAddTestOrder} />
        </div>
      ) : (
        <div className="space-y-2">
          {homeMeasurements.length === 0 && (
            <div className="mb-2 rounded-lg bg-[#FAFAF8] px-3 py-2 text-center text-[11px] text-muted-foreground">
              No home measurements assigned. Instruct the patient to self-monitor vitals at home.
            </div>
          )}
          {homeMeasurements.map((m) => (
            <MeasurementCard key={m.id} measurement={m} onRemove={onRemoveMeasurement} />
          ))}
          <AddMeasurementForm onAdd={onAddMeasurement} />
        </div>
      )}
    </div>
  )
}
