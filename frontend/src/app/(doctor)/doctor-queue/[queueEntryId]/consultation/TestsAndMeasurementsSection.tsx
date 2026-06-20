"use client"

import { useMemo, useState } from "react"
import type { TestOrder, HomeMeasurement } from "./consultation.types"
import type { ClinicalNotesAiContext } from "./clinicalNotesAiSuggestions"
import {
  buildTestOrderSuggestions,
  type TestOrderSuggestion,
} from "./testOrdersAiSuggestions"
import { showIcareToast } from "@/components/shared/icare-toast"
import { cn } from "@/lib/utils"
import {
  BeakerIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  CheckIcon,
  ClockIcon,
  FlaskConicalIcon,
  HeartIcon,
  HomeIcon,
  Loader2Icon,
  MapPinIcon,
  MoonIcon,
  PencilLineIcon,
  PlusIcon,
  SparklesIcon,
  SunriseIcon,
  SunIcon,
  TargetIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  { value: "holter_monitor" as const, label: "Holter Monitor (24-48 hr)", icon: HeartIcon },
  { value: "stress_test" as const, label: "Stress Test", icon: HeartIcon },
  {
    value: "nuclear_stress_test" as const,
    label: "Nuclear Stress Test (Perfusion)",
    icon: HeartIcon,
  },
  { value: "ct_coronary_angiography" as const, label: "CT Coronary Angiography", icon: BeakerIcon },
  { value: "cardiac_mri" as const, label: "Cardiac MRI", icon: BeakerIcon },
  { value: "cardiac_catheterization" as const, label: "Cardiac Catheterization", icon: HeartIcon },
  {
    value: "carotid_doppler" as const,
    label: "Carotid Doppler / Vascular Ultrasound",
    icon: HeartIcon,
  },
  { value: "tilt_table_test" as const, label: "Tilt Table Test", icon: HeartIcon },
  { value: "pulmonary_function" as const, label: "Pulmonary Function", icon: HeartIcon },
  { value: "sleep_study" as const, label: "Sleep Study (Polysomnography)", icon: MoonIcon },
  { value: "urinalysis" as const, label: "Urinalysis", icon: FlaskConicalIcon },
  { value: "other" as const, label: "Other", icon: BeakerIcon },
]

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const INPUT_CLASS =
  "h-10 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
const SELECT_TRIGGER_CLASS = cn(INPUT_CLASS, "w-full")

const URGENCY_CONFIG = {
  routine: { label: "Routine", badge: "bg-[#1A5345] text-white hover:bg-[#1A5345]" },
  urgent: { label: "Urgent", badge: "bg-amber-500 text-white hover:bg-amber-500" },
  stat: { label: "STAT", badge: "bg-red-500 text-white hover:bg-red-500" },
}

const TEST_TYPE_BADGES: Record<TestOrder["testType"], string> = {
  blood: "bg-violet-500 text-white hover:bg-violet-500",
  imaging: "bg-blue-500 text-white hover:bg-blue-500",
  ecg: "bg-emerald-500 text-white hover:bg-emerald-500",
  echocardiogram: "bg-teal-500 text-white hover:bg-teal-500",
  holter_monitor: "bg-fuchsia-500 text-white hover:bg-fuchsia-500",
  stress_test: "bg-orange-500 text-white hover:bg-orange-500",
  nuclear_stress_test: "bg-amber-600 text-white hover:bg-amber-600",
  ct_coronary_angiography: "bg-sky-600 text-white hover:bg-sky-600",
  cardiac_mri: "bg-indigo-500 text-white hover:bg-indigo-500",
  cardiac_catheterization: "bg-rose-500 text-white hover:bg-rose-500",
  carotid_doppler: "bg-cyan-600 text-white hover:bg-cyan-600",
  tilt_table_test: "bg-lime-600 text-white hover:bg-lime-600",
  pulmonary_function: "bg-cyan-500 text-white hover:bg-cyan-500",
  sleep_study: "bg-violet-600 text-white hover:bg-violet-600",
  urinalysis: "bg-amber-500 text-white hover:bg-amber-500",
  other: "bg-slate-500 text-white hover:bg-slate-500",
}

