"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ArrowDownToLineIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileIcon,
  Loader2Icon,
  RulerIcon,
  ScanIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full transition-colors",
        isDragging ? "bg-[#1A5345]/10" : "bg-[#E8F0EE]",
      )}>
        <UploadCloudIcon className={cn("size-5", isDragging ? "text-[#1A5345]" : "text-[#2C6A5B]")} />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-medium text-[#102F27]">
          Drop a CT scan here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
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
  const statusMap = {
    idle:       { badge: "",                              icon: null,            label: "" },
    processing: { badge: "bg-amber-50 text-amber-700",   icon: Loader2Icon,     label: "Analyzing…" },
    done:       { badge: "bg-emerald-50 text-emerald-700", icon: CheckCircle2Icon, label: "Done" },
    error:      { badge: "bg-red-50 text-red-600",        icon: XCircleIcon,     label: "Failed" },
  }
  const cfg = statusMap[status]
  const Icon = cfg.icon

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
          <FileIcon className="size-4 text-[#1A5345]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#102F27]">{file.name}</p>
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

function SliceGrid({ slices }: { slices: SliceImages }) {
  const views = [
    { key: "axial",    label: "Axial" },
    { key: "coronal",  label: "Coronal" },
    { key: "sagittal", label: "Sagittal" },
  ] as const

  return (
    <div className="overflow-hidden rounded-xl border border-[#1d2b22] bg-[#0d1117]">
      <div className="flex items-center gap-2 border-b border-[#1d2b22] px-3 py-2">
        <div className="size-2 rounded-full bg-red-500/70" />
        <div className="size-2 rounded-full bg-amber-500/70" />
        <div className="size-2 rounded-full bg-emerald-500/70" />
        <span className="ml-1 text-[10px] font-medium text-[#8b949e]">
          Coronary Artery Segmentation — red overlay = detected vessels
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#1d2b22]">
        {views.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1 p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slices[key]}
              alt={`${label} slice`}
              className="w-full rounded object-contain"
            />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#8b949e]">
              {label}
            </span>
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

  const stats = [
    {
      label: "Coronary Voxels",
      value: result.voxelCount.toLocaleString(),
      sub: "labelled voxels",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Estimated Volume",
      value: `${result.volumeMl.toFixed(2)} mL`,
      sub: "at 1 mm³ / voxel",
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Output Shape",
      value: result.predShape.join(" × "),
      sub: "H × W × D",
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
    {
      label: "Inference Time",
      value: formatElapsed(result.elapsedSec),
      sub: "sliding-window 96³",
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-3">
      {/* Slice viewer */}
      <SliceGrid slices={result.slices} />

      {/* Stats + download */}
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <BrainCircuitIcon className="size-3.5 text-emerald-700" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-emerald-800">Segmentation Complete</p>
              <p className="text-[10px] text-emerald-600">BasicUNet · 96³ sliding window · 1 mm isotropic</p>
            </div>
          </div>
          <CheckCircle2Icon className="size-4 text-emerald-500" />
        </div>

        <Separator className="bg-emerald-200" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={cn("rounded-lg p-2.5", s.bg)}>
              <p className={cn("text-[13px] font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[#102F27]/70">{s.label}</p>
              <p className="text-[9px] text-[#102F27]/50">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#EEF5F3]">
            <RulerIcon className="size-3.5 text-[#1A5345]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#102F27]">
              segmentation_{fileName.replace(/\.nii(\.gz)?$/, "")}.nii.gz
            </p>
            <p className="text-[10px] text-muted-foreground">
              Ready for import into 3D Slicer, ITK-SNAP, or OHIF
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleDownload}
            className="shrink-0 gap-1.5 bg-[#1A5345] text-[11px] hover:bg-[#0F3D32]"
          >
            <ArrowDownToLineIcon className="size-3" />
            Download
          </Button>
        </div>
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
          className="shrink-0 border-red-200 text-[11px] text-red-600 hover:bg-red-100 hover:text-red-700"
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
        predShape:  json.pred_shape,
        volumeMl:   json.volume_ml,
        elapsedSec: json.elapsed_sec,
        slices:     json.slices,
        maskB64:    json.mask_b64,
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
            <ScanIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">CT Coronary Analysis</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">
          AI · BasicUNet
        </span>
      </div>

      <div className="space-y-3">
        {!ctFile ? (
          <UploadDropZone onFileSelected={handleFileSelected} />
        ) : (
          <FileCard file={ctFile} status={status} elapsed={elapsed} onRemove={handleRemove} />
        )}

        {status === "done" && result && (
          <ResultPanel result={result} fileName={ctFile?.name ?? "scan"} />
        )}

        {status === "error" && (
          <ErrorPanel message={errorMsg} onRetry={handleAnalyze} />
        )}

        {ctFile && status !== "done" && status !== "error" && (
          <Button
            size="sm"
            disabled={status === "processing"}
            onClick={handleAnalyze}
            className="w-full gap-1.5 bg-[#1A5345] text-[12px] hover:bg-[#0F3D32]"
          >
            {status === "processing" ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Analyzing coronary arteries…
              </>
            ) : (
              <>
                <BrainCircuitIcon className="size-3.5" />
                Run Coronary Segmentation
              </>
            )}
          </Button>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Upload a cardiac CT in NIfTI format (.nii / .nii.gz). Segmentation runs on the local ML
          service using sliding-window BasicUNet inference (~30–60 s on GPU).
        </p>
      </div>
    </div>
  )
}
