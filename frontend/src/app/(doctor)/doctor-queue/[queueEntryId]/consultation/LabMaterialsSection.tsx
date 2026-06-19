"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { LabMaterialFile } from "./consultation.types"
import type { LabAnalysisBundle, LabResultRow, LabResultStatus } from "./labMaterials.types"
import { LabMaterialsAiChatDialog } from "./LabMaterialsAiChatDialog"
import { useLabMaterialsWorkspace, type UseLabMaterialsWorkspaceResult } from "./useLabMaterialsWorkspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircleIcon,
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

function isImageFile(item: LabMaterialFile): boolean {
  const name = (item.file?.name ?? item.fileName).toLowerCase()
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
    if (!item?.file) {
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
  const isImage = isImageFile(item)
  const displayName = item.fileName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#E8E6E0] px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#102F27]">
            <FileIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <span className="truncate">{displayName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#F9F8F5] p-4">
          {isImage && objectUrl ? (
            <img
              src={objectUrl}
              alt={displayName}
              className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#E5EEEA] bg-white p-8 text-center">
              <FileIcon className="size-10 text-[#1A5345]" aria-hidden />
              <div>
                <p className="text-[14px] font-medium text-[#102F27]">{displayName}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {formatBytes(item.fileSize)}
                  {file?.type ? ` · ${file.type}` : ""}
                </p>
              </div>
              {objectUrl && file && (
                <a
                  href={objectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1A5345] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#133F34]"
                >
                  Open file
                </a>
              )}
              {!file && item.documentId ? (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Stored in MinIO — preview available after download is enabled.
                </p>
              ) : null}
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

function statusBadgeClass(status: LabResultStatus): string {
  switch (status) {
    case "Normal":
      return "border-0 bg-emerald-500 text-white hover:bg-emerald-500"
    case "High":
      return "border-0 bg-amber-500 text-white hover:bg-amber-500"
    case "Low":
      return "border-0 bg-sky-500 text-white hover:bg-sky-500"
    case "Critical":
      return "border-0 bg-rose-500 text-white hover:bg-rose-500"
    default:
      return "border-0 bg-[#6B7870] text-white hover:bg-[#6B7870]"
  }
}

// ─── Presentational pieces (SRP: one visual concern each) ─────────────────────

function LabMaterialsCollapsedStrip({ onPickFiles }: { onPickFiles: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] text-muted-foreground">
        Attach lab reports to open the analysis workspace.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onPickFiles}
        className="h-8 w-full shrink-0 gap-1.5 rounded-lg border-[#E8E6E0] text-[12px] font-medium hover:bg-[#F9F8F5] sm:w-auto"
      >
        <UploadCloudIcon className="size-3.5 text-[#1A5345]" aria-hidden />
        Add lab files
      </Button>
    </div>
  )
}

function LabMetaGrid({ bundle }: { bundle: LabAnalysisBundle }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
        <p className="text-[12px] font-bold text-[#102F27]">Facility</p>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Hospital</dt>
            <dd className="text-right font-semibold text-[#1A1F1E]">{bundle.facility.hospitalName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Lab</dt>
            <dd className="text-right font-semibold text-[#1A1F1E]">{bundle.facility.labName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Ordering</dt>
            <dd className="text-right font-semibold text-[#1A1F1E]">{bundle.facility.doctorName}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
        <p className="text-[12px] font-bold text-[#102F27]">Patient (document)</p>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">ID</dt>
            <dd className="font-mono text-[12px] font-semibold text-[#1A1F1E]">{bundle.patient.id}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Collected</dt>
            <dd className="font-semibold text-[#1A1F1E]">{bundle.patient.dateCollected}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Reported</dt>
            <dd className="font-semibold text-[#1A1F1E]">{bundle.patient.dateReported}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function LabResultsTable({ rows }: { rows: LabResultRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5EEEA]">
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <h4 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Structured results</h4>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Verify extracted values against source documents.</p>
      </div>
      <div className="scrollbar-hide max-h-[360px] overflow-x-auto overflow-y-auto sm:max-h-none">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E8E6E0] bg-white">
              <th className="px-4 py-3 text-[13px] font-bold text-[#102F27]">Test</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#102F27]">Value</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#102F27]">Ref.</th>
              <th className="px-4 py-3 text-[13px] font-bold text-[#102F27]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.testName} className="border-b border-[#F0EFEA] last:border-0 hover:bg-[#F9F8F5]/60">
                <td className="px-4 py-3 text-[14px] font-semibold text-[#1A1F1E]">{row.testName}</td>
                <td className="px-4 py-3 text-[14px] font-medium tabular-nums text-[#1A1F1E]">
                  {row.value} {row.unit}
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.referenceRange}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="default"
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-none",
                      statusBadgeClass(row.status),
                    )}
                  >
                    {row.status}
                  </Badge>
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
    <div className="rounded-xl border border-[#E5EEEA] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="size-5 text-[#1A5345]" aria-hidden />
        <h4 className="font-serif text-[15px] font-bold text-[#1A1F1E]">Summary report</h4>
      </div>
      <p className="text-[13px] leading-relaxed text-[#374151]">{text}</p>
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
      <div className="px-2 text-center">
        <p className="text-[14px] font-medium text-[#102F27]">
          Drop files here or{" "}
          <span className="text-[#1A5345] underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
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
  activeItemId?: string | null
  onSelectItem?: (id: string) => void
  workspace?: UseLabMaterialsWorkspaceResult
}

export function LabMaterialsSection({
  items,
  onAdd,
  onRemove,
  className,
  activeItemId,
  onSelectItem,
  workspace: externalWorkspace,
}: LabMaterialsSectionProps) {
  const internalWorkspace = useLabMaterialsWorkspace(items)
  const workspace = externalWorkspace ?? internalWorkspace
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
        "rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm transition-[padding] duration-300 ease-out",
        workspace.workspaceOpen ? "p-5" : "p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FlaskConicalIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <h3 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Lab reports & documents</h3>
          </div>
          <p className="mt-1 pl-7 text-[13px] text-muted-foreground">
            {workspace.workspaceOpen
              ? "Upload reports, run AI structuring, then review results below."
              : "Attach lab materials to expand the analysis workspace."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-[#EEF5F3] px-2.5 py-1 text-[11px] font-bold text-[#1A5345] shadow-none hover:bg-[#EEF5F3]"
          >
            {items.length === 0 ? "No files" : `${items.length} file${items.length === 1 ? "" : "s"}`}
          </Badge>
          {workspace.workspaceOpen && workspace.analysisPhase === "analyzing" ? (
            <Badge
              variant="default"
              className="gap-1 rounded-lg border-0 bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-amber-500"
            >
              <Loader2Icon className="size-3 animate-spin" aria-hidden />
              Analyzing
            </Badge>
          ) : null}
          {workspace.workspaceOpen && workspace.analysisPhase === "complete" ? (
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-emerald-500"
            >
              Structured
            </Badge>
          ) : null}
          {workspace.workspaceOpen && workspace.analysisPhase === "error" ? (
            <Badge
              variant="default"
              className="gap-1 rounded-lg border-0 bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-rose-500"
            >
              <AlertCircleIcon className="size-3" aria-hidden />
              Failed
            </Badge>
          ) : null}
          {workspace.workspaceOpen ? (
            <Badge
              variant="default"
              className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]"
            >
              AI · OCR + LLM
            </Badge>
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
                {items.map((item) => {
                  const isActive = activeItemId ? item.id === activeItemId : false
                  return (
                    <li
                      key={item.id}
                      onClick={() => {
                        onSelectItem?.(item.id)
                        setPreviewItem(item)
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-[#F9F8F5]",
                        isActive
                          ? "border-[#1A5345]/40"
                          : "border-[#E8E6E0]/60",
                      )}
                    >
                      <FileIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#1A1F1E]">
                          {item.fileName}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {formatBytes(item.fileSize)}
                          {item.uploadPhase === "uploading" ? " · Uploading…" : ""}
                          {item.uploadPhase === "error" ? " · Upload failed" : ""}
                          {item.file?.type ? ` · ${item.file.type}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={workspace.analysisPhase === "analyzing"}
                        className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-rose-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(item.id)
                        }}
                        aria-label={`Remove ${item.fileName}`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            ) : null}

            <Button
              type="button"
              size="sm"
              disabled={(() => {
                const selectedId = activeItemId ?? items[0]?.id
                const selected = items.find((item) => item.id === selectedId)
                return (
                  items.length === 0 ||
                  workspace.analysisPhase === "analyzing" ||
                  items.some((item) => item.uploadPhase === "uploading") ||
                  !selected?.file ||
                  selected.uploadPhase !== "ready"
                )
              })()}
              onClick={() => void workspace.runAiAnalysis()}
              className={cn(
                "h-10 w-full gap-1.5 rounded-lg text-[13px] font-bold shadow-sm",
                workspace.analysisPhase === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-0 bg-[#1A5345] text-white hover:bg-[#133F34]",
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
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
                <div className="min-w-0 text-[13px] text-rose-700">
                  <p className="font-semibold text-rose-800">Analysis failed</p>
                  <p className="mt-1 break-words">{workspace.analysisError}</p>
                  <p className="mt-2 text-[12px] text-rose-600/90">
                    Ensure the Medical Analyzer service is running and reachable.
                  </p>
                </div>
              </div>
            ) : null}

            {workspace.analysisPhase === "complete" && workspace.analysis ? (
              <div className="space-y-4 border-t border-[#E8E6E0]/60 pt-4">
                <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">Extraction output</p>
                <LabMetaGrid bundle={workspace.analysis} />
                <LabResultsTable rows={workspace.analysis.results} />
                <LabSummaryReport text={workspace.analysis.summary} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => workspace.setChatOpen(true)}
                  className="h-10 w-full gap-1.5 rounded-lg border-[#E8E6E0] text-[13px] font-medium hover:bg-[#F9F8F5]"
                  aria-label="Open lab AI chat"
                >
                  <MessageSquareTextIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                  Ask AI about these results
                </Button>
              </div>
            ) : null}

            <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
              Powered by Mistral OCR + Groq. Files are stored in MinIO; structured results save to the patient record.
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
