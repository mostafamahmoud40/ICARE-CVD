"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  CheckCircle2Icon,
  FilmIcon,
  HeartPulseIcon,
  Loader2Icon,
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  TrendingDownIcon,
  UploadCloudIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"
import {
  useEchoAnalyze,
  useEchoChat,
  useEchoGenerateReport,
  type EchoAnalysisResult,
  type EchoChatMessage,
} from "./useEchoAnalysis"

const ACCEPTED = ".avi,.mp4,.mov,.webm,.mkv,video/*"

// ── Helpers ──────────────────────────────────────────────────────────────────

type TranscodeStatus = "idle" | "loading-ffmpeg" | "transcoding" | "done" | "error"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isAcceptedVideo(file: File): boolean {
  if (file.type.startsWith("video/")) return true
  return /\.(avi|mp4|mov|webm|mkv)$/i.test(file.name)
}

function needsTranscode(file: File): boolean {
  return /\.(avi|mkv|mov)$/i.test(file.name)
}

// ── UploadDropZone ────────────────────────────────────────────────────────────

function UploadDropZone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const file = files[0]
      if (!isAcceptedVideo(file)) return
      onFileSelected(file)
    },
    [onFileSelected],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload echocardiogram video"
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
          Drop an echocardiogram clip here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Accepts <span className="font-medium">.avi</span>,{" "}
          <span className="font-medium">.mp4</span>, .mov, .webm, .mkv
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

// ── VideoPreviewCard ──────────────────────────────────────────────────────────

