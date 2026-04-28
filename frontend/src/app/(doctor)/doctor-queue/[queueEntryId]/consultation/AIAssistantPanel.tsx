"use client"

import type { AISuggestion } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  BotIcon,
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileTextIcon,
  HeartIcon,
  PillIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const SUGGESTION_TYPE_CONFIG: Record<AISuggestion["type"], { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  diagnosis: { icon: ClipboardCheckIcon, label: "Diagnosis", color: "text-violet-600", bgColor: "bg-violet-50" },
  prescription: { icon: PillIcon, label: "Prescription", color: "text-blue-600", bgColor: "bg-blue-50" },
  note: { icon: FileTextIcon, label: "Note Draft", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  risk_assessment: { icon: HeartIcon, label: "Risk Assessment", color: "text-orange-600", bgColor: "bg-orange-50" },
  interaction_warning: { icon: AlertTriangleIcon, label: "Interaction Warning", color: "text-red-600", bgColor: "bg-red-50" },
}

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: AISuggestion
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const config = SUGGESTION_TYPE_CONFIG[suggestion.type]
  const Icon = config.icon

  return (
    <div className={cn(
      "rounded-xl border-2 p-3 transition-all",
      suggestion.accepted === true
        ? "border-emerald-200 bg-emerald-50/50"
        : suggestion.accepted === false
          ? "border-[#E5EEEA] bg-[#FAFAF8] opacity-60"
          : "border-[#E5EEEA] bg-white hover:border-[#A8C4BC]",
    )}>
      <div className="flex items-start gap-2">
        <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", config.bgColor)}>
          <Icon className={cn("size-3.5", config.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", config.bgColor, config.color)}>
              {config.label}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <SparklesIcon className="size-2.5 text-violet-500" />
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-1 text-[12px] font-medium text-[#102F27]">{suggestion.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{suggestion.content}</p>

          {suggestion.accepted === null ? (
            <div className="mt-2 flex gap-1.5">
              <Button
                size="sm"
                className="h-6 gap-1 bg-[#1A5345] px-2 text-[10px] hover:bg-[#0F3D32]"
                onClick={() => onAccept(suggestion.id)}
              >
                <CheckCircle2Icon className="size-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[10px]"
                onClick={() => onDismiss(suggestion.id)}
              >
                <XIcon className="size-3" />
                Dismiss
              </Button>
            </div>
          ) : suggestion.accepted ? (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <CheckCircle2Icon className="size-3" />
              Accepted
            </div>
          ) : (
            <div className="mt-2 text-[10px] font-medium text-muted-foreground">Dismissed</div>
          )}
        </div>
      </div>
    </div>
  )
}

export type AIAssistantPanelProps = {
  suggestions: AISuggestion[]
  onAcceptSuggestion: (id: string) => void
  onDismissSuggestion: (id: string) => void
  collapsed: boolean
  onToggle: () => void
  widthPx: number
  onNudgeWidth?: (delta: number) => void
}

export function AIAssistantPanel({
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  collapsed,
  onToggle,
  widthPx,
  onNudgeWidth,
}: AIAssistantPanelProps) {
  const pendingCount = suggestions.filter((s) => s.accepted === null).length
  const acceptedCount = suggestions.filter((s) => s.accepted === true).length

  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center border-l border-white/20 bg-transparent py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-violet-600 transition-colors hover:bg-violet-50"
          aria-label="Expand AI assistant"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col border-l border-white/20 bg-transparent"
      style={{ width: widthPx, minWidth: widthPx, maxWidth: widthPx }}
    >
      <div className="border-b border-white/10 bg-transparent px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <BotIcon className="size-4 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-semibold text-[#102F27]">AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">Real-time clinical support</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {onNudgeWidth ? (
              <>
                <button
                  type="button"
                  onClick={() => onNudgeWidth(-20)}
                  className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-violet-600 transition-colors hover:bg-violet-50"
                  aria-label="Narrow AI panel"
                >
                  <MinusIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNudgeWidth(20)}
                  className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-violet-600 transition-colors hover:bg-violet-50"
                  aria-label="Widen AI panel"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onToggle}
              className="flex size-7 items-center justify-center rounded-md border border-[#E8E6E0] text-violet-600 transition-colors hover:bg-violet-50"
              aria-label="Collapse AI assistant"
            >
              <ChevronLeftIcon className="size-4 rotate-180" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
            {pendingCount} pending
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            {acceptedCount} accepted
          </span>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-3">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={onAcceptSuggestion}
            onDismiss={onDismissSuggestion}
          />
        ))}

        {suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#F5F5F3]">
              <SparklesIcon className="size-5 text-[#9CA3AF]" />
            </div>
            <p className="text-[12px] text-muted-foreground">AI suggestions will appear as you fill in the consultation data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
