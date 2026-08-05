"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  FileImageIcon,
  Loader2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisStatus = "idle" | "processing" | "done" | "error"

interface XrayResult {
  findings: Record<string, number>
  riskLevel: "high" | "moderate" | "normal"
  interpretation: string[]
  xrayB64: string
  chartB64: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ML_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ML_SERVICE_URL ?? "http://localhost:8000")
    : "http://localhost:8000"

const ACCEPTED = ".jpg,.jpeg,.png,.bmp,.tiff,.tif"

// ─── Risk config ──────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  high: {
    label: "HIGH RISK",
    icon: AlertTriangleIcon,
    card: "border-red-200 bg-red-50/60",
    badge: "bg-red-100 text-red-700",
    icon_bg: "bg-red-100",
    icon_color: "text-red-600",
    text: "text-red-700",
    sub: "text-red-500",
  },
  moderate: {
    label: "MODERATE RISK",
    icon: AlertTriangleIcon,
    card: "border-amber-200 bg-amber-50/60",
    badge: "bg-amber-100 text-amber-700",
    icon_bg: "bg-amber-100",
    icon_color: "text-amber-600",
    text: "text-amber-700",
    sub: "text-amber-500",
  },
  normal: {
    label: "NORMAL",
    icon: ShieldCheckIcon,
    card: "border-emerald-200 bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-700",
    icon_bg: "bg-emerald-100",
    icon_color: "text-emerald-600",
    text: "text-emerald-700",
    sub: "text-emerald-500",
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UploadDropZone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const file = files[0]
      if (!file.type.startsWith("image/")) return
      onFileSelected(file)
    },
    [onFileSelected],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload chest X-ray"
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
          : "border-[#E5EEEA] bg-[#FAFAF8] hover:border-[#1A5345]/30 hover:bg-[#F6FBF9]",
      )}
    >
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full transition-colors",
        isDragging ? "bg-[#1A5345]/10" : "bg-[#E8F0EE]",
      )}>
        <FileImageIcon className={cn("size-5", isDragging ? "text-[#1A5345]" : "text-[#2C6A5B]")} />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-medium text-[#102F27]">
          Drop a chest X-ray here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Accepts <span className="font-medium">JPEG</span>,{" "}
          <span className="font-medium">PNG</span>, BMP, TIFF
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

function ImagePreviewCard({
  file,
  previewUrl,
  status,
  onRemove,
}: {
  file: File
  previewUrl: string
  status: AnalysisStatus
  onRemove: () => void
}) {
  const statusBadge = {
    idle:       null,
    processing: { cls: "bg-amber-50 text-amber-700", icon: Loader2Icon,      label: "Analyzing…" },
    done:       { cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2Icon, label: "Done" },
    error:      { cls: "bg-red-50 text-red-600",    icon: XCircleIcon,     label: "Failed" },
  }[status]

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="Chest X-ray preview"
        className="h-48 w-full object-contain bg-[#0d1117]"
      />
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#102F27]">{file.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
            {statusBadge && (
              <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", statusBadge.cls)}>
                <statusBadge.icon className={cn("size-2.5", status === "processing" && "animate-spin")} />
                {statusBadge.label}
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

function ResultPanel({ result }: { result: XrayResult }) {
  const risk = RISK_CONFIG[result.riskLevel]
  const RiskIcon = risk.icon

  return (
    <div className="space-y-3">
      {/* X-ray + chart side by side */}
      <div className="overflow-hidden rounded-xl border border-[#1d2b22] bg-[#0d1117]">
        <div className="flex items-center gap-2 border-b border-[#1d2b22] px-3 py-2">
          <div className="size-2 rounded-full bg-red-500/70" />
          <div className="size-2 rounded-full bg-amber-500/70" />
          <div className="size-2 rounded-full bg-emerald-500/70" />
          <span className="ml-1 text-[10px] font-medium text-[#8b949e]">
            DenseNet121 · Cardiovascular Analysis
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#1d2b22]">
          <div className="flex flex-col items-center gap-1 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.xrayB64} alt="Processed X-ray" className="w-full rounded object-contain" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#8b949e]">
              X-Ray (224 × 224)
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.chartB64} alt="Probability chart" className="w-full rounded object-contain" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#8b949e]">
              Finding Probabilities
            </span>
          </div>
        </div>
      </div>

      {/* Risk + interpretation */}
      <div className={cn("rounded-xl border-2 p-4 space-y-3", risk.card)}>
        {/* Risk header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", risk.icon_bg)}>
              <RiskIcon className={cn("size-3.5", risk.icon_color)} />
            </div>
            <div>
              <p className={cn("text-[12px] font-bold", risk.text)}>{risk.label}</p>
              <p className={cn("text-[10px]", risk.sub)}>DenseNet121 cardiovascular assessment</p>
            </div>
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", risk.badge)}>
            {result.riskLevel.toUpperCase()}
          </span>
        </div>

        <Separator className={result.riskLevel === "high" ? "bg-red-200" : result.riskLevel === "moderate" ? "bg-amber-200" : "bg-emerald-200"} />

        {/* Findings probabilities */}
        <div className="space-y-1.5">
          <p className={cn("text-[10px] font-semibold uppercase tracking-wide", risk.sub)}>Finding Probabilities</p>
          {Object.entries(result.findings).map(([label, prob]) => {
            const pct = Math.round(prob * 100)
            const barColor = pct > 60 ? "bg-red-400" : pct > 40 ? "bg-amber-400" : "bg-emerald-400"
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="w-[180px] shrink-0 truncate text-[11px] font-medium text-[#102F27]">
                  {label}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-white/60 h-2">
                  <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className="w-8 text-right text-[10px] font-bold tabular-nums text-[#102F27]">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>

        {/* Interpretation bullets */}
        {result.interpretation.length > 0 && (
          <div className="space-y-1">
            <p className={cn("text-[10px] font-semibold uppercase tracking-wide", risk.sub)}>Interpretation</p>
            {result.interpretation.map((line, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", risk.icon_color.replace("text-", "bg-"))} />
                <p className={cn("text-[11px]", risk.text)}>{line}</p>
              </div>
            ))}
          </div>
        )}
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
            Make sure the ML service is running at{" "}
            <span className="font-mono font-medium">{ML_URL}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 border-red-200 text-[11px] text-red-600 hover:bg-red-100"
        >
          Retry
        </Button>
      </div>
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export type XrayScanSectionProps = {
  xrayFile: File | null
  onXrayFileChange: (file: File | null) => void
}

export function XrayScanSection({ xrayFile, onXrayFileChange }: XrayScanSectionProps) {
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<XrayResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const previewUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const reset = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
  }

  const handleFileSelected = (file: File) => {
    reset()
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPreviewUrl(url)
    onXrayFileChange(file)
  }

  const handleRemove = () => {
    reset()
    onXrayFileChange(null)
  }

  const handleAnalyze = async () => {
    if (!xrayFile) return
    setStatus("processing")
    setResult(null)
    setErrorMsg("")

    try {
      const formData = new FormData()
      formData.append("file", xrayFile)

      const res = await fetch(`${ML_URL}/api/v1/xray/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(text || `HTTP ${res.status}`)
      }

      const json = await res.json()
      setResult({
        findings:       json.findings,
        riskLevel:      json.risk_level,
        interpretation: json.interpretation,
        xrayB64:        json.xray_b64,
        chartB64:       json.chart_b64,
      })
      setStatus("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
  }

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <ActivityIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Chest X-Ray Analysis</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">
          AI · DenseNet121
        </span>
      </div>

      <div className="space-y-3">
        {!xrayFile ? (
          <UploadDropZone onFileSelected={handleFileSelected} />
        ) : (
          <ImagePreviewCard
            file={xrayFile}
            previewUrl={previewUrl!}
            status={status}
            onRemove={handleRemove}
          />
        )}

        {status === "done" && result && <ResultPanel result={result} />}

        {status === "error" && (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        )}

        {xrayFile && status !== "done" && status !== "error" && (
          <Button
            size="sm"
            disabled={status === "processing"}
            onClick={handleAnalyze}
            className="w-full gap-1.5 bg-[#1A5345] text-[12px] hover:bg-[#0F3D32]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Analyzing X-ray…
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-3.5" />
                Analyze Cardiovascular Findings
              </>
            )}
          </Button>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Upload a PA chest X-ray (JPEG or PNG). Detects Cardiomegaly, Edema,
          Pleural Effusion, and Mediastinal Enlargement using DenseNet121-xrv.
        </p>
      </div>
    </div>
  )
}
