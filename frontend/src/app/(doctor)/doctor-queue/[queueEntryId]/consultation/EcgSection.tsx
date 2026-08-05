"use client"

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  BotIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  FileIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  SendHorizontalIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── types ───────────────────────────────────────────────────────────────────

type AnalysisStatus = "idle" | "processing" | "done" | "error"

interface BeatProbs {
  N: number
  S: number
  V: number
  F: number
  Q: number
}

interface BeatResult {
  beat: number
  class: string
  label: string
  color: string
  suspicious: boolean
  confidence: number
  probs: BeatProbs
  waveform: number[]
  waveform_min: number
  waveform_max: number
}

interface SummaryEntry {
  class: string
  label: string
  color: string
  count: number
  pct: number
}

interface EcgMeta {
  record: string
  fs: number
  leads: string[]
  used_lead: string
  total_samples: number
  duration_sec: number
  r_peaks_found: number
  valid_beats: number
  suspicious_beats: number
  normal_beats: number
}

interface EcgResult {
  meta: EcgMeta
  beats: BeatResult[]
  summary: SummaryEntry[]
}

interface EcgReport {
  overall_assessment: string
  risk_level: "Low" | "Moderate" | "High"
  findings: string[]
  recommendations: string[]
  clinical_notes: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

const ECG_CHAT_SUGGESTIONS = [
  "Summarize the arrhythmia pattern",
  "Which beats need urgent review?",
  "Explain the clinical significance for CVD",
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatElapsed(sec: number): string {
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function waveformToPath(waveform: number[]): string {
  if (!waveform.length) return ""
  const W = 140
  const H = 40
  const min = Math.min(...waveform)
  const max = Math.max(...waveform)
  const range = max - min || 1
  return waveform
    .map((v, i) => {
      const x = (i / (waveform.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 4) - 2
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

const ECG_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ECG_SERVICE_URL ?? "http://localhost:5050")
    : "http://localhost:5050"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const RESULT_SECTION =
  "overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm"
const SECTION_TITLE = "font-serif text-[16px] font-bold text-[#1A1F1E]"
const SECTION_LABEL = "text-[13px] font-semibold text-[#6B7870]"
const SECTION_LABEL_ACCENT = "text-[13px] font-semibold text-[#1A5345]"

// ─── sub-components ──────────────────────────────────────────────────────────

function EcgUploadZone({
  heaFile,
  datFile,
  onHeaSelected,
  onDatSelected,
}: {
  heaFile: File | null
  datFile: File | null
  onHeaSelected: (f: File) => void
  onDatSelected: (f: File) => void
}) {
  const heaRef = useRef<HTMLInputElement>(null)
  const datRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (files: FileList | null) => {
      if (!files) return
      Array.from(files).forEach((file) => {
        if (file.name.endsWith(".hea")) onHeaSelected(file)
        if (file.name.endsWith(".dat")) onDatSelected(file)
      })
    },
    [onHeaSelected, onDatSelected],
  )

  const allUploaded = heaFile && datFile

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload ECG signal files"
        onKeyDown={(e) => e.key === "Enter" && heaRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleDrop(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-default flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
          isDragging
            ? "border-[#1A5345]/50 bg-[#F0F7F4]"
            : "border-[#E8E6E0] bg-[#FAFAF8] hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]",
        )}
      >
        <UploadCloudIcon
          className={cn("size-8", isDragging ? "text-[#1A5345]" : "text-[#1A5345]/80")}
          aria-hidden
        />
        <div className="text-center">
          <p className="text-[14px] font-medium text-[#1A1F1E]">
            Drop ECG files here or browse below
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Requires both{" "}
            <span className="font-medium">.hea</span> (header) and{" "}
            <span className="font-medium">.dat</span> (signal) — MIT-BIH / PhysioNet format
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => heaRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
              heaFile
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#E8E6E0] bg-white text-[#1A5345] hover:bg-[#F9F8F5]",
            )}
          >
            {heaFile ? <CheckCircle2Icon className="size-3.5" /> : <FileIcon className="size-3.5" />}
            {heaFile ? heaFile.name : "Select .hea"}
          </button>
          <button
            type="button"
            onClick={() => datRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
              datFile
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#E8E6E0] bg-white text-[#1A5345] hover:bg-[#F9F8F5]",
            )}
          >
            {datFile ? <CheckCircle2Icon className="size-3.5" /> : <FileIcon className="size-3.5" />}
            {datFile ? datFile.name : "Select .dat"}
          </button>
        </div>

        {allUploaded && (
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-emerald-500"
          >
            Both files ready
          </Badge>
        )}
      </div>

      <input
        ref={heaRef}
        type="file"
        accept=".hea"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onHeaSelected(f) }}
      />
      <input
        ref={datRef}
        type="file"
        accept=".dat"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onDatSelected(f) }}
      />
    </div>
  )
}

