"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  FileIcon,
  Loader2Icon,
  MessageCircleIcon,
  SendIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

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
  role: "user" | "assistant"
  content: string
}

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
          "flex cursor-default flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 transition-colors",
          isDragging
            ? "border-[#1A5345]/50 bg-[#F0F7F4]"
            : "border-[#E5EEEA] bg-[#FAFAF8]",
        )}
      >
        <div className={cn(
          "flex size-10 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-[#1A5345]/10" : "bg-[#E8F0EE]",
        )}>
          <UploadCloudIcon className={cn("size-5", isDragging ? "text-[#1A5345]" : "text-[#2C6A5B]")} />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-medium text-[#102F27]">
            Drop ECG files here or browse below
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Requires both{" "}
            <span className="font-medium">.hea</span> (header) and{" "}
            <span className="font-medium">.dat</span> (signal) — MIT-BIH / PhysioNet format
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => heaRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
              heaFile
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#E5EEEA] bg-white text-[#1A5345] hover:bg-[#E8F0EE]",
            )}
          >
            {heaFile ? <CheckCircle2Icon className="size-3" /> : <FileIcon className="size-3" />}
            {heaFile ? heaFile.name : "Select .hea"}
          </button>
          <button
            type="button"
            onClick={() => datRef.current?.click()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
              datFile
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[#E5EEEA] bg-white text-[#1A5345] hover:bg-[#E8F0EE]",
            )}
          >
            {datFile ? <CheckCircle2Icon className="size-3" /> : <FileIcon className="size-3" />}
            {datFile ? datFile.name : "Select .dat"}
          </button>
        </div>

        {allUploaded && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
            Both files ready
          </span>
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
    processing: { badge: "bg-amber-50 text-amber-700",     icon: Loader2Icon,       label: "Analyzing…" },
    done:       { badge: "bg-emerald-50 text-emerald-700", icon: CheckCircle2Icon,  label: "Done" },
    error:      { badge: "bg-red-50 text-red-600",         icon: XCircleIcon,       label: "Failed" },
  }
  const cfg = statusMap[status]
  const Icon = cfg.icon

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
          <ActivityIcon className="size-3.5 text-[#1A5345]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-[#102F27]">
            <span className="mr-1.5 rounded bg-[#E8F0EE] px-1 py-0.5 text-[9px] font-bold uppercase text-[#2C6A5B]">
              {label}
            </span>
            {file.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
            {Icon && (
              <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", cfg.badge)}>
                <Icon className={cn("size-2.5", status === "processing" && "animate-spin")} />
                {cfg.label}
              </span>
            )}
            {status === "processing" && elapsed > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ClockIcon className="size-2.5" />
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={status === "processing"}
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:bg-red-50 hover:text-red-500"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3.5" />
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
      className="h-8 w-[70px] shrink-0"
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummaryStats({ meta, summary }: { meta: EcgMeta; summary: SummaryEntry[] }) {
  const riskLevel =
    meta.suspicious_beats === 0
      ? { label: "Normal Rhythm", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
      : meta.suspicious_beats / meta.valid_beats > 0.2
        ? { label: "High Concern", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
        : { label: "Needs Review", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }

  const topStats = [
    { label: "Total Beats",    value: String(meta.valid_beats),    sub: "detected beats",      color: "text-[#1A5345]",    bg: "bg-[#EEF5F3]" },
    { label: "Normal",         value: String(meta.normal_beats),   sub: `${((meta.normal_beats / meta.valid_beats) * 100).toFixed(0)}% of beats`, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Suspicious",     value: String(meta.suspicious_beats), sub: `${((meta.suspicious_beats / meta.valid_beats) * 100).toFixed(0)}% of beats`, color: meta.suspicious_beats > 0 ? "text-red-700" : "text-emerald-700", bg: meta.suspicious_beats > 0 ? "bg-red-50" : "bg-emerald-50" },
    { label: "Duration",       value: `${meta.duration_sec}s`,     sub: `Lead ${meta.used_lead} · ${meta.fs} Hz`, color: "text-blue-700", bg: "bg-blue-50" },
  ]

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3", riskLevel.border, riskLevel.bg + "/30")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", riskLevel.bg)}>
            <BrainCircuitIcon className={cn("size-3.5", riskLevel.text)} />
          </div>
          <div>
            <p className={cn("text-[12px] font-semibold", riskLevel.text)}>ECG Analysis Complete</p>
            <p className="text-[10px] text-muted-foreground">
              ECGTransForm · {meta.record} · {meta.valid_beats} beats classified
            </p>
          </div>
        </div>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", riskLevel.bg, riskLevel.text, riskLevel.border)}>
          {riskLevel.label}
        </span>
      </div>

      <Separator className={riskLevel.border} />

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {topStats.map((s) => (
          <div key={s.label} className={cn("rounded-lg p-2.5", s.bg)}>
            <p className={cn("text-[14px] font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[#102F27]/70">{s.label}</p>
            <p className="text-[9px] text-[#102F27]/50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Class breakdown */}
      {summary.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#102F27]/60">
            Class Breakdown
          </p>
          {summary.map((s) => (
            <div key={s.class} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="w-28 text-[11px] text-[#102F27]">
                {s.label}
              </span>
              <div className="relative flex-1 h-1.5 overflow-hidden rounded-full bg-[#E8E6E0]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
              <span className="w-10 text-right text-[10px] font-medium text-[#102F27]">
                {s.count} <span className="text-muted-foreground">({s.pct}%)</span>
              </span>
            </div>
          ))}
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#102F27]">
          {showAll ? `All Beats (${beats.length})` : `Suspicious Beats (${suspicious.length})`}
        </p>
        {(suspicious.length > 0 || showAll) && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-[#1A5345] underline underline-offset-2"
          >
            {label}
            <ChevronDownIcon className={cn("size-3 transition-transform", showAll && "rotate-180")} />
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-6 text-center">
          <CheckCircle2Icon className="mx-auto size-6 text-emerald-500" />
          <p className="mt-1 text-[11px] font-medium text-emerald-700">No suspicious beats detected</p>
          <p className="text-[10px] text-muted-foreground">All {beats.length} beats classified as Normal</p>
        </div>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
        {shown.map((beat) => (
          <div
            key={beat.beat}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-white p-2.5",
              beat.suspicious ? "border-red-100" : "border-[#E5EEEA]",
            )}
          >
            {/* Beat index */}
            <span className="w-8 shrink-0 text-center text-[10px] font-bold tabular-nums text-muted-foreground">
              #{beat.beat + 1}
            </span>

            {/* Waveform */}
            <BeatWaveform waveform={beat.waveform} color={beat.color} />

            {/* Class badge */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: beat.color + "20", color: beat.color }}
                >
                  {beat.class}
                </span>
                <span className="text-[11px] font-medium text-[#102F27]">{beat.label}</span>
                {beat.suspicious && (
                  <AlertTriangleIcon className="size-3 text-amber-500" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Confidence: <span className="font-semibold">{beat.confidence}%</span>
              </p>
            </div>

            {/* Prob mini bars */}
            <div className="hidden sm:flex flex-col gap-0.5 w-24 shrink-0">
              {(Object.entries(beat.probs) as [string, number][])
                .filter(([, v]) => v > 0.5)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cls, pct]) => (
                  <div key={cls} className="flex items-center gap-1">
                    <span className="w-3 text-[9px] font-bold text-[#102F27]/60">{cls}</span>
                    <div className="relative flex-1 h-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: beat.color }}
                      />
                    </div>
                    <span className="w-7 text-right text-[9px] tabular-nums text-muted-foreground">
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <div className="flex items-start gap-2">
        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-red-700">Analysis failed</p>
          <p className="mt-0.5 text-[10px] text-red-600">{message}</p>
          <p className="mt-1 text-[10px] text-red-500/80">
            Make sure the ECG ML service is running at{" "}
            <span className="font-mono font-medium">{ECG_URL}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 border-red-200 text-[11px] text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          Retry
        </Button>
      </div>
    </div>
  )
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
    Low:      { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: ShieldCheckIcon },
    Moderate: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   icon: ShieldAlertIcon },
    High:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     icon: ShieldAlertIcon },
  }

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-lg bg-violet-100">
          <BrainCircuitIcon className="size-3.5 text-violet-600" />
        </div>
        <h4 className="text-[12px] font-semibold text-[#102F27]">AI Clinical Report</h4>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-600">
          Groq · qwen3-32b
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3 text-[11px] text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin text-violet-500" />
          Generating clinical interpretation…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
          {error}
        </div>
      )}

      {report && (() => {
        const cfg = riskCfg[report.risk_level] ?? riskCfg.Moderate
        const RiskIcon = cfg.icon
        return (
          <div className="space-y-3">
            {/* Assessment + risk */}
            <div className={cn("flex items-center gap-3 rounded-xl border-2 p-3", cfg.bg, cfg.border)}>
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                <RiskIcon className={cn("size-4", cfg.text)} />
              </div>
              <div>
                <p className={cn("text-[12px] font-bold", cfg.text)}>{report.overall_assessment}</p>
                <p className="text-[10px] text-muted-foreground">
                  Risk Level: <span className={cn("font-semibold", cfg.text)}>{report.risk_level}</span>
                </p>
              </div>
            </div>

            {/* Findings */}
            {report.findings?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#102F27]/60">Findings</p>
                {report.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[#102F27]">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-violet-400" />
                    {f}
                  </div>
                ))}
              </div>
            )}

            <Separator className="bg-[#E8E6E0]" />

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#102F27]/60">Recommendations</p>
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[#102F27]">
                    <CheckCircle2Icon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                    {r}
                  </div>
                ))}
              </div>
            )}

            {/* Clinical notes */}
            {report.clinical_notes && (
              <div className="rounded-lg bg-[#F9F8F5] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#102F27]/60 mb-1">
                  Clinical Notes
                </p>
                <p className="text-[11px] leading-relaxed text-[#102F27]/80">{report.clinical_notes}</p>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── chat panel ───────────────────────────────────────────────────────────────

function EcgChatPanel({ ecgResult }: { ecgResult: EcgResult }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = { role: "user", content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput("")
    setSending(true)

    try {
      const res = await fetch(`${ECG_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, ecg_context: ecgResult }),
      })
      const j = await res.json()
      setMessages([...history, { role: "assistant", content: j.reply ?? j.error ?? "Error" }])
    } catch (e) {
      setMessages([...history, { role: "assistant", content: "Failed to reach AI service." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#E5EEEA] bg-[#FAFAF8] px-4 py-2.5">
        <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <MessageCircleIcon className="size-3.5 text-[#1A5345]" />
        </div>
        <p className="text-[12px] font-semibold text-[#102F27]">Ask about this ECG</p>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-600">
          Groq · qwen3-32b
        </span>
      </div>

      {/* Messages */}
      <div className="max-h-72 min-h-[80px] overflow-y-auto space-y-2 p-3 scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-center text-[10px] text-muted-foreground py-4">
            Ask any question about the ECG findings…
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-[#1A5345] text-white"
                  : "rounded-bl-sm bg-[#F0F7F4] text-[#102F27]",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[#F0F7F4] px-3 py-2 text-[11px] text-muted-foreground">
              <Loader2Icon className="size-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E5EEEA] bg-[#FAFAF8] p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Type your question… (Enter to send)"
            rows={1}
            className="min-h-0 flex-1 resize-none rounded-xl border-[#E5EEEA] bg-white text-[11px] focus-visible:ring-1 focus-visible:ring-[#1A5345]"
          />
          <Button
            size="sm"
            disabled={!input.trim() || sending}
            onClick={send}
            className="h-8 w-8 shrink-0 p-0 bg-[#1A5345] hover:bg-[#0F3D32]"
          >
            <SendIcon className="size-3.5" />
          </Button>
        </div>
      </div>
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
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <ActivityIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">ECG Arrhythmia Analysis</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">
          AI · ECGTransForm
        </span>
      </div>

      <div className="space-y-3">
        {/* Upload zone — only show when no files yet */}
        {(!heaFile || !datFile) && (
          <EcgUploadZone
            heaFile={heaFile}
            datFile={datFile}
            onHeaSelected={handleHeaSelected}
            onDatSelected={handleDatSelected}
          />
        )}

        {/* File rows once selected */}
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

        {/* Analyze button */}
        {hasFiles && status !== "done" && status !== "error" && (
          <Button
            size="sm"
            disabled={status === "processing"}
            onClick={handleAnalyze}
            className="w-full gap-1.5 bg-[#1A5345] text-[12px] hover:bg-[#0F3D32]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Classifying beats… {elapsed > 0 && `(${formatElapsed(elapsed)})`}
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-3.5" />
                Run ECG Arrhythmia Classification
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {status === "done" && result && (
          <div className="space-y-3">
            <SummaryStats meta={result.meta} summary={result.summary} />
            <BeatList beats={result.beats} />
            <EcgAiReport ecgResult={result} />
            <EcgChatPanel ecgResult={result} />
          </div>
        )}

        {status === "error" && (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        )}

        {/* Re-upload hint after done or error */}
        {(status === "done" || status === "error") && (
          <button
            type="button"
            onClick={() => { reset(); onHeaFileChange(null); onDatFileChange(null) }}
            className="w-full rounded-lg border border-dashed border-[#E5EEEA] py-2 text-[10px] text-[#1A5345] hover:border-[#1A5345]/30 hover:bg-[#F6FBF9]"
          >
            Upload a different recording
          </button>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Upload a PhysioNet / MIT-BIH recording (<span className="font-medium">.hea</span> +{" "}
          <span className="font-medium">.dat</span>). The model classifies each beat into Normal,
          Supraventricular, Ventricular, Fusion, or Unknown.
        </p>
      </div>
    </div>
  )
}
