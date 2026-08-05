"use client"

import { Fragment, useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import {
  ActivityIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileIcon,
  FilmIcon,
  HeartPulseIcon,
  LayoutGridIcon,
  Loader2Icon,
  ScanHeartIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CineMRIAiChatDialog } from "./CineMRIAiChatDialog"
import type { AnalysisStatus, PersistedCineMriStudy } from "./useConsultationCineMri"

// ─── types ────────────────────────────────────────────────────────────────────

export type MriDiagnosisClass = "NOR" | "HCM" | "DCM" | "MINF" | "RV"

export interface MriClinicalFeatures {
  ed_vol_lv: number
  es_vol_lv: number
  ed_vol_rv: number
  es_vol_rv: number
  ed_mass_myo: number
  es_vol_myo: number
  ef_lv: number
  ef_rv: number
  ed_ratio_lv_rv: number
  es_ratio_lv_rv: number
  ed_ratio_myo_lv: number
  es_ratio_myo_lv: number
  es_max_mean_mwt: number
  es_stdev_mean_mwt: number
  es_mean_stdev_mwt: number
  es_stdev_stdev_mwt: number
  ed_max_mean_mwt: number
  ed_stdev_mean_mwt: number
  ed_mean_stdev_mwt: number
  ed_stdev_stdev_mwt: number
}

export interface MriResult {
  diagnosisClass: MriDiagnosisClass
  clinicalFeatures: MriClinicalFeatures
  elapsedSec: number
  rawGifB64?: string
  segGifB64?: string
  segGridEdB64?: string
  segGridEsB64?: string
  rawGifUrl?: string
  segGifUrl?: string
  segGridEdUrl?: string
  segGridEsUrl?: string
}

// ─── constants ────────────────────────────────────────────────────────────────

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const STAT_CARD =
  "rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

const DIAGNOSIS_CONFIG: Record<
  MriDiagnosisClass,
  { label: string; description: string; badge: string; text: string; bg: string; border: string }
> = {
  NOR: {
    label: "Normal",
    description: "No significant structural or functional cardiac abnormality detected.",
    badge: "bg-emerald-500 text-white hover:bg-emerald-500",
    text: "text-emerald-800",
    bg: "bg-emerald-50/60",
    border: "border-emerald-200",
  },
  HCM: {
    label: "Hypertrophic Cardiomyopathy",
    description: "Abnormal thickening of the myocardial wall, typically affecting the interventricular septum.",
    badge: "bg-amber-500 text-white hover:bg-amber-500",
    text: "text-amber-800",
    bg: "bg-amber-50/60",
    border: "border-amber-200",
  },
  DCM: {
    label: "Dilated Cardiomyopathy",
    description: "Enlarged, weakened left ventricle with significantly reduced ejection fraction.",
    badge: "bg-orange-500 text-white hover:bg-orange-500",
    text: "text-orange-800",
    bg: "bg-orange-50/60",
    border: "border-orange-200",
  },
  MINF: {
    label: "Myocardial Infarction",
    description: "Evidence of regional wall motion abnormality consistent with prior myocardial infarction.",
    badge: "bg-red-500 text-white hover:bg-red-500",
    text: "text-red-800",
    bg: "bg-red-50/60",
    border: "border-red-200",
  },
  RV: {
    label: "Right Ventricular Disease",
    description: "Abnormal right ventricular size or function relative to the left ventricle.",
    badge: "bg-violet-500 text-white hover:bg-violet-500",
    text: "text-violet-800",
    bg: "bg-violet-50/60",
    border: "border-violet-200",
  },
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatElapsed(sec: number): string {
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MriDropZone({
  phase,
  onFileSelected,
}: {
  phase: "ED" | "ES"
  onFileSelected: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const file = files[0]
      if (!file.name.endsWith(".nii") && !file.name.endsWith(".nii.gz")) return
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const phaseLabel = phase === "ED" ? "End-diastolic (ED)" : "End-systolic (ES)"
  const phaseBadge =
    phase === "ED"
      ? "bg-blue-500 text-white hover:bg-blue-500"
      : "bg-violet-500 text-white hover:bg-violet-500"

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload ${phaseLabel} NIfTI scan`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
        isDragging
          ? "border-[#1A5345]/50 bg-[#F0F7F4]"
          : "border-[#E8E6E0] bg-[#FAFAF8] hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]",
      )}
    >
      <Badge
        variant="default"
        className={cn("rounded-lg border-0 px-2.5 py-0.5 text-[10px] font-bold shadow-none", phaseBadge)}
      >
        {phase}
      </Badge>
      <UploadCloudIcon
        className={cn("size-8", isDragging ? "text-[#1A5345]" : "text-[#1A5345]/80")}
        aria-hidden
      />
      <div className="text-center">
        <p className="text-[14px] font-medium text-[#1A1F1E]">{phaseLabel}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Drop or{" "}
          <span className="font-semibold text-[#1A5345] underline underline-offset-2">browse</span>
          {" "}· .nii / .nii.gz
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".nii,.nii.gz"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

function MriFileCard({
  file,
  fileMeta,
  phase,
  status,
  elapsed,
  onRemove,
}: {
  file?: File
  fileMeta?: { fileName: string; fileSize: number }
  phase: "ED" | "ES"
  status: AnalysisStatus
  elapsed: number
  onRemove: () => void
}) {
  const fileName = file?.name ?? fileMeta?.fileName ?? "NIfTI scan"
  const fileSize = file?.size ?? fileMeta?.fileSize ?? 0
  const phaseBadge =
    phase === "ED"
      ? "bg-blue-500 text-white hover:bg-blue-500"
      : "bg-violet-500 text-white hover:bg-violet-500"

  const statusMap = {
    idle:       { badge: "",                                icon: null,             label: "" },
    processing: { badge: "bg-amber-500 text-white hover:bg-amber-500", icon: Loader2Icon, label: "Analyzing" },
    done:       { badge: "bg-emerald-500 text-white hover:bg-emerald-500", icon: CheckCircle2Icon, label: "Done" },
    error:      { badge: "bg-rose-500 text-white hover:bg-rose-500", icon: XCircleIcon, label: "Failed" },
  }
  const cfg = statusMap[status]
  const Icon = cfg.icon

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
        <FileIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold shadow-none", phaseBadge)}
            >
              {phase}
            </Badge>
            <p className="truncate text-[14px] font-semibold text-[#1A1F1E]">{fileName}</p>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted-foreground">{formatBytes(fileSize)}</span>
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

function DiagnosisClassCard({ diagnosisClass }: { diagnosisClass: MriDiagnosisClass }) {
  const cfg = DIAGNOSIS_CONFIG[diagnosisClass]

  return (
    <div className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}>
      <div className="flex items-start gap-3">
        <HeartPulseIcon className={cn("mt-0.5 size-5 shrink-0", cfg.text)} aria-hidden />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="default"
              className={cn("rounded-lg border-0 px-2.5 py-0.5 text-[11px] font-bold shadow-none", cfg.badge)}
            >
              {diagnosisClass}
            </Badge>
            <p className={cn("text-[14px] font-bold", cfg.text)}>{cfg.label}</p>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#374151]">{cfg.description}</p>
        </div>
        <CheckCircle2Icon className={cn("size-5 shrink-0", cfg.text)} aria-hidden />
      </div>
    </div>
  )
}

function KeyMetricsGrid({ features }: { features: MriClinicalFeatures }) {
  const metrics = [
    {
      label: "EF (LV)",
      value: `${fmt(features.ef_lv)} %`,
      sub: "Left ventricular ejection fraction",
      color: features.ef_lv < 40 ? "text-red-700" : features.ef_lv < 55 ? "text-amber-700" : "text-emerald-700",
      bg: features.ef_lv < 40 ? "bg-red-50" : features.ef_lv < 55 ? "bg-amber-50" : "bg-emerald-50",
    },
    {
      label: "EF (RV)",
      value: `${fmt(features.ef_rv)} %`,
      sub: "Right ventricular ejection fraction",
      color: features.ef_rv < 40 ? "text-red-700" : features.ef_rv < 55 ? "text-amber-700" : "text-emerald-700",
      bg: features.ef_rv < 40 ? "bg-red-50" : features.ef_rv < 55 ? "bg-amber-50" : "bg-emerald-50",
    },
    {
      label: "ED vol (LV)",
      value: `${fmt(features.ed_vol_lv)} mL`,
      sub: "End-diastolic LV volume",
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "ES vol (LV)",
      value: `${fmt(features.es_vol_lv)} mL`,
      sub: "End-systolic LV volume",
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className={cn("space-y-1", STAT_CARD)}>
          <p className={cn("text-[16px] font-bold tabular-nums", m.color)}>{m.value}</p>
          <p className="text-[12px] font-semibold text-[#1A1F1E]">{m.label}</p>
          <p className="text-[11px] text-muted-foreground">{m.sub}</p>
        </div>
      ))}
    </div>
  )
}

function ClinicalFeaturesTable({ features }: { features: MriClinicalFeatures }) {
  const rows: { group: string; items: { label: string; ed: string; es: string }[] }[] = [
    {
      group: "Ventricular Volumes",
      items: [
        { label: "LV Volume",    ed: `${fmt(features.ed_vol_lv)} mL`, es: `${fmt(features.es_vol_lv)} mL` },
        { label: "RV Volume",    ed: `${fmt(features.ed_vol_rv)} mL`, es: `${fmt(features.es_vol_rv)} mL` },
      ],
    },
    {
      group: "Myocardial Mass / Volume",
      items: [
        { label: "Myo Mass/Vol",  ed: `${fmt(features.ed_mass_myo)} g`,  es: `${fmt(features.es_vol_myo)} mL` },
        { label: "Myo/LV ratio",  ed: fmt(features.ed_ratio_myo_lv, 2), es: fmt(features.es_ratio_myo_lv, 2) },
      ],
    },
    {
      group: "LV / RV Volume Ratio",
      items: [
        { label: "LV/RV ratio", ed: fmt(features.ed_ratio_lv_rv, 2), es: fmt(features.es_ratio_lv_rv, 2) },
      ],
    },
    {
      group: "Myocardial Wall Thickness (MWT)",
      items: [
        { label: "max(mean MWT)",   ed: fmt(features.ed_max_mean_mwt),    es: fmt(features.es_max_mean_mwt) },
        { label: "std(mean MWT)",   ed: fmt(features.ed_stdev_mean_mwt),  es: fmt(features.es_stdev_mean_mwt) },
        { label: "mean(std MWT)",   ed: fmt(features.ed_mean_stdev_mwt),  es: fmt(features.es_mean_stdev_mwt) },
        { label: "std(std MWT)",    ed: fmt(features.ed_stdev_stdev_mwt), es: fmt(features.es_stdev_stdev_mwt) },
      ],
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
        <ActivityIcon className="size-4 text-[#1A5345]" aria-hidden />
        <span className="font-serif text-[14px] font-bold text-[#1A1F1E]">Clinical feature breakdown</span>
        <span className="ml-auto text-[12px] text-muted-foreground">20 manual features · ACDC pipeline</span>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#E8E6E0]/60 bg-[#FAFAF8]">
            <th className="py-2.5 pl-4 text-left font-semibold text-muted-foreground">Feature</th>
            <th className="py-2.5 text-center font-semibold text-blue-600">ED</th>
            <th className="py-2.5 pr-4 text-center font-semibold text-violet-600">ES</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((group) => (
            <Fragment key={group.group}>
              <tr className="border-t border-[#E8E6E0]/60 bg-[#F9F8F5]">
                <td colSpan={3} className="py-2 pl-4 text-[11px] font-bold uppercase tracking-wider text-[#1A5345]">
                  {group.group}
                </td>
              </tr>
              {group.items.map((item) => (
                <tr
                  key={`${group.group}-${item.label}`}
                  className="border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]"
                >
                  <td className="py-2.5 pl-4 text-[#374151]">{item.label}</td>
                  <td className="py-2.5 text-center font-semibold tabular-nums text-blue-700">{item.ed}</td>
                  <td className="py-2.5 pr-4 text-center font-semibold tabular-nums text-violet-700">{item.es}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── visualization panels (assistant card chrome, dark image canvas) ───────────

function VizPanel({
  title,
  icon: Icon,
  description,
  imgB64,
  imgUrl,
  mime = "image/png",
  children,
  contentClassName,
  expandable = false,
}: {
  title: string
  icon: LucideIcon
  description: string
  imgB64?: string
  imgUrl?: string
  mime?: "image/png" | "image/gif"
  children?: React.ReactNode
  contentClassName?: string
  expandable?: boolean
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const src = imgUrl ?? (imgB64 ? `data:${mime};base64,${imgB64}` : undefined)

  const imageNode =
    src &&
    (expandable ? (
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="group relative block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102F27]"
        aria-label={`View full size: ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="w-full object-contain" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Click to expand
        </span>
      </button>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={title} className="w-full object-contain" />
    ))

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <h4 className="font-serif text-[14px] font-bold text-[#1A1F1E]">{title}</h4>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
        </div>
        <div className={cn("overflow-y-auto bg-[#102F27]", contentClassName ?? "max-h-80")}>
          {children ??
            (imageNode ?? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 px-4">
                <Icon className="size-8 text-[#8b949e]" aria-hidden />
                <p className="text-[12px] font-medium text-[#8b949e]">Awaiting ML service output</p>
              </div>
            ))}
        </div>
      </div>

      {expandable && src ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="w-auto max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-1rem)]">
            <DialogHeader className="border-b border-[#E8E6E0] px-4 py-2">
              <DialogTitle className="flex items-center gap-2 text-[14px] font-semibold text-[#102F27]">
                <Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                <span className="truncate">{title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="bg-[#102F27]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={title}
                className="block h-auto w-auto max-h-[85vh] max-w-[calc(100vw-2rem)]"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

// ─── result panel ─────────────────────────────────────────────────────────────

function MriResultPanel({ result, elapsedSec }: { result: MriResult; elapsedSec: number }) {
  const cfg = DIAGNOSIS_CONFIG[result.diagnosisClass]

  return (
    <div className="space-y-4">
      <div className={cn("space-y-4 rounded-xl border p-4", cfg.bg, cfg.border)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrainCircuitIcon className={cn("size-5 shrink-0", cfg.text)} aria-hidden />
            <div>
              <p className={cn("font-serif text-[15px] font-bold", cfg.text)}>Analysis complete</p>
              <p className="text-[12px] text-muted-foreground">
                FCT segmentation · VAE + manual features · ensemble · {formatElapsed(elapsedSec)}
              </p>
            </div>
          </div>
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-emerald-500"
          >
            Ready for review
          </Badge>
        </div>

        <DiagnosisClassCard diagnosisClass={result.diagnosisClass} />
        <KeyMetricsGrid features={result.clinicalFeatures} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VizPanel
          title="Raw cine-MRI loop"
          icon={FilmIcon}
          description="Animated loop of all MRI slices (ED + ES) in grayscale — no segmentation overlay."
          imgB64={result.rawGifB64}
          imgUrl={result.rawGifUrl}
          mime="image/gif"
        />
        <VizPanel
          title="Segmentation animation (ED ↔ ES)"
          icon={FilmIcon}
          description="Overlay alternating ED ↔ ES frames. Cyan = LV · Orange = myocardium · Magenta = RV."
          imgB64={result.segGifB64}
          imgUrl={result.segGifUrl}
          mime="image/gif"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VizPanel
          title="Segmentation grid — ED phase"
          icon={LayoutGridIcon}
          description="Per-slice segmentation masks on grayscale frames for end-diastolic phase."
          imgB64={result.segGridEdB64}
          imgUrl={result.segGridEdUrl}
          expandable
        />
        <VizPanel
          title="Segmentation grid — ES phase"
          icon={LayoutGridIcon}
          description="Per-slice segmentation masks on grayscale frames for end-systolic phase."
          imgB64={result.segGridEsB64}
          imgUrl={result.segGridEsUrl}
          expandable
        />
      </div>

      <ClinicalFeaturesTable features={result.clinicalFeatures} />

      <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#1A1F1E]">Model:</span> FCT segmentation → VAE (32 deep features) + 20 manual clinical
          features → voting classifier (MLP + random forest + SVM). Trained on ACDC — 5 classes, ~92% accuracy.
          Results are for clinical decision support only and do not replace physician judgement.
        </p>
      </div>
    </div>
  )
}

function MriErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
      <div className="flex items-start gap-3">
        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-rose-800">Analysis failed</p>
          <p className="mt-1 text-[12px] text-rose-700">{message}</p>
          <p className="mt-2 text-[12px] text-rose-600/90">
            Make sure both ED and ES NIfTI files are valid cardiac MRI scans.
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

// ─── main section ─────────────────────────────────────────────────────────────

export type CineMRISectionProps = {
  edFile: File | null
  esFile: File | null
  savedStudy: PersistedCineMriStudy | null
  result: MriResult | null
  status: AnalysisStatus
  errorMsg: string
  elapsed: number
  isLoading?: boolean
  onEdFileSelected: (file: File) => void
  onEsFileSelected: (file: File) => void
  onRemoveEd: () => void
  onRemoveEs: () => void
  onAnalyze: () => void
  onRetry: () => void
}

export function CineMRISection({
  edFile,
  esFile,
  savedStudy,
  result,
  status,
  errorMsg,
  elapsed,
  isLoading = false,
  onEdFileSelected,
  onEsFileSelected,
  onRemoveEd,
  onRemoveEs,
  onAnalyze,
  onRetry,
}: CineMRISectionProps) {
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const edMeta = edFile ? null : savedStudy?.edFile ?? null
  const esMeta = esFile ? null : savedStudy?.esFile ?? null
  const bothFilesReady =
    (edFile !== null && esFile !== null) || savedStudy !== null
  const showAnalyzeButton =
    edFile !== null &&
    esFile !== null &&
    status !== "done" &&
    status !== "error"

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ScanHeartIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Cardiac cine-MRI analysis</h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            FCT segmentation, VAE features, and ensemble classification from paired ED/ES NIfTI volumes.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-violet-500"
        >
          AI · FCT + ensemble
        </Badge>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5EEEA] bg-[#FAFAF8] py-6 text-[13px] text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin text-[#1A5345]" aria-hidden />
            Loading saved MRI study…
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {edFile || edMeta ? (
            <MriFileCard
              file={edFile ?? undefined}
              fileMeta={edMeta ?? undefined}
              phase="ED"
              status={status}
              elapsed={elapsed}
              onRemove={onRemoveEd}
            />
          ) : (
            <MriDropZone phase="ED" onFileSelected={onEdFileSelected} />
          )}

          {esFile || esMeta ? (
            <MriFileCard
              file={esFile ?? undefined}
              fileMeta={esMeta ?? undefined}
              phase="ES"
              status={status}
              elapsed={elapsed}
              onRemove={onRemoveEs}
            />
          ) : (
            <MriDropZone phase="ES" onFileSelected={onEsFileSelected} />
          )}
        </div>

        {!bothFilesReady && !isLoading && (
          <p className="text-center text-[13px] text-muted-foreground">
            Upload both the{" "}
            <span className="font-semibold text-blue-600">end-diastolic (ED)</span> and{" "}
            <span className="font-semibold text-violet-600">end-systolic (ES)</span> NIfTI scans to run the analysis.
          </p>
        )}

        {status === "done" && result && (
          <>
            <MriResultPanel result={result} elapsedSec={result.elapsedSec || elapsed} />
            <Button
              type="button"
              size="sm"
              onClick={() => setAiChatOpen(true)}
              className="h-10 w-full gap-2 rounded-lg bg-violet-600 text-[13px] font-semibold hover:bg-violet-700"
            >
              <SparklesIcon className="size-4" aria-hidden />
              AI summary &amp; recommendations
            </Button>
            <CineMRIAiChatDialog
              open={aiChatOpen}
              onOpenChange={setAiChatOpen}
              result={result}
            />
          </>
        )}

        {status === "error" && (
          <MriErrorPanel message={errorMsg} onRetry={onRetry} />
        )}

        {showAnalyzeButton && (
          <Button
            type="button"
            size="sm"
            disabled={status === "processing"}
            onClick={onAnalyze}
            className="h-10 w-full gap-2 rounded-lg bg-[#1A5345] text-[13px] font-semibold hover:bg-[#133F34]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Running MRI pipeline…
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-4" aria-hidden />
                Run cardiac MRI analysis
              </>
            )}
          </Button>
        )}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          Upload cardiac cine-MRI scans in NIfTI format (.nii / .nii.gz). Requires separate ED and ES phase files.
          Pipeline: FCT segmentation → VAE deep features + 20 manual clinical features → ensemble classification.
        </p>
      </div>
    </div>
  )
}
