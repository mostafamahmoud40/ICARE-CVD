"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { LabMaterialFile } from "./consultation.types"
import type { LabAnalysisBundle, LabResultRow, LabResultStatus } from "./labMaterials.types"
import { LabMaterialsAiChatDialog } from "./LabMaterialsAiChatDialog"
import { useLabMaterialsWorkspace } from "./useLabMaterialsWorkspace"
import { Button } from "@/components/ui/button"
import {
  AlertCircleIcon,
  ChevronRightIcon,
  FileIcon,
  FlaskConicalIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  RefreshCwIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"

const ACCEPT_LABEL = "PDF, PNG, JPEG"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(file: LabMaterialFile["file"]): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
}

function FilePreviewDialog({
  item,
  open,
  onOpenChange,
}: {
  item: LabMaterialFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!item) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(item.file)
    setObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [item])

  if (!item) return null

  const file = item.file
  const isImage = isImageFile(file)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#E5EEEA] px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#102F27]">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
              <FileIcon className="size-4 text-[#1A5345]" />
            </div>
            <span className="truncate">{file.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#F9F8F5] p-4">
          {isImage && objectUrl ? (
            <img
              src={objectUrl}
              alt={file.name}
              className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#E5EEEA] bg-white p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#EEF5F3]">
                <FileIcon className="size-7 text-[#1A5345]" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#102F27]">{file.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatBytes(file.size)}
                  {file.type ? ` · ${file.type}` : ""}
                </p>
              </div>
              {objectUrl && (
                <a
                  href={objectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#1A5345] px-4 py-2 text-[11px] font-medium text-white hover:bg-[#0F3D32]"
                >
                  فتح الملف
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function isAllowedLabFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith(".pdf")) return true
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return true
  const t = file.type
  return t === "application/pdf" || t === "image/png" || t === "image/jpeg"
}

function statusClass(status: LabResultStatus): string {
  switch (status) {
    case "Normal":
      return "bg-emerald-50 text-emerald-800"
    case "High":
      return "bg-amber-50 text-amber-800"
    case "Low":
      return "bg-sky-50 text-sky-800"
    case "Critical":
      return "bg-red-50 text-red-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// ─── Presentational pieces (SRP: one visual concern each) ─────────────────────

function LabMaterialsCollapsedStrip({ onPickFiles }: { onPickFiles: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-muted-foreground">
        The analysis workspace stays compact until you attach files or run AI review.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onPickFiles}
        className="w-full shrink-0 gap-1.5 border-[#E5EEEA] text-[12px] hover:bg-[#E8F0EE] sm:w-auto"
      >
        <UploadCloudIcon className="size-3.5" />
        Add lab files
      </Button>
    </div>
  )
}

function LabMetaGrid({ bundle }: { bundle: LabAnalysisBundle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border border-[#E5EEEA] bg-[#FAFAF8] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Facility
        </p>
        <dl className="mt-2 space-y-1 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Hospital</dt>
            <dd className="text-right font-medium text-[#102F27]">{bundle.facility.hospitalName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Lab</dt>
            <dd className="text-right font-medium text-[#102F27]">{bundle.facility.labName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Ordering</dt>
            <dd className="text-right font-medium text-[#102F27]">{bundle.facility.doctorName}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border border-[#E5EEEA] bg-[#FAFAF8] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Patient (document)
        </p>
        <dl className="mt-2 space-y-1 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">ID</dt>
            <dd className="font-mono text-[10px] font-medium text-[#102F27]">{bundle.patient.id}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Collected</dt>
            <dd className="font-medium text-[#102F27]">{bundle.patient.dateCollected}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Reported</dt>
            <dd className="font-medium text-[#102F27]">{bundle.patient.dateReported}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function LabResultsTable({ rows }: { rows: LabResultRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2">
        <h4 className="text-[12px] font-semibold text-[#102F27]">Structured results</h4>
        <p className="text-[10px] text-muted-foreground">Mock extraction — verify against source documents.</p>
      </div>
      <div className="scrollbar-hide max-h-[280px] overflow-x-auto overflow-y-auto sm:max-h-none">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#E8E6E0] bg-white">
              <th className="px-3 py-2 font-semibold text-[#102F27]">Test</th>
              <th className="px-3 py-2 font-semibold text-[#102F27]">Value</th>
              <th className="px-3 py-2 font-semibold text-[#102F27]">Ref.</th>
              <th className="px-3 py-2 font-semibold text-[#102F27]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.testName} className="border-b border-[#F0EFEA] last:border-0">
                <td className="px-3 py-2 font-medium text-[#102F27]">{row.testName}</td>
                <td className="px-3 py-2 tabular-nums text-[#1A1F1E]">
                  {row.value} {row.unit}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.referenceRange}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      statusClass(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LabSummaryReport({ text }: { text: string }) {
  return (
    <div className="rounded-xl border-2 border-violet-100 bg-violet-50/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-violet-100">
          <SparklesIcon className="size-3.5 text-violet-700" />
        </div>
        <h4 className="text-[12px] font-semibold text-violet-900">Summary report</h4>
      </div>
      <p className="text-[11px] leading-relaxed text-violet-950/90">{text}</p>
    </div>
  )
}

function LabUploadDropZone({
  onFiles,
}: {
  onFiles: (files: FileList | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload lab documents"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        onFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all duration-300 sm:py-8",
        isDragging
          ? "border-[#1A5345]/50 bg-[#F0F7F4] scale-[1.01]"
          : "border-[#E5EEEA] bg-[#FAFAF8] hover:border-[#1A5345]/30 hover:bg-[#F6FBF9]",
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-[#1A5345]/10" : "bg-[#E8F0EE]",
        )}
      >
        <UploadCloudIcon
          className={cn("size-5", isDragging ? "text-[#1A5345]" : "text-[#2C6A5B]")}
        />
      </div>
      <div className="px-2 text-center">
        <p className="text-[12px] font-medium text-[#102F27]">
          Drop files here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {ACCEPT_LABEL} · multiple files allowed
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

export type LabMaterialsSectionProps = {
  items: LabMaterialFile[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  className?: string
}

export function LabMaterialsSection({
  items,
  onAdd,
  onRemove,
  className,
}: LabMaterialsSectionProps) {
  const workspace = useLabMaterialsWorkspace(items)
  const pickInputRef = useRef<HTMLInputElement>(null)
  const [previewItem, setPreviewItem] = useState<LabMaterialFile | null>(null)

  const ingestFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return
      const next = Array.from(list).filter(isAllowedLabFile)
      if (next.length) onAdd(next)
    },
    [onAdd],
  )

  const openPicker = () => pickInputRef.current?.click()

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-[#E5EEEA] bg-white transition-[padding] duration-300 ease-out",
        workspace.workspaceOpen ? "p-5" : "p-4",
        className,
      )}
    >
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <FlaskConicalIcon className="size-4 text-[#1A5345]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[#102F27]">Lab reports & documents</h3>
            {!workspace.workspaceOpen ? (
              <p className="text-[10px] text-muted-foreground">
                Attach materials to expand the analysis workspace.
              </p>
            ) : (
              <p className="hidden text-[10px] text-muted-foreground sm:block">
                Upload, run AI structuring, then review the table and summary below.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EEF5F3] px-2.5 py-0.5 text-[10px] font-medium text-[#1A5345]">
            {items.length === 0 ? "No files" : `${items.length} file${items.length === 1 ? "" : "s"}`}
          </span>
          {workspace.workspaceOpen ? (
            <>
              {workspace.analysisPhase === "analyzing" ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  <Loader2Icon className="size-3 animate-spin" />
                  Analyzing…
                </span>
              ) : null}
              {workspace.analysisPhase === "complete" ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  Structured
                </span>
              ) : null}
              {workspace.analysisPhase === "error" ? (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  <AlertCircleIcon className="size-3" />
                  Failed
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <input
        ref={pickInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          ingestFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {!workspace.workspaceOpen ? (
        <LabMaterialsCollapsedStrip onPickFiles={openPicker} />
      ) : null}

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          workspace.workspaceOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "space-y-3 pt-1 transition-opacity duration-300",
              workspace.workspaceOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <LabUploadDropZone onFiles={ingestFiles} />

            {items.length > 0 ? (
              <ul className="space-y-2" aria-label="Attached lab files">
                {items.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5EEEA] bg-white p-3 transition-colors hover:bg-[#F9F8F5]"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
                      <FileIcon className="size-4 text-[#1A5345]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#102F27]">{item.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(item.file.size)}
                        {item.file.type ? ` · ${item.file.type}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={workspace.analysisPhase === "analyzing"}
                      className="h-8 w-8 shrink-0 p-0 text-[#6B7870] hover:bg-red-50 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(item.id)
                      }}
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              type="button"
              size="sm"
              disabled={items.length === 0 || workspace.analysisPhase === "analyzing"}
              onClick={() => void workspace.runAiAnalysis()}
              className={cn(
                "w-full gap-1.5 text-[12px]",
                workspace.analysisPhase === "error"
                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-[#1A5345] hover:bg-[#0F3D32]",
              )}
            >
              {workspace.analysisPhase === "analyzing" ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Analyzing document…
                </>
              ) : workspace.analysisPhase === "error" ? (
                <>
                  <RefreshCwIcon className="size-3.5" />
                  Retry analysis
                </>
              ) : (
                <>
                  <SparklesIcon className="size-3.5" />
                  Run AI structuring
                </>
              )}
            </Button>

            {workspace.analysisPhase === "error" && workspace.analysisError ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[10px] text-red-700">
                <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">Analysis failed</p>
                  <p className="mt-0.5 break-words">{workspace.analysisError}</p>
                  <p className="mt-1 text-red-500">
                    Make sure the Medical Analyzer service is running and reachable by the Next.js server.
                  </p>
                </div>
              </div>
            ) : null}

            {workspace.analysisPhase === "complete" && workspace.analysis ? (
              <div className="space-y-4 border-t border-[#E8E6E0] pt-4">
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#102F27]">
                  <ChevronRightIcon className="size-3.5 text-[#1A5345]" />
                  Extraction output
                </div>
                <LabMetaGrid bundle={workspace.analysis} />
                <LabResultsTable rows={workspace.analysis.results} />
                <LabSummaryReport text={workspace.analysis.summary} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => workspace.setChatOpen(true)}
                  className="w-full gap-1 border-violet-200 bg-violet-50/80 px-3 text-[11px] text-violet-900 hover:bg-violet-100"
                  aria-label="Open lab AI chat"
                >
                  <MessageSquareTextIcon className="size-3.5 shrink-0" />
                  <span>Ask AI</span>
                </Button>
              </div>
            ) : null}

            <p className="text-center text-[10px] text-muted-foreground">
              Powered by Mistral OCR + Groq Qwen. Files are sent to the Medical Analyzer service
              and are not stored permanently.
            </p>
          </div>
        </div>
      </div>

      <LabMaterialsAiChatDialog
        open={workspace.chatOpen}
        onOpenChange={workspace.setChatOpen}
        analysis={workspace.analysis}
      />

      <FilePreviewDialog
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      />
    </div>
  )
}