const METRIC_OPTIONS = [
  { value: "blood_pressure" as const, label: "Blood Pressure" },
  { value: "heart_rate" as const, label: "Heart Rate" },
  { value: "weight" as const, label: "Weight" },
  { value: "blood_sugar" as const, label: "Blood Sugar" },
  { value: "oxygen_saturation" as const, label: "O₂ Saturation" },
  { value: "temperature" as const, label: "Temperature" },
  { value: "symptom_log" as const, label: "Symptom Log (pain / palpitations)" },
  { value: "single_lead_ecg" as const, label: "Single-lead ECG / Heart Rhythm" },
  { value: "physical_activity" as const, label: "Physical Activity (Steps)" },
  { value: "sleep_quality" as const, label: "Sleep Duration / Quality" },
  { value: "other" as const, label: "Other" },
]

const METRIC_BADGES: Record<HomeMeasurement["metric"], string> = {
  blood_pressure: "bg-red-500 text-white hover:bg-red-500",
  heart_rate: "bg-rose-500 text-white hover:bg-rose-500",
  weight: "bg-amber-500 text-white hover:bg-amber-500",
  blood_sugar: "bg-violet-500 text-white hover:bg-violet-500",
  oxygen_saturation: "bg-blue-500 text-white hover:bg-blue-500",
  temperature: "bg-orange-500 text-white hover:bg-orange-500",
  symptom_log: "bg-pink-600 text-white hover:bg-pink-600",
  single_lead_ecg: "bg-emerald-600 text-white hover:bg-emerald-600",
  physical_activity: "bg-green-600 text-white hover:bg-green-600",
  sleep_quality: "bg-indigo-500 text-white hover:bg-indigo-500",
  other: "bg-slate-500 text-white hover:bg-slate-500",
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
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", typeBadge)}
            >
              {typeLabel}
            </Badge>
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", urgency.badge)}
            >
              {urgency.label}
            </Badge>
            {order.fastingRequired && (
              <Badge
                variant="default"
                className="rounded-lg border-0 bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-orange-500"
              >
                Fasting required
              </Badge>
            )}
          </div>
          <p className="mt-2 text-[14px] font-bold text-[#1A1F1E]">{order.testName}</p>
          {order.notes && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{order.notes}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
            {order.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {order.location}
              </span>
            )}
            {order.scheduledDate && (
              <span className="flex items-center gap-1">
                <CalendarClockIcon className="size-3.5" />
                {order.scheduledDate}
                {order.scheduledTime && ` at ${order.scheduledTime}`}
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-500"
          onClick={() => onRemove(order.id)}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

const AI_GENERATE_MS = 700

function TestSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: TestOrderSuggestion
  onAccept: (entry: TestOrder) => void
  onDismiss: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [testType, setTestType] = useState<TestOrder["testType"]>(suggestion.testType)
  const [testName, setTestName] = useState(suggestion.testName)
  const [urgency, setUrgency] = useState<TestOrder["urgency"]>(suggestion.urgency)
  const [notes, setNotes] = useState(suggestion.notes)
  const [fastingRequired, setFastingRequired] = useState(suggestion.fastingRequired)

  const typeLabel = TEST_TYPES.find((t) => t.value === testType)?.label ?? testType
  const typeBadge = TEST_TYPE_BADGES[testType]

  const handleAccept = () => {
    if (!testName.trim()) return
    onAccept({
      id: `test-ai-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      testType,
      testName: testName.trim(),
      urgency,
      notes: notes.trim(),
      location: "",
      scheduledDate: "",
      scheduledTime: "",
      fastingRequired,
    })
    onDismiss(suggestion.id)
    showIcareToast({
      title: "Test order added",
      description: "Review the ordered test in the list above.",
    })
  }

  return (
    <article className="space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm", typeBadge)}
          >
            {typeLabel}
          </Badge>
          <Badge
            variant="default"
            className={cn(
              "rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold text-white shadow-none",
              URGENCY_CONFIG[urgency].badge,
            )}
          >
            {URGENCY_CONFIG[urgency].label}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600/70">
            <SparklesIcon className="size-3 text-violet-500" aria-hidden />
            AI suggested
          </span>
        </div>
        <FlaskConicalIcon className="size-4 shrink-0 text-violet-600/70" aria-hidden />
      </div>

      <div>
        <h4 className="text-[14px] font-bold text-[#1A1F1E]">{testName}</h4>
        {notes ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[#374151]">{notes}</p>
        ) : null}
        <p className="mt-2 text-[12px] leading-relaxed text-violet-900/75">{suggestion.rationale}</p>
        {suggestion.caution ? (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
            <TargetIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-[11px] leading-relaxed text-amber-800">{suggestion.caution}</p>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-3 rounded-xl border border-[#E8E6E0]/60 bg-white/80 p-3">
          <p className="text-[12px] font-semibold text-[#1A1F1E]">Adjust before ordering</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Test type</label>
              <Select value={testType} onValueChange={(v) => setTestType(v as TestOrder["testType"])}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[14px]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Urgency</label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as TestOrder["urgency"])}>
                <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                  {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-[14px]">
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground">Test name</label>
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground">Clinical notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`fasting-${suggestion.id}`}
              checked={fastingRequired}
              onCheckedChange={(checked) => setFastingRequired(checked === true)}
              className="border-[#E8E6E0]"
            />
            <label htmlFor={`fasting-${suggestion.id}`} className="text-[12px] font-medium text-muted-foreground">
              Fasting required
            </label>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onDismiss(suggestion.id)}
          className="h-8 rounded-lg border-[#E8E6E0] bg-white px-2.5 text-[11px] font-bold shadow-sm hover:bg-red-50 hover:text-red-600"
        >
          <XIcon className="size-3.5" aria-hidden />
          Dismiss
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsEditing((prev) => !prev)}
          className="h-8 flex-1 rounded-lg border-[#E8E6E0] bg-white text-[11px] font-bold shadow-sm hover:bg-[#F9F8F5]"
        >
          <PencilLineIcon className="size-3.5" aria-hidden />
          {isEditing ? "Close" : "Edit"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAccept}
          disabled={!testName.trim()}
          className="h-8 flex-1 rounded-lg border-0 bg-[#1A5345] text-[11px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          <CheckIcon className="size-3.5" aria-hidden />
          Order test
        </Button>
      </div>
    </article>
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
  const [suggestFacilitySchedule, setSuggestFacilitySchedule] = useState(false)
  const [fastingRequired, setFastingRequired] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
      >
        <PlusIcon className="size-4" />
        Order test
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
      location: suggestFacilitySchedule ? location.trim() : "",
      scheduledDate: suggestFacilitySchedule ? scheduledDate : "",
      scheduledTime: suggestFacilitySchedule ? scheduledTime : "",
      fastingRequired,
    })
    setTestType("blood")
    setTestName("")
    setUrgency("routine")
    setNotes("")
    setLocation("")
    setScheduledDate("")
    setScheduledTime("")
    setSuggestFacilitySchedule(false)
    setFastingRequired(false)
    setIsOpen(false)
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[15px] font-bold text-[#1A1F1E]">New test order</span>
        <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Test type</label>
          <Select value={testType} onValueChange={(v) => setTestType(v as TestOrder["testType"])}>
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {TEST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[14px]">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Urgency</label>
          <Select value={urgency} onValueChange={(v) => setUrgency(v as TestOrder["urgency"])}>
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-[14px]">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Test name *</label>
        <Input
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g. Complete Blood Count, Lipid Panel, Chest X-Ray..."
          className={INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Clinical notes / reason</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Check HbA1c control, Evaluate cardiac enzymes..."
          className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="suggest-facility-schedule"
          checked={suggestFacilitySchedule}
          onCheckedChange={(checked) => {
            const enabled = checked === true
            setSuggestFacilitySchedule(enabled)
            if (!enabled) {
              setLocation("")
              setScheduledDate("")
              setScheduledTime("")
            }
          }}
          className="mt-0.5 border-[#E8E6E0]"
        />
        <div className="space-y-0.5">
          <label htmlFor="suggest-facility-schedule" className="text-[13px] font-medium text-[#1A1F1E]">
            Suggest facility & schedule
          </label>
          <p className="text-[12px] text-muted-foreground">
            Optional — patient may choose a different location or time.
          </p>
        </div>
      </div>
      {suggestFacilitySchedule ? (
        <>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Facility / location</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main Lab - Floor 2, Cardiology Imaging Center..."
                className={cn(INPUT_CLASS, "pl-9")}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Preferred date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Preferred time</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </>
      ) : null}
      <div className="flex items-center gap-2">
        <Checkbox
          id="fasting"
          checked={fastingRequired}
          onCheckedChange={(checked) => setFastingRequired(checked === true)}
          className="border-[#E8E6E0]"
        />
        <label htmlFor="fasting" className="text-[13px] font-medium text-muted-foreground">
          Fasting required (8-12 hours)
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[13px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]" disabled={!testName.trim()} onClick={handleSubmit}>
          Order test
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
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", metricBadge)}
            >
              {metricLabel}
            </Badge>
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
            >
              <ClockIcon className="mr-0.5 size-2.5" />
              {measurement.frequency}
            </Badge>
            {measurement.duration && (
              <Badge
                variant="outline"
                className="rounded-lg border-[#E8E6E0] bg-[#F9F8F5] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
              >
                {measurement.duration}
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span className="font-medium text-[#1A1F1E]">When:</span>
            {measurement.timesOfDay.map((tod) => (
              <span key={tod} className="rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] px-2.5 py-0.5 text-[12px] font-medium capitalize text-[#1A5345]">
                {tod}
              </span>
            ))}
          </div>
          {measurement.targetRange && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
              <TargetIcon className="size-3.5 text-[#1A5345]" />
              <span className="text-muted-foreground">Target:</span>
              <span className="font-semibold text-[#1A1F1E]">{measurement.targetRange}</span>
            </div>
          )}
          {measurement.instructions && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{measurement.instructions}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-red-50 hover:text-red-500"
          onClick={() => onRemove(measurement.id)}
        >
          <Trash2Icon className="size-4" />
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
      >
        <PlusIcon className="size-4" />
        Add measurement
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
    <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[15px] font-bold text-[#1A1F1E]">New home measurement</span>
        <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setIsOpen(false)}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Metric</label>
          <Select value={metric} onValueChange={(v) => setMetric(v as HomeMeasurement["metric"])}>
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {METRIC_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-[14px]">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Frequency</label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-[14px]">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {metric === "other" && (
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Custom metric name *</label>
          <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. Peak Flow Rate" className={INPUT_CLASS} />
        </div>
      )}
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>When to measure</label>
        <div className="flex flex-wrap gap-2">
          {TIME_OF_DAY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTimeOfDay(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                  timesOfDay.includes(opt.value)
                    ? "bg-[#1A5345] text-white"
                    : "border border-[#E8E6E0] bg-white text-muted-foreground hover:bg-[#F9F8F5]",
                )}
              >
                <Icon className="size-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Duration</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-[14px]">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Target range</label>
          <Input
            value={targetRange}
            onChange={(e) => setTargetRange(e.target.value)}
            placeholder="e.g. <130/80 mmHg"
            className={INPUT_CLASS}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Instructions</label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Sit for 5 min before measuring. Take 2 readings each time, 1 min apart..."
          className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-muted-foreground focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-10 flex-1 rounded-lg text-[13px]" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button size="sm" className="h-10 flex-1 rounded-lg bg-[#1A5345] text-[13px] hover:bg-[#133F34]" disabled={!isValid} onClick={handleSubmit}>
          Add measurement
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
  aiContext: ClinicalNotesAiContext
}

export function TestsAndMeasurementsSection({
  testOrders,
  onAddTestOrder,
  onRemoveTestOrder,
  homeMeasurements,
  onAddMeasurement,
  onRemoveMeasurement,
  aiContext,
}: TestsAndMeasurementsSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>("tests")
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([])

  const allSuggestions = useMemo(
    () => buildTestOrderSuggestions(aiContext),
    [aiContext],
  )
  const visibleSuggestions = allSuggestions.filter((s) => !dismissedSuggestionIds.includes(s.id))

  const openAiSuggestions = () => {
    if (isGenerating) return
    setShowAiSuggestions(true)
    setIsGenerating(true)
    window.setTimeout(() => {
      setIsGenerating(false)
      if (buildTestOrderSuggestions(aiContext).filter((s) => !dismissedSuggestionIds.includes(s.id)).length === 0) {
        showIcareToast({
          title: "No new test suggestions",
          description: "Current orders and chart data do not suggest additional investigations right now.",
        })
      }
    }, AI_GENERATE_MS)
  }

  const dismissSuggestion = (id: string) => {
    setDismissedSuggestionIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConicalIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Tests & measurements</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "tests" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => (showAiSuggestions ? setShowAiSuggestions(false) : openAiSuggestions())}
                  disabled={isGenerating}
                  className={cn(
                    "size-8 border-0 bg-transparent shadow-none hover:bg-transparent",
                    showAiSuggestions || isGenerating
                      ? "text-violet-600"
                      : "text-violet-600 hover:text-violet-800",
                  )}
                  aria-label="AI test suggestions"
                  aria-pressed={showAiSuggestions}
                >
                  {isGenerating ? (
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <SparklesIcon className="size-4" aria-hidden />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                {isGenerating
                  ? "Reviewing chart context…"
                  : showAiSuggestions
                    ? "Hide AI test suggestions"
                    : "AI test suggestions"}
              </TooltipContent>
            </Tooltip>
          ) : null}
        <div className="inline-flex rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] p-1">
          <button
            onClick={() => setActiveTab("tests")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
              activeTab === "tests" ? "bg-[#1A5345] text-white" : "text-[#4F6D64] hover:bg-white",
            )}
          >
            <span className="flex items-center gap-1.5">
              <FlaskConicalIcon className="size-3.5" />
              Lab orders
              {testOrders.length > 0 && (
                <Badge
                  variant="default"
                  className={cn(
                    "ml-0.5 rounded-md border-0 px-1.5 py-0 text-[9px] font-bold shadow-none",
                    activeTab === "tests" ? "bg-white/20 text-white hover:bg-white/20" : "bg-[#1A5345] text-white hover:bg-[#1A5345]",
                  )}
                >
                  {testOrders.length}
                </Badge>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("measurements")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
              activeTab === "measurements" ? "bg-[#1A5345] text-white" : "text-[#4F6D64] hover:bg-white",
            )}
          >
            <span className="flex items-center gap-1.5">
              <HomeIcon className="size-3.5" />
              Home monitoring
              {homeMeasurements.length > 0 && (
                <Badge
                  variant="default"
                  className={cn(
                    "ml-0.5 rounded-md border-0 px-1.5 py-0 text-[9px] font-bold shadow-none",
                    activeTab === "measurements" ? "bg-white/20 text-white hover:bg-white/20" : "bg-[#1A5345] text-white hover:bg-[#1A5345]",
                  )}
                >
                  {homeMeasurements.length}
                </Badge>
              )}
            </span>
          </button>
        </div>
        </div>
      </div>

      {activeTab === "tests" && showAiSuggestions ? (
        <section className="mb-4 space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/30 to-[#F9F8F5] p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuitIcon className="size-4 text-violet-600" aria-hidden />
                <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E]">Suggested investigations</h4>
                {visibleSuggestions.length > 0 ? (
                  <Badge
                    variant="default"
                    className="rounded-lg border-0 bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
                  >
                    {visibleSuggestions.length}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Based on complaint, exam, diagnoses, and orders already on this visit.
              </p>
            </div>
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
            >
              AI · Rule-based
            </Badge>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-white/70 px-4 py-8 text-[12px] text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin text-violet-500" aria-hidden />
              Reviewing chart context…
            </div>
          ) : visibleSuggestions.length > 0 ? (
            <div className="space-y-3">
              {visibleSuggestions.map((suggestion) => (
                <TestSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={onAddTestOrder}
                  onDismiss={dismissSuggestion}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-white/70 px-4 py-8 text-center">
              <SparklesIcon className="mx-auto mb-2 size-5 text-violet-400/50" aria-hidden />
              <p className="text-[12px] font-medium text-muted-foreground">
                No additional test suggestions right now — dismissals and existing orders are accounted for.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "tests" ? (
        <div className="space-y-3">
          {testOrders.length === 0 && (
            <div className="mb-1 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3 text-center text-[13px] text-muted-foreground">
              No tests ordered yet. Order blood work, imaging, ECG, or other investigations.
            </div>
          )}
          {testOrders.map((order) => (
            <TestOrderCard key={order.id} order={order} onRemove={onRemoveTestOrder} />
          ))}
          <AddTestOrderForm onAdd={onAddTestOrder} />
        </div>
      ) : (
        <div className="space-y-3">
          {homeMeasurements.length === 0 && (
            <div className="mb-1 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3 text-center text-[13px] text-muted-foreground">
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