function FileRow({
  label,
  file,
  status,
  elapsed,
  onRemove,
}: {
  label: string
  file: File
  status: AnalysisStatus
  elapsed: number
  onRemove: () => void
}) {
  const statusMap = {
    idle:       { badge: "",                                icon: null,              label: "" },
    processing: { badge: "bg-amber-500 text-white hover:bg-amber-500", icon: Loader2Icon, label: "Analyzing" },
    done:       { badge: "bg-emerald-500 text-white hover:bg-emerald-500", icon: CheckCircle2Icon, label: "Done" },
    error:      { badge: "bg-rose-500 text-white hover:bg-rose-500", icon: XCircleIcon, label: "Failed" },
  }
  const cfg = statusMap[status]
  const Icon = cfg.icon
  const labelBadge =
    label === ".hea"
      ? "bg-blue-500 text-white hover:bg-blue-500"
      : "bg-violet-500 text-white hover:bg-violet-500"

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
        <FileIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", labelBadge)}
            >
              {label}
            </Badge>
            <p className="truncate text-[14px] font-semibold text-[#1A1F1E]">{file.name}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted-foreground">{formatBytes(file.size)}</span>
            {status === "processing" && elapsed > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <ClockIcon className="size-3" aria-hidden />
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <Badge
            variant="default"
            className={cn("gap-1 rounded-lg border-0 px-2.5 py-1 text-[11px] font-bold shadow-none", cfg.badge)}
          >
            <Icon className={cn("size-3", status === "processing" && "animate-spin")} aria-hidden />
            {cfg.label}
          </Badge>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={status === "processing"}
          className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-rose-600"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function BeatWaveform({ waveform, color }: { waveform: number[]; color: string }) {
  const path = waveformToPath(waveform)
  return (
    <svg
      viewBox="0 0 140 40"
      className="h-10 w-[88px] shrink-0 rounded-lg bg-[#F9F8F5] p-1"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummaryStats({ meta, summary }: { meta: EcgMeta; summary: SummaryEntry[] }) {
  const riskLevel =
    meta.suspicious_beats === 0
      ? {
          label: "Normal rhythm",
          badge: "bg-emerald-500 text-white hover:bg-emerald-500",
          title: "No arrhythmia flagged",
        }
      : meta.suspicious_beats / meta.valid_beats > 0.2
        ? {
            label: "High concern",
            badge: "bg-red-500 text-white hover:bg-red-500",
            title: "Significant arrhythmia pattern",
          }
        : {
            label: "Needs review",
            badge: "bg-amber-500 text-white hover:bg-amber-500",
            title: "Some beats need review",
          }

  const topStats = [
    { label: "Total beats", value: String(meta.valid_beats), hint: "Detected in recording" },
    {
      label: "Normal",
      value: String(meta.normal_beats),
      hint: `${((meta.normal_beats / meta.valid_beats) * 100).toFixed(0)}% of all beats`,
      valueClass: "text-emerald-700",
    },
    {
      label: "Suspicious",
      value: String(meta.suspicious_beats),
      hint: `${((meta.suspicious_beats / meta.valid_beats) * 100).toFixed(0)}% of all beats`,
      valueClass: meta.suspicious_beats > 0 ? "text-red-700" : "text-emerald-700",
    },
    {
      label: "Duration",
      value: `${meta.duration_sec}s`,
      hint: `Lead ${meta.used_lead} · ${meta.fs} Hz`,
      valueClass: "text-[#1A5345]",
    },
  ]

  return (
    <div className={cn(RESULT_SECTION, "space-y-4 p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAFAF8] px-4 py-3.5 shadow-sm">
        <div className="min-w-0">
          <p className={SECTION_LABEL}>Overall assessment</p>
          <p className="mt-1 font-serif text-[18px] font-bold leading-snug text-[#1A1F1E] sm:text-[20px]">
            {riskLevel.title}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            ECGTransForm · {meta.record} · {meta.valid_beats} beats classified
          </p>
        </div>
        <Badge
          variant="default"
          className={cn("shrink-0 rounded-lg border-0 px-3 py-1.5 text-[12px] font-bold shadow-none", riskLevel.badge)}
        >
          {riskLevel.label}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {topStats.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#FAFAF8] px-4 py-3.5 shadow-sm">
            <p className={SECTION_LABEL}>{s.label}</p>
            <p className={cn("mt-2 font-serif text-[20px] font-bold tabular-nums leading-none text-[#1A1F1E]", s.valueClass)}>
              {s.value}
            </p>
            <p className="mt-2 text-[12px] font-medium leading-snug text-[#6B7870]">{s.hint}</p>
          </div>
        ))}
      </div>

      {summary.length > 0 && (
        <div>
          <p className={SECTION_LABEL}>Class breakdown</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {summary.map((s) => (
              <div
                key={s.class}
                className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate text-[14px] font-bold text-[#1A1F1E]">{s.label}</span>
                  </div>
                  <Badge
                    variant="default"
                    className="shrink-0 rounded-lg border-0 px-2 py-0.5 text-[11px] font-bold shadow-none"
                    style={{ backgroundColor: s.color, color: "white" }}
                  >
                    {s.class}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="font-serif text-[28px] font-bold tabular-nums leading-none text-[#1A1F1E]">
                    {s.pct}%
                  </p>
                  <p className="text-[13px] font-semibold text-[#6B7870]">
                    {s.count} beat{s.count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E6E0]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BeatList({ beats }: { beats: BeatResult[] }) {
  const [showAll, setShowAll] = useState(false)
  const suspicious = beats.filter((b) => b.suspicious)
  const shown = showAll ? beats : suspicious.slice(0, 10)
  const label = showAll ? "Show suspicious only" : `Show all ${beats.length} beats`

  if (beats.length === 0) return null

  return (
    <div className={cn(RESULT_SECTION, "p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6E0]/40 pb-4">
        <div>
          <p className={SECTION_TITLE}>
            {showAll ? `All beats (${beats.length})` : `Suspicious beats (${suspicious.length})`}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {showAll
              ? "Every classified beat with waveform preview and confidence."
              : "Beats flagged as non-normal — review before signing off."}
          </p>
        </div>
        {(suspicious.length > 0 || showAll) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="h-9 gap-1.5 rounded-lg border-[#E8E6E0] text-[13px] font-semibold text-[#1A5345]"
          >
            {label}
            <ChevronDownIcon className={cn("size-4 transition-transform", showAll && "rotate-180")} />
          </Button>
        )}
      </div>

      {shown.length === 0 && (
        <div className="mt-4 rounded-xl bg-[#F9F8F5] px-4 py-10 text-center shadow-sm">
          <CheckCircle2Icon className="mx-auto size-8 text-emerald-500" aria-hidden />
          <p className="mt-3 font-serif text-[16px] font-bold text-emerald-800">No suspicious beats detected</p>
          <p className="mt-1 text-[14px] text-muted-foreground">All {beats.length} beats classified as normal.</p>
        </div>
      )}

      <div className="scrollbar-hide mt-4 max-h-[28rem] space-y-2.5 overflow-y-auto pr-1">
        {shown.map((beat) => (
          <div
            key={beat.beat}
            className={cn(
              "flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center",
              beat.suspicious && "shadow-md",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F9F8F5] text-[13px] font-bold tabular-nums text-[#1A5345]">
                #{beat.beat + 1}
              </span>
              <BeatWaveform waveform={beat.waveform} color={beat.color} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="default"
                    className="rounded-lg border-0 px-2.5 py-0.5 text-[11px] font-bold shadow-none"
                    style={{ backgroundColor: beat.color, color: "white" }}
                  >
                    {beat.class}
                  </Badge>
                  <span className="text-[15px] font-bold text-[#1A1F1E]">{beat.label}</span>
                  {beat.suspicious && (
                    <AlertTriangleIcon className="size-4 text-amber-600" aria-hidden />
                  )}
                </div>
                <p className="mt-1.5 text-[14px] text-[#374151]">
                  Confidence{" "}
                  <span className="font-bold tabular-nums text-[#1A1F1E]">{beat.confidence}%</span>
                </p>
              </div>
            </div>

            <div className="flex min-w-[9rem] flex-col gap-1.5 rounded-lg bg-[#FAFAF8] px-3 py-2 sm:shrink-0">
              <p className={SECTION_LABEL}>Top probabilities</p>
              {(Object.entries(beat.probs) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cls, pct]) => (
                  <div key={cls} className="flex items-center gap-2">
                    <span className="w-4 text-[12px] font-bold text-[#1A1F1E]">{cls}</span>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: beat.color }}
                      />
                    </div>
                    <span className="w-9 text-right text-[12px] font-bold tabular-nums text-[#1A1F1E]">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
      <div className="flex items-start gap-3">
        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-rose-800">Analysis failed</p>
          <p className="mt-1 text-[12px] text-rose-700">{message}</p>
          <p className="mt-2 text-[12px] text-rose-600/90">
            Make sure the ECG ML service is running at{" "}
            <span className="font-mono font-medium">{ECG_URL}</span>
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 rounded-lg border-rose-200 bg-white text-[12px] text-rose-700 hover:bg-rose-50"
        >
          Retry
        </Button>
      </div>
    </div>
  )
}

// ─── clinical text highlighting ──────────────────────────────────────────────

type ClinicalTone = "good" | "bad"

type ToneSpan = { start: number; end: number; tone: ClinicalTone }

const CLINICAL_BAD_PHRASES = [
  "complete absence of normal",
  "absence of normal",
  "abnormal beats",
  "abnormal beat",
  "classified as abnormal",
  "ventricular origin",
  "ventricular",
  "supraventricular",
  "arrhythmia",
  "suspicious",
  "no normal sinus",
  "no normal",
  "high concern",
  "high risk",
  "malignant",
  "critical",
  "concerning",
  "ischemic",
  "infarction",
]

const CLINICAL_GOOD_PHRASES = [
  "normal sinus rhythm",
  "normal sinus",
  "sinus rhythm",
  "normal beats",
  "normal beat",
  "no arrhythmia",
  "no significant",
  "within normal limits",
  "benign",
  "stable rhythm",
]

const CLINICAL_NUMERIC_RE = /\d+(?:\.\d+)?%|\b\d+\/\d+\b|\b\d+(?:\.\d+)?-(?:second|seconds)\b/gi

function findPhraseSpans(text: string, phrases: string[], tone: ClinicalTone): ToneSpan[] {
  const lower = text.toLowerCase()
  const spans: ToneSpan[] = []
  for (const phrase of [...phrases].sort((a, b) => b.length - a.length)) {
    let idx = 0
    while (idx < lower.length) {
      const found = lower.indexOf(phrase, idx)
      if (found === -1) break
      spans.push({ start: found, end: found + phrase.length, tone })
      idx = found + phrase.length
    }
  }
  return spans
}

function numericContextTone(text: string, start: number, end: number): ClinicalTone | null {
  const slice = text.slice(Math.max(0, start - 70), Math.min(text.length, end + 70)).toLowerCase()
  const badHints = [
    "abnormal",
    "ventricular",
    "arrhythmia",
    "suspicious",
    "absence",
    "no normal",
    "concern",
    "predominant",
    "classified as abnormal",
    "origin arrhythm",
    "sinus beats with",
  ]
  const goodHints = [
    "normal sinus",
    " normal ",
    "sinus beat",
    "benign",
    "within normal",
    "no arrhythmia",
    "normal beats",
  ]
  const badScore = badHints.reduce((n, w) => n + (slice.includes(w) ? 1 : 0), 0)
  const goodScore = goodHints.reduce((n, w) => n + (slice.includes(w) ? 1 : 0), 0)
  if (badScore > goodScore) return "bad"
  if (goodScore > badScore) return "good"
  return null
}

function mergeToneSpans(spans: ToneSpan[]): ToneSpan[] {
  const sorted = [...spans].sort((a, b) => (b.end - b.start) - (a.end - a.start))
  const accepted: ToneSpan[] = []
  for (const span of sorted) {
    const overlaps = accepted.some((a) => span.start < a.end && span.end > a.start)
    if (!overlaps) accepted.push(span)
  }
  return accepted.sort((a, b) => a.start - b.start)
}

function buildClinicalToneSpans(text: string): ToneSpan[] {
  const spans: ToneSpan[] = [
    ...findPhraseSpans(text, CLINICAL_BAD_PHRASES, "bad"),
    ...findPhraseSpans(text, CLINICAL_GOOD_PHRASES, "good"),
  ]

  CLINICAL_NUMERIC_RE.lastIndex = 0
  let match = CLINICAL_NUMERIC_RE.exec(text)
  while (match) {
    const tone = numericContextTone(text, match.index, match.index + match[0].length)
    if (tone) {
      spans.push({ start: match.index, end: match.index + match[0].length, tone })
    }
    match = CLINICAL_NUMERIC_RE.exec(text)
  }

  return mergeToneSpans(spans)
}

function ClinicalRichText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string
  className?: string
  as?: "p" | "span" | "div"
}) {
  const spans = buildClinicalToneSpans(text)
  const bodyClass = cn("text-[13px] leading-relaxed text-[#1A1F1E] sm:text-[14px]", className)

  if (spans.length === 0) {
    return <Tag className={bodyClass}>{text}</Tag>
  }

  const nodes: ReactNode[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) nodes.push(text.slice(cursor, span.start))
    nodes.push(
      <span
        key={`${span.start}-${span.end}`}
        className={cn(
          "font-semibold",
          span.tone === "good" ? "text-emerald-700" : "text-red-700",
        )}
      >
        {text.slice(span.start, span.end)}
      </span>,
    )
    cursor = span.end
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))

  return <Tag className={bodyClass}>{nodes}</Tag>
}

// ─── AI report ───────────────────────────────────────────────────────────────

function EcgAiReport({ ecgResult }: { ecgResult: EcgResult }) {
  const [report, setReport] = useState<EcgReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    setReport(null)

    fetch(`${ECG_URL}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ecg_result: ecgResult }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (j.success) setReport(j.report)
        else setError(j.error ?? "Failed to generate report")
      })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [ecgResult])

  const riskCfg = {
    Low:      { bg: "bg-emerald-50/60", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-500 text-white hover:bg-emerald-500", icon: ShieldCheckIcon },
    Moderate: { bg: "bg-amber-50/60", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-500 text-white hover:bg-amber-500", icon: ShieldAlertIcon },
    High:     { bg: "bg-red-50/60", border: "border-red-200", text: "text-red-800", badge: "bg-red-500 text-white hover:bg-red-500", icon: ShieldAlertIcon },
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <BrainCircuitIcon className="size-5 shrink-0 text-violet-600" aria-hidden />
        <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E]">AI clinical report</h4>
        <Badge
          variant="default"
          className="rounded-lg border-0 bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-500"
        >
          Groq · qwen3-32b
        </Badge>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3 text-[13px] text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin text-violet-500" aria-hidden />
          Generating clinical interpretation…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </div>
      )}

      {report && (() => {
        const cfg = riskCfg[report.risk_level] ?? riskCfg.Moderate
        const RiskIcon = cfg.icon
        return (
          <div className="space-y-4">
            <div className={cn("flex items-start gap-3 rounded-xl border p-4", cfg.bg, cfg.border)}>
              <RiskIcon className={cn("mt-0.5 size-5 shrink-0", cfg.text)} aria-hidden />
              <div className="flex-1">
                <ClinicalRichText
                  text={report.overall_assessment}
                  className="text-[14px] font-bold sm:text-[15px]"
                  as="div"
                />
                <p className="mt-1 text-[13px] text-[#1A1F1E]">
                  Risk level:{" "}
                  <Badge
                    variant="default"
                    className={cn("ml-1 rounded-md border-0 px-2 py-0 text-[11px] font-bold shadow-none", cfg.badge)}
                  >
                    {report.risk_level}
                  </Badge>
                </p>
              </div>
            </div>

            {report.findings?.length > 0 && (
              <div className="space-y-2">
                <p className={SECTION_LABEL_ACCENT}>Findings</p>
                {report.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                    <ClinicalRichText text={f} as="div" className="min-w-0 flex-1" />
                  </div>
                ))}
              </div>
            )}

            {report.recommendations?.length > 0 && (
              <div className="space-y-2">
                <p className={SECTION_LABEL_ACCENT}>Recommendations</p>
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2Icon className="mt-1 size-4 shrink-0 text-emerald-500" aria-hidden />
                    <ClinicalRichText text={r} as="div" className="min-w-0 flex-1" />
                  </div>
                ))}
              </div>
            )}

            {report.clinical_notes && (
              <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
                <p className={cn("mb-2", SECTION_LABEL_ACCENT)}>
                  Clinical notes
                </p>
                <ClinicalRichText text={report.clinical_notes} />
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── chat panel ───────────────────────────────────────────────────────────────

function buildEcgWelcome(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Ask me anything about this ECG — suspicious beats, rhythm interpretation, or follow-up priorities.",
  }
}

function EcgTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <Avatar className="size-8 shrink-0 border border-[#E8E6E0]/60 bg-[#EEF5F3]">
          <AvatarFallback className="bg-[#1A5345]/5 text-[#1A5345]">
            <BotIcon className="size-4" aria-hidden />
          </AvatarFallback>
        </Avatar>
        <div className="flex h-10 w-14 items-center justify-center gap-1.5 rounded-2xl rounded-tl-xs border border-[#E8E6E0]/70 bg-white shadow-xs">
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function EcgChatPanel({ ecgResult }: { ecgResult: EcgResult }) {
  const formId = useId()
  const [messages, setMessages] = useState<ChatMessage[]>([buildEcgWelcome()])
  const [draft, setDraft] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([buildEcgWelcome()])
    setDraft("")
    setReplyError(null)
  }, [ecgResult])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isReplying])

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isReplying) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }

    const history = [...messages.filter((m) => m.id !== "welcome"), userMsg]

    setDraft("")
    setReplyError(null)
    setMessages((prev) => [...prev, userMsg])
    setIsReplying(true)

    try {
      const res = await fetch(`${ECG_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.map((m) => ({ role: m.role, content: m.content })),
          ecg_context: ecgResult,
        }),
      })
      const j = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: j.reply ?? j.error ?? "Error",
        },
      ])
    } catch {
      setReplyError("Failed to reach AI service.")
    } finally {
      setIsReplying(false)
    }
  }

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    void sendText(draft)
  }

  const showSuggestions =
    messages.length === 1 &&
    messages[0]?.id === "welcome" &&
    !isReplying

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <div className="border-b border-[#E8E6E0]/60 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="flex items-center gap-2 font-serif text-[16px] font-bold text-[#1A1F1E]">
              <MessageSquareTextIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
              ECG assistant
            </h4>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Classification loaded — ask about rhythm, risk, or follow-up.
            </p>
          </div>
          <Badge
            variant="default"
            className="shrink-0 rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]"
          >
            AI · Groq
          </Badge>
        </div>
      </div>

      <div
        ref={listRef}
        className="scrollbar-hide min-h-[280px] max-h-[min(420px,50vh)] space-y-4 overflow-y-auto bg-[#F9F8F5] px-5 py-4"
        dir="auto"
      >
        {messages.map((m) => {
          const isUser = m.role === "user"
          return (
            <div
              key={m.id}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                isUser ? "justify-end" : "justify-start",
              )}
            >
              <div className={cn("flex max-w-[88%] gap-3", isUser && "flex-row-reverse")}>
                {!isUser ? (
                  <Avatar className="size-8 shrink-0 border border-[#E8E6E0]/60 bg-[#EEF5F3]">
                    <AvatarFallback className="bg-[#1A5345]/5 text-[#1A5345]">
                      <BotIcon className="size-4" aria-hidden />
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-xs",
                    isUser
                      ? "rounded-tr-xs bg-[#1A5345] text-white"
                      : "rounded-tl-xs border border-[#E8E6E0]/70 bg-white text-[#1A1F1E]",
                  )}
                  dir="auto"
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            </div>
          )
        })}

        {showSuggestions ? (
          <div className="space-y-2 border-t border-[#E8E6E0]/45 pt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <SparklesIcon className="size-3.5 text-[#1A5345]" aria-hidden />
              <span className="text-[12px] font-semibold text-[#1A1F1E]">Quick prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ECG_CHAT_SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendText(prompt)}
                  className="rounded-xl border border-[#E8E6E0]/60 bg-white px-3 py-2 text-left text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-colors hover:bg-[#F0F7F4] hover:text-[#1A5345]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isReplying ? <EcgTypingIndicator /> : null}

        {replyError ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-[13px] text-rose-700">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
            <span>{replyError}</span>
          </div>
        ) : null}
      </div>

      <form
        id={formId}
        onSubmit={handleSend}
        className="flex shrink-0 gap-2 border-t border-[#E8E6E0]/60 bg-white p-4"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about the ECG findings…"
          dir="auto"
          className="h-10 flex-1 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-4 text-[13px] text-[#1A1F1E] outline-none placeholder:text-muted-foreground focus-visible:border-[#1A5345]/40 focus-visible:ring-2 focus-visible:ring-[#1A5345]/15"
          aria-label="Message to ECG assistant"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || isReplying}
          className="size-10 shrink-0 rounded-lg border-0 bg-[#1A5345] text-white shadow-sm hover:bg-[#133F34] disabled:opacity-40"
          aria-label="Send message"
        >
          <SendHorizontalIcon className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  )
}

// ─── main section ─────────────────────────────────────────────────────────────

export type EcgSectionProps = {
  heaFile: File | null
  datFile: File | null
  onHeaFileChange: (file: File | null) => void
  onDatFileChange: (file: File | null) => void
}

export function EcgSection({ heaFile, datFile, onHeaFileChange, onDatFileChange }: EcgSectionProps) {
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<EcgResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === "processing") {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  const reset = () => {
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
    setElapsed(0)
  }

  const handleHeaSelected = (file: File) => {
    reset()
    onHeaFileChange(file)
  }

  const handleDatSelected = (file: File) => {
    reset()
    onDatFileChange(file)
  }

  const handleRemoveHea = () => {
    reset()
    onHeaFileChange(null)
  }

  const handleRemoveDat = () => {
    reset()
    onDatFileChange(null)
  }

  const handleAnalyze = async () => {
    if (!heaFile || !datFile) return
    reset()
    setStatus("processing")

    try {
      const formData = new FormData()
      formData.append("hea", heaFile)
      formData.append("dat", datFile)

      const res = await fetch(`${ECG_URL}/infer`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(text || `HTTP ${res.status}`)
      }

      const json: EcgResult = await res.json()

      if ("error" in json) {
        throw new Error((json as unknown as { error: string }).error)
      }

      setResult(json)
      setStatus("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
  }

  const hasFiles = heaFile && datFile

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">ECG arrhythmia analysis</h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            Beat-by-beat classification from PhysioNet MIT-BIH recordings via ECGTransForm.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-violet-500"
        >
          AI · ECGTransForm
        </Badge>
      </div>

      <div className="space-y-4">
        {(!heaFile || !datFile) && (
          <EcgUploadZone
            heaFile={heaFile}
            datFile={datFile}
            onHeaSelected={handleHeaSelected}
            onDatSelected={handleDatSelected}
          />
        )}

        {heaFile && (
          <FileRow
            label=".hea"
            file={heaFile}
            status={status}
            elapsed={elapsed}
            onRemove={handleRemoveHea}
          />
        )}
        {datFile && (
          <FileRow
            label=".dat"
            file={datFile}
            status={status}
            elapsed={elapsed}
            onRemove={handleRemoveDat}
          />
        )}

        {hasFiles && status !== "done" && status !== "error" && (
          <Button
            type="button"
            size="sm"
            disabled={status === "processing"}
            onClick={handleAnalyze}
            className="h-10 w-full gap-2 rounded-lg bg-[#1A5345] text-[13px] font-semibold hover:bg-[#133F34]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Classifying beats… {elapsed > 0 && `(${formatElapsed(elapsed)})`}
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-4" aria-hidden />
                Run ECG arrhythmia classification
              </>
            )}
          </Button>
        )}

        {status === "done" && result && (
          <div className="space-y-4">
            <SummaryStats meta={result.meta} summary={result.summary} />
            <BeatList beats={result.beats} />
            <EcgAiReport ecgResult={result} />
            <EcgChatPanel ecgResult={result} />
          </div>
        )}

        {status === "error" && (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        )}

        {(status === "done" || status === "error") && (
          <button
            type="button"
            onClick={() => { reset(); onHeaFileChange(null); onDatFileChange(null) }}
            className="w-full rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
          >
            Upload a different recording
          </button>
        )}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          Upload a PhysioNet / MIT-BIH recording (<span className="font-medium">.hea</span> +{" "}
          <span className="font-medium">.dat</span>). The model classifies each beat into normal,
          supraventricular, ventricular, fusion, or unknown.
        </p>
      </div>
    </div>
  )
}
