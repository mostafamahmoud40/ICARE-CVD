"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileImageIcon,
  Loader2Icon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisStatus = "idle" | "processing" | "done" | "error"

interface XrayResult {
  findings: Record<string, number>
  riskLevel: "high" | "moderate" | "normal"
  interpretation: string[]
  originalB64: string
  annotatedB64: string
  totalDetections: number
  inferenceTimeMs: number
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

const RISK_BADGE: Record<XrayResult["riskLevel"], string> = {
  high: "border-0 bg-rose-500 text-white hover:bg-rose-500",
  moderate: "border-0 bg-amber-500 text-white hover:bg-amber-500",
  normal: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
}

const RISK_LABEL: Record<XrayResult["riskLevel"], string> = {
  high: "High risk",
  moderate: "Moderate risk",
  normal: "Normal",
}

function findingBarColor(pct: number): string {
  if (pct > 60) return "bg-rose-500"
  if (pct > 40) return "bg-amber-500"
  return "bg-emerald-500"
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
      <UploadCloudIcon
        className={cn("size-8", isDragging ? "text-[#1A5345]" : "text-[#1A5345]/80")}
        aria-hidden
      />
      <div className="text-center">
        <p className="text-[12px] font-medium text-[#102F27]">
          Drop a chest X-ray here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          JPEG, PNG, BMP, or TIFF · PA view recommended
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

function XrayScannerOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
      aria-live="polite"
      aria-label="Scanning chest X-ray"
    >
      <div className="absolute inset-0 animate-xray-scan-unscanned bg-[#0A1F1A]/45" />
      <div className="absolute inset-0 animate-xray-scan-trail bg-[#1A5345]/18" />
      <div
        className="animate-xray-scan-line absolute inset-x-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
          boxShadow:
            "0 0 10px 1px rgba(74,222,128,0.9), 0 0 22px 4px rgba(74,222,128,0.45), 0 4px 14px rgba(26,83,69,0.35)",
        }}
      />
      <div
        className="animate-xray-scan-line absolute inset-x-0 h-10 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(74,222,128,0.12) 45%, rgba(74,222,128,0.28) 50%, rgba(74,222,128,0.12) 55%, transparent)",
        }}
      />
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md border border-[#1A5345]/30 bg-[#102F27]/85 px-2.5 py-1 text-[10px] font-medium text-emerald-100 backdrop-blur-sm">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        Scanning image…
      </div>
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
  const statusBadge =
    status === "processing"
      ? { cls: "bg-amber-500 text-white", icon: Loader2Icon, label: "Analyzing" }
      : status === "done"
        ? { cls: "bg-emerald-500 text-white", icon: CheckCircle2Icon, label: "Done" }
        : status === "error"
          ? { cls: "bg-rose-500 text-white", icon: XCircleIcon, label: "Failed" }
          : null

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow duration-300",
        status === "processing"
          ? "border-[#1A5345]/40 shadow-md ring-2 ring-[#1A5345]/15"
          : "border-[#E8E6E0]/60",
      )}
    >
      <div className="relative border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Chest X-ray preview"
          className={cn(
            "mx-auto max-h-52 w-full object-contain transition-[filter] duration-300",
            status === "processing" && "brightness-[0.92] contrast-[1.06] saturate-[0.9]",
          )}
        />
        {status === "processing" ? <XrayScannerOverlay /> : null}
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <FileImageIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#1A1F1E]">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        {statusBadge ? (
          <Badge
            variant="default"
            className={cn(
              "gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-none",
              statusBadge.cls,
            )}
          >
            <statusBadge.icon
              className={cn("size-3", status === "processing" && "animate-spin")}
              aria-hidden
            />
            {statusBadge.label}
          </Badge>
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={status === "processing"}
          className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-rose-600"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function FindingsTable({
  findings,
  totalDetections,
  inferenceTimeMs,
}: {
  findings: Record<string, number>
  totalDetections: number
  inferenceTimeMs: number
}) {
  const rows = Object.entries(findings).sort((a, b) => b[1] - a[1])

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2.5">
        <h4 className="text-[12px] font-semibold text-[#102F27]">Detected findings</h4>
        <p className="text-[10px] text-muted-foreground">
          YOLO12s localization · {totalDetections} region{totalDetections === 1 ? "" : "s"} ·{" "}
          {inferenceTimeMs.toFixed(0)} ms
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-[11px] text-muted-foreground">
          No regions detected above the model threshold.
        </p>
      ) : (
        <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-[#E8E6E0] bg-white">
            <th className="px-3 py-2 font-semibold text-[#102F27]">Finding</th>
            <th className="px-3 py-2 font-semibold text-[#102F27]">Probability</th>
            <th className="hidden px-3 py-2 font-semibold text-[#102F27] sm:table-cell">Level</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, prob]) => {
            const pct = Math.round(prob * 100)
            return (
              <tr key={label} className="border-b border-[#F0EFEA] last:border-0 hover:bg-[#F9F8F5]/60">
                <td className="px-3 py-2.5 font-medium text-[#1A1F1E]">{label}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 min-w-[72px] flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                      <div
                        className={cn("h-full rounded-full transition-all", findingBarColor(pct))}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[10px] font-bold tabular-nums text-[#102F27]">
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <span
                    className={cn(
                      "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold text-white",
                      pct > 60 ? "bg-rose-500" : pct > 40 ? "bg-amber-500" : "bg-[#6B7870]",
                    )}
                  >
                    {pct > 60 ? "Elevated" : pct > 40 ? "Borderline" : "Low"}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      )}
    </div>
  )
}

