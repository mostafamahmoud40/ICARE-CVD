"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2Icon,
  Clock3Icon,
  FileIcon,
  Loader2Icon,
  PaperclipIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import type { RequirementAttachmentInsight } from "@/lib/procedures/requirementAttachmentAnalysis"

import type { ProcedureRequirement } from "./assistantProcedures.types"

type RequirementItemProps = {
  requirement: ProcedureRequirement
  onToggle: () => void
  onUpload: (file: File) => void | Promise<void>
  onEdit: () => void
  onDelete: () => void
  isToggling: boolean
  isUploading: boolean
  attachmentInsight?: RequirementAttachmentInsight
  isAnalyzingAttachment?: boolean
  onDismissInsight?: () => void
  onApplyInsightSuggestion?: () => void
}

export function RequirementItem({
  requirement,
  onToggle,
  onUpload,
  onEdit,
  onDelete,
  isToggling,
  isUploading,
  attachmentInsight,
  isAnalyzingAttachment,
  onDismissInsight,
  onApplyInsightSuggestion,
}: RequirementItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showAiPanel =
    Boolean(isAnalyzingAttachment) ||
    (requirement.allowsAttachment && attachmentInsight != null)

  return (
    <div
      className={cn(
        "group relative rounded-2xl border p-4 transition-all duration-300 sm:p-5",
        requirement.isDone
          ? "border-[#1A5345]/10 bg-[#F9F8F5]/50 shadow-inner"
          : "border-[#E8E6E0]/80 bg-white hover:border-[#1A5345]/30 hover:shadow-xl hover:shadow-[#1A5345]/5",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Clinical Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isToggling}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 active:scale-90 disabled:opacity-50 sm:size-7",
            requirement.isDone
              ? "border-[#1A5345] bg-[#1A5345] shadow-[0_2px_10px_-2px_rgba(26,83,69,0.4)]"
              : "border-[#E8E6E0] bg-white hover:border-[#1A5345]/40 shadow-sm"
          )}
          aria-label={requirement.isDone ? "Mark as not done" : "Mark as done"}
        >
          {requirement.isDone && <CheckCircle2Icon className="size-4 text-white" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[14px] font-bold leading-relaxed transition-all duration-300 sm:text-[15px]",
                  requirement.isDone
                    ? "text-muted-foreground/50 line-through decoration-muted-foreground/20"
                    : "text-[#1A1F1E]",
                )}
              >
                {requirement.description ?? requirement.title}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 translate-x-2">
              <button
                type="button"
                onClick={onEdit}
                className="flex size-8 items-center justify-center rounded-xl border border-transparent text-muted-foreground/60 transition-all hover:border-[#E8E6E0] hover:bg-white hover:text-[#1A5345] hover:shadow-sm"
              >
                <PencilIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex size-8 items-center justify-center rounded-xl border border-transparent text-muted-foreground/40 transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metadata Tags */}
            {requirement.dueAt && (
              <span className={cn(
                "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                requirement.isDone ? "bg-muted-foreground/5 text-muted-foreground/40" : "bg-[#FFF8E7] text-[#B8860B] border border-[#B8860B]/10"
              )}>
                <Clock3Icon className="size-3" />
                {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(new Date(requirement.dueAt))}
              </span>
            )}

            {requirement.allowsAttachment && (
              <div className="flex flex-wrap items-center gap-2">
                {requirement.attachmentUrl && (
                  <a
                    href={requirement.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#E8F0EE] px-3.5 py-1.5 text-[12px] font-bold text-[#1A5345] transition-all hover:bg-[#D4EDE6] shadow-sm active:scale-95"
                  >
                    <FileIcon className="size-4" />
                    <span>{requirement.attachmentName ?? "View Clinical Record"}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isAnalyzingAttachment}
                  className="flex items-center gap-2 rounded-xl border border-[#E8E6E0] bg-white px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground transition-all hover:bg-[#F9F8F5] hover:text-[#1A5345] hover:border-[#1A5345]/30 active:scale-95 disabled:opacity-50"
                >
                  <PaperclipIcon className="size-4" />
                  <span>{requirement.attachmentUrl ? "Replace File" : "Attach Record"}</span>
                </button>
              </div>
            )}

            {!requirement.allowsAttachment && !requirement.dueAt && (
               <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">Standard Protocol</span>
            )}
          </div>

          {requirement.allowsAttachment && showAiPanel && (
            <div className="relative overflow-hidden rounded-2xl border border-[#1A5345]/15 bg-[#F6FBF9] p-4 shadow-inner">
              <div className="absolute top-0 right-0 size-24 rounded-full bg-[#1A5345]/5 -mr-12 -mt-12 blur-2xl opacity-40" />
              <div className="relative mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1A5345]">
                  <SparklesIcon className="size-4 shrink-0" aria-hidden />
                  AI Verification Insight
                </span>
                {attachmentInsight && onDismissInsight && !isAnalyzingAttachment && (
                  <button
                    type="button"
                    onClick={onDismissInsight}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-white hover:text-rose-600 hover:shadow-sm"
                    aria-label="Dismiss insight"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>

              {isAnalyzingAttachment ? (
                <div className="flex items-center gap-3 text-[12px] font-bold text-[#1A5345]/60 py-1">
                  <Loader2Icon className="size-4 shrink-0 animate-spin" />
                  <span>Scanning Clinical Documentation...</span>
                </div>
              ) : attachmentInsight ? (
                <div className="space-y-3">
                  <p className="text-[12px] font-medium leading-relaxed text-[#102F27]">{attachmentInsight.summary}</p>
                  {(attachmentInsight.extracted.highlights?.length ?? 0) > 0 && (
                    <div className="space-y-1.5 rounded-xl bg-white/50 p-2.5">
                      {attachmentInsight.extracted.highlights?.map((line, i) => (
                        <div key={`${i}-${line}`} className="flex items-start gap-2 text-[11px] font-bold text-[#1A5345]/80">
                           <div className="mt-1.5 size-1 shrink-0 rounded-full bg-[#1A5345]/40" />
                           <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-sm">
                       <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground/60">Confidence</span>
                       <span className={cn(
                         "text-[10px] font-black uppercase",
                         attachmentInsight.confidence === 'high' ? "text-[#1A5345]" : "text-[#B8860B]"
                       )}>{attachmentInsight.confidence}</span>
                    </div>
                    {attachmentInsight.suggestComplete && !requirement.isDone && onApplyInsightSuggestion && (
                      <button
                        type="button"
                        onClick={onApplyInsightSuggestion}
                        className="rounded-xl bg-[#1A5345] px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-[#1A5345]/10 transition-all hover:bg-[#133F34] hover:-translate-y-0.5"
                      >
                        Approve & Verify
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {requirement.isDone && requirement.completedAt && (
          <div className="flex flex-col items-end shrink-0 pt-0.5">
             <div className="flex items-center gap-1.5 rounded-full bg-[#E8F0EE] px-2.5 py-1 text-[#1A5345] shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
               <CheckCircle2Icon className="size-3" />
             </div>
             <span className="mt-1 text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(new Date(requirement.completedAt))}
             </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void Promise.resolve(onUpload(file))
          e.target.value = ""
        }}
      />
    </div>
  )
}
