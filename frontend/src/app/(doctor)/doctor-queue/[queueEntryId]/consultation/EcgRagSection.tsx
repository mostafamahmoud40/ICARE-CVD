"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  ClockIcon,
  FileTextIcon,
  HeartPulseIcon,
  Loader2Icon,
  SendHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  WifiOffIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { ecgRagMlAdapter, getEcgRagServiceUrl } from "@/lib/ml"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"

// ─── types ────────────────────────────────────────────────────────────────────

type AnalysisStatus = "idle" | "processing" | "done" | "error"

interface EcgRhythm {
  mean_bpm: number
  min_bpm: number
  max_bpm: number
  classification: string
  rhythm_regular: boolean
  rr_cv: number
}
interface EcgHrv {
  sdnn_ms: number
  rmssd_ms: number
  pnn50_pct: number
  mean_rr_ms: number
}
interface EcgIntervals {
  pr_ms: number
  qrs_duration_ms: number
  qt_ms: number
  qtc_bazett_ms: number
  qtc_fridericia_ms: number
  p_dur_ms: number
  t_dur_ms: number
  st_dur_ms: number
}
interface LeadAmplitude { R: number; Q: number; S: number; T: number }
interface StLead { st_mv: number; elevated: boolean; depressed: boolean }
interface MiTerritory { elevated_leads: string[]; depressed_leads: string[]; stemi_suspected: boolean }
interface TInversion { t_inverted: boolean; concerning: boolean }
interface EcgAxis { axis_deg: number; axis_class: string }
interface EcgLvh {
  sokolow_lyon_mv: number
  sokolow_lyon_lvh: boolean
  cornell_mv: number
  cornell_lvh_male: boolean
  cornell_lvh_female: boolean
}
interface EcgRvh { r_v1_mv: number; s_v1_mv: number; rs_ratio_v1: number; rvh_suspected: boolean }
interface EcgAtrialEnlargement {
  p_dur_ms: number
  p_amp_ii_mv: number
  lae_suspected: boolean
  rae_suspected: boolean
}
interface EcgConduction {
  pr_ms: number
  qrs_duration_ms: number
  first_degree_avb: boolean
  wide_qrs: boolean
  lbbb_suspected: boolean
  rbbb_suspected: boolean
  wpw_suspected: boolean
}

interface EcgFullFeatures {
  rhythm: EcgRhythm
  hrv: EcgHrv
  intervals: EcgIntervals
  amplitudes: Record<string, LeadAmplitude>
  p_amplitudes: Record<string, number>
  axis: EcgAxis
  st_per_lead: Record<string, StLead>
  t_inversion: Record<string, TInversion>
  mi_localization: Record<string, MiTerritory>
  lvh: EcgLvh
  rvh: EcgRvh
  atrial_enlargement: EcgAtrialEnlargement
  conduction: EcgConduction
  quality: { mean_quality: number }
  lead_names: string[]
}

interface EcgRagAnalysisResult {
  full_features: EcgFullFeatures
  legacy_features: Record<string, unknown>
  retrieved: string
  warnings?: string[]
  ecg_plot_b64: string
  /** Standard 12-lead strip layout (fixed mV scale) — most readable in UI. */
  hospital_plot_b64?: string
  cleaned_plot_b64: string
  sig_names: string[]
  sampling_rate: number
  duration_sec: number
  r_peaks_count: number
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 1): string {
  return n?.toFixed(d) ?? "—"
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

/** Rough expected .dat size from WFDB header line 1 + format-16 signal lines. */
function expectedDatBytesFromHea(text: string): number | null {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"))
  if (lines.length < 2) return null
  const head = lines[0].trim().split(/\s+/)
  const nSig = Number(head[1])
  const nSamples = Number(head[3])
  if (!Number.isFinite(nSig) || !Number.isFinite(nSamples) || nSig < 1 || nSamples < 1) return null
  const fmt = lines[1].trim().split(/\s+/)[1]?.split("+")[0] ?? "16"
  const bytesPerSample = fmt === "16" ? 2 : fmt === "24" ? 3 : fmt === "32" ? 4 : 2
  return nSamples * nSig * bytesPerSample
}

async function detectWfdbPairIssue(heaFile: File, datFile: File): Promise<string | null> {
  const heaText = await heaFile.text()
  const expected = expectedDatBytesFromHea(heaText)
  if (!expected) return null
  const ratio = datFile.size / expected
  if (ratio > 1.5) {
    return `ملف .dat كبير جداً (${formatBytes(datFile.size)}) مقارنة بما يتوقعه الـ header (~${formatBytes(expected)}). غالباً ملف غلط — PTB-XL 100 Hz يكون ~24 KB و 500 Hz ~120 KB.`
  }
  if (ratio < 0.9) {
    return `ملف .dat صغير جداً (${formatBytes(datFile.size)}) للـ header (~${formatBytes(expected)}). تأكد إن الـ .hea والـ .dat من نفس التسجيل.`
  }
  return null
}

function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

/** Parse a simple GitHub-flavoured Markdown table into headers + row arrays. */
function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("|"))
  if (lines.length < 2) return null
  const parseRow = (l: string) =>
    l
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim())
  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow).filter((r) => r.length === headers.length)
  return { headers, rows }
}

