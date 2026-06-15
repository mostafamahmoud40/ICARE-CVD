"use client"

import { useRef } from "react"
import {
  FileIcon,
  FolderOpenIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
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
  studyKindToPayload,
  type StudyKind,
} from "../assistant-queue/assistantQueue.documents.types"
import type { PendingPatientDocument } from "./addPatient.types"

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

type AddPatientDocumentsSectionProps = {
  pendingDocuments: PendingPatientDocument[]
  studyKind: StudyKind
  onStudyKindChange: (kind: StudyKind) => void
  onAddFiles: (files: FileList | null) => void
  onRemove: (id: string) => void
  isUploading: boolean
}

export function AddPatientDocumentsSection({
  pendingDocuments,
  studyKind,
  onStudyKindChange,
  onAddFiles,
  onRemove,
  isUploading,
}: AddPatientDocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <FolderOpenIcon className="size-5 text-[#1A5345]" aria-hidden />
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Patient documents</h3>
          <p className="text-[12px] text-muted-foreground">
            Attach imaging, lab reports, or other files — saved to the chart when you register.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="add-patient-doc-type" className="text-sm font-medium text-[#374151]">
            Document type
          </Label>
          <Select value={studyKind} onValueChange={(v) => onStudyKindChange(v as StudyKind)}>
            <SelectTrigger
              id="add-patient-doc-type"
              className="h-10 w-full rounded-xl border-gray-200 bg-white text-[14px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDY_KIND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[14px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.dcm"
            onChange={(e) => {
              onAddFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="h-10 gap-2 rounded-xl border-[#D6E6DF] bg-white text-[13px] font-semibold text-[#1A5345] hover:bg-[#F0F4F2]"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <UploadIcon className="size-4" aria-hidden />
            )}
            Add files
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        PDF or images (DICOM single-file where supported). Files upload after the patient record is created.
      </p>

      {pendingDocuments.length > 0 ? (
        <div className="space-y-2">
          <FieldLabel style={{ color: "#374151" }}>
            Queued for upload ({pendingDocuments.length})
          </FieldLabel>
          <ul className="space-y-2">
            {pendingDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
              >
                <FileIcon className="mt-0.5 size-4 shrink-0 text-[#6B7870]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#102F27]">{doc.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {DOCUMENT_CATEGORY_LABELS[
                      studyKindToPayload(doc.studyKind, doc.file.name).registerCategory
                    ] ?? doc.studyKind}
                    {" · "}
                    {formatBytes(doc.file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isUploading}
                  className="size-8 shrink-0 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-red-600"
                  onClick={() => onRemove(doc.id)}
                  aria-label={`Remove ${doc.file.name}`}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 px-4 py-6 text-center text-[13px] text-muted-foreground">
          No files added yet. Optional — add scans or lab reports the patient brought.
        </p>
      )}
    </div>
  )
}