function VideoPreviewCard({
  file,
  previewUrl,
  transcodeStatus,
  onRemove,
}: {
  file: File
  previewUrl: string | null
  transcodeStatus: TranscodeStatus
  onRemove: () => void
}) {
  const isConverting = transcodeStatus === "loading-ffmpeg" || transcodeStatus === "transcoding"
  const statusLabel =
    transcodeStatus === "loading-ffmpeg" ? "Loading codec…" :
    transcodeStatus === "transcoding"    ? "Converting to MP4…" : null

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA] bg-white">
      <div className="bg-[#0d1117]">
        {isConverting && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <Loader2Icon className="size-8 animate-spin text-[#2C6A5B]" />
            <p className="text-[11px] font-medium text-[#c9d1d9]">{statusLabel}</p>
            <p className="text-[10px] text-[#8b949e]">Transcoding AVI → MP4 in-browser…</p>
          </div>
        )}
        {!isConverting && previewUrl && (
          <video
            src={previewUrl}
            autoPlay
            loop
            playsInline
            muted
            className="h-64 w-full object-contain bg-[#0d1117]"
          />
        )}
        {!isConverting && !previewUrl && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <FilmIcon className="size-8 text-[#8b949e]" />
            <p className="text-[11px] font-medium text-[#c9d1d9]">Conversion failed</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
          <FilmIcon className="size-4 text-[#1A5345]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#102F27]">{file.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
            {isConverting ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <Loader2Icon className="size-2.5 animate-spin" />
                {statusLabel}
              </span>
            ) : (
              <span className="rounded-full bg-[#EEF5F3] px-1.5 py-0.5 text-[10px] font-medium text-[#1A5345]">
                Echo Clip
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={isConverting}
          className="h-6 w-6 shrink-0 p-0 text-[#6B7870] hover:bg-red-50 hover:text-red-500"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Result sub-components ─────────────────────────────────────────────────────

function EfBadge({ label }: { label: EchoAnalysisResult["label"] }) {
  const styles: Record<EchoAnalysisResult["label"], string> = {
    Normal: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Mildly Reduced": "bg-amber-50 text-amber-700 border border-amber-200",
    Reduced: "bg-red-50 text-red-700 border border-red-200",
  }
  const Icon = label === "Normal" ? CheckCircle2Icon : TrendingDownIcon
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", styles[label])}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

function EchoMetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[#E5EEEA] bg-white p-2.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-bold text-[#102F27]">{value}</span>
      {sub && <span className="text-[9px] text-muted-foreground">{sub}</span>}
    </div>
  )
}

function AreaSparkline({
  areas,
  esFrame,
  edFrame,
  systoleFrames,
}: {
  areas: number[]
  esFrame: number
  edFrame: number
  systoleFrames: number[]
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (!areas.length) return null

  const W = 500
  const H = 180
  const ML = 38, MR = 20, MT = 12, MB = 28
  const plotW = W - ML - MR
  const plotH = H - MT - MB

  const areaMax = Math.max(...areas)
  const areaMin = Math.min(...areas)
  const pad = (areaMax - areaMin) * 0.12
  const yMin = areaMin - pad
  const yMax = areaMax + pad
  const yRange = yMax - yMin

  const px = (i: number) => ML + (i / (areas.length - 1)) * plotW
  const py = (v: number) => MT + plotH - ((v - yMin) / yRange) * plotH

  const linePoints = areas.map((a, i) => `${px(i)},${py(a)}`).join(" ")
  const areaPoints = `${ML},${MT + plotH} ${linePoints} ${ML + plotW},${MT + plotH}`

  const xStep = Math.max(1, Math.ceil(areas.length / 7))
  const xTicks: number[] = []
  for (let i = 0; i < areas.length; i += xStep) xTicks.push(i)
  if (xTicks[xTicks.length - 1] !== areas.length - 1) xTicks.push(areas.length - 1)

  const yTicks = Array.from({ length: 4 }, (_, i) =>
    Math.round(yMin + (i / 3) * yRange),
  )

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    const relX = mouseX - ML
    if (relX < 0 || relX > plotW) { setHoverIdx(null); return }
    const idx = Math.round((relX / plotW) * (areas.length - 1))
    setHoverIdx(Math.max(0, Math.min(areas.length - 1, idx)))
  }

  const hoverArea = hoverIdx !== null ? areas[hoverIdx] : null
  const isED = hoverIdx === edFrame
  const isES = hoverIdx === esFrame

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair"
        style={{ aspectRatio: "500 / 180", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="echoAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="echoPlotClip">
            <rect x={ML} y={MT} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {yTicks.map((v) => (
          <line key={v} x1={ML} y1={py(v)} x2={ML + plotW} y2={py(v)}
            stroke="#e5eeea" strokeWidth="0.8" />
        ))}

        <g clipPath="url(#echoPlotClip)">
          <polygon points={areaPoints} fill="url(#echoAreaGrad)" />

          {systoleFrames.filter((f) => f !== esFrame).map((f) => (
            <line key={`sys-${f}`} x1={px(f)} y1={MT} x2={px(f)} y2={MT + plotH}
              stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
          ))}

          <line x1={px(esFrame)} y1={MT} x2={px(esFrame)} y2={MT + plotH}
            stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5,3" />

          <line x1={px(edFrame)} y1={MT} x2={px(edFrame)} y2={MT + plotH}
            stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5,3" />

          <polyline points={linePoints} fill="none" stroke="#ef4444"
            strokeWidth="1.8" strokeLinejoin="round" />

          <circle cx={px(edFrame)} cy={py(areas[edFrame])} r="3.5"
            fill="#22c55e" stroke="white" strokeWidth="1" />
          <circle cx={px(esFrame)} cy={py(areas[esFrame])} r="3.5"
            fill="#60a5fa" stroke="white" strokeWidth="1" />

          {hoverIdx !== null && (
            <>
              <line x1={px(hoverIdx)} y1={MT} x2={px(hoverIdx)} y2={MT + plotH}
                stroke="#6b7870" strokeWidth="1" strokeDasharray="2,2" />
              <circle cx={px(hoverIdx)} cy={py(areas[hoverIdx])} r="4"
                fill="#ef4444" stroke="white" strokeWidth="1.5" />
            </>
          )}
        </g>

        <line x1={ML} y1={MT} x2={ML} y2={MT + plotH} stroke="#cfd9d5" strokeWidth="0.8" />
        <line x1={ML} y1={MT + plotH} x2={ML + plotW} y2={MT + plotH} stroke="#cfd9d5" strokeWidth="0.8" />

        {yTicks.map((v) => (
          <text key={v} x={ML - 5} y={py(v) + 3} textAnchor="end" fontSize="8" fill="#8b949e">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          </text>
        ))}

        {xTicks.map((i) => (
          <text key={i} x={px(i)} y={H - 5} textAnchor="middle" fontSize="8" fill="#8b949e">
            {i}
          </text>
        ))}
      </svg>

      {hoverIdx !== null && hoverArea !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-md border border-[#E5EEEA] bg-white px-2.5 py-1.5 shadow-md"
          style={{
            left: `${(px(hoverIdx) / W) * 100}%`,
            transform: px(hoverIdx) > W * 0.65 ? "translateX(-110%)" : "translateX(8px)",
          }}
        >
          <p className="text-[9px] text-muted-foreground">Frame {hoverIdx}</p>
          <p className="text-[12px] font-bold text-[#102F27]">{hoverArea.toLocaleString()} px²</p>
          {isED && <p className="text-[9px] font-medium text-emerald-600">✓ End-Diastole</p>}
          {isES && <p className="text-[9px] font-medium text-blue-500">✓ End-Systole</p>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="#ef4444" strokeWidth="1.8" /></svg>
          LV area
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,2" /></svg>
          ED frame {edFrame}
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4,2" /></svg>
          ES frame {esFrame}
        </span>
        {systoleFrames.filter((f) => f !== esFrame).length > 0 && (
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" /></svg>
            Systole cycles
          </span>
        )}
      </div>
    </div>
  )
}

// ── ReportPanel ───────────────────────────────────────────────────────────────

function ReportPanel({
  report,
  isGenerating,
  onGenerate,
}: {
  report: string | null
  isGenerating: boolean
  onGenerate: () => void
}) {
  return (
    <div className="space-y-2">
      <Button
        className="w-full bg-[#1A5345] text-white hover:bg-[#0F3D32] text-[12px] h-9"
        disabled={isGenerating}
        onClick={onGenerate}
      >
        {isGenerating ? (
          <>
            <Loader2Icon className="mr-2 size-3.5 animate-spin" />
            Generating report…
          </>
        ) : (
          <>
            <SparklesIcon className="mr-2 size-3.5" />
            {report ? "Regenerate AI Cardiology Report" : "Generate AI Cardiology Report"}
          </>
        )}
      </Button>

      {report && (
        <div className="rounded-lg border border-[#E5EEEA] bg-white">
          <div className="flex items-center gap-2 border-b border-[#E5EEEA] px-3 py-2">
            <SparklesIcon className="size-3.5 text-violet-500" />
            <span className="text-[11px] font-semibold text-[#102F27]">AI Cardiology Report</span>
            <span className="ml-auto rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-600">
              Groq · Qwen3
            </span>
          </div>
          <pre className="whitespace-pre-wrap p-3 text-[11px] leading-relaxed text-[#102F27] font-sans">
            {report}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────

function ChatPanel({
  analysisData,
}: {
  analysisData: EchoAnalysisResult
}) {
  const [messages, setMessages] = useState<EchoChatMessage[]>([])
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatMutation = useEchoChat()

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return
    const userMsg: EchoChatMessage = { role: "user", content: text.trim() }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput("")

    const response = await chatMutation.mutateAsync({
      message: text.trim(),
      analysisData,
      history: messages,
    })

    setMessages([...nextHistory, { role: "assistant", content: response }])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, chatMutation.isPending])

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E5EEEA] px-3 py-2">
        <MessageCircleIcon className="size-3.5 text-[#1A5345]" />
        <span className="text-[11px] font-semibold text-[#102F27]">AI Consultation Chat</span>
        <span className="ml-auto rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[9px] font-medium text-[#1A5345]">
          Groq · Qwen3
        </span>
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-center text-[10px] text-muted-foreground py-4">
            Ask any clinical question about these echocardiogram findings.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed",
              m.role === "user"
                ? "self-end bg-[#EEF5F3] text-[#102F27]"
                : "self-start bg-[#F9F8F5] border border-[#E5EEEA] text-[#102F27]",
            )}
          >
            {m.content}
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="self-start flex items-center gap-1.5 rounded-lg border border-[#E5EEEA] bg-[#F9F8F5] px-3 py-2">
            <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-[#E5EEEA] p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder="Ask about these findings…"
          disabled={chatMutation.isPending}
          className="flex-1 rounded-md border border-[#E5EEEA] bg-[#FAFAF8] px-3 py-1.5 text-[11px] text-[#102F27] placeholder:text-muted-foreground focus:border-[#1A5345] focus:outline-none disabled:opacity-50"
        />
        <Button
          size="sm"
          disabled={!input.trim() || chatMutation.isPending}
          onClick={() => sendMessage(input)}
          className="h-8 w-8 shrink-0 bg-[#1A5345] p-0 text-white hover:bg-[#0F3D32] disabled:opacity-40"
        >
          <SendIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── EchoAnalysisResults ───────────────────────────────────────────────────────

function EchoAnalysisResults({
  result,
  report,
  isGeneratingReport,
  onGenerateReport,
}: {
  result: EchoAnalysisResult
  report: string | null
  isGeneratingReport: boolean
  onGenerateReport: () => void
}) {
  const fac =
    result.ed_area > 0
      ? Math.round(((result.ed_area - result.es_area) / result.ed_area) * 1000) / 10
      : 0

  const efColor =
    result.label === "Normal"
      ? "text-emerald-600"
      : result.label === "Mildly Reduced"
        ? "text-amber-600"
        : "text-red-600"

  return (
    <div className="space-y-3 rounded-xl border border-[#E5EEEA] bg-[#FAFBFA] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-violet-100">
            <ActivityIcon className="size-3.5 text-violet-600" />
          </div>
          <span className="text-[12px] font-semibold text-[#102F27]">Analysis Results</span>
        </div>
        <span className="rounded-full bg-[#EEF5F3] px-2 py-0.5 text-[10px] font-medium text-[#1A5345]">
          {result.device.toUpperCase()}
        </span>
      </div>

      {/* EF hero */}
      <div className="flex items-center gap-3 rounded-lg border border-[#E5EEEA] bg-white p-3">
        <div>
          <p className="text-[10px] text-muted-foreground">Ejection Fraction</p>
          <p className={cn("mt-0.5 text-[28px] font-black leading-none", efColor)}>
            {result.ef}%
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1.5">
          <EfBadge label={result.label} />
          <span className="text-[9px] text-muted-foreground">Reference: Normal ≥ 55%</span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <EchoMetricCard
          label="ES Area"
          value={`${result.es_area.toLocaleString()} px²`}
          sub={`Frame #${result.es_frame}`}
        />
        <EchoMetricCard
          label="ED Area"
          value={`${result.ed_area.toLocaleString()} px²`}
          sub={`Frame #${result.ed_frame}`}
        />
        <EchoMetricCard label="FAC" value={`${fac}%`} sub="Normal ≥ 35%" />
        <EchoMetricCard
          label="Cycles"
          value={String(result.chart_data.systole_frames.length)}
          sub={`/ ${result.total_frames} frames`}
        />
      </div>

      {/* Segmentation overlay GIF */}
      <div className="overflow-hidden rounded-lg border border-[#E5EEEA]">
        <div className="flex items-center justify-between bg-[#0d1117] px-3 py-2">
          <div className="flex items-center gap-2">
            <FilmIcon className="size-3.5 text-[#c9d1d9]" />
            <span className="text-[11px] font-medium text-[#c9d1d9]">Segmentation Overlay</span>
          </div>
          <span className="rounded-full bg-[#1e293b] px-2 py-0.5 text-[9px] font-medium text-[#8b949e]">
            LV mask · animated
          </span>
        </div>
        {result.overlay_gif ? (
          <img
            src={`data:image/gif;base64,${result.overlay_gif}`}
            alt="LV segmentation overlay"
            className="w-full bg-[#0d1117]"
          />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-3 bg-[#0d1117]">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-[#1A5345] [animation-delay:300ms]" />
            </div>
            <p className="text-[11px] font-medium text-[#c9d1d9]">Overlay video will play here</p>
          </div>
        )}
      </div>

      {/* Frame viz */}
      {result.frame_viz ? (
        <div className="overflow-hidden rounded-lg border border-[#E5EEEA]">
          <img src={`data:image/png;base64,${result.frame_viz}`} alt="Echo frame grid" className="w-full" />
        </div>
      ) : (
        <div className="flex h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-[#E5EEEA] bg-white">
          <FilmIcon className="size-4 text-[#8b949e]" />
          <span className="text-[10px] text-muted-foreground">Frame grid (Frame 0 · ED · ES) will appear here</span>
        </div>
      )}

      {/* LV area chart */}
      {result.chart_data.areas.length > 0 && (
        <div className="rounded-lg border border-[#E5EEEA] bg-white px-3 pb-2 pt-3">
          <p className="mb-1 text-[10px] font-medium text-[#102F27]">LV Area over Time</p>
          <AreaSparkline
            areas={result.chart_data.areas}
            esFrame={result.chart_data.es_frame}
            edFrame={result.chart_data.ed_frame}
            systoleFrames={result.chart_data.systole_frames}
          />
        </div>
      )}

      {/* AI report */}
      <ReportPanel
        report={report}
        isGenerating={isGeneratingReport}
        onGenerate={onGenerateReport}
      />

      {/* Chat (always visible after results arrive) */}
      <ChatPanel analysisData={result} />
    </div>
  )
}

// ── EchoVideoSection (public) ─────────────────────────────────────────────────

export type EchoVideoSectionProps = {
  echoFile: File | null
  onEchoFileChange: (file: File | null) => void
}

export function EchoVideoSection({ echoFile, onEchoFileChange }: EchoVideoSectionProps) {
  const previewUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [transcodeStatus, setTranscodeStatus] = useState<TranscodeStatus>("idle")
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [analysisResult, setAnalysisResult] = useState<EchoAnalysisResult | null>(null)
  const [report, setReport] = useState<string | null>(null)

  const analyzeMutation = useEchoAnalyze()
  const reportMutation = useEchoGenerateReport()

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const revokePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
  }

  const transcode = async (file: File) => {
    setTranscodeStatus("loading-ffmpeg")
    try {
      if (!ffmpegRef.current) {
        const ff = new FFmpeg()
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
        await ff.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        })
        ffmpegRef.current = ff
      }
      const ff = ffmpegRef.current
      setTranscodeStatus("transcoding")
      await ff.writeFile("input.avi", await fetchFile(file))
      await ff.exec([
        "-i", "input.avi",
        "-vcodec", "libx264",
        "-acodec", "aac",
        "-movflags", "+faststart",
        "-preset", "ultrafast",
        "-crf", "28",
        "output.mp4",
      ])
      const data = await ff.readFile("output.mp4")
      const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: "video/mp4" })
      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setTranscodeStatus("done")
    } catch {
      setTranscodeStatus("error")
    }
  }

  const handleFileSelected = (file: File) => {
    revokePreview()
    onEchoFileChange(file)
    setAnalysisResult(null)
    setReport(null)
    if (needsTranscode(file)) {
      transcode(file)
    } else {
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setTranscodeStatus("done")
    }
  }

  const handleAnalyze = async () => {
    if (!echoFile) return
    const result = await analyzeMutation.mutateAsync(echoFile)
    setAnalysisResult(result)
    setReport(null)
  }

  const handleGenerateReport = async () => {
    if (!analysisResult) return
    const text = await reportMutation.mutateAsync(analysisResult)
    setReport(text)
  }

  const handleRemove = () => {
    revokePreview()
    setTranscodeStatus("idle")
    onEchoFileChange(null)
    setAnalysisResult(null)
    setReport(null)
    analyzeMutation.reset()
    reportMutation.reset()
  }

  return (
    <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <HeartPulseIcon className="size-4 text-[#1A5345]" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#102F27]">Echocardiogram Video</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">
          Cardiac Imaging
        </span>
      </div>

      <div className="space-y-3">
        {transcodeStatus === "idle" ? (
          <UploadDropZone onFileSelected={handleFileSelected} />
        ) : (
          <VideoPreviewCard
            file={echoFile!}
            previewUrl={previewUrl}
            transcodeStatus={transcodeStatus}
            onRemove={handleRemove}
          />
        )}

        {analyzeMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-[11px] text-red-600">
              Analysis failed:{" "}
              {analyzeMutation.error instanceof Error
                ? analyzeMutation.error.message
                : "Unknown error"}
            </p>
          </div>
        )}

        {transcodeStatus === "done" && !analysisResult && (
          <Button
            className="w-full bg-[#1A5345] text-white hover:bg-[#0F3D32] text-[12px] h-9"
            disabled={analyzeMutation.isPending}
            onClick={handleAnalyze}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 size-3.5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ActivityIcon className="mr-2 size-3.5" />
                Analyze Echocardiogram
              </>
            )}
          </Button>
        )}

        {analysisResult && (
          <EchoAnalysisResults
            result={analysisResult}
            report={report}
            isGeneratingReport={reportMutation.isPending}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {!analysisResult && (
          <p className="text-center text-[10px] text-muted-foreground">
            Attach a 2D echocardiogram clip (e.g. apical 4-chamber view) for ejection
            fraction reference. Supports .avi, .mp4, .mov, .webm, and .mkv.
          </p>
        )}
      </div>
    </div>
  )
}
