"use client";

import { useState, useCallback } from "react";
import { Beaker, FileText, ImageIcon, Pill, Waves, X, Upload, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { RegisterDocumentFileMeta, RegisterDocumentsValues } from "./register.types";
import { useDocumentUpload, type UploadedDocumentFile } from "./useDocumentUpload";

const DOCUMENT_CATEGORIES: Array<{ value: string; label: string; icon: React.ReactNode }> = [
  { value: "lab_report", label: "Lab Report", icon: <Beaker className="size-4 text-[#1A5345]" aria-hidden /> },
  { value: "imaging", label: "Imaging", icon: <ImageIcon className="size-4 text-[#1A5345]" aria-hidden /> },
  { value: "ecg", label: "ECG", icon: <Waves className="size-4 text-[#1A5345]" aria-hidden /> },
  { value: "prescription", label: "Prescription", icon: <Pill className="size-4 text-[#1A5345]" aria-hidden /> },
  { value: "other", label: "Other", icon: <FileText className="size-4 text-[#1A5345]" aria-hidden /> },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type StepDocumentsUploadProps = {
  documentsValues: RegisterDocumentsValues;
  onFieldChange: <K extends keyof RegisterDocumentsValues>(field: K, value: RegisterDocumentsValues[K]) => void;
  isPending: boolean;
};

/**
 * StepDocumentsUpload - Component for document uploads to S3
 * SOLID: Single Responsibility - UI for document upload workflow
 * - Delegates upload logic to useDocumentUpload hook
 * - Manages local file selection state
 * - Coordinates S3 uploads with form state
 */
export function StepDocumentsUpload({ documentsValues, onFieldChange, isPending }: StepDocumentsUploadProps) {
  const doc = documentsValues as RegisterDocumentsValues;
  const category = doc.documentCategory ?? "";
  const uploadedFiles = (doc.files ?? []) as (RegisterDocumentFileMeta & Partial<UploadedDocumentFile>)[];
  const notes = doc.notes ?? "";

  const [pendingFiles, setPendingFiles] = useState<Array<{ id: string; file: File }>>([]);
  const { uploadDocument, uploading, uploadProgress, error, clearError } = useDocumentUpload();

  /**
   * Handle file selection from input
   * SOLID: Interface Segregation - focused on file selection
   */
  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list?.length) return;

      const newFiles: Array<{ id: string; file: File }> = [];
      for (let i = 0; i < list.length; i += 1) {
        const f = list.item(i);
        if (f) {
          newFiles.push({
            id: `pending-${Date.now()}-${Math.random()}`,
            file: f,
          });
        }
      }

      setPendingFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    },
    []
  );

  /**
   * Upload a specific file to S3
   * SOLID: Single Responsibility - orchestrate one file upload
   */
  const handleUploadFile = useCallback(
    async (fileId: string, file: File) => {
      try {
        if (!category) {
          clearError();
          alert("Please select a document category first");
          return;
        }

        const uploadedDoc = await uploadDocument(fileId, file, category);

        // Add uploaded file metadata to form state
        onFieldChange("files", [
          ...uploadedFiles,
          {
            ...uploadedDoc,
            id: uploadedDoc.id,
            name: uploadedDoc.fileName,
            size: uploadedDoc.fileSize,
            category: uploadedDoc.category,
          },
        ]);

        // Remove from pending
        setPendingFiles((prev) => prev.filter((pf) => pf.id !== fileId));
      } catch (err) {
        // Error is handled by the hook
        console.error("Upload failed:", err);
      }
    },
    [category, uploadDocument, onFieldChange, uploadedFiles, clearError]
  );

  /**
   * Remove an uploaded file
   * SOLID: Single Responsibility - file removal only
   */
  const removeFile = useCallback(
    (id: string) => {
      onFieldChange(
        "files",
        uploadedFiles.filter((f) => f.id !== id)
      );
    },
    [uploadedFiles, onFieldChange]
  );

  /**
   * Remove a pending file
   */
  const removePendingFile = useCallback((fileId: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== fileId));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Category and Upload Input */}
      <div className="rounded-xl border-2 border-[#E5EEEA] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doc-category" className="text-[13px] font-semibold text-[#102F27]">
              Document Category
            </Label>
            <Select
              value={category || undefined}
              onValueChange={(v) => onFieldChange("documentCategory", v)}
              disabled={isPending}
            >
              <SelectTrigger
                id="doc-category"
                className="h-10 w-full rounded-lg border-[#E8E6E0] bg-[#FAFAF8] text-[14px] text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#cfd9d5] bg-white">
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="h-10 cursor-pointer text-[14px] text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]">
                    <span className="flex items-center gap-2">
                      {c.icon}
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-files" className="text-[13px] font-semibold text-[#102F27]">
              Upload Files
            </Label>
            <Input
              id="doc-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.dcm,application/pdf,image/*"
              disabled={isPending || !category}
              onChange={onFileInputChange}
              className="h-10 w-full cursor-pointer rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#1A5345] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white file:transition-colors hover:file:bg-[#0F3D32]"
            />
          </div>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Accepted: PDF, JPG, PNG, DICOM. You can upload multiple files and repeat for different categories.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="gap-3">
          <AlertCircle className="size-4 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Files for Upload */}
      {pendingFiles.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 text-[14px] font-bold text-amber-900">Pending Uploads</div>
          <ul className="space-y-2">
            {pendingFiles.map(({ id, file }) => {
              const isUploading = uploading[id] === "uploading";
              const progress = uploadProgress[id] ?? 0;

              return (
                <li
                  key={id}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="size-4 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#102F27]">{file.name}</p>
                      {isUploading && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF5F3]">
                            <div
                              className="h-full bg-[#1A5345] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-medium text-[#1A5345]">{progress}%</span>
                        </div>
                      )}
                    </div>
                    {!isUploading && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 shrink-0 bg-[#1A5345] text-[12px] hover:bg-[#0F3D32]"
                        onClick={() => handleUploadFile(id, file)}
                        disabled={isPending}
                      >
                        Upload
                      </Button>
                    )}
                    {!isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8 shrink-0 text-[#2C6A5B] hover:bg-[#E8F0EE]"
                        onClick={() => removePendingFile(id)}
                        disabled={isPending}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Uploaded Files */}
      <div className="rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-[#102F27]">Uploaded Files</span>
          <span className="rounded-full bg-[#E8F0EE] px-2.5 py-0.5 text-[12px] font-bold text-[#1A5345]">
            {uploadedFiles.length} file(s)
          </span>
        </div>
        {uploadedFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#cfd9d5] bg-white py-10 text-center text-[13px] text-muted-foreground">
            No files uploaded yet
          </div>
        ) : (
          <ul className="space-y-2">
            {uploadedFiles.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#E5EEEA] bg-white px-3 py-2 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#102F27]">{f.name}</p>
                  <p className="text-[12px] text-muted-foreground capitalize">
                    {f.category.replace("_", " ")} · {formatBytes(f.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeFile(f.id)}
                  disabled={isPending}
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="doc-notes" className="text-[13px] font-semibold text-[#102F27]">
          Additional Notes (Optional)
        </Label>
        <textarea
          id="doc-notes"
          rows={4}
          placeholder="Add any extra information for your doctor (symptoms timeline, concerns, previous results, etc.)"
          value={notes}
          onChange={(e) => onFieldChange("notes", e.target.value)}
          disabled={isPending}
          className={cn(
            "min-h-[100px] w-full resize-y rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] px-3 py-2 text-[13px] text-[#102F27] outline-none transition-colors",
            "placeholder:text-[#9CA3AF] focus-visible:border-[#1A5345] focus-visible:ring-1 focus-visible:ring-[#1A5345]/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>
    </div>
  );
}
