"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2Icon,
  Clock3Icon,
  CircleIcon,
  FileIcon,
  PaperclipIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import type { ProcedureRequirement } from "./assistantProcedures.types"

type RequirementItemProps = {
  requirement: ProcedureRequirement
  onToggle: () => void
  onUpload: (file: File) => void
  onEdit: () => void
  onDelete: () => void
  isToggling: boolean
  isUploading: boolean
}

export function RequirementItem({
  requirement,
  onToggle,
  onUpload,
  onEdit,
  onDelete,
  isToggling,
  isUploading,
}: RequirementItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        requirement.isDone
          ? "border-[#D7E7E2] bg-[#F6FBF9]"
          : "border-[#E5EEEA] bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={isToggling}
          className="mt-0.5 shrink-0 transition-opacity disabled:opacity-50"
          aria-label={requirement.isDone ? "Mark as not done" : "Mark as done"}
        >
          {requirement.isDone ? (
            <CheckCircle2Icon className="size-5 text-[#1A5345]" />
          ) : (
            <CircleIcon className="size-5 text-[#9CA3AF]" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[12px] font-medium sm:text-[13px]",
                  requirement.isDone
                    ? "text-[#1A5345] line-through decoration-[#9AB9AF]"
                    : "text-[#102F27]",
                )}
              >
                {requirement.description ?? requirement.title}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={onEdit}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                aria-label="Edit requirement"
              >
                <PencilIcon className="size-3" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Delete requirement"
              >
                <Trash2Icon className="size-3" />
              </button>
            </div>
          </div>

          {requirement.allowsAttachment && (
            <div className="flex flex-wrap items-center gap-2">
              {requirement.attachmentUrl && (
                <a
                  href={requirement.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md bg-[#E8F0EE] px-2 py-1 text-[10px] font-medium text-[#1A5345] transition-colors hover:bg-[#D0E4DE] sm:text-[11px]"
                >
                  <FileIcon className="size-3" />
                  {requirement.attachmentName ?? "View file"}
                </a>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1 rounded-md border border-[#E5EEEA] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-[#F6FBF9] hover:text-[#1A5345] disabled:opacity-50 sm:text-[11px]"
              >
                <PaperclipIcon className="size-3" />
                {requirement.attachmentUrl ? "Replace file" : "Attach file"}
              </button>
            </div>
          )}

          {!requirement.allowsAttachment && (
            <span className="inline-block rounded-md bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-muted-foreground">
              No attachment needed
            </span>
          )}

          {requirement.dueAt && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700 sm:text-[10px]">
              <Clock3Icon className="size-2.5" />
              Due{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "short",
              }).format(new Date(requirement.dueAt))}
            </span>
          )}
        </div>

        {requirement.isDone && requirement.completedAt && (
          <span className="shrink-0 text-[9px] text-muted-foreground sm:text-[10px]">
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(
              new Date(requirement.completedAt),
            )}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
