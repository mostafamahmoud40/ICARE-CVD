"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileIcon,
  Loader2Icon,
  ScanIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── types ───────────────────────────────────────────────────────────────────

type AnalysisStatus = "idle" | "processing" | "done" | "error"

interface SliceImages {
  axial: string
  coronal: string
  sagittal: string
}

interface SegmentationResult {
  voxelCount: number
  predShape: [number, number, number]
  volumeMl: number
  elapsedSec: number
  slices: SliceImages
  maskB64: string
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

function b64ToBlob(b64: string, mime = "application/gzip"): Blob {
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

const ML_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ML_SERVICE_URL ?? "http://localhost:8000")
    : "http://localhost:8000"

const STAT_CARD =
  "rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

// ─── sub-components ──────────────────────────────────────────────────────────

function UploadDropZone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
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

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload NIfTI CT scan"
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
        <p className="text-[14px] font-medium text-[#102F27]">
          Drop a CT scan here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Accepts <span className="font-medium">.nii</span> and{" "}
          <span className="font-medium">.nii.gz</span> (NIfTI format)
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

function FileCard({
  file,
  status,
  elapsed,
  onRemove,
}: {
  file: File
  status: AnalysisStatus
  elapsed: number
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
    <div className="overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3">
        <FileIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[#1A1F1E]">{file.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted-foreground">{formatBytes(file.size)}</span>
            {status === "processing" && elapsed > 0 ? (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <ClockIcon className="size-3" aria-hidden />
                {formatElapsed(elapsed)}
              </span>
            ) : null}
          </div>
        </div>
        {statusBadge ? (
          <Badge
            variant="default"
            className={cn(
              "gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-none",
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

function SliceGrid({ slices }: { slices: SliceImages }) {
  const views = [
    { key: "axial", label: "Axial" },
    { key: "coronal", label: "Coronal" },
    { key: "sagittal", label: "Sagittal" },
  ] as const

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <h4 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Coronary segmentation</h4>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Red overlay marks detected vessels — axial, coronal, and sagittal views.
        </p>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-3">
        {views.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]"
          >
            <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-3 py-2">
              <p className="text-[12px] font-bold text-[#102F27]">{label}</p>
            </div>
            <div className="relative aspect-square w-full bg-[#102F27]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slices[key]}
                alt={`${label} slice`}
                className="absolute inset-0 size-full object-contain p-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultPanel({ result, fileName }: { result: SegmentationResult; fileName: string }) {
  const handleDownload = () => {
    const blob = b64ToBlob(result.maskB64)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `segmentation_${fileName.replace(/\.nii(\.gz)?$/, "")}.nii.gz`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maskName = `segmentation_${fileName.replace(/\.nii(\.gz)?$/, "")}.nii.gz`

  const stats = [
    { label: "Coronary voxels", value: result.voxelCount.toLocaleString(), sub: "labelled voxels" },
    { label: "Estimated volume", value: `${result.volumeMl.toFixed(2)} mL`, sub: "at 1 mm³ / voxel" },
    { label: "Output shape", value: result.predShape.join(" × "), sub: "H × W × D" },
    { label: "Inference time", value: formatElapsed(result.elapsedSec), sub: "sliding-window 96³" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">Overall assessment</p>
          <p className="mt-0.5 font-serif text-[16px] font-bold text-[#1A1F1E]">Segmentation complete</p>
        </div>
        <Badge
          variant="default"
          className="rounded-lg border-0 bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-emerald-500"
        >
          Ready for review
        </Badge>
      </div>

      <SliceGrid slices={result.slices} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn("space-y-1", STAT_CARD)}>
            <p className="text-[11px] font-medium text-[#6B7870]">{s.label}</p>
            <p className="text-[16px] font-bold tabular-nums text-[#1A1F1E]">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5EEEA] bg-white p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-[#102F27]">Segmentation mask</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-[#1A1F1E]">{maskName}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Import into 3D Slicer, ITK-SNAP, or OHIF for further review.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleDownload}
          className="h-10 shrink-0 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          <ArrowDownToLineIcon className="size-4" aria-hidden />
          Download mask
        </Button>
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
            Ensure the ML service is running at{" "}
            <span className="font-mono font-medium">{ML_URL}</span>
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

export type CTScanSectionProps = {
  ctFile: File | null
  onCtFileChange: (file: File | null) => void
}

export function CTScanSection({ ctFile, onCtFileChange }: CTScanSectionProps) {
  const [status, setStatus] = useState<AnalysisStatus>("idle")
  const [result, setResult] = useState<SegmentationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === "processing") {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const reset = () => {
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
    setElapsed(0)
  }

  const handleFileSelected = (file: File) => {
    reset()
    onCtFileChange(file)
  }

  const handleRemove = () => {
    reset()
    onCtFileChange(null)
  }

  const handleAnalyze = async () => {
    if (!ctFile) return
    reset()
    setStatus("processing")

    try {
      const formData = new FormData()
      formData.append("file", ctFile)

      const res = await fetch(`${ML_URL}/api/v1/ct/segment`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        throw new Error(text || `HTTP ${res.status}`)
      }

      const json = await res.json()

      setResult({
        voxelCount: json.voxel_count,
        predShape: json.pred_shape,
        volumeMl: json.volume_ml,
        elapsedSec: json.elapsed_sec,
        slices: json.slices,
        maskB64: json.mask_b64,
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
            <ScanIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">CT coronary analysis</h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            3D coronary artery segmentation from cardiac CT NIfTI volumes via BasicUNet.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]"
        >
          AI · BasicUNet
        </Badge>
      </div>

      <div className="space-y-4">
        {!ctFile ? (
          <UploadDropZone onFileSelected={handleFileSelected} />
        ) : (
          <FileCard file={ctFile} status={status} elapsed={elapsed} onRemove={handleRemove} />
        )}

        {status === "done" && result ? (
          <ResultPanel result={result} fileName={ctFile?.name ?? "scan"} />
        ) : null}

        {status === "error" ? (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        ) : null}

        {ctFile && status !== "done" && status !== "error" ? (
          <Button
            type="button"
            size="sm"
            disabled={status === "processing"}
            onClick={() => void handleAnalyze()}
            className="h-10 w-full gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Analyzing coronary arteries…
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" aria-hidden />
                Run coronary segmentation
              </>
            )}
          </Button>
        ) : null}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          Upload cardiac CT in NIfTI format. Segmentation runs on the local ML service (~30–60 s on GPU).
        </p>
      </div>
    </div>
  )
}
