"use client"

import type { AISuggestion } from "./consultation.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  ChevronLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  HeartIcon,
  MinusIcon,
  PillIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const PANEL_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm"

const SUGGESTION_TYPE_CONFIG: Record<
  AISuggestion["type"],
  {
    icon: React.ElementType
    label: string
    badgeClass: string
    cardClass: string
    detailClass: string
  }
> = {
  diagnosis: {
    icon: ClipboardCheckIcon,
    label: "Diagnosis",
    badgeClass: "bg-violet-600 hover:bg-violet-600",
    cardClass: "border-violet-100 bg-gradient-to-br from-violet-50/50 to-white",
    detailClass: "text-violet-900/70",
  },
  prescription: {
    icon: PillIcon,
    label: "Prescription",
    badgeClass: "bg-blue-600 hover:bg-blue-600",
    cardClass: "border-blue-100 bg-gradient-to-br from-blue-50/50 to-white",
    detailClass: "text-blue-900/70",
  },
  note: {
    icon: FileTextIcon,
    label: "Note draft",
    badgeClass: "bg-emerald-600 hover:bg-emerald-600",
    cardClass: "border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white",
    detailClass: "text-emerald-900/70",
  },
  risk_assessment: {
    icon: HeartIcon,
    label: "Risk assessment",
    badgeClass: "bg-amber-600 hover:bg-amber-600",
    cardClass: "border-amber-100 bg-gradient-to-br from-amber-50/50 to-white",
    detailClass: "text-amber-900/70",
  },
  interaction_warning: {
    icon: AlertTriangleIcon,
    label: "Interaction warning",
    badgeClass: "bg-rose-600 hover:bg-rose-600",
    cardClass: "border-rose-100 bg-gradient-to-br from-rose-50/50 to-white",
    detailClass: "text-rose-900/70",
  },
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
  const confidencePct = Math.round(suggestion.confidence * 100)

  return (
    <article
      className={cn(
        "space-y-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        suggestion.accepted === true
          ? "border-[#E8E6E0]/60 bg-white"
          : suggestion.accepted === false
            ? "border-[#E8E6E0]/60 bg-[#FAFAF8] opacity-70"
            : config.cardClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className={cn("rounded-lg border-0 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm", config.badgeClass)}
          >
            {config.label}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600/70">
            <SparklesIcon className="size-3 text-violet-500" aria-hidden />
            {confidencePct}% match
          </span>
        </div>
        <Icon className={cn("size-4 shrink-0", config.detailClass)} aria-hidden />
      </div>

      <div>
        <h4 className="text-[13px] font-bold text-[#1A1F1E]">{suggestion.title}</h4>
        <p className={cn("mt-1 text-[12px] leading-relaxed", config.detailClass)}>{suggestion.content}</p>
      </div>

      {suggestion.accepted === null ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-8 flex-1 rounded-lg border-0 bg-[#1A5345] text-[11px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            onClick={() => onAccept(suggestion.id)}
          >
            <CheckIcon className="size-3.5" aria-hidden />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 rounded-lg border-[#E8E6E0] bg-white text-[11px] font-bold shadow-sm hover:bg-[#F9F8F5]"
            onClick={() => onDismiss(suggestion.id)}
          >
            <XIcon className="size-3.5" aria-hidden />
            Dismiss
          </Button>
        </div>
      ) : suggestion.accepted ? (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <CheckCircle2Icon className="size-3.5" aria-hidden />
          Accepted
        </div>
      ) : (
        <p className="text-[11px] font-medium text-muted-foreground">Dismissed</p>
      )}
    </article>
  )
}

const panelControlClass =
  "flex size-7 items-center justify-center rounded-lg border border-[#E8E6E0]/60 bg-white text-[#1A5345] shadow-sm transition-colors hover:bg-[#F9F8F5]"

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
      <div className="flex w-11 shrink-0 flex-col items-center border-l border-[#E8E6E0]/60 bg-[#F9F8F5] py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="size-8 border border-[#E8E6E0]/60 bg-white text-violet-600 shadow-sm hover:bg-violet-50"
          aria-label="Expand AI assistant"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col border-l border-[#E8E6E0]/60 bg-[#F9F8F5]"
      style={{ width: widthPx, minWidth: widthPx, maxWidth: widthPx }}
    >
      <div className="border-b border-[#E8E6E0]/60 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="size-5 shrink-0 text-violet-600" aria-hidden />
              <h3 className="truncate font-serif text-[14px] font-bold text-[#1A1F1E]">AI assistant</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">Real-time clinical support</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onNudgeWidth ? (
              <>
                <button
                  type="button"
                  onClick={() => onNudgeWidth(-20)}
                  className={panelControlClass}
                  aria-label="Narrow AI panel"
                >
                  <MinusIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNudgeWidth(20)}
                  className={panelControlClass}
                  aria-label="Widen AI panel"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onToggle}
              className={panelControlClass}
              aria-label="Collapse AI assistant"
            >
              <ChevronLeftIcon className="size-4 rotate-180" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-violet-600"
          >
            {pendingCount} pending
          </Badge>
          <Badge
            variant="default"
            className="rounded-lg border-0 bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-none hover:bg-emerald-500"
          >
            {acceptedCount} accepted
          </Badge>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-4">
        {suggestions.length > 0 ? (
          suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={onAcceptSuggestion}
              onDismiss={onDismissSuggestion}
            />
          ))
        ) : (
          <div className={cn(PANEL_CARD, "flex flex-col items-center justify-center py-10 text-center")}>
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-dashed border-[#E8E6E0] bg-[#F9F8F5]">
              <SparklesIcon className="size-5 text-violet-400/60" aria-hidden />
            </div>
            <p className="text-[12px] font-medium text-muted-foreground">
              AI suggestions will appear as you fill in the consultation data.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
