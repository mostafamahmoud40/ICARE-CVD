"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  MessageSquareTextIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  CheckCircle2Icon,
  MicIcon,
} from "lucide-react"
import { useSpeechDictation } from "./useSpeechDictation"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CVD_COMPLAINTS = [
  { value: "chest_pain", label: "Chest Pain" },
  { value: "dyspnea", label: "Shortness of Breath (Dyspnea)" },
  { value: "palpitations", label: "Palpitations" },
  { value: "syncope", label: "Syncope / Near-Syncope" },
  { value: "fatigue", label: "Fatigue" },
  { value: "edema", label: "Peripheral Edema" },
  { value: "dizziness", label: "Dizziness" },
  { value: "orthopnea", label: "Orthopnea" },
  { value: "pnd", label: "Paroxysmal Nocturnal Dyspnea" },
  { value: "claudication", label: "Claudication" },
  { value: "diaphoresis", label: "Diaphoresis" },
  { value: "nausea", label: "Nausea / Vomiting" },
  { value: "jaw_pain", label: "Jaw Pain" },
  { value: "arm_pain", label: "Arm Pain" },
  { value: "back_pain", label: "Back Pain" },
  { value: "epigastric_pain", label: "Epigastric Pain" },
  { value: "other", label: "Other" },
] as const

const ONSET_OPTIONS = ["Sudden", "Gradual", "Intermittent"] as const
const DURATION_OPTIONS = ["< 24 hours", "1-3 days", "1 week", "> 1 week", "Chronic"] as const
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const
const CHARACTER_OPTIONS = ["Sharp", "Dull", "Pressure-like", "Burning", "Throbbing"] as const
const AGGRAVATING_OPTIONS = ["Exertion", "Stress", "After meals", "Deep breathing", "Lying flat"] as const
const RELIEVING_OPTIONS = ["Rest", "Medication", "Sitting upright", "Hydration", "None"] as const

type AiOrderSuggestion = {
  id: string
  label: string
  rationale: string
}

const COMPLAINT_FOLLOW_UPS: Record<string, string[]> = {
  chest_pain: [
    "Does pain radiate to jaw, left arm, or back?",
    "Is pain associated with sweating, nausea, or shortness of breath?",
    "Did the pain start with exertion or at rest?",
    "How long does each episode last?",
  ],
  dyspnea: [
    "Is dyspnea worse when lying flat (orthopnea)?",
    "Any paroxysmal nocturnal dyspnea episodes?",
    "Any recent leg swelling or weight gain?",
    "Any cough, wheeze, or chest tightness?",
  ],
  palpitations: [
    "Are palpitations regular or irregular?",
    "Any associated syncope, dizziness, or chest pain?",
    "Trigger: caffeine, stress, or exertion?",
  ],
  default: [
    "What symptom is most bothersome right now?",
    "What makes symptoms better or worse?",
    "Any associated alarming symptoms?",
  ],
}

const COMPLAINT_DIFFERENTIALS: Record<string, string[]> = {
  chest_pain: ["Acute coronary syndrome", "Stable/unstable angina", "GERD or musculoskeletal chest pain"],
  dyspnea: ["Heart failure exacerbation", "Pulmonary edema", "COPD/asthma exacerbation"],
  palpitations: ["Atrial fibrillation", "Supraventricular tachycardia", "Anxiety-related tachycardia"],
  default: ["Cardiovascular etiology", "Respiratory etiology", "Non-cardiac etiology"],
}

const COMPLAINT_ORDERS: Record<string, AiOrderSuggestion[]> = {
  chest_pain: [
    { id: "ecg", label: "12-lead ECG", rationale: "Early ischemia/arrhythmia screening" },
    { id: "troponin", label: "Cardiac Troponin", rationale: "Rule in/out myocardial injury" },
    { id: "cxr", label: "Chest X-ray", rationale: "Assess pulmonary/cardiac causes" },
  ],
  dyspnea: [
    { id: "ecg", label: "12-lead ECG", rationale: "Detect cardiac rhythm/ischemia changes" },
    { id: "bnp", label: "BNP / NT-proBNP", rationale: "Support heart failure assessment" },
    { id: "echo", label: "Echocardiogram", rationale: "Evaluate ventricular/valvular function" },
  ],
  palpitations: [
    { id: "ecg", label: "12-lead ECG", rationale: "Baseline rhythm analysis" },
    { id: "holter", label: "24h Holter Monitor", rationale: "Capture intermittent rhythm events" },
    { id: "tsh", label: "TSH", rationale: "Exclude thyroid-triggered arrhythmia" },
  ],
  default: [
    { id: "ecg", label: "12-lead ECG", rationale: "Baseline cardiac assessment" },
    { id: "cbc", label: "CBC", rationale: "Screen for infection/anemia contributors" },
    { id: "cmp", label: "CMP", rationale: "Evaluate renal/electrolyte status" },
  ],
}