function ResultPanel({ result }: { result: XrayResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">Overall assessment</p>
          <p className="mt-0.5 font-serif text-[16px] font-bold text-[#1A1F1E]">Chest X-ray screening</p>
        </div>
        <Badge
          variant="default"
          className={cn("rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-none", RISK_BADGE[result.riskLevel])}
        >
          {RISK_LABEL[result.riskLevel]}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
          <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2">
            <p className="text-[11px] font-semibold text-[#102F27]">Source X-ray</p>
            <p className="text-[10px] text-muted-foreground">Original upload</p>
          </div>
          <div className="bg-[#F9F8F5] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.originalB64} alt="Source chest X-ray" className="w-full rounded-lg object-contain" />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
          <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2">
            <p className="text-[11px] font-semibold text-[#102F27]">AI detection overlay</p>
            <p className="text-[10px] text-muted-foreground">Localized findings with confidence</p>
          </div>
          <div className="bg-[#F9F8F5] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.annotatedB64}
              alt="Chest X-ray with AI bounding boxes"
              className="w-full rounded-lg object-contain"
            />
          </div>
        </div>
      </div>

      <FindingsTable
        findings={result.findings}
        totalDetections={result.totalDetections}
        inferenceTimeMs={result.inferenceTimeMs}
      />

      {result.interpretation.length > 0 ? (
        <div className="rounded-xl border border-[#E5EEEA] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <SparklesIcon className="size-4 text-[#1A5345]" aria-hidden />
            <h4 className="text-[12px] font-semibold text-[#102F27]">Clinical interpretation</h4>
          </div>
          <ul className="space-y-2">
            {result.interpretation.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[11px] leading-relaxed text-[#374151]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#1A5345]" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-rose-800">Analysis failed</p>
          <p className="mt-1 text-[11px] text-rose-700">{message}</p>
          <p className="mt-2 text-[10px] text-rose-600/90">
            Ensure the ML service is running at{" "}
            <span className="font-mono font-medium">{ML_URL}</span>
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="shrink-0 rounded-lg border-rose-200 bg-white text-[11px] text-rose-700 hover:bg-rose-50"
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
        findings: json.findings,
        riskLevel: json.risk_level,
        interpretation: json.interpretation,
        originalB64: json.original_b64,
        annotatedB64: json.annotated_b64,
        totalDetections: json.total_detections,
        inferenceTimeMs: json.inference_time_ms,
      })
      setStatus("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
  }

  return (
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Chest X-ray analysis</h3>
          </div>
          <p className="mt-1 pl-7 text-[11px] text-muted-foreground">
            Localized chest findings — cardiomegaly, effusion, and related regions via YOLO12s.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[10px] font-bold text-white shadow-none hover:bg-[#1A5345]"
        >
          AI · YOLO12s
        </Badge>
      </div>

      <div className="space-y-4">
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

        {status === "done" && result ? <ResultPanel result={result} /> : null}

        {status === "error" ? (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        ) : null}

        {xrayFile && status !== "done" && status !== "error" ? (
          <Button
            type="button"
            size="sm"
            disabled={status === "processing"}
            onClick={() => void handleAnalyze()}
            className="h-9 w-full gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Analyzing X-ray…
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" aria-hidden />
                Run X-ray analysis
              </>
            )}
          </Button>
        ) : null}

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          Assistive screening only — correlate with clinical context and the source image before documenting.
        </p>
      </div>
    </div>
  )
}
