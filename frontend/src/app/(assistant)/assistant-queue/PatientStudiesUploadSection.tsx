"use client"

import { useCallback, useRef, useState } from "react"
import { FileIcon, Loader2Icon, RadiationIcon, UploadIcon } from "lucide-react"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DOCUMENT_CATEGORY_LABELS,
  STUDY_KIND_OPTIONS,
  type StudyKind,
} from "./assistantQueue.documents.types"
import {
  formatQueueDocumentUploadError,
  useAssistantQueuePatientDocuments,
} from "./useAssistantQueuePatientDocuments"

function formatBytes(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

type PatientStudiesUploadSectionProps = {
  queueEntryId: string
}

export function PatientStudiesUploadSection({ queueEntryId }: PatientStudiesUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [studyKind, setStudyKind] = useState<StudyKind>("xray")

  const {
    documents,
    isLoadingDocuments,
    isDocumentsError,
    uploadStudyFile,
    isUploading,
    refetchDocuments,
  } = useAssistantQueuePatientDocuments(queueEntryId)

  const onPickFiles = useCallback(
    async (list: FileList | null) => {
      const file = list?.[0]
      if (!file) return

      try {
        await uploadStudyFile({ file, studyKind })
        showIcareSuccessToast("File saved to the patient chart", file.name)
      } catch (err) {
        showIcareErrorToast("Could not upload file", formatQueueDocumentUploadError(err))
      } finally {
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [studyKind, uploadStudyFile],
  )

  return (
    <div className="rounded-lg border border-[#E5EEEA] bg-[#FBFDFC] p-2.5 sm:p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-8">
          <RadiationIcon className="size-3.5 text-[#1A5345] sm:size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-muted-foreground sm:text-[10px]">
            Imaging & documents
          </p>
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">
            Attach scans or labs the patient brought (stored on their record).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`study-type-${queueEntryId}`} className="text-[9px] text-muted-foreground sm:text-[10px]">
            Document type
          </Label>
          <Select value={studyKind} onValueChange={(v) => setStudyKind(v as StudyKind)}>
            <SelectTrigger
              id={`study-type-${queueEntryId}`}
              className="h-8 border-[#E8E6E0] bg-white text-[11px] sm:h-9 sm:text-[12px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDY_KIND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.dcm"
            onChange={(e) => void onPickFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="h-8 gap-1.5 border-[#D6E6DF] bg-white text-[10px] sm:h-9 sm:text-[11px]"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <UploadIcon className="size-3.5" />
            )}
            Upload file
          </Button>
        </div>
      </div>

      <p className="mt-2 text-[8px] text-muted-foreground sm:text-[9px]">
        PDF or images (DICOM single-file where supported). Requires MinIO on the server.
      </p>

      <div className="mt-3 border-t border-[#E8E6E0] pt-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[9px] font-medium text-[#102F27] sm:text-[10px]">On record today</span>
          {isDocumentsError && (
            <button
              type="button"
              onClick={() => void refetchDocuments()}
              className="text-[9px] font-medium text-[#1A5345] underline sm:text-[10px]"
            >
              Retry
            </button>
          )}
        </div>
        {isLoadingDocuments ? (
          <div className="flex items-center gap-2 py-3 text-[10px] text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <p className="py-2 text-[10px] text-muted-foreground sm:text-[11px]">
            No files linked yet for this visit.
          </p>
        ) : (
          <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-0.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-2 rounded-md border border-[#E8E6E0] bg-white px-2 py-1.5"
              >
                <FileIcon className="mt-0.5 size-3.5 shrink-0 text-[#6B7870]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium text-[#102F27] sm:text-[11px]">
                    {doc.title ?? doc.fileName ?? "Document"}
                  </p>
                  <p className="text-[8px] text-muted-foreground sm:text-[9px]">
                    {(doc.category && DOCUMENT_CATEGORY_LABELS[doc.category]) ?? doc.category ?? "—"}
                    {" · "}
                    {formatBytes(doc.sizeBytes)}
                    {" · "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(doc.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