export type ChiefComplaintSectionProps = {
  complaint: string
  onComplaintChange: (value: string) => void
  structuredComplaint: string
  onStructuredComplaintChange: (value: string) => void
}

export function ChiefComplaintSection({
  complaint,
  onComplaintChange,
  structuredComplaint,
  onStructuredComplaintChange,
}: ChiefComplaintSectionProps) {
  const [onset, setOnset] = useState("")
  const [duration, setDuration] = useState("")
  const [severity, setSeverity] = useState("")
  const [character, setCharacter] = useState("")
  const [aggravating, setAggravating] = useState<string[]>([])
  const [relieving, setRelieving] = useState<string[]>([])
  const [showAiAssist, setShowAiAssist] = useState(false)
  const [freeTextInput, setFreeTextInput] = useState("")
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const complaintLabel = useMemo(
    () => CVD_COMPLAINTS.find((c) => c.value === structuredComplaint)?.label ?? "",
    [structuredComplaint],
  )

  const generatedDescription = useMemo(() => {
    if (!complaintLabel) return ""

    const parts = [
      `Patient presents with ${complaintLabel.toLowerCase()}.`,
      onset ? `Onset: ${onset}.` : "",
      duration ? `Duration: ${duration}.` : "",
      severity ? `Severity: ${severity}.` : "",
      character ? `Character: ${character}.` : "",
      aggravating.length ? `Aggravating factors: ${aggravating.join(", ")}.` : "",
      relieving.length ? `Relieving factors: ${relieving.join(", ")}.` : "",
    ].filter(Boolean)

    return parts.join(" ")
  }, [aggravating, character, complaintLabel, duration, onset, relieving, severity])

  const completenessScore = useMemo(() => {
    const fields = [
      structuredComplaint,
      onset,
      duration,
      severity,
      character,
      aggravating.length > 0 ? "1" : "",
      relieving.length > 0 ? "1" : "",
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [structuredComplaint, onset, duration, severity, character, aggravating.length, relieving.length])

  const complaintKey = structuredComplaint || "default"
  const followUps = COMPLAINT_FOLLOW_UPS[complaintKey] ?? COMPLAINT_FOLLOW_UPS.default
  const differentials = COMPLAINT_DIFFERENTIALS[complaintKey] ?? COMPLAINT_DIFFERENTIALS.default
  const suggestedOrders = COMPLAINT_ORDERS[complaintKey] ?? COMPLAINT_ORDERS.default
  const selectedOrders = suggestedOrders.filter((order) => selectedOrderIds.includes(order.id))

  const redFlags = useMemo(() => {
    const flags: string[] = []
    const aggrSet = new Set(aggravating)
    if (structuredComplaint === "chest_pain" && severity === "Severe") {
      flags.push("Severe chest pain needs urgent ischemic risk exclusion.")
    }
    if (structuredComplaint === "chest_pain" && (aggrSet.has("Exertion") || aggrSet.has("Stress"))) {
      flags.push("Exertional/stress-related chest pain pattern can suggest cardiac origin.")
    }
    if (structuredComplaint === "dyspnea" && aggrSet.has("Lying flat")) {
      flags.push("Dyspnea worsening in supine position may indicate heart failure/volume overload.")
    }
    return flags
  }, [structuredComplaint, severity, aggravating])

  const hpiDraft = useMemo(() => {
    if (!complaintLabel) return ""
    const lines = [
      `${complaintLabel} in a patient presenting for cardiovascular evaluation.`,
      onset ? `Onset is ${onset.toLowerCase()}.` : "Onset timing not yet clarified.",
      duration ? `Symptom duration: ${duration}.` : "Duration needs clarification.",
      severity ? `Severity reported as ${severity.toLowerCase()}.` : "Severity not yet documented.",
      character ? `Symptom character: ${character.toLowerCase()}.` : "Characterization pending.",
      aggravating.length > 0 ? `Worsened by ${aggravating.join(", ").toLowerCase()}.` : "No aggravating factors documented.",
      relieving.length > 0 ? `Partially relieved by ${relieving.join(", ").toLowerCase()}.` : "No relieving factors documented.",
      redFlags.length > 0 ? `Red-flag context: ${redFlags.join(" ")}` : "No immediate red-flag pattern detected from available fields.",
    ]
    return lines.join(" ")
  }, [complaintLabel, onset, duration, severity, character, aggravating, relieving, redFlags])

  useEffect(() => {
    if (generatedDescription !== complaint) {
      onComplaintChange(generatedDescription)
    }
  }, [generatedDescription, complaint, onComplaintChange])

  const toggleMultiValue = (values: string[], value: string, setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value))
      return
    }
    setter([...values, value])
  }

  const inferStructuredComplaintFromText = (text: string) => {
    const normalized = text.toLowerCase()
    if (normalized.includes("chest") || normalized.includes("angina")) return "chest_pain"
    if (normalized.includes("dyspnea") || normalized.includes("shortness of breath") || normalized.includes("breath")) return "dyspnea"
    if (normalized.includes("palpitation") || normalized.includes("racing heart")) return "palpitations"
    if (normalized.includes("syncope") || normalized.includes("fainted")) return "syncope"
    if (normalized.includes("edema") || normalized.includes("swelling")) return "edema"
    return "other"
  }

  const runAiExtraction = () => {
    if (!freeTextInput.trim()) return
    const normalized = freeTextInput.toLowerCase()
    onStructuredComplaintChange(inferStructuredComplaintFromText(freeTextInput))
    if (normalized.includes("sudden")) setOnset("Sudden")
    else if (normalized.includes("gradual")) setOnset("Gradual")
    else setOnset("Intermittent")

    if (normalized.includes("week")) setDuration("1 week")
    else if (normalized.includes("day")) setDuration("1-3 days")
    else if (normalized.includes("month") || normalized.includes("chronic")) setDuration("Chronic")
    else setDuration("< 24 hours")

    if (normalized.includes("severe")) setSeverity("Severe")
    else if (normalized.includes("moderate")) setSeverity("Moderate")
    else setSeverity("Mild")

    if (normalized.includes("pressure")) setCharacter("Pressure-like")
    else if (normalized.includes("burn")) setCharacter("Burning")
    else if (normalized.includes("sharp")) setCharacter("Sharp")

    const nextAggravating = AGGRAVATING_OPTIONS.filter((item) => normalized.includes(item.toLowerCase()))
    const nextRelieving = RELIEVING_OPTIONS.filter((item) => normalized.includes(item.toLowerCase()))
    setAggravating(nextAggravating)
    setRelieving(nextRelieving.length > 0 ? nextRelieving : ["Rest"])
  }

  const getFreeText = useCallback(() => freeTextInput, [freeTextInput])
  const setFreeText = useCallback(
    (_key: "freeTextInput", value: string) => setFreeTextInput(value),
    [],
  )

  const getDetailedDesc = useCallback(() => generatedDescription || complaint, [generatedDescription, complaint])
  const setDetailedDesc = useCallback(
    (_key: "detailedDescription", value: string) => onComplaintChange(value),
    [onComplaintChange],
  )

  const {
    supported,
    activeKey,
    interimText,
    audioLevel,
    elapsedSeconds,
    toggle,
  } = useSpeechDictation({
    getText: getFreeText,
    setText: setFreeText,
  })

  const {
    supported: detailedDescSupported,
    activeKey: detailedDescActiveKey,
    interimText: detailedDescInterimText,
    audioLevel: detailedDescAudioLevel,
    elapsedSeconds: detailedDescElapsedSeconds,
    toggle: detailedDescToggle,
  } = useSpeechDictation({
    getText: getDetailedDesc,
    setText: setDetailedDesc,
  })

  const formatElapsedTime = useCallback((totalSeconds: number) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
    const ss = String(totalSeconds % 60).padStart(2, "0")
    return `${mm}:${ss}`
  }, [])

  const freeTextListening = activeKey === "freeTextInput"
  const detailedDescListening = detailedDescActiveKey === "detailedDescription"

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
              <MessageSquareTextIcon className="size-4 text-[#1A5345]" />
            </div>
            <h3 className="font-serif text-[16px] font-bold text-[#102F27]">Chief Complaint</h3>
          </div>
          <div className="flex items-center gap-2">
            {supported ? (
              <span className="text-[12px] text-muted-foreground">Type or use voice dictation</span>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAiAssist((prev) => !prev)}
              className="h-8 gap-1.5 border-[#cfd9d5] bg-white text-[13px] text-[#1A5345] hover:bg-[#E8F0EE]"
            >
              <SparklesIcon className="size-3.5" />
              AI Assist
            </Button>
          </div>
        </div>

        {showAiAssist ? (
          <div className="mb-4 space-y-3 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-[#102F27]">AI Smart Intake</p>
                {supported ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        id="chief-complaint-free-text-mic"
                        variant={freeTextListening ? "secondary" : "ghost"}
                        size="icon-xs"
                        className={
                          freeTextListening
                            ? "shrink-0 text-[#B42318] ring-2 ring-[#B42318]/25"
                            : "shrink-0 text-[#2C6A5B]"
                        }
                        aria-pressed={freeTextListening}
                        aria-label={freeTextListening ? "Stop voice dictation" : "Start voice dictation"}
                        onClick={() => toggle("freeTextInput")}
                      >
                        <MicIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-center">
                      {freeTextListening ? "Stop dictation" : "Voice dictation"}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <Textarea
                id="chief-complaint-free-text"
                value={freeTextInput}
                onChange={(e) => setFreeTextInput(e.target.value)}
                placeholder="Paste patient wording or quick notes, then extract to structured fields..."
                className="min-h-[70px] border-[#E5EEEA] bg-white text-[14px]"
                aria-describedby={freeTextListening && interimText ? "chief-complaint-free-text-interim" : undefined}
              />
              {freeTextListening ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#B42318]">{formatElapsedTime(elapsedSeconds)}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EEF5F3]">
                    <div
                      className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                      style={{ width: `${Math.max(6, audioLevel)}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-muted-foreground">Voice level</span>
                </div>
              ) : null}
              {freeTextListening && interimText ? (
                <p id="chief-complaint-free-text-interim" className="text-[13px] leading-snug text-[#6B7280]">
                  {interimText}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" onClick={runAiExtraction} className="h-7 bg-[#1A5345] px-2.5 text-[13px] hover:bg-[#0F3D32]">
                  Extract
                </Button>
                <span className="text-[12px] text-muted-foreground">Completeness: {completenessScore}%</span>
              </div>
            </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[#E5EEEA] bg-white p-2.5">
              <p className="mb-1 text-[13px] font-bold text-[#102F27]">Follow-up Questions</p>
              <ul className="space-y-1">
                {followUps.map((q) => (
                  <li key={q} className="text-[12px] text-[#102F27]">- {q}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[#E5EEEA] bg-white p-2.5">
              <p className="mb-1 text-[13px] font-bold text-[#102F27]">Differential Starter</p>
              <ul className="space-y-1">
                {differentials.map((d) => (
                  <li key={d} className="text-[12px] text-[#102F27]">- {d}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5EEEA] bg-white p-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#102F27]">
              <ShieldAlertIcon className="size-3.5 text-red-600" />
              Red Flags
            </div>
            {redFlags.length > 0 ? (
              <div className="space-y-1">
                {redFlags.map((flag) => (
                  <div key={flag} className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[12px] text-red-700">
                    <AlertTriangleIcon className="mt-0.5 size-3 shrink-0" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">No urgent red-flag pattern detected from current inputs.</p>
            )}
          </div>

          <div className="rounded-lg border border-[#E5EEEA] bg-white p-2.5">
            <p className="mb-2 text-[13px] font-bold text-[#102F27]">Suggested Orders</p>
            <div className="space-y-1.5">
              {suggestedOrders.map((order) => {
                const selected = selectedOrderIds.includes(order.id)
                return (
                  <div key={order.id} className="flex items-start justify-between gap-2 rounded-md border border-[#E8E6E0] px-2 py-1.5">
                    <div>
                      <p className="text-[13px] font-semibold text-[#102F27]">{order.label}</p>
                      <p className="text-[11.5px] text-muted-foreground">{order.rationale}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrderIds((prev) =>
                          selected ? prev.filter((id) => id !== order.id) : [...prev, order.id]
                        )
                      }}
                      className="h-7 border-[#cfd9d5] text-[12px]"
                    >
                      {selected ? "Dismiss" : "Accept"}
                    </Button>
                  </div>
                )
              })}
            </div>
            {selectedOrders.length > 0 ? (
              <p className="mt-2 text-[12px] text-[#1A5345]">
                <CheckCircle2Icon className="mr-1 inline size-3" />
                Added: {selectedOrders.map((order) => order.label).join(", ")}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-[#E5EEEA] bg-white p-2.5">
            <p className="mb-1 text-[13px] font-bold text-[#102F27]">HPI Draft</p>
            <p className="text-[12.5px] leading-relaxed text-[#102F27]">{hpiDraft || "Select complaint details to generate an HPI draft."}</p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setFreeTextInput(hpiDraft)}
                disabled={!hpiDraft}
                className="h-7 bg-[#1A5345] px-2.5 text-[13px] hover:bg-[#0F3D32]"
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFreeTextInput(hpiDraft)}
                disabled={!hpiDraft}
                className="h-7 border-[#cfd9d5] px-2.5 text-[13px]"
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFreeTextInput("")}
                className="h-7 border-[#cfd9d5] px-2.5 text-[13px]"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[13px] font-semibold text-muted-foreground">Structured Complaint</label>
          <Select value={structuredComplaint} onValueChange={onStructuredComplaintChange}>
            <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
              <SelectValue placeholder="Select primary complaint..." />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
              {CVD_COMPLAINTS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="cursor-pointer text-[14px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[13px] font-semibold text-muted-foreground">Detailed Description</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={onset} onValueChange={setOnset}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] text-[#152a24]">
                <SelectValue placeholder="Onset" />
              </SelectTrigger>
              <SelectContent>
                {ONSET_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] text-[#152a24]">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] text-[#152a24]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={character} onValueChange={setCharacter}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] text-[#152a24]">
                <SelectValue placeholder="Character" />
              </SelectTrigger>
              <SelectContent>
                {CHARACTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 rounded-lg border border-[#E8E6E0] bg-white p-2.5">
            <p className="text-[13px] font-semibold text-muted-foreground">Aggravating factors</p>
            <div className="flex flex-wrap gap-1.5">
              {AGGRAVATING_OPTIONS.map((option) => {
                const active = aggravating.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiValue(aggravating, option, setAggravating)}
                    className={`rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
                      active
                        ? "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-[#FAFAF8] text-[#4B5563] hover:border-[#A8C4BC]"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg border border-[#E8E6E0] bg-white p-2.5">
            <p className="text-[13px] font-semibold text-muted-foreground">Relieving factors</p>
            <div className="flex flex-wrap gap-1.5">
              {RELIEVING_OPTIONS.map((option) => {
                const active = relieving.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiValue(relieving, option, setRelieving)}
                    className={`rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
                      active
                        ? "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                        : "border-[#E8E6E0] bg-[#FAFAF8] text-[#4B5563] hover:border-[#A8C4BC]"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[13px] font-semibold text-muted-foreground" htmlFor="detailed-description">
                Detailed Description
              </label>
              {detailedDescSupported ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      id="detailed-description-mic"
                      variant={detailedDescListening ? "secondary" : "ghost"}
                      size="icon-xs"
                      className={
                        detailedDescListening
                           ? "shrink-0 text-[#B42318] ring-2 ring-[#B42318]/25"
                           : "shrink-0 text-[#2C6A5B]"
                      }
                      aria-pressed={detailedDescListening}
                      aria-label={detailedDescListening ? "Stop voice dictation" : "Start voice dictation"}
                      onClick={() => detailedDescToggle("detailedDescription")}
                    >
                      <MicIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center">
                    {detailedDescListening ? "Stop dictation" : "Voice dictation"}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <Textarea
              id="detailed-description"
              value={generatedDescription || complaint}
              onChange={(e) => onComplaintChange(e.target.value)}
              placeholder="Select complaint options to generate the detailed description."
              className="min-h-[80px] resize-none border-[#E8E6E0] bg-[#FAFAF8] text-[14px] placeholder:text-[#9CA3AF]"
              aria-describedby={detailedDescListening && detailedDescInterimText ? "detailed-description-interim" : undefined}
            />
            {detailedDescListening ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#B42318]">{formatElapsedTime(detailedDescElapsedSeconds)}</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EEF5F3]">
                  <div
                    className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
                    style={{ width: `${Math.max(6, detailedDescAudioLevel)}%` }}
                  />
                </div>
                <span className="text-[12px] text-muted-foreground">Voice level</span>
              </div>
            ) : null}
            {detailedDescListening && detailedDescInterimText ? (
              <p id="detailed-description-interim" className="text-[13px] leading-snug text-[#6B7280]">
                {detailedDescInterimText}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