function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
      <AlertTriangleIcon className="size-2.5" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      <CheckCircle2Icon className="size-2.5" />
      {falseLabel}
    </span>
  )
}

// ─── upload / file sub-components ─────────────────────────────────────────────

function EcgRagFileCard({
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
    idle:       { badge: "",                                icon: null,             label: "" },
    processing: { badge: "bg-amber-50 text-amber-700",     icon: Loader2Icon,      label: "Analyzing…" },
    done:       { badge: "bg-emerald-50 text-emerald-700", icon: CheckCircle2Icon, label: "Done" },
    error:      { badge: "bg-red-50 text-red-600",         icon: XCircleIcon,      label: "Failed" },
  }
  const cfg = statusMap[status]
  const StatusIcon = cfg.icon

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
            {StatusIcon && (
              <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", cfg.badge)}>
                <StatusIcon className={cn("size-2.5", status === "processing" && "animate-spin")} />
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

// ─── ECG plot panel (clean white card matching Streamlit's st.pyplot style) ───

function EcgPlotPanel({
  title,
  description,
  imgB64,
}: {
  title: string
  description: string
  imgB64?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E5EEEA] bg-[#FAFAF8] px-3 py-2">
        <ActivityIcon className="size-3.5 text-[#1A5345]" />
        <span className="text-[11px] font-semibold text-[#102F27]">{title}</span>
      </div>
      <div className="bg-white">
        {imgB64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${imgB64}`}
            alt={title}
            className="w-full"
            style={{ display: "block" }}
          />
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 px-4">
            <ActivityIcon className="size-8 text-[#C8D8D1]" />
            <p className="text-center text-[11px] text-muted-foreground">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── signal summary (reference: label + optional info, value below, flat white) ─

function SummaryMetricCell({
  label,
  value,
  subline,
  tooltip,
}: {
  label: string
  value: string
  subline?: string
  tooltip?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-medium text-[#6B7870]">{label}</span>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 rounded-full text-[#9CA3A3] outline-none hover:text-[#102F27] focus-visible:ring-2 focus-visible:ring-[#1A5345]/30"
                aria-label={`About ${label}`}
              >
                <CircleHelpIcon className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-[11px] leading-snug" side="top">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className="mt-1 text-[15px] font-semibold tabular-nums tracking-tight text-[#102F27] sm:text-[16px]">
        {value}
      </p>
      {subline ? (
        <p className="mt-0.5 text-[10px] leading-tight text-[#102F27]/45">{subline}</p>
      ) : null}
    </div>
  )
}

function SignalSummaryGrid({
  features,
  durationSec,
  rPeaksCount,
}: {
  features: EcgFullFeatures
  durationSec: number
  rPeaksCount: number
}) {
  const { rhythm, intervals, axis, quality } = features
  const rV5 = features.amplitudes?.["V5"]?.R ?? 0

  const hrSub = `${fmt(rhythm.min_bpm, 0)}–${fmt(rhythm.max_bpm, 0)} bpm · ${
    rhythm.mean_bpm > 100 ? "Tachycardia range" : rhythm.mean_bpm < 60 ? "Bradycardia range" : "Typical resting range"
  }`

  const row1 = [
    {
      label: "Heart Rate",
      value: `${fmt(rhythm.mean_bpm, 0)} bpm`,
      subline: hrSub,
      tooltip: "Mean heart rate from detected R–R intervals over the analyzed segment. Range shows min–max instantaneous HR.",
    },
    {
      label: "Rhythm",
      value: rhythm.classification,
      subline: rhythm.rhythm_regular ? "Regular" : "Irregular",
      tooltip: "Rhythm label from rate and regularity rules. Subtext indicates whether R–R intervals are regular.",
    },
    {
      label: "QRS Duration",
      value: `${fmt(intervals.qrs_duration_ms, 0)} ms`,
      subline: intervals.qrs_duration_ms > 120 ? "Wide QRS — review conduction" : "Within typical limits (80–120 ms)",
      tooltip: "QRS complex duration in milliseconds. Prolonged QRS may indicate bundle branch block or ventricular conduction delay.",
    },
    {
      label: "QTc (Bazett)",
      value: `${fmt(intervals.qtc_bazett_ms, 0)} ms`,
      subline: intervals.qtc_bazett_ms > 440 ? "Prolonged — clinical correlation" : "Reference often < 440 ms (rate-corrected)",
      tooltip: "QT interval corrected for heart rate using Bazett’s formula. Prolonged QTc warrants drug/repolarization review.",
    },
    {
      label: "Signal Quality",
      value: fmt(quality.mean_quality, 2),
      subline: quality.mean_quality < 0.5 ? "Low — interpret with caution" : "Adequate for automated metrics",
      tooltip: "Mean signal quality score from the processing pipeline (0 = poor, 1 = excellent).",
    },
  ] as const

  const row2 = [
    {
      label: "Recording Duration",
      value: `${fmt(durationSec, 1)} sec`,
      subline: "Analyzed window length",
      tooltip: undefined as string | undefined,
    },
    {
      label: "R-peaks Detected",
      value: String(rPeaksCount),
      subline: "Count in segment",
      tooltip: undefined as string | undefined,
    },
    {
      label: "QRS Axis",
      value: `${fmt(axis.axis_deg, 0)}°`,
      subline: axis.axis_class,
      tooltip: "Frontal plane QRS axis derived from limb leads. Classification summarizes normal vs deviated axis.",
    },
    {
      label: "PR Interval",
      value: `${fmt(intervals.pr_ms, 0)} ms`,
      subline: intervals.pr_ms > 200 || intervals.pr_ms < 120 ? "Outside typical 120–200 ms" : "Typical AV conduction interval",
      tooltip: "PR interval reflects AV nodal conduction time. Prolonged PR may indicate first-degree AV block.",
    },
    {
      label: "R-wave V5",
      value: `${fmt(rV5, 2)} mV`,
      subline: "Precordial R amplitude",
      tooltip: undefined as string | undefined,
    },
  ] as const

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5 sm:gap-y-8">
        {row1.map((m) => (
          <SummaryMetricCell key={m.label} {...m} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5 sm:gap-y-8">
        {row2.map((m) => (
          <SummaryMetricCell key={m.label} {...m} />
        ))}
      </div>
    </div>
  )
}

// ─── feature tabs ─────────────────────────────────────────────────────────────

type TabId = "rhythm" | "intervals" | "amplitudes" | "st" | "criteria" | "raw"

const TABS: { id: TabId; label: string }[] = [
  { id: "rhythm",     label: "Rhythm & HRV" },
  { id: "intervals",  label: "Wave Intervals" },
  { id: "amplitudes", label: "Per-Lead Amplitudes" },
  { id: "st",         label: "ST / MI Analysis" },
  { id: "criteria",   label: "Diagnostic Criteria" },
  { id: "raw",        label: "Raw Feature JSON" },
]

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap border-b-2 px-1 pb-2.5 text-[11px] font-medium transition-colors sm:text-[12px]",
        active
          ? "border-red-600 text-red-600"
          : "border-transparent text-[#6B7870] hover:text-[#102F27]",
      )}
    >
      {label}
    </button>
  )
}

function RhythmHrvTab({ features }: { features: EcgFullFeatures }) {
  const { rhythm, hrv } = features
  const metrics = [
    { label: "Mean HR",    value: `${fmt(rhythm.mean_bpm, 1)} bpm`,    note: "" },
    { label: "SDNN",       value: `${fmt(hrv.sdnn_ms, 1)} ms`,         note: "Overall HRV" },
    { label: "RMSSD",      value: `${fmt(hrv.rmssd_ms, 1)} ms`,        note: "Short-term HRV (parasympathetic)" },
    { label: "pNN50",      value: `${fmt(hrv.pnn50_pct, 1)} %`,        note: "% successive RR diffs > 50 ms" },
    { label: "Mean RR",    value: `${fmt(hrv.mean_rr_ms, 0)} ms`,      note: "" },
    { label: "Min HR",     value: `${fmt(rhythm.min_bpm, 1)} bpm`,     note: "" },
    { label: "Max HR",     value: `${fmt(rhythm.max_bpm, 1)} bpm`,     note: "" },
    { label: "RR CV",      value: `${fmt(rhythm.rr_cv * 100, 1)} %`,   note: "Coefficient of variation" },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-[#E5EEEA] bg-[#FAFAF8] p-3">
            <p className="text-[14px] font-bold tabular-nums text-[#1A5345]">{m.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-[#102F27]/80">{m.label}</p>
            {m.note && <p className="text-[9px] text-[#102F27]/50">{m.note}</p>}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[#E5EEEA] bg-[#F9F8F5] px-3 py-2 text-[11px] text-[#102F27]/70">
        Rhythm: <span className="font-semibold text-[#102F27]">{rhythm.classification}</span>
        {" · "}
        {rhythm.rhythm_regular ? "Regular" : "Irregular"}
        {" · "}RR CV = {fmt(rhythm.rr_cv * 100, 1)}%
      </div>
    </div>
  )
}

function IntervalsTab({ features }: { features: EcgFullFeatures }) {
  const iv = features.intervals
  const rows: { label: string; value: string; ref: string; flag?: boolean }[] = [
    { label: "PR Interval",           value: `${fmt(iv.pr_ms, 1)} ms`,              ref: "120–200 ms",         flag: iv.pr_ms > 200 || iv.pr_ms < 120 },
    { label: "QRS Duration",          value: `${fmt(iv.qrs_duration_ms, 1)} ms`,    ref: "80–120 ms",          flag: iv.qrs_duration_ms > 120 },
    { label: "QT Interval",           value: `${fmt(iv.qt_ms, 1)} ms`,              ref: "< 440 ms (rate-dep)" },
    { label: "QTc Bazett",            value: `${fmt(iv.qtc_bazett_ms, 1)} ms`,      ref: "< 440 ms",           flag: iv.qtc_bazett_ms > 440 },
    { label: "QTc Fridericia",        value: `${fmt(iv.qtc_fridericia_ms, 1)} ms`,  ref: "< 440 ms",           flag: iv.qtc_fridericia_ms > 440 },
    { label: "P-wave Duration",       value: `${fmt(iv.p_dur_ms, 1)} ms`,           ref: "< 120 ms",           flag: iv.p_dur_ms > 120 },
    { label: "T-wave Duration",       value: `${fmt(iv.t_dur_ms, 1)} ms`,           ref: "variable" },
    { label: "ST Segment Duration",   value: `${fmt(iv.st_dur_ms, 1)} ms`,          ref: "variable" },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#E5EEEA] bg-[#FAFAF8]">
            <th className="py-2 pl-4 text-left font-semibold text-[#102F27]/60">Interval</th>
            <th className="py-2 text-center font-semibold text-[#1A5345]">Value</th>
            <th className="py-2 pr-4 text-center font-semibold text-[#102F27]/40">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-[#F0EDE8] hover:bg-[#F6FBF9]">
              <td className="py-2.5 pl-4 text-[#102F27]/80">
                {r.flag && <AlertTriangleIcon className="mr-1 inline size-3 text-amber-500" />}
                {r.label}
              </td>
              <td className={cn("py-2.5 text-center font-semibold tabular-nums", r.flag ? "text-amber-700" : "text-[#1A5345]")}>
                {r.value}
              </td>
              <td className="py-2.5 pr-4 text-center text-[10px] text-[#102F27]/40">{r.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AmplitudesTab({ features }: { features: EcgFullFeatures }) {
  const { amplitudes, p_amplitudes, t_inversion, lead_names } = features
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[11px]">
        <thead>
          <tr className="border-b border-[#E5EEEA] bg-[#FAFAF8]">
            {["Lead", "R (mV)", "Q (mV)", "S (mV)", "T (mV)", "P (mV)", "T inv.", "⚠"].map((h) => (
              <th key={h} className={cn("py-2 font-semibold text-[#102F27]/60", h === "Lead" ? "pl-4 text-left" : "text-center")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lead_names.map((lead) => {
            const a = amplitudes?.[lead] ?? { R: 0, Q: 0, S: 0, T: 0 }
            const p = p_amplitudes?.[lead] ?? 0
            const ti = t_inversion?.[lead]
            return (
              <tr key={lead} className="border-t border-[#F0EDE8] hover:bg-[#F6FBF9]">
                <td className="py-2 pl-4 font-semibold text-[#102F27]">{lead}</td>
                <td className="py-2 text-center tabular-nums text-blue-700">{fmt(a.R, 3)}</td>
                <td className="py-2 text-center tabular-nums text-[#102F27]/70">{fmt(a.Q, 3)}</td>
                <td className="py-2 text-center tabular-nums text-[#102F27]/70">{fmt(a.S, 3)}</td>
                <td className="py-2 text-center tabular-nums text-violet-700">{fmt(a.T, 3)}</td>
                <td className="py-2 text-center tabular-nums text-[#102F27]/60">{fmt(p, 3)}</td>
                <td className="py-2 text-center">
                  {ti?.t_inverted ? (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">✓</span>
                  ) : null}
                </td>
                <td className="py-2 text-center">
                  {ti?.concerning ? (
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">⚠</span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 px-4 text-[9px] text-[#102F27]/40">
        R/Q/S/T measured on each lead at R-peak indices detected from the processing lead (Lead II or first available).
      </p>
    </div>
  )
}

function StMiTab({ features }: { features: EcgFullFeatures }) {
  const { st_per_lead, mi_localization, lead_names } = features

  return (
    <div className="space-y-4">
      {/* ST deviation table */}
      <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
        <div className="flex items-center gap-2 border-b border-[#E5EEEA] bg-[#F6FBF9] px-4 py-2">
          <ZapIcon className="size-3.5 text-[#1A5345]" />
          <span className="text-[11px] font-semibold text-[#102F27]">ST Deviation per Lead</span>
          <span className="ml-auto text-[10px] text-muted-foreground">threshold ±0.10 mV</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#E5EEEA] bg-[#FAFAF8]">
              {["Lead", "ST @ J+80ms (mV)", "Status"].map((h) => (
                <th key={h} className={cn("py-2 font-semibold text-[#102F27]/60", h === "Lead" ? "pl-4 text-left" : "text-center")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lead_names.map((lead) => {
              const d = st_per_lead?.[lead] ?? { st_mv: 0, elevated: false, depressed: false }
              const flag = d.elevated ? "↑ Elevated" : d.depressed ? "↓ Depressed" : "—"
              const flagColor = d.elevated ? "text-red-600 font-semibold" : d.depressed ? "text-amber-600 font-semibold" : "text-[#102F27]/30"
              return (
                <tr key={lead} className="border-t border-[#F0EDE8] hover:bg-[#F6FBF9]">
                  <td className="py-2 pl-4 font-semibold text-[#102F27]">{lead}</td>
                  <td className={cn("py-2 text-center tabular-nums", d.elevated ? "text-red-700 font-semibold" : d.depressed ? "text-amber-700 font-semibold" : "text-[#102F27]/70")}>
                    {fmt(d.st_mv, 3)}
                  </td>
                  <td className={cn("py-2 text-center", flagColor)}>{flag}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MI territory localization */}
      <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
        <div className="flex items-center gap-2 border-b border-[#E5EEEA] bg-[#F6FBF9] px-4 py-2">
          <HeartPulseIcon className="size-3.5 text-[#1A5345]" />
          <span className="text-[11px] font-semibold text-[#102F27]">MI Territory Localization</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#E5EEEA] bg-[#FAFAF8]">
              {["Territory", "Elevated Leads", "Depressed Leads", "STEMI Suspected"].map((h) => (
                <th key={h} className={cn("py-2 font-semibold text-[#102F27]/60", h === "Territory" ? "pl-4 text-left" : "text-center")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(mi_localization ?? {}).map(([territory, info]) => (
              <tr key={territory} className="border-t border-[#F0EDE8] hover:bg-[#F6FBF9]">
                <td className="py-2 pl-4 font-medium text-[#102F27]">{territory}</td>
                <td className="py-2 text-center text-red-700">{info.elevated_leads.join(", ") || "—"}</td>
                <td className="py-2 text-center text-amber-700">{info.depressed_leads.join(", ") || "—"}</td>
                <td className="py-2 text-center">
                  {info.stemi_suspected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700">
                      <AlertTriangleIcon className="size-2.5" />⚠ YES
                    </span>
                  ) : (
                    <span className="text-[#102F27]/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DiagnosticCriteriaTab({ features }: { features: EcgFullFeatures }) {
  const { lvh, rvh, atrial_enlargement: ae, conduction, axis } = features

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Hypertrophy & Enlargement */}
      <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
        <div className="border-b border-[#E5EEEA] bg-[#F6FBF9] px-4 py-2">
          <span className="text-[11px] font-semibold text-[#102F27]">Hypertrophy / Enlargement</span>
        </div>
        <div className="divide-y divide-[#F0EDE8]">
          {[
            { label: "Sokolow-Lyon",         value: `${fmt(lvh.sokolow_lyon_mv, 2)} mV` },
            { label: "Sokolow-Lyon LVH",     value: <BoolBadge value={lvh.sokolow_lyon_lvh} /> },
            { label: "Cornell (mV)",          value: `${fmt(lvh.cornell_mv, 2)} mV` },
            { label: "Cornell LVH (Male)",    value: <BoolBadge value={lvh.cornell_lvh_male} /> },
            { label: "Cornell LVH (Female)",  value: <BoolBadge value={lvh.cornell_lvh_female} /> },
            { label: "R(V1)",                 value: `${fmt(rvh.r_v1_mv, 2)} mV` },
            { label: "S(V1)",                 value: `${fmt(rvh.s_v1_mv, 2)} mV` },
            { label: "R/S ratio V1",          value: fmt(rvh.rs_ratio_v1, 2) },
            { label: "RVH Suspected",         value: <BoolBadge value={rvh.rvh_suspected} /> },
            { label: "P-wave Duration",       value: `${fmt(ae.p_dur_ms, 1)} ms` },
            { label: "P amp (II)",            value: `${fmt(ae.p_amp_ii_mv, 3)} mV` },
            { label: "LAE Suspected",         value: <BoolBadge value={ae.lae_suspected} /> },
            { label: "RAE Suspected",         value: <BoolBadge value={ae.rae_suspected} /> },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2 text-[11px]">
              <span className="text-[#102F27]/70">{label}</span>
              <span className="font-medium text-[#102F27]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conduction & Axis */}
      <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
        <div className="border-b border-[#E5EEEA] bg-[#F6FBF9] px-4 py-2">
          <span className="text-[11px] font-semibold text-[#102F27]">Conduction & Axis</span>
        </div>
        <div className="divide-y divide-[#F0EDE8]">
          {[
            { label: "PR Interval",         value: `${fmt(conduction.pr_ms, 1)} ms` },
            { label: "QRS Duration",        value: `${fmt(conduction.qrs_duration_ms, 1)} ms` },
            { label: "1st-degree AVB",      value: <BoolBadge value={conduction.first_degree_avb} /> },
            { label: "Wide QRS (>120 ms)",  value: <BoolBadge value={conduction.wide_qrs} /> },
            { label: "LBBB Suspected",      value: <BoolBadge value={conduction.lbbb_suspected} /> },
            { label: "RBBB Suspected",      value: <BoolBadge value={conduction.rbbb_suspected} /> },
            { label: "WPW Suspected",       value: <BoolBadge value={conduction.wpw_suspected} /> },
            { label: "QRS Axis",            value: `${fmt(axis.axis_deg, 1)}°` },
            { label: "Axis Classification", value: axis.axis_class },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2 text-[11px]">
              <span className="text-[#102F27]/70">{label}</span>
              <span className="font-medium text-[#102F27]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RawFeatureJsonTab({ legacyFeatures }: { legacyFeatures: Record<string, unknown> }) {
  const text = JSON.stringify(legacyFeatures, null, 2)
  return (
    <pre className="max-h-[min(420px,50vh)] overflow-auto rounded-lg border border-[#E5EEEA] bg-[#FAFAF8] p-3 font-mono text-[10px] leading-relaxed text-[#102F27] sm:text-[11px]">
      {text}
    </pre>
  )
}

function FeatureTabs({ features, embedded, legacyFeatures }: { features: EcgFullFeatures; embedded?: boolean; legacyFeatures?: Record<string, unknown> }) {
  const [activeTab, setActiveTab] = useState<TabId>("rhythm")

  const shell = embedded
    ? "overflow-hidden bg-white"
    : "overflow-hidden rounded-xl border border-[#E5EEEA] bg-white"

  return (
    <div className={shell}>
      <div className="flex gap-4 overflow-x-auto border-b border-[#E5EEEA] px-5 pt-1 scrollbar-hide sm:gap-6">
        {TABS.map((t) => (
          <TabButton
            key={t.id}
            active={activeTab === t.id}
            label={t.label}
            onClick={() => setActiveTab(t.id)}
          />
        ))}
      </div>
      <div className={embedded ? "p-5 pt-4" : "p-4"}>
        {activeTab === "rhythm"     && <RhythmHrvTab features={features} />}
        {activeTab === "intervals"  && <IntervalsTab features={features} />}
        {activeTab === "amplitudes" && <AmplitudesTab features={features} />}
        {activeTab === "st"         && <StMiTab features={features} />}
        {activeTab === "criteria"   && <DiagnosticCriteriaTab features={features} />}
        {activeTab === "raw"        && legacyFeatures && <RawFeatureJsonTab legacyFeatures={legacyFeatures} />}
        {activeTab === "raw"        && !legacyFeatures && (
          <p className="text-[11px] text-muted-foreground">No legacy feature payload available.</p>
        )}
      </div>
    </div>
  )
}

// ─── diagnosis panel ──────────────────────────────────────────────────────────

function DiagnosisTable({ markdown }: { markdown: string }) {
  const parsed = parseMarkdownTable(markdown)

  if (!parsed) {
    return (
      <div className="rounded-xl border border-[#E5EEEA] bg-[#FAFAF8] px-4 py-3 text-[13px] leading-relaxed text-[#102F27] whitespace-pre-wrap">
        {markdown}
      </div>
    )
  }

  const conditionColor = (row: string[]) => {
    const result = row[1]?.toLowerCase() ?? ""
    if (result.includes("true")) return "bg-red-50 border-red-100"
    return "bg-white border-[#E5EEEA]"
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#E5EEEA] bg-[#F6FBF9]">
            {parsed.headers.map((h) => (
              <th
                key={h}
                className={cn(
                  "py-2.5 font-semibold text-[#102F27]/70",
                  h === parsed.headers[0] ? "pl-4 text-left" : "px-3 text-center",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsed.rows.map((row, i) => (
            <tr key={i} className={cn("border-t", conditionColor(row))}>
              {row.map((cell, j) => {
                const isResult = j === 1
                const isTrue = cell.toLowerCase() === "true"
                return (
                  <td
                    key={j}
                    className={cn(
                      "py-3 align-top",
                      j === 0 ? "pl-4 pr-3 font-semibold text-[#102F27]" : "px-3 text-center",
                    )}
                  >
                    {isResult ? (
                      isTrue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                          <AlertTriangleIcon className="size-3" />
                          True
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2Icon className="size-3" />
                          False
                        </span>
                      )
                    ) : (
                      <span className="text-[#102F27]/80 leading-relaxed">{cell}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DiagnosisPanel({
  legacyFeatures,
  retrieved,
}: {
  legacyFeatures: Record<string, unknown>
  retrieved: string
}) {
  const [query, setQuery] = useState("")
  const [historyText, setHistoryText] = useState("")
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const historyRef = useRef<HTMLInputElement>(null)

  const handleHistoryFile = async (file: File) => {
    const text = await file.text()
    setHistoryText(text)
  }

  const handleGenerate = async () => {
    const q = query.trim()
    if (!q) return
    setStatus("loading")
    setDiagnosis(null)
    setErrorMsg("")

    try {
      const json = await ecgRagMlAdapter.diagnose({
        featuresJson: JSON.stringify(legacyFeatures),
        query: q,
        retrieved,
        medicalHistory: historyText.trim() || undefined,
      })
      setDiagnosis(json.diagnosis)
      setStatus("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
  }

  return (
    <div className="space-y-3">
      {/* Diagnosis header */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-violet-100">
          <SparklesIcon className="size-3.5 text-violet-600" />
        </div>
        <h4 className="text-[13px] font-semibold text-[#102F27]">LLM Diagnosis</h4>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-600">
          Groq · llama-3.3-70b-versatile + RAG
        </span>
      </div>

      {/* Query textarea */}
      <Textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Does this patient have a heart condition? Is there evidence of MI?"
        rows={3}
        className="resize-none border-[#E5EEEA] text-[12px] focus-visible:ring-1 focus-visible:ring-[#1A5345]"
      />

      {/* Medical history upload */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => historyRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
            historyText
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#E5EEEA] bg-white text-[#1A5345] hover:bg-[#E8F0EE]",
          )}
        >
          {historyText ? <CheckCircle2Icon className="size-3" /> : <FileTextIcon className="size-3" />}
          {historyText ? "History loaded" : "Upload medical history (optional)"}
        </button>
        {historyText && (
          <button
            type="button"
            onClick={() => setHistoryText("")}
            className="text-[10px] text-red-500 hover:underline"
          >
            Clear
          </button>
        )}
        <input
          ref={historyRef}
          type="file"
          accept=".txt,.pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleHistoryFile(f) }}
        />
      </div>

      {/* Generate button */}
      <Button
        size="sm"
        disabled={!query.trim() || status === "loading"}
        onClick={() => void handleGenerate()}
        className="w-full gap-1.5 bg-violet-600 text-[12px] hover:bg-violet-700"
      >
        {status === "loading" ? (
          <>
            <Loader2Icon className="size-3.5 animate-spin" />
            Generating diagnosis…
          </>
        ) : (
          <>
            <SendHorizontalIcon className="size-3.5" />
            Generate Diagnosis
          </>
        )}
      </Button>

      {/* Error */}
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
          <WifiOffIcon className="mt-0.5 size-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Diagnosis result */}
      {status === "done" && diagnosis && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#102F27]/50">
            Response
          </p>
          <DiagnosisTable markdown={diagnosis} />
        </div>
      )}
    </div>
  )
}

// ─── error panel ──────────────────────────────────────────────────────────────

function EcgRagWarningsPanel({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold text-amber-900">
            Signal quality warning — metrics below may be unreliable
          </p>
          <ul className="list-disc space-y-1 pl-4 text-[10px] leading-relaxed text-amber-900/90">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="text-[10px] text-amber-800/80">
            For PTB-XL, upload the matching pair from the same folder:{" "}
            <span className="font-mono">records100/…/05469_lr.hea</span> +{" "}
            <span className="font-mono">05469_lr.dat</span> (~24 KB), or the 500 Hz{" "}
            <span className="font-mono">*_hr.*</span> pair (~120 KB). A .dat of ~1–2 MB with a
            100 Hz header usually means the wrong file was selected.
          </p>
        </div>
      </div>
    </div>
  )
}

function EcgRagErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <div className="flex items-start gap-2">
        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-red-700">Analysis failed</p>
          <p className="mt-0.5 text-[10px] text-red-600">{message}</p>
          <p className="mt-1 text-[10px] text-red-500/80">
            Make sure the ECG-RAG service is running at{" "}
            <span className="font-mono font-medium">{getEcgRagServiceUrl()}</span>
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

// ─── internal file upload drop zone ──────────────────────────────────────────

function EcgRagUploadZone({
  heaFile,
  datFile,
  onHeaFile,
  onDatFile,
  disabled,
}: {
  heaFile: File | null
  datFile: File | null
  onHeaFile: (f: File | null) => void
  onDatFile: (f: File | null) => void
  disabled: boolean
}) {
  const heaRef = useRef<HTMLInputElement>(null)
  const datRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    for (const file of Array.from(e.dataTransfer.files)) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "hea") onHeaFile(file)
      else if (ext === "dat") onDatFile(file)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-8 transition-colors hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <UploadCloudIcon className="size-8 text-[#1A5345]/80" aria-hidden />
      <div className="text-center">
        <p className="text-[14px] font-medium text-[#1A1F1E]">
          Drop ECG files here or browse below
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Requires matching <span className="font-medium">.hea</span> +{" "}
          <span className="font-medium">.dat</span> from the same WFDB record
        </p>
        <p className="mx-auto mt-2 max-w-md text-[11px] text-muted-foreground">
          PTB-XL 100 Hz pairs are ~600 B + ~24 KB; 500 Hz pairs are ~600 B + ~120 KB. Mismatched
          or oversized .dat files produce corrupted traces and wrong heart-rate detection.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => heaRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
            heaFile
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#E8E6E0] bg-white text-[#1A5345] hover:bg-[#F9F8F5]",
          )}
        >
          {heaFile ? <CheckCircle2Icon className="size-3.5" /> : <UploadCloudIcon className="size-3.5" />}
          {heaFile ? heaFile.name : "Select .hea"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => datRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
            datFile
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#E8E6E0] bg-white text-[#1A5345] hover:bg-[#F9F8F5]",
          )}
        >
          {datFile ? <CheckCircle2Icon className="size-3.5" /> : <UploadCloudIcon className="size-3.5" />}
          {datFile ? datFile.name : "Select .dat"}
        </button>
      </div>
      <input ref={heaRef} type="file" accept=".hea" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onHeaFile(f); e.target.value = "" }} />
      <input ref={datRef} type="file" accept=".dat" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onDatFile(f); e.target.value = "" }} />
    </div>
  )
}

// ─── main section (fully self-contained — no shared state with EcgSection) ────

export function EcgRagSection() {
  // Own file state — independent from EcgSection
  const [heaFile, setHeaFile] = useState<File | null>(null)
  const [datFile, setDatFile] = useState<File | null>(null)
  const [pairIssue, setPairIssue] = useState<string | null>(null)

  const syncPairIssue = useCallback(async (hea: File | null, dat: File | null) => {
    if (!hea || !dat) {
      setPairIssue(null)
      return
    }
    try {
      setPairIssue(await detectWfdbPairIssue(hea, dat))
    } catch {
      setPairIssue(null)
    }
  }, [])

  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<EcgRagAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
    setPairIssue(null)
    setElapsed(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleAnalyze = async () => {
    if (!heaFile || !datFile) return
    setStatus("processing")
    setResult(null)
    setErrorMsg("")
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)

    try {
      const json = (await ecgRagMlAdapter.analyze({
        heaFile,
        datFile,
      })) as EcgRagAnalysisResult
      setResult(json)
      setStatus("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const bothReady = heaFile !== null && datFile !== null
  const pairBlocked = pairIssue !== null
  const showAnalyze = bothReady && status !== "done" && status !== "error"

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BrainCircuitIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">
              ECG diagnosis — LLM + RAG
            </h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            Comprehensive feature extraction with NeuroKit2, literature RAG, and structured cardiac diagnosis.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]"
        >
          AI · NeuroKit2 + RAG
        </Badge>
      </div>

      <div className="space-y-4">
        {/* File upload — always visible, own state */}
        {status !== "done" && (
          <EcgRagUploadZone
            heaFile={heaFile}
            datFile={datFile}
            onHeaFile={(f) => {
              reset()
              setHeaFile(f)
              void syncPairIssue(f, datFile)
            }}
            onDatFile={(f) => {
              reset()
              setDatFile(f)
              void syncPairIssue(heaFile, f)
            }}
            disabled={status === "processing"}
          />
        )}

        {pairIssue && status !== "done" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">ملفات غير متطابقة — الرسم والنتائج هتطلع غلط</p>
                <p className="mt-1">{pairIssue}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* File cards */}
        {heaFile && status !== "idle" && (
          <EcgRagFileCard
            label=".hea"
            file={heaFile}
            status={status}
            elapsed={elapsed}
            onRemove={() => { reset(); setHeaFile(null) }}
          />
        )}
        {datFile && status !== "idle" && (
          <EcgRagFileCard
            label=".dat"
            file={datFile}
            status={status}
            elapsed={elapsed}
            onRemove={() => { reset(); setDatFile(null) }}
          />
        )}

        {/* Analyze button */}
        {showAnalyze && (
          <Button
            type="button"
            size="sm"
            disabled={status === "processing" || pairBlocked}
            onClick={() => void handleAnalyze()}
            className="h-10 w-full gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Extracting ECG features… {elapsed > 0 && `(${formatElapsed(elapsed)})`}
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-4" aria-hidden />
                Run feature analysis + RAG diagnosis
              </>
            )}
          </Button>
        )}

        {/* Error */}
        {status === "error" && (
          <EcgRagErrorPanel message={errorMsg} onRetry={() => void handleAnalyze()} />
        )}

        {/* Results — mirror the Streamlit layout */}
        {status === "done" && result && (
          <div className="space-y-4">
            {result.warnings && result.warnings.length > 0 ? (
              <EcgRagWarningsPanel warnings={result.warnings} />
            ) : null}
            {/* Signal summary + detail tabs (single card, reference layout) */}
            <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
              <TooltipProvider delay={200}>
                <div className="px-5 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
                  <h4 className="text-[15px] font-bold tracking-tight text-[#102F27] sm:text-base">
                    Signal Summary
                  </h4>
                  <div className="mt-5 sm:mt-6">
                    <SignalSummaryGrid
                      features={result.full_features}
                      durationSec={result.duration_sec}
                      rPeaksCount={result.r_peaks_count}
                    />
                  </div>
                </div>
                <FeatureTabs features={result.full_features} embedded legacyFeatures={result.legacy_features} />
              </TooltipProvider>
            </div>

            <Separator className="bg-[#E8E6E0]" />

            {result.hospital_plot_b64 ? (
              <EcgPlotPanel
                title={`12-lead ECG — ${result.sig_names.length} leads · ${result.sampling_rate} Hz (up to 10 s)`}
                description="Standard clinical layout (fixed scale)"
                imgB64={result.hospital_plot_b64}
              />
            ) : null}
            <EcgPlotPanel
              title={`Per-lead traces — ${result.sig_names.length} lead(s) · ${result.sampling_rate} Hz · first 10 s`}
              description="Y-axis scaled per lead for readability"
              imgB64={result.ecg_plot_b64}
            />

            <EcgPlotPanel
              title="Processing Lead (cleaned) with R-peaks"
              description="Cleaned ECG processing lead with detected R-peak markers"
              imgB64={result.cleaned_plot_b64}
            />

            <Separator className="bg-[#E8E6E0]" />

            {/* Diagnosis */}
            <DiagnosisPanel
              legacyFeatures={result.legacy_features}
              retrieved={result.retrieved}
            />

            {/* Re-run hint */}
            <button
              type="button"
              onClick={() => { reset(); setHeaFile(null); setDatFile(null) }}
              className="w-full rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
            >
              Upload a different recording
            </button>
          </div>
        )}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          Uses <span className="font-medium">NeuroKit2</span> for feature extraction (HRV, intervals, ST,
          MI localisation, LVH/RVH) · <span className="font-medium">ChromaDB</span> RAG ·{" "}
          <span className="font-medium">Groq llama-3.3-70b</span> for structured diagnosis.
        </p>
      </div>
    </div>
  )
}
