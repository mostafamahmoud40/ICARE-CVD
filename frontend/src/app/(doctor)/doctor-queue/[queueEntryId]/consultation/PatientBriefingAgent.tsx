"use client"

import { useRef, useEffect, useState } from "react"
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
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

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
  className?: string
  trendData?: BriefingTrendPoint[]
  visitStats?: BriefingVisitStats
  vitalProgressData?: BriefingVitalProgressPoint[]
  medicationAdherenceTrendData?: BriefingMedicationAdherenceTrendPoint[]
  medicationMissedBreakdownData?: BriefingMedicationMissedBreakdownPoint[]
}

export type BriefingTrendPoint = {
  visitLabel: string
  systolic: number
  diastolic: number
  hba1c: number
}

export type BriefingVisitStats = {
  totalVisitsLast6Months: number
  followUpAdherencePercent: number
  medicationAdherencePercent: number
  adherenceNarrative?: string
}

export type BriefingVitalProgressPoint = {
  visitLabel: string
  sbp: number
  dbp: number
  hr: number
  spo2: number
}

export type BriefingMedicationAdherenceTrendPoint = {
  visitLabel: string
  adherence: number
  target: number
}

export type BriefingMedicationMissedBreakdownPoint = {
  medication: string
  missedPercent: number
}

const trendChartConfig = {
  systolic: { label: "Systolic", color: "#1A5345" },
  diastolic: { label: "Diastolic", color: "#E89042" },
  hba1c: { label: "HbA1c", color: "#7C3AED" },
} satisfies ChartConfig

const comparisonChartConfig = {
  value: { label: "Current", color: "#1A5345" },
  target: { label: "Target", color: "#CBD5D1" },
} satisfies ChartConfig

const adherenceChartConfig = {
  adherence: { label: "Adherence %", color: "#1A5345" },
  target: { label: "Target %", color: "#A7C6BE" },
} satisfies ChartConfig

const adherenceBreakdownChartConfig = {
  missedPercent: { label: "Missed %", color: "#E89042" },
} satisfies ChartConfig

const vitalProgressChartConfig = {
  sbp: { label: "SBP", color: "#1A5345" },
  dbp: { label: "DBP", color: "#E89042" },
  hr: { label: "HR", color: "#7C3AED" },
  spo2: { label: "SpO2", color: "#0EA5A4" },
} satisfies ChartConfig

