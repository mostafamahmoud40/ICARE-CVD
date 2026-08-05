"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ChiefComplaintStructured } from "./consultation.types"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const FIELD_LABEL = "text-sm font-medium text-[#374151]"
const SELECT_TRIGGER =
  "h-10 w-full rounded-xl border-gray-200 bg-white text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
const TEXTAREA_CLASS =
  "min-h-[88px] resize-none rounded-xl border-gray-200 bg-white text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"

function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <h3 className="font-serif text-[17px] font-bold tracking-tight text-[#1A1F1E]">{label}</h3>
      </div>
      {action}
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {children}
    </label>
  )
}

function ChipToggleGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className={FIELD_LABEL}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "border-[#1A5345] bg-[#1A534518] text-[#1A5345]"
                  : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC] hover:bg-[#F9F8F5]",
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VoiceMicButton({
  id,
  listening,
  supported,
  onToggle,
}: {
  id: string
  listening: boolean
  supported: boolean
  onToggle: () => void
}) {
  if (!supported) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 border-0 bg-transparent shadow-none hover:bg-transparent",
            listening ? "text-red-600" : "text-muted-foreground hover:text-[#1A5345]",
          )}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
          onClick={onToggle}
        >
          <MicIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center">
        {listening ? "Stop dictation" : "Voice dictation"}
      </TooltipContent>
    </Tooltip>
  )
}

function VoiceLevelBar({
  listening,
  elapsedSeconds,
  audioLevel,
  interimText,
  interimId,
  formatElapsedTime,
}: {
  listening: boolean
  elapsedSeconds: number
  audioLevel: number
  interimText: string | null
  interimId: string
  formatElapsedTime: (s: number) => string
}) {
  if (!listening) return null
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold tabular-nums text-red-600">{formatElapsedTime(elapsedSeconds)}</span>
        <div className="h-1 w-20 overflow-hidden rounded-full bg-[#E8E6E0]/60">
          <div
            className="h-full rounded-full bg-[#1A5345] transition-all duration-150"
            style={{ width: `${Math.max(6, audioLevel)}%` }}
          />
        </div>
      </div>
      {interimText ? (
        <p id={interimId} className="text-[12px] leading-snug text-[#6B7870]">
          {interimText}
        </p>
      ) : null}
    </div>
  )
}

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

const ASSOCIATED_SYMPTOMS_BY_COMPLAINT: Record<string, readonly string[]> = {
  chest_pain: [
    "Dyspnea",
    "Diaphoresis",
    "Nausea",
    "Vomiting",
    "Palpitations",
    "Syncope",
    "Dizziness",
    "Jaw pain",
    "Arm pain",
  ],
  dyspnea: [
    "Chest pain",
    "Cough",
    "Wheezing",
    "Orthopnea",
    "Leg swelling",
    "Palpitations",
    "Fatigue",
    "Fever",
  ],
  palpitations: [
    "Chest pain",
    "Dyspnea",
    "Dizziness",
    "Syncope",
    "Anxiety",
    "Diaphoresis",
    "Weakness",
  ],
  syncope: [
    "Chest pain",
    "Palpitations",
    "Dyspnea",
    "Nausea",
    "Headache",
    "Weakness",
    "Confusion",
  ],
  fatigue: ["Dyspnea", "Chest pain", "Palpitations", "Dizziness", "Leg swelling", "Orthopnea"],
  edema: ["Dyspnea", "Orthopnea", "Weight gain", "Fatigue", "Abdominal distension"],
  dizziness: ["Palpitations", "Chest pain", "Dyspnea", "Nausea", "Syncope", "Headache"],
  default: [
    "Dyspnea",
    "Chest pain",
    "Palpitations",
    "Dizziness",
    "Nausea",
    "Diaphoresis",
    "Fatigue",
    "Syncope",
  ],
}

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
  structured: ChiefComplaintStructured
  onStructuredChange: (value: ChiefComplaintStructured) => void
}

