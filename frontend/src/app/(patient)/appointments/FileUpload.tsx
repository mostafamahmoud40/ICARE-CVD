"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { UploadIcon, FileIcon, XIcon, FileTextIcon, Beaker, ImageIcon, Pill, Waves, Stethoscope, FileBadge } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FileCategory = 
  | "ecg"
  | "blood-test"
  | "xray"
  | "prescription"
  | "medical-history"
  | "insurance"
  | "other"

export const fileCategories: { id: FileCategory; label: string; icon: React.ReactNode }[] = [
  { id: "ecg", label: "ECG Report", icon: <Waves className="size-4 text-[#00392D]" /> },
  { id: "blood-test", label: "Blood Test", icon: <Beaker className="size-4 text-[#00392D]" /> },
  { id: "xray", label: "X-Ray / Imaging", icon: <ImageIcon className="size-4 text-[#00392D]" /> },
  { id: "prescription", label: "Prescription", icon: <Pill className="size-4 text-[#00392D]" /> },
  { id: "medical-history", label: "Medical History", icon: <Stethoscope className="size-4 text-[#00392D]" /> },
  { id: "insurance", label: "Insurance Document", icon: <FileBadge className="size-4 text-[#00392D]" /> },
  { id: "other", label: "Other", icon: <FileTextIcon className="size-4 text-[#00392D]" /> },
]

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  category: FileCategory
  file: File
}

interface FileUploadProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      category: "other",
      file,
    }))

    onFilesChange([...files, ...newFiles])
  }

  const handleCategoryChange = (fileId: string, category: FileCategory) => {
    onFilesChange(
      files.map((f) => (f.id === fileId ? { ...f, category } : f))
    )
  }

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="rounded-2xl border border-[#E8E6E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F0EE]">
          <FileTextIcon className="size-4 text-[#00392D]" />
        </div>
        <h3 className="text-lg font-bold text-[#1A1F1E]">Attachments</h3>
        <span className="text-[13px] text-[#6B7870]">(Optional)</span>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-[#00392D] bg-[#E8F0EE]"
            : "border-[#E8E6E0] bg-[#FAFAF8] hover:border-[#A8C4BC]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#E8F0EE]">
            <UploadIcon className="size-6 text-[#00392D]" />
          </div>
          <p className="text-[14px] font-medium text-[#1A1F1E]">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-[12px] text-[#6B7870]">
            PDF, Images, Word docs up to 10MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                  <FileIcon className="size-5 text-[#00392D]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1A1F1E]">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-[#6B7870]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(file.id)}
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              
              {/* File Type Selector */}
              <div className="mt-3">
                <Select
                  value={file.category}
                  onValueChange={(v) => handleCategoryChange(file.id, v as FileCategory)}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#E8E6E0] bg-white text-[13px]">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {fileCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="cursor-pointer text-[13px]">
                        <span className="flex items-center gap-2">
                          {cat.icon}
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
