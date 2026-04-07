"use client";

import { Beaker, FileText, ImageIcon, Pill, Waves, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { RegisterDocumentFileMeta, RegisterDocumentsValues } from "./register.types";

const DOCUMENT_CATEGORIES: Array<{ value: string; label: string; icon: React.ReactNode }> = [
  { value: "lab_report", label: "Lab Report", icon: <Beaker className="size-4 text-teal-600" aria-hidden /> },
  { value: "imaging", label: "Imaging", icon: <ImageIcon className="size-4 text-teal-600" aria-hidden /> },
  { value: "ecg", label: "ECG", icon: <Waves className="size-4 text-teal-600" aria-hidden /> },
  { value: "prescription", label: "Prescription", icon: <Pill className="size-4 text-teal-600" aria-hidden /> },
  { value: "other", label: "Other", icon: <FileText className="size-4 text-teal-600" aria-hidden /> },
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

export function StepDocumentsUpload({ documentsValues, onFieldChange, isPending }: StepDocumentsUploadProps) {
  const doc = documentsValues as RegisterDocumentsValues;
  const category = doc.documentCategory ?? "";
  const files = doc.files ?? [];
  const notes = doc.notes ?? "";

  function setFiles(next: RegisterDocumentFileMeta[]) {
    onFieldChange("files", next);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    const catLabel =
      DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label ??
      (category || "Uncategorized");
    const next: RegisterDocumentFileMeta[] = [...files];
    for (let i = 0; i < list.length; i += 1) {
      const f = list.item(i);
      if (!f) continue;
      next.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        category: catLabel,
      });
    }
    setFiles(next);
    e.target.value = "";
  }

  function removeFile(id: string) {
    setFiles(files.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doc-category" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Document Category
            </Label>
            <Select
              value={category || undefined}
              onValueChange={(v) => onFieldChange("documentCategory", v)}
              disabled={isPending}
            >
              <SelectTrigger
                id="doc-category"
                className="h-10 w-full rounded-lg border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
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
            <Label htmlFor="doc-files" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Upload Files
            </Label>
            <Input
              id="doc-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.dcm,application/pdf,image/*"
              disabled={isPending}
              onChange={onFileInputChange}
              className="h-10 cursor-pointer rounded-lg border-zinc-200 bg-white file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-teal-700 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Accepted: PDF, JPG, PNG, DICOM. You can upload multiple files and repeat for different categories.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Uploaded Files</span>
          <span className="rounded-full bg-teal-600/15 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">
            {files.length} file(s)
          </span>
        </div>
        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
            No files uploaded yet
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{f.name}</p>
                  <p className="text-xs text-zinc-500">
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

      <div className="space-y-2">
        <Label htmlFor="doc-notes" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
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
            "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none transition-colors",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:text-zinc-50"
          )}
        />
      </div>
    </div>
  );
}