export function ChiefComplaintSection({
  complaint,
  onComplaintChange,
  structured,
  onStructuredChange,
}: ChiefComplaintSectionProps) {
  const patchStructured = useCallback(
    (patch: Partial<ChiefComplaintStructured>) => {
      onStructuredChange({ ...structured, ...patch })
    },
    [onStructuredChange, structured],
  )

  const [showAiAssist, setShowAiAssist] = useState(false)
  const [freeTextInput, setFreeTextInput] = useState("")
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const structuredComplaint = structured.primaryComplaint
  const onset = structured.onset
  const duration = structured.duration
  const severity = structured.severity
  const character = structured.character
  const aggravating = structured.aggravating
  const relieving = structured.relieving
  const associatedSymptoms = structured.associatedSymptoms
  const otherComplaintDetail = structured.otherComplaintDetail

  const complaintLabel = useMemo(() => {
    if (structuredComplaint === "other") {
      const detail = otherComplaintDetail.trim()
      return detail || "Other"
    }
    return CVD_COMPLAINTS.find((c) => c.value === structuredComplaint)?.label ?? ""
  }, [structuredComplaint, otherComplaintDetail])

  const isOtherComplaint = structuredComplaint === "other"

  const associatedOptions = useMemo(
    () => ASSOCIATED_SYMPTOMS_BY_COMPLAINT[structuredComplaint] ?? ASSOCIATED_SYMPTOMS_BY_COMPLAINT.default,
    [structuredComplaint],
  )

  const generatedDescription = useMemo(() => {
    if (!structuredComplaint) return ""
    if (!complaintLabel) return ""

    const subject =
      isOtherComplaint && otherComplaintDetail.trim()
        ? otherComplaintDetail.trim()
        : complaintLabel.toLowerCase()

    const parts = [
      `Patient presents with ${subject}.`,
      onset ? `Onset: ${onset}.` : "",
      duration ? `Duration: ${duration}.` : "",
      severity ? `Severity: ${severity}.` : "",
      !isOtherComplaint && character ? `Character: ${character}.` : "",
      !isOtherComplaint && aggravating.length ? `Aggravating factors: ${aggravating.join(", ")}.` : "",
      !isOtherComplaint && relieving.length ? `Relieving factors: ${relieving.join(", ")}.` : "",
      associatedSymptoms.length ? `Associated symptoms: ${associatedSymptoms.join(", ")}.` : "",
    ].filter(Boolean)

    return parts.join(" ")
  }, [
    aggravating,
    associatedSymptoms,
    character,
    complaintLabel,
    duration,
    isOtherComplaint,
    onset,
    otherComplaintDetail,
    relieving,
    severity,
    structuredComplaint,
  ])

  const completenessScore = useMemo(() => {
    if (isOtherComplaint) {
      const fields = [
        otherComplaintDetail.trim(),
        onset,
        duration,
        severity,
        associatedSymptoms.length > 0 ? "1" : "",
      ]
      const filled = fields.filter(Boolean).length
      return Math.round((filled / fields.length) * 100)
    }

    const fields = [
      structuredComplaint,
      onset,
      duration,
      severity,
      character,
      aggravating.length > 0 ? "1" : "",
      relieving.length > 0 ? "1" : "",
      associatedSymptoms.length > 0 ? "1" : "",
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [
    structuredComplaint,
    isOtherComplaint,
    otherComplaintDetail,
    onset,
    duration,
    severity,
    character,
    aggravating.length,
    relieving.length,
    associatedSymptoms.length,
  ])

  const complaintKey = structuredComplaint || "default"
  const followUps = COMPLAINT_FOLLOW_UPS[complaintKey] ?? COMPLAINT_FOLLOW_UPS.default
  const differentials = COMPLAINT_DIFFERENTIALS[complaintKey] ?? COMPLAINT_DIFFERENTIALS.default
  const suggestedOrders = COMPLAINT_ORDERS[complaintKey] ?? COMPLAINT_ORDERS.default
  const selectedOrders = suggestedOrders.filter((order) => selectedOrderIds.includes(order.id))

  const redFlags = useMemo(() => {
    const flags: string[] = []
    const aggrSet = new Set(aggravating)
    const assocSet = new Set(associatedSymptoms)
    if (structuredComplaint === "chest_pain" && severity === "Severe") {
      flags.push("Severe chest pain needs urgent ischemic risk exclusion.")
    }
    if (structuredComplaint === "chest_pain" && (aggrSet.has("Exertion") || aggrSet.has("Stress"))) {
      flags.push("Exertional/stress-related chest pain pattern can suggest cardiac origin.")
    }
    if (
      structuredComplaint === "chest_pain" &&
      (assocSet.has("Diaphoresis") || assocSet.has("Nausea") || assocSet.has("Dyspnea"))
    ) {
      flags.push("Associated diaphoresis, nausea, or dyspnea may indicate acute coronary syndrome.")
    }
    if (structuredComplaint === "dyspnea" && aggrSet.has("Lying flat")) {
      flags.push("Dyspnea worsening in supine position may indicate heart failure/volume overload.")
    }
    if (assocSet.has("Syncope")) {
      flags.push("Syncope as an associated symptom warrants urgent cardiovascular evaluation.")
    }
    return flags
  }, [structuredComplaint, severity, aggravating, associatedSymptoms])

  const hpiDraft = useMemo(() => {
    if (!structuredComplaint) return ""
    const lines = [
      isOtherComplaint && otherComplaintDetail.trim()
        ? `${otherComplaintDetail.trim()} — patient presenting for cardiovascular evaluation.`
        : `${complaintLabel} in a patient presenting for cardiovascular evaluation.`,
      onset ? `Onset is ${onset.toLowerCase()}.` : "Onset timing not yet clarified.",
      duration ? `Symptom duration: ${duration}.` : "Duration needs clarification.",
      severity ? `Severity reported as ${severity.toLowerCase()}.` : "Severity not yet documented.",
      !isOtherComplaint && character ? `Symptom character: ${character.toLowerCase()}.` : null,
      !isOtherComplaint && aggravating.length > 0
        ? `Worsened by ${aggravating.join(", ").toLowerCase()}.`
        : !isOtherComplaint
          ? "No aggravating factors documented."
          : null,
      !isOtherComplaint && relieving.length > 0
        ? `Partially relieved by ${relieving.join(", ").toLowerCase()}.`
        : !isOtherComplaint
          ? "No relieving factors documented."
          : null,
      associatedSymptoms.length > 0
        ? `Associated symptoms include ${associatedSymptoms.join(", ").toLowerCase()}.`
        : "No associated symptoms documented.",
      redFlags.length > 0 ? `Red-flag context: ${redFlags.join(" ")}` : "No immediate red-flag pattern detected from available fields.",
    ].filter(Boolean)
    return lines.join(" ")
  }, [
    structuredComplaint,
    isOtherComplaint,
    otherComplaintDetail,
    complaintLabel,
    onset,
    duration,
    severity,
    character,
    aggravating,
    relieving,
    associatedSymptoms,
    redFlags,
  ])

  useEffect(() => {
    if (structuredComplaint !== "other" && otherComplaintDetail) {
      patchStructured({ otherComplaintDetail: "" })
    }
  }, [structuredComplaint, otherComplaintDetail, patchStructured])

  useEffect(() => {
    if (generatedDescription !== complaint) {
      onComplaintChange(generatedDescription)
    }
  }, [generatedDescription, complaint, onComplaintChange])

  useEffect(() => {
    const next = associatedSymptoms.filter((symptom) => associatedOptions.includes(symptom))
    if (next.length !== associatedSymptoms.length) {
      patchStructured({ associatedSymptoms: next })
    }
  }, [associatedOptions, associatedSymptoms, patchStructured])

  const toggleMultiValue = (
    values: string[],
    value: string,
    key: "aggravating" | "relieving" | "associatedSymptoms",
  ) => {
    const next = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value]
    patchStructured({ [key]: next })
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
    const inferredComplaint = inferStructuredComplaintFromText(freeTextInput)

    const next: ChiefComplaintStructured = {
      ...structured,
      primaryComplaint: inferredComplaint,
      otherComplaintDetail:
        inferredComplaint === "other" ? freeTextInput.trim() : "",
      onset: normalized.includes("sudden")
        ? "Sudden"
        : normalized.includes("gradual")
          ? "Gradual"
          : "Intermittent",
      duration: normalized.includes("week")
        ? "1 week"
        : normalized.includes("day")
          ? "1-3 days"
          : normalized.includes("month") || normalized.includes("chronic")
            ? "Chronic"
            : "< 24 hours",
      severity: normalized.includes("severe")
        ? "Severe"
        : normalized.includes("moderate")
          ? "Moderate"
          : "Mild",
      character:
        inferredComplaint === "other"
          ? ""
          : normalized.includes("pressure")
            ? "Pressure-like"
            : normalized.includes("burn")
              ? "Burning"
              : normalized.includes("sharp")
                ? "Sharp"
                : structured.character,
      aggravating:
        inferredComplaint === "other"
          ? []
          : AGGRAVATING_OPTIONS.filter((item) => normalized.includes(item.toLowerCase())),
      relieving:
        inferredComplaint === "other"
          ? []
          : (() => {
              const matched = RELIEVING_OPTIONS.filter((item) =>
                normalized.includes(item.toLowerCase()),
              )
              return matched.length > 0 ? matched : ["Rest"]
            })(),
      associatedSymptoms: (() => {
        const assocOptions =
          ASSOCIATED_SYMPTOMS_BY_COMPLAINT[inferredComplaint] ??
          ASSOCIATED_SYMPTOMS_BY_COMPLAINT.default
        return assocOptions.filter((item) => normalized.includes(item.toLowerCase()))
      })(),
    }

    onStructuredChange(next)
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
    <div className={SECTION_CARD}>
      <SectionHeader
        icon={MessageSquareTextIcon}
        label="Chief complaint"
        action={
          <div className="flex items-center gap-2">
            {structuredComplaint ? (
              <span className="rounded-full bg-[#1A534518] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-[#1A5345]">
                {completenessScore}% complete
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={showAiAssist ? "default" : "outline"}
              onClick={() => setShowAiAssist((prev) => !prev)}
              className={cn(
                "h-8 gap-1.5 rounded-xl text-[12px] font-semibold",
                showAiAssist
                  ? "bg-[#1A5345] text-white hover:bg-[#154434]"
                  : "border-[#E8E6E0] bg-white text-[#1A5345] hover:bg-[#F9F8F5]",
              )}
            >
              <SparklesIcon className="size-3.5" />
              AI assist
            </Button>
          </div>
        }
      />

      {showAiAssist ? (
        <div className="mb-4 space-y-3 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#1A5345]">Smart intake</p>
              <VoiceMicButton
                id="chief-complaint-free-text-mic"
                listening={freeTextListening}
                supported={supported}
                onToggle={() => toggle("freeTextInput")}
              />
            </div>
            <Textarea
              id="chief-complaint-free-text"
              value={freeTextInput}
              onChange={(e) => setFreeTextInput(e.target.value)}
              placeholder="Paste patient wording or quick notes, then extract to structured fields…"
              className={TEXTAREA_CLASS}
              aria-describedby={freeTextListening && interimText ? "chief-complaint-free-text-interim" : undefined}
            />
            <VoiceLevelBar
              listening={freeTextListening}
              elapsedSeconds={elapsedSeconds}
              audioLevel={audioLevel}
              interimText={interimText}
              interimId="chief-complaint-free-text-interim"
              formatElapsedTime={formatElapsedTime}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={runAiExtraction}
                className="h-8 rounded-xl bg-[#1A5345] px-3 text-[12px] font-semibold hover:bg-[#154434]"
              >
                Extract to fields
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E8E6E0]/50 bg-white p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6B7870]">Follow-up questions</p>
              <ul className="space-y-1.5">
                {followUps.map((q) => (
                  <li key={q} className="text-[12px] leading-snug text-[#1A1F1E]">
                    · {q}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#E8E6E0]/50 bg-white p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6B7870]">Differential starter</p>
              <ul className="space-y-1.5">
                {differentials.map((d) => (
                  <li key={d} className="text-[12px] leading-snug text-[#1A1F1E]">
                    · {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/50 bg-white p-3">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1A1F1E]">
              <ShieldAlertIcon className="size-4 text-red-600" aria-hidden />
              Red flags
            </div>
            {redFlags.length > 0 ? (
              <div className="space-y-1.5">
                {redFlags.map((flag) => (
                  <div
                    key={flag}
                    className="flex items-start gap-2 rounded-lg border border-red-200/50 bg-red-50/60 px-2.5 py-2 text-[12px] text-red-800"
                  >
                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#6B7870]">No urgent red-flag pattern from current inputs.</p>
            )}
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/50 bg-white p-3">
            <p className="mb-2 text-sm font-bold text-[#1A1F1E]">Suggested orders</p>
            <div className="space-y-2">
              {suggestedOrders.map((order) => {
                const selected = selectedOrderIds.includes(order.id)
                return (
                  <div
                    key={order.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-[#E8E6E0]/50 bg-[#F9F8F5]/40 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1F1E]">{order.label}</p>
                      <p className="text-[11px] text-[#6B7870]">{order.rationale}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrderIds((prev) =>
                          selected ? prev.filter((id) => id !== order.id) : [...prev, order.id],
                        )
                      }}
                      className="h-7 shrink-0 rounded-lg border-[#E8E6E0] text-[11px] font-semibold"
                    >
                      {selected ? "Remove" : "Add"}
                    </Button>
                  </div>
                )
              })}
            </div>
            {selectedOrders.length > 0 ? (
              <p className="mt-2 text-[12px] font-medium text-[#1A5345]">
                <CheckCircle2Icon className="mr-1 inline size-3.5" aria-hidden />
                Added: {selectedOrders.map((order) => order.label).join(", ")}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/50 bg-white p-3">
            <p className="mb-1 text-sm font-bold text-[#1A1F1E]">HPI draft</p>
            <p className="text-[12px] leading-relaxed text-[#374151]">
              {hpiDraft || "Select complaint details to generate an HPI draft."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onComplaintChange(hpiDraft)}
                disabled={!hpiDraft}
                className="h-7 rounded-lg bg-[#1A5345] px-2.5 text-[12px] hover:bg-[#154434]"
              >
                Use draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFreeTextInput("")}
                className="h-7 rounded-lg border-[#E8E6E0] px-2.5 text-[12px]"
              >
                Clear intake
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <FieldLabel>Primary complaint</FieldLabel>
          <Select
            value={structuredComplaint}
            onValueChange={(value) => patchStructured({ primaryComplaint: value })}
          >
            <SelectTrigger className={SELECT_TRIGGER}>
              <SelectValue placeholder="Select primary complaint…" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
              {CVD_COMPLAINTS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="h-10 cursor-pointer text-[14px]">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {structuredComplaint ? (
          isOtherComplaint ? (
            <div className="space-y-4 rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/40 p-4">
              <p className="text-sm font-bold text-[#1A5345]">Other complaint details</p>
              <p className="text-[12px] leading-relaxed text-[#6B7870]">
                Describe the symptom in the patient&apos;s words — no cardiac OPQRST template for custom complaints.
              </p>

              <div className="space-y-1.5">
                <FieldLabel htmlFor="other-complaint-detail">
                  Describe the complaint <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="other-complaint-detail"
                  value={otherComplaintDetail}
                  onChange={(e) => patchStructured({ otherComplaintDetail: e.target.value })}
                  placeholder="e.g. Recurrent headaches, skin rash, joint stiffness…"
                  className="h-10 rounded-xl border-gray-200 bg-white text-[14px] focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { value: onset, onChange: (v: string) => patchStructured({ onset: v }), placeholder: "Onset", options: ONSET_OPTIONS },
                    { value: duration, onChange: (v: string) => patchStructured({ duration: v }), placeholder: "Duration", options: DURATION_OPTIONS },
                    { value: severity, onChange: (v: string) => patchStructured({ severity: v }), placeholder: "Severity", options: SEVERITY_OPTIONS },
                  ] as const
                ).map((field) => (
                  <div key={field.placeholder} className="space-y-1.5">
                    <FieldLabel>{field.placeholder}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder={`Select ${field.placeholder.toLowerCase()}…`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option} className="cursor-pointer">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <ChipToggleGroup
                label="Associated symptoms"
                options={associatedOptions}
                selected={associatedSymptoms}
                onToggle={(option) => toggleMultiValue(associatedSymptoms, option, "associatedSymptoms")}
              />
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/40 p-4">
              <p className="text-sm font-bold text-[#1A5345]">Symptom details (OPQRST)</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: onset, onChange: (v: string) => patchStructured({ onset: v }), placeholder: "Onset", options: ONSET_OPTIONS },
                    { value: duration, onChange: (v: string) => patchStructured({ duration: v }), placeholder: "Duration", options: DURATION_OPTIONS },
                    { value: severity, onChange: (v: string) => patchStructured({ severity: v }), placeholder: "Severity", options: SEVERITY_OPTIONS },
                    { value: character, onChange: (v: string) => patchStructured({ character: v }), placeholder: "Character", options: CHARACTER_OPTIONS },
                  ] as const
                ).map((field) => (
                  <div key={field.placeholder} className="space-y-1.5">
                    <FieldLabel>{field.placeholder}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder={`Select ${field.placeholder.toLowerCase()}…`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#E8E6E0] bg-white">
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option} className="cursor-pointer">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <ChipToggleGroup
                label="Aggravating factors"
                options={AGGRAVATING_OPTIONS}
                selected={aggravating}
                onToggle={(option) => toggleMultiValue(aggravating, option, "aggravating")}
              />

              <ChipToggleGroup
                label="Relieving factors"
                options={RELIEVING_OPTIONS}
                selected={relieving}
                onToggle={(option) => toggleMultiValue(relieving, option, "relieving")}
              />

              <ChipToggleGroup
                label="Associated symptoms"
                options={associatedOptions}
                selected={associatedSymptoms}
                onToggle={(option) => toggleMultiValue(associatedSymptoms, option, "associatedSymptoms")}
              />
            </div>
          )
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="detailed-description">Clinical narrative</FieldLabel>
            <VoiceMicButton
              id="detailed-description-mic"
              listening={detailedDescListening}
              supported={detailedDescSupported}
              onToggle={() => detailedDescToggle("detailedDescription")}
            />
          </div>
          <Textarea
            id="detailed-description"
            value={generatedDescription || complaint}
            onChange={(e) => onComplaintChange(e.target.value)}
            placeholder="Structured fields build this narrative automatically — edit or dictate freely."
            className={TEXTAREA_CLASS}
            aria-describedby={
              detailedDescListening && detailedDescInterimText ? "detailed-description-interim" : undefined
            }
          />
          <VoiceLevelBar
            listening={detailedDescListening}
            elapsedSeconds={detailedDescElapsedSeconds}
            audioLevel={detailedDescAudioLevel}
            interimText={detailedDescInterimText}
            interimId="detailed-description-interim"
            formatElapsedTime={formatElapsedTime}
          />
        </div>
      </div>
    </div>
  )
}
