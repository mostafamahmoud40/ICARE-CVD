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
  { value: "lab_report", label: "Lab Report", icon: <Beaker className="size-4 text-primary" aria-hidden /> },
  { value: "imaging", label: "Imaging", icon: <ImageIcon className="size-4 text-primary" aria-hidden /> },
  { value: "ecg", label: "ECG", icon: <Waves className="size-4 text-primary" aria-hidden /> },
  { value: "prescription", label: "Prescription", icon: <Pill className="size-4 text-primary" aria-hidden /> },
  { value: "other", label: "Other", icon: <FileText className="size-4 text-primary" aria-hidden /> },
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
            id: uploadedDoc.id,
            name: uploadedDoc.fileName,
            size: uploadedDoc.fileSize,
            category: uploadedDoc.category,
            ...uploadedDoc,
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
    <div className="flex flex-col gap-6">
      {/* Category and Upload Input */}
      <div className="rounded-xl border border-border/90 bg-muted/20 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doc-category" className="text-sm font-medium text-foreground">
              Document Category
            </Label>
            <Select
              value={category || undefined}
              onValueChange={(v) => onFieldChange("documentCategory", v)}
              disabled={isPending}
            >
              <SelectTrigger
                id="doc-category"
                className="h-10 w-full rounded-lg border-input bg-background"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="cursor-pointer">
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
            <Label htmlFor="doc-files" className="text-sm font-medium text-foreground">
              Upload Files
            </Label>
            <Input
              id="doc-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.dcm,application/pdf,image/*"
              disabled={isPending || !category}
              onChange={onFileInputChange}
              className="h-10 cursor-pointer rounded-lg border-input bg-background file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
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
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-3 text-sm font-medium text-amber-900 dark:text-amber-200">Pending Uploads</div>
          <ul className="space-y-2">
            {pendingFiles.map(({ id, file }) => {
              const isUploading = uploading[id] === "uploading";
              const progress = uploadProgress[id] ?? 0;

              return (
                <li
                  key={id}
                  className="rounded-lg border border-amber-200 bg-card px-3 py-2 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="size-4 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      {isUploading && (
                        <div className="mt-1 flex gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
                            <div
                              className="h-full bg-amber-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-amber-600 dark:text-amber-400">{progress}%</span>
                        </div>
                      )}
                    </div>
                    {!isUploading && (
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 bg-amber-600 hover:bg-amber-700"
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
                        className="shrink-0 text-amber-600 hover:bg-amber-50"
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
      <div className="rounded-xl border border-border/90 bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Uploaded Files</span>
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {uploadedFiles.length} file(s)
          </span>
        </div>
        {uploadedFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
            No files uploaded yet
          </div>
        ) : (
          <ul className="space-y-2">
            {uploadedFiles.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.category} · {formatBytes(f.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
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
        <Label htmlFor="doc-notes" className="text-sm font-medium text-foreground">
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
            "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          )}
        />
      </div>
    </div>
  );
}
