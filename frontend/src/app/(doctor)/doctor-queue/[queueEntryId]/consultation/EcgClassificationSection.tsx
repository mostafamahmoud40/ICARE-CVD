"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  FileImageIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AnalysisStatus, PersistedEcgClsStudy } from "./useConsultationEcgClassification"
import type { EcgClassificationResult, EcgClsInputSource } from "./consultationEcgCls.api"

const ECG_CLS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ECG_CLASSIFICATION_URL ?? "http://localhost:8503")
    : "http://localhost:8503"

const SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm"
const RESULT_SECTION = "overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm"

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.bmp"

const CLASS_LABELS: Record<string, string> = {
  Normal: "Normal sinus rhythm pattern",
  "Atrial Fibrillation": "Atrial fibrillation suspected",
  "Myocardial Infarction": "Myocardial infarction pattern",
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-[#1A5345] text-white"
          : "border border-[#E8E6E0] bg-[#FAFAF8] text-[#6B7870] hover:text-[#1A1F1E]",
      )}
    >
      {label}
    </button>
  )
}

function ProbabilityBars({
  probabilities,
  highlight,
}: {
  probabilities: Record<string, number>
  highlight: string
}) {
  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1])
  return (
    <div className="space-y-2">
      {entries.map(([label, prob]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span
              className={cn(
                "font-medium",
                label === highlight ? "text-[#1A1F1E]" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            <span className="tabular-nums text-[#1A1F1E]">{formatPct(prob)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEF5F3]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(prob * 100, 2)}%`,
                backgroundColor: label === highlight ? "#1A5345" : "#C8D8D1",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export type EcgClassificationSectionProps = {
  mode: EcgClsInputSource
  imageFile: File | null
  heaFile: File | null
  datFile: File | null
  savedStudy: PersistedEcgClsStudy | null
  result: (EcgClassificationResult & { previewUrl?: string | null }) | null
  status: AnalysisStatus
  errorMsg: string
  isLoading?: boolean
  onModeChange: (mode: EcgClsInputSource) => void
  onImageFile: (file: File | null) => void
  onHeaFile: (file: File | null) => void
  onDatFile: (file: File | null) => void
  onAnalyze: () => void
  onRetry: () => void
  onNewRecording: () => void
}

export function EcgClassificationSection({
  mode,
  imageFile,
  heaFile,
  datFile,
  savedStudy,
  result,
  status,
  errorMsg,
  isLoading = false,
  onModeChange,
  onImageFile,
  onHeaFile,
  onDatFile,
  onAnalyze,
  onRetry,
  onNewRecording,
}: EcgClassificationSectionProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const heaRef = useRef<HTMLInputElement>(null)
  const datRef = useRef<HTMLInputElement>(null)

  const canAnalyze =
    mode === "image"
      ? imageFile !== null
      : heaFile !== null && datFile !== null

  const previewSrc =
    result?.previewUrl ??
    (result?.input_preview_b64
      ? `data:image/png;base64,${result.input_preview_b64}`
      : null)

  const displayImageName = imageFile?.name ?? savedStudy?.imageFileName
  const displayHeaName = heaFile?.name ?? savedStudy?.heaFileName
  const displayDatName = datFile?.name ?? savedStudy?.datFileName

  return (
    <div className={SECTION_CARD}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">
              ECG image classification
            </h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            MaxViT classifier for ECG strip images (Normal / AF / MI). WFDB pairs are rendered
            server-side before classification. Results are saved to this consultation.
          </p>
        </div>
        <Badge
          variant="default"
          className="w-fit rounded-lg border-0 bg-violet-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-violet-500"
        >
          AI · MaxViT
        </Badge>
      </div>

      <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5EEEA] bg-[#FAFAF8] py-6 text-[13px] text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin text-[#1A5345]" aria-hidden />
          Loading saved classification…
        </div>
      ) : (
        <>
          {status !== "done" && (
            <>
              <div className="mb-1 flex flex-wrap gap-2">
                <ModeTab
                  active={mode === "wfdb"}
                  label="WFDB (.hea + .dat)"
                  onClick={() => onModeChange("wfdb")}
                />
                <ModeTab
                  active={mode === "image"}
                  label="ECG image (PNG/JPG)"
                  onClick={() => onModeChange("image")}
                />
              </div>

              <div className="space-y-3">
                {mode === "image" ? (
                  <div
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-8 text-center transition-colors hover:border-[#1A5345]/30 hover:bg-[#F9F8F5]"
                    onClick={() => imageRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const f = e.dataTransfer.files[0]
                      if (f?.type.startsWith("image/")) onImageFile(f)
                    }}
                  >
                    <FileImageIcon className="size-8 text-[#1A5345]/80" aria-hidden />
                    <p className="text-[14px] font-medium text-[#1A1F1E]">
                      Drop an ECG strip image or click to browse
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      PNG, JPG, WEBP · 12-lead printout or strip photo
                    </p>
                    <input
                      ref={imageRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onImageFile(f)
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FileImageIcon className="size-8 text-[#1A5345]/80" aria-hidden />
                      <p className="text-[14px] font-medium text-[#1A1F1E]">
                        Upload matching WFDB pair
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Rendered to a 12-lead strip before classification
                      </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-[12px] font-semibold text-[#1A5345]"
                        onClick={() => heaRef.current?.click()}
                      >
                        {heaFile ? heaFile.name : "Select .hea"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-[12px] font-semibold text-[#1A5345]"
                        onClick={() => datRef.current?.click()}
                      >
                        {datFile ? datFile.name : "Select .dat"}
                      </Button>
                    </div>
                    </div>
                    <input
                      ref={heaRef}
                      type="file"
                      accept=".hea"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onHeaFile(f)
                      }}
                    />
                    <input
                      ref={datRef}
                      type="file"
                      accept=".dat"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onDatFile(f)
                      }}
                    />
                  </div>
                )}

                {(displayImageName || displayHeaName || displayDatName) && (
                  <div className="rounded-lg border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3 text-[12px] text-muted-foreground">
                    {displayImageName && (
                      <p>
                        Image: {displayImageName}
                        {imageFile ? ` (${formatBytes(imageFile.size)})` : ""}
                      </p>
                    )}
                    {displayHeaName && (
                      <p>
                        .hea: {displayHeaName}
                        {heaFile ? ` (${formatBytes(heaFile.size)})` : ""}
                      </p>
                    )}
                    {displayDatName && (
                      <p>
                        .dat: {displayDatName}
                        {datFile ? ` (${formatBytes(datFile.size)})` : ""}
                      </p>
                    )}
                  </div>
                )}

                {canAnalyze && status !== "processing" && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 w-full gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                    onClick={() => void onAnalyze()}
                  >
                    <SparklesIcon className="size-4" aria-hidden />
                    Classify ECG
                  </Button>
                )}

                {status === "processing" && (
                  <div className="flex items-center justify-center gap-2 py-4 text-[13px] text-[#1A5345]">
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Running MaxViT classification…
                  </div>
                )}

                {status === "error" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                      <XCircleIcon className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Classification failed</p>
                        <p className="mt-0.5">{errorMsg}</p>
                        <p className="mt-1 text-[10px] opacity-80">
                          Service: <span className="font-mono">{ECG_CLS_URL}</span>
                        </p>
                      </div>
                    </div>
                    {canAnalyze && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-[11px]"
                        onClick={() => void onRetry()}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {status === "done" && result && (
            <div className="space-y-4">
              {savedStudy && (
                <p className="text-[12px] text-muted-foreground">
                  Saved to consultation · {savedStudy.fileName}
                </p>
              )}

              <div className={`${RESULT_SECTION} p-5`}>
                <div className="flex items-start gap-3">
                  <ActivityIcon
                    className="mt-0.5 size-6 shrink-0"
                    style={{ color: result.color }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Prediction
                    </p>
                    <p className="mt-1 font-serif text-[22px] font-bold leading-tight text-[#1A1F1E]">
                      {result.prediction}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {CLASS_LABELS[result.prediction] ?? result.prediction}
                    </p>
                    <p
                      className="mt-3 text-[15px] font-bold tabular-nums"
                      style={{ color: result.color }}
                    >
                      Confidence {formatPct(result.confidence)}
                    </p>
                    {result.source === "wfdb" && result.sampling_rate ? (
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        Rendered from WFDB · {result.sig_names?.length ?? 0} leads ·{" "}
                        {result.sampling_rate} Hz
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={`${RESULT_SECTION} p-4`}>
                <p className="mb-2 text-[13px] font-semibold text-[#1A1F1E]">
                  Class probabilities
                </p>
                <ProbabilityBars
                  probabilities={result.probabilities}
                  highlight={result.prediction}
                />
              </div>

              {previewSrc ? (
                <div className={RESULT_SECTION}>
                  <p className="border-b border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-2.5 text-[13px] font-semibold text-[#1A1F1E]">
                    {result.source === "wfdb"
                      ? "Rendered strip (sent to model)"
                      : "Model input"}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt="ECG strip sent to classifier"
                    className="w-full"
                  />
                </div>
              ) : null}

              <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/80 p-3 text-[12px] text-amber-900">
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Image classifier output is decision support only. WFDB-derived strips are
                  auto-rendered and may differ from training images — prefer scanned/printed
                  12-lead photos when available.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void onNewRecording()}
                className="w-full rounded-xl border border-dashed border-[#E8E6E0] py-3 text-[13px] font-semibold text-[#1A5345] transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Trash2Icon className="size-3.5" aria-hidden />
                  Classify another recording
                </span>
              </button>
            </div>
          )}
        </>
      )}

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          MaxViT-Base · classes: Normal, Atrial Fibrillation, Myocardial Infarction · ~98% val accuracy
        </p>
      </div>
    </div>
  )
}
