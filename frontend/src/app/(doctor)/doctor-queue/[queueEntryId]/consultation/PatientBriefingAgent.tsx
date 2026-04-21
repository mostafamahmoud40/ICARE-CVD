"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { PatientSummary } from "./consultation.types"
import { usePatientBriefing, type VisibleMessage } from "./usePatientBriefing"
import { TypewriterText } from "./TypewriterText"
import {
  BotIcon,
  ChevronDownIcon,
  Maximize2Icon,
  SparklesIcon,
  ActivityIcon,
  HeartIcon,
  PillIcon,
  ShieldAlertIcon,
  UsersIcon,
  UserRoundIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react"

type MessageIconProps = {
  type: VisibleMessage["type"]
}

function MessageIcon({ type }: MessageIconProps) {
  const iconMap: Record<VisibleMessage["type"], { icon: React.ElementType; color: string; bg: string }> = {
    greeting: { icon: SparklesIcon, color: "text-[#1A5345]", bg: "bg-[#E8F0EE]" },
    demographics: { icon: UserRoundIcon, color: "text-[#1A5345]", bg: "bg-[#E8F0EE]" },
    conditions: { icon: ActivityIcon, color: "text-[#1A5345]", bg: "bg-[#E8F0EE]" },
    medications: { icon: PillIcon, color: "text-[#1A5345]", bg: "bg-[#E8F0EE]" },
    allergies: { icon: ShieldAlertIcon, color: "text-red-600", bg: "bg-red-50" },
    family: { icon: UsersIcon, color: "text-[#1A5345]", bg: "bg-[#E8F0EE]" },
    lifestyle: { icon: HeartIcon, color: "text-amber-600", bg: "bg-amber-50" },
    risk: { icon: AlertTriangleIcon, color: "text-red-600", bg: "bg-red-50" },
    complete: { icon: CheckCircle2Icon, color: "text-emerald-600", bg: "bg-emerald-50" },
  }
  const config = iconMap[type]
  const Icon = config.icon
  return (
    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", config.bg)}>
      <Icon className={cn("size-3.5", config.color)} />
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-0.5">
      <span className="size-1.5 rounded-full bg-[#1A5345] animate-[bounce_0.6s_infinite_0ms]" />
      <span className="size-1.5 rounded-full bg-[#1A5345] animate-[bounce_0.6s_infinite_150ms]" />
      <span className="size-1.5 rounded-full bg-[#1A5345] animate-[bounce_0.6s_infinite_300ms]" />
    </div>
  )
}

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E5EEEA] bg-[#FAFAF8] px-3 py-2 animate-[fadeInUp_0.3s_ease-out]">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
        <BotIcon className="size-3.5 text-[#1A5345] animate-pulse" />
      </div>
      <span className="text-[11px] font-medium text-[#1A5345]">{label}</span>
      <ThinkingDots />
    </div>
  )
}

export type PatientBriefingAgentProps = {
  summary: PatientSummary
  visible: boolean
  onDismiss: () => void
}

export function PatientBriefingAgent({ summary, visible, onDismiss }: PatientBriefingAgentProps) {
  const { visibleMessages, currentThinking, isComplete, markTypingDone } = usePatientBriefing(summary)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleMessages, currentThinking])

  if (!visible) return null

  return (
    <div className="absolute inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-[640px]",
          "animate-[slideBriefingDown_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
          "bg-white rounded-b-2xl border border-[#E5EEEA]",
          "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[#E5EEEA] px-4 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#E8F0EE]">
            <BotIcon className="size-5 text-[#1A5345]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-bold text-[#102F27]">AI Patient Briefing</h3>
            <p className="text-[10px] text-muted-foreground">
              {isComplete ? "Briefing complete" : "Analyzing patient data..."}
            </p>
          </div>
          {isComplete && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex size-7 items-center justify-center rounded-lg border border-[#E8E6E0] text-muted-foreground transition-colors hover:bg-[#E8F0EE] hover:text-[#1A5345]"
              aria-label="Close briefing"
            >
              <ChevronDownIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="scrollbar-hide max-h-[42vh] space-y-2 overflow-y-auto p-4">
          {visibleMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border-2 p-3 animate-[fadeInUp_0.3s_ease-out]",
                msg.type === "allergies"
                  ? "border-red-100 bg-red-50/30"
                  : msg.type === "risk"
                    ? "border-amber-100 bg-amber-50/30"
                    : "border-[#E5EEEA] bg-[#FBFDFC]",
              )}
            >
              <MessageIcon type={msg.type} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-relaxed text-[#102F27]">
                  <TypewriterText
                    text={msg.text}
                    speed={msg.type === "greeting" || msg.type === "complete" ? 10 : 8}
                    onComplete={() => markTypingDone(msg.id)}
                  />
                </p>
              </div>
            </div>
          ))}

          {currentThinking && <ThinkingIndicator label={currentThinking} />}
        </div>

        {/* Footer */}
        {isComplete && (
          <div className="flex items-center justify-between border-t border-[#E5EEEA] px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <SparklesIcon className="size-3 text-[#1A5345]" />
              <span>Clinical suggestions available in the AI panel</span>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center gap-1 rounded-lg bg-[#1A5345] px-3 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#0F3D32]"
            >
              <span>Start Consultation</span>
              <ChevronDownIcon className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function BriefingAgentChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-2 left-1/2 -translate-x-1/2 z-40",
        "flex items-center gap-1.5 rounded-full bg-[#1A5345] px-3 py-1.5",
        "text-[10px] font-medium text-white transition-all hover:bg-[#0F3D32]",
        "animate-[fadeInDown_0.3s_ease-out]",
      )}
    >
      <BotIcon className="size-3.5" />
      <span>AI Briefing</span>
      <Maximize2Icon className="size-3" />
    </button>
  )
}