export function PatientBriefingAgent({
  summary,
  visible,
  onDismiss,
  className,
  trendData = [],
  visitStats,
  vitalProgressData = [],
  medicationAdherenceTrendData = [],
  medicationMissedBreakdownData = [],
}: PatientBriefingAgentProps) {
  const { visibleMessages, currentThinking, isComplete, markTypingDone } = usePatientBriefing(summary)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [footerStage, setFooterStage] = useState(0)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleMessages, currentThinking])

  useEffect(() => {
    if (!isComplete || !visitStats) {
      setFooterStage(0)
      return
    }

    setFooterStage((prev) => (prev === 0 ? 1 : prev))
  }, [isComplete, visitStats])

  if (!visible) return null

  return (
    <div className={cn("absolute top-full right-0 z-50 mt-2 pointer-events-none", className)}>
      <div
        className={cn(
          "pointer-events-auto flex max-h-[calc(100vh-7rem)] w-[640px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden",
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

        <div ref={scrollRef} className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          {/* Messages */}
          <div className="space-y-2 p-4">
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
            <div className="space-y-3 border-t border-[#E5EEEA] px-4 py-3">
            {visitStats ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {footerStage >= 1 ? (
                  <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Visits (6 months)</p>
                  <p className="text-[15px] font-bold text-[#102F27]">
                    <TypewriterText
                      text={String(visitStats.totalVisitsLast6Months)}
                      speed={35}
                      onComplete={() => setFooterStage((prev) => (prev < 2 ? 2 : prev))}
                    />
                  </p>
                  </div>
                ) : null}
                {footerStage >= 2 ? (
                  <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Follow-up Regularity</p>
                  <p className="text-[15px] font-bold text-[#102F27]">
                    <TypewriterText
                      text={`${visitStats.followUpAdherencePercent}%`}
                      speed={25}
                      onComplete={() => setFooterStage((prev) => (prev < 3 ? 3 : prev))}
                    />
                  </p>
                  </div>
                ) : null}
                {footerStage >= 3 ? (
                  <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Medication Adherence</p>
                  <p className="text-[15px] font-bold text-[#102F27]">
                    <TypewriterText
                      text={`${visitStats.medicationAdherencePercent}%`}
                      speed={25}
                      onComplete={() => setFooterStage((prev) => (prev < 4 ? 4 : prev))}
                    />
                  </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {visitStats?.adherenceNarrative && footerStage >= 4 ? (
              <div className="flex items-start gap-2.5 rounded-xl border-2 border-[#E5EEEA] bg-[#FBFDFC] p-3 animate-[fadeInUp_0.3s_ease-out]">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                  <PillIcon className="size-3.5 text-[#1A5345]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-relaxed text-[#102F27]">
                    <TypewriterText
                      text={visitStats.adherenceNarrative}
                      speed={8}
                      onComplete={() => setFooterStage((prev) => (prev < 5 ? 5 : prev))}
                    />
                  </p>
                </div>
              </div>
            ) : null}

            {footerStage >= 5 && (medicationAdherenceTrendData.length > 0 || medicationMissedBreakdownData.length > 0) ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {medicationAdherenceTrendData.length > 0 ? (
                  <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                    <p className="mb-1 text-[10px] font-medium text-[#102F27]">Medication Adherence by Visit</p>
                    <ChartContainer config={adherenceChartConfig} className="h-[120px] w-full">
                      <LineChart data={medicationAdherenceTrendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#E5EEEA" />
                        <XAxis dataKey="visitLabel" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Line dataKey="adherence" type="monotone" stroke="var(--color-adherence)" strokeWidth={2} dot={false} />
                        <Line dataKey="target" type="monotone" stroke="var(--color-target)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                ) : null}

                {medicationMissedBreakdownData.length > 0 ? (
                  <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                    <p className="mb-1 text-[10px] font-medium text-[#102F27]">Missed Doses by Medication</p>
                    <ChartContainer config={adherenceBreakdownChartConfig} className="h-[120px] w-full">
                      <BarChart data={medicationMissedBreakdownData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#E5EEEA" />
                        <XAxis dataKey="medication" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="missedPercent" fill="var(--color-missedPercent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                ) : null}
              </div>
            ) : null}

            {trendData.length > 0 && footerStage >= 5 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                  <p className="mb-1 text-[10px] font-medium text-[#102F27]">Results Trend by Visit</p>
                  <ChartContainer config={trendChartConfig} className="h-[120px] w-full">
                    <LineChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#E5EEEA" />
                      <XAxis dataKey="visitLabel" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Line dataKey="systolic" type="monotone" stroke="var(--color-systolic)" strokeWidth={2} dot={false} />
                      <Line dataKey="diastolic" type="monotone" stroke="var(--color-diastolic)" strokeWidth={2} dot={false} />
                      <Line dataKey="hba1c" type="monotone" stroke="var(--color-hba1c)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </div>

                <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                  <p className="mb-1 text-[10px] font-medium text-[#102F27]">Latest vs Target</p>
                  <ChartContainer config={comparisonChartConfig} className="h-[120px] w-full">
                    <BarChart
                      data={[
                        {
                          metric: "Systolic",
                          value: trendData[trendData.length - 1]?.systolic ?? 0,
                          target: 130,
                        },
                        {
                          metric: "Diastolic",
                          value: trendData[trendData.length - 1]?.diastolic ?? 0,
                          target: 80,
                        },
                        {
                          metric: "HbA1c",
                          value: trendData[trendData.length - 1]?.hba1c ?? 0,
                          target: 7,
                        },
                      ]}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#E5EEEA" />
                      <XAxis dataKey="metric" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            ) : null}

            {vitalProgressData.length > 0 && footerStage >= 5 ? (
              <div className="rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-2.5">
                <p className="mb-1 text-[10px] font-medium text-[#102F27]">Vitals Progress Across Visits</p>
                <ChartContainer config={vitalProgressChartConfig} className="h-[140px] w-full">
                  <LineChart data={vitalProgressData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E5EEEA" />
                    <XAxis dataKey="visitLabel" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Line dataKey="sbp" type="monotone" stroke="var(--color-sbp)" strokeWidth={2} dot={false} />
                    <Line dataKey="dbp" type="monotone" stroke="var(--color-dbp)" strokeWidth={2} dot={false} />
                    <Line dataKey="hr" type="monotone" stroke="var(--color-hr)" strokeWidth={2} dot={false} />
                    <Line dataKey="spo2" type="monotone" stroke="var(--color-spo2)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : null}

              <div className={cn("flex items-center justify-between", footerStage < 5 && "hidden")}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function BriefingAgentChip({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "z-40",
        "flex items-center gap-1.5 rounded-full bg-[#1A5345] px-3 py-1.5",
        "text-[10px] font-medium text-white transition-all hover:bg-[#0F3D32]",
        "animate-[fadeInDown_0.3s_ease-out]",
        className,
      )}
    >
      <BotIcon className="size-3.5" />
      <span>AI Briefing</span>
      <Maximize2Icon className="size-3" />
    </button>
  )
}
