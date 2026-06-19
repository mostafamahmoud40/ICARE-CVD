"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type {
  BriefingMedicationAdherenceTrendPoint,
  BriefingMedicationMissedBreakdownPoint,
  BriefingTrendPoint,
  BriefingVisitStats,
  BriefingVitalProgressPoint,
} from "./briefing.constants"
import {
  BRIEFING_PREP_STEPS,
  type BriefingAlertSeverity,
  type PatientBriefingReport,
} from "./usePatientBriefing"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  FileTextIcon,
  HeartIcon,
  Loader2Icon,
  PillIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type PatientBriefingReportContentProps = {
  report: PatientBriefingReport
  trendData?: BriefingTrendPoint[]
  visitStats?: BriefingVisitStats
  vitalProgressData?: BriefingVitalProgressPoint[]
  medicationAdherenceTrendData?: BriefingMedicationAdherenceTrendPoint[]
  medicationMissedBreakdownData?: BriefingMedicationMissedBreakdownPoint[]
}

const trendChartConfig = {
  systolic: { label: "Systolic", color: "#1A5345" },
  diastolic: { label: "Diastolic", color: "#E89042" },
  hba1c: { label: "HbA1c", color: "#7C3AED" },
} satisfies ChartConfig

const adherenceChartConfig = {
  adherence: { label: "Adherence %", color: "#1A5345" },
  target: { label: "Target %", color: "#A7C6BE" },
} satisfies ChartConfig

const vitalProgressChartConfig = {
  sbp: { label: "Systolic", color: "#1A5345" },
  dbp: { label: "Diastolic", color: "#E89042" },
} satisfies ChartConfig

const SNAPSHOT_CARD = "rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm"
const CHART_SECTION_CARD = "rounded-2xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm"
const AXIS_TICK = { fill: "#64748b", fontSize: 11, fontWeight: 500 as const }
const CHART_HEIGHT = "aspect-auto h-[220px] w-full sm:h-[240px]"

const riskBadgeClass: Record<string, string> = {
  high: "bg-rose-500 hover:bg-rose-500",
  "moderate-high": "bg-amber-500 hover:bg-amber-500",
  moderate: "bg-emerald-500 hover:bg-emerald-500",
}

const alertStyles: Record<
  BriefingAlertSeverity,
  { border: string; icon: string; badge: string }
> = {
  critical: {
    border: "border-rose-200 bg-rose-50/50",
    icon: "text-rose-600",
    badge: "bg-rose-600 hover:bg-rose-600",
  },
  warning: {
    border: "border-amber-200 bg-amber-50/50",
    icon: "text-amber-600",
    badge: "bg-amber-500 hover:bg-amber-500",
  },
  info: {
    border: "border-violet-200 bg-violet-50/40",
    icon: "text-violet-600",
    badge: "bg-violet-600 hover:bg-violet-600",
  },
}

export function BriefingPreparation({ prepStep }: { prepStep: number }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
        <BrainCircuitIcon className="size-7 text-violet-600" aria-hidden />
      </div>
      <h4 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Preparing pre-visit report</h4>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
        AI is synthesizing chart data into a structured briefing for this consultation.
      </p>
      <div className="mt-6 w-full max-w-xs space-y-2 text-left">
        {BRIEFING_PREP_STEPS.map((step, index) => {
          const done = index < prepStep
          const active = index === prepStep
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
                done
                  ? "bg-[#E8F0EE] text-[#1A5345]"
                  : active
                    ? "bg-white text-[#1A1F1E] shadow-sm ring-1 ring-[#E8E6E0]/80"
                    : "text-muted-foreground",
              )}
            >
              {done ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" aria-hidden />
              ) : active ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-violet-600" aria-hidden />
              ) : (
                <span className="size-4 shrink-0 rounded-full border border-[#E8E6E0]" />
              )}
              {step}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SnapshotList({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string
  icon: React.ElementType
  items: { name: string; detail: string }[]
  emptyLabel: string
}) {
  return (
    <div className={cn(SNAPSHOT_CARD, "space-y-3")}>
      <div className="flex items-center gap-2">
        <Icon className="size-[18px] text-[#1A5345]" aria-hidden />
        <p className="font-serif text-[14px] font-bold text-[#1A1F1E]">{title}</p>
        {items.length > 0 ? (
          <Badge className="rounded-lg border-0 bg-[#1A5345] px-2 py-0 text-[11px] font-bold text-white shadow-none hover:bg-[#1A5345]">
            {items.length}
          </Badge>
        ) : null}
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${title}-${item.name}`} className="rounded-lg bg-[#F9F8F5]/80 px-3 py-2.5">
              <p className="text-[13px] font-bold text-[#1A1F1E]">{item.name}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  )
}

function BriefingChartSection({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className={cn(CHART_SECTION_CARD, "space-y-4")}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-[#1A5345]" aria-hidden />
        <div className="min-w-0">
          <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  )
}

function TargetComparisonGrid({
  items,
}: {
  items: { label: string; value: number; target: number; unit: string }[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const atTarget = item.value <= item.target
        return (
          <div
            key={item.label}
            className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2.5"
          >
            <p className="text-[12px] font-semibold text-muted-foreground">{item.label}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span
                className={cn(
                  "text-[22px] font-bold tabular-nums leading-none",
                  atTarget ? "text-emerald-600" : "text-amber-600",
                )}
              >
                {item.value}
              </span>
              <span className="text-[12px] font-medium text-muted-foreground">
                target {item.target}
                {item.unit}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MissedDoseBars({ data }: { data: BriefingMedicationMissedBreakdownPoint[] }) {
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.medication} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <span className="font-semibold text-[#1A1F1E]">{row.medication}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{row.missedPercent}% missed</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8E6E0]/70">
            <div
              className="h-full rounded-full bg-[#E89042] transition-all"
              style={{ width: `${Math.min(row.missedPercent, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function LatestVitalChips({ point }: { point: BriefingVitalProgressPoint }) {
  const chips = [
    { label: "Heart rate", value: `${point.hr} bpm` },
    { label: "SpO₂", value: `${point.spo2}%` },
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex items-center justify-between rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3 py-2"
        >
          <span className="text-[12px] font-semibold text-muted-foreground">{chip.label}</span>
          <span className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">{chip.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PatientBriefingReportContent({
  report,
  trendData = [],
  visitStats,
  vitalProgressData = [],
  medicationAdherenceTrendData = [],
  medicationMissedBreakdownData = [],
}: PatientBriefingReportContentProps) {
  return (
    <div className="space-y-4">
              <div className={cn(SNAPSHOT_CARD, "flex items-start gap-3")}>
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
                  <Image
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(report.patientName.replace(/\s+/g, ""))}`}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif text-[18px] font-bold text-[#1A1F1E]">{report.patientName}</h4>
                    <Badge
                      className={cn(
                        "rounded-lg border-0 px-2 py-0.5 text-[11px] font-bold text-white shadow-none",
                        riskBadgeClass[report.riskTier],
                      )}
                    >
                      {report.riskLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{report.demographicsLine}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-5 shadow-sm">
                <div className="mb-2.5 flex items-center gap-2">
                  <FileTextIcon className="size-[18px] text-violet-600" aria-hidden />
                  <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">Executive summary</p>
                </div>
                <p className="text-[14px] leading-relaxed text-violet-950/80">{report.executiveSummary}</p>
              </div>

              {report.priorityAlerts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlertIcon className="size-[18px] text-rose-600" aria-hidden />
                    <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">Priority alerts</p>
                  </div>
                  <div className="space-y-2">
                    {report.priorityAlerts.map((alert) => {
                      const style = alertStyles[alert.severity]
                      return (
                        <div
                          key={alert.id}
                          className={cn("flex items-start gap-3 rounded-xl border p-4", style.border)}
                        >
                          <AlertTriangleIcon className={cn("mt-0.5 size-[18px] shrink-0", style.icon)} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[14px] font-bold text-[#1A1F1E]">{alert.title}</p>
                              <Badge
                                className={cn(
                                  "rounded-lg border-0 px-2 py-0 text-[11px] font-bold text-white shadow-none capitalize",
                                  style.badge,
                                )}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{alert.detail}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <SnapshotList
                  title="Active conditions"
                  icon={ActivityIcon}
                  items={report.conditions.map((c) => ({ name: c.name, detail: c.detail }))}
                  emptyLabel="No active conditions on chart."
                />
                <SnapshotList
                  title="Current medications"
                  icon={PillIcon}
                  items={report.medications.map((m) => ({ name: m.name, detail: m.detail }))}
                  emptyLabel="No active medications on chart."
                />
              </div>

              {(report.familyHistory.length > 0 || report.lifestyleFlags.length > 0) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.familyHistory.length > 0 ? (
                    <div className={cn(SNAPSHOT_CARD, "space-y-3")}>
                      <div className="flex items-center gap-2">
                        <UsersIcon className="size-[18px] text-[#1A5345]" aria-hidden />
                        <p className="font-serif text-[14px] font-bold text-[#1A1F1E]">Family history</p>
                      </div>
                      <div className="space-y-2">
                        {report.familyHistory.map((fh) => (
                          <div key={`${fh.relationship}-${fh.condition}`} className="rounded-lg bg-[#F9F8F5]/80 px-3 py-2.5">
                            <p className="text-[13px] font-bold text-[#1A1F1E]">
                              {fh.relationship}: {fh.condition}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{fh.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {report.lifestyleFlags.length > 0 ? (
                    <div className={cn(SNAPSHOT_CARD, "space-y-3")}>
                      <div className="flex items-center gap-2">
                        <HeartIcon className="size-[18px] text-[#1A5345]" aria-hidden />
                        <p className="font-serif text-[14px] font-bold text-[#1A1F1E]">Lifestyle factors</p>
                      </div>
                      <div className="space-y-2">
                        {report.lifestyleFlags.map((f) => (
                          <div key={f.label} className="flex items-center justify-between gap-3 rounded-lg bg-[#F9F8F5]/80 px-3 py-2.5">
                            <span className="text-[13px] font-semibold text-[#1A1F1E]">{f.label}</span>
                            <span className="text-right text-[13px] text-muted-foreground">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className={cn(SNAPSHOT_CARD, "space-y-3")}>
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="size-[18px] text-[#1A5345]" aria-hidden />
                  <p className="font-serif text-[14px] font-bold text-[#1A1F1E]">Suggested clinical focus</p>
                </div>
                <ul className="space-y-2">
                  {report.clinicalFocus.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#374151]">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1A5345]" />
                      {item}
                    </li>
                  ))}
                </ul>
                {report.riskFactors.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {report.riskFactors.map((factor) => (
                      <Badge
                        key={factor}
                        variant="outline"
                        className="rounded-lg border-[#E8E6E0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#374151]"
                      >
                        {factor}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              {visitStats ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className={SNAPSHOT_CARD}>
                    <p className="text-[12px] font-semibold text-muted-foreground">Visits (6 months)</p>
                    <p className="text-[20px] font-bold tabular-nums text-[#1A1F1E]">
                      {visitStats.totalVisitsLast6Months}
                    </p>
                  </div>
                  <div className={SNAPSHOT_CARD}>
                    <p className="text-[12px] font-semibold text-muted-foreground">Follow-up regularity</p>
                    <p className="text-[20px] font-bold tabular-nums text-[#1A1F1E]">
                      {visitStats.followUpAdherencePercent}%
                    </p>
                  </div>
                  <div className={SNAPSHOT_CARD}>
                    <p className="text-[12px] font-semibold text-muted-foreground">Medication adherence</p>
                    <p className="text-[20px] font-bold tabular-nums text-[#1A1F1E]">
                      {visitStats.medicationAdherencePercent}%
                    </p>
                  </div>
                </div>
              ) : null}

              {visitStats?.adherenceNarrative ? (
                <div className={cn(SNAPSHOT_CARD, "flex items-start gap-3")}>
                  <PillIcon className="mt-0.5 size-[18px] shrink-0 text-[#1A5345]" aria-hidden />
                  <p className="text-[14px] leading-relaxed text-[#374151]">{visitStats.adherenceNarrative}</p>
                </div>
              ) : null}

              {medicationAdherenceTrendData.length > 0 ||
              medicationMissedBreakdownData.length > 0 ||
              trendData.length > 0 ||
              vitalProgressData.length > 0 ? (
                <div className="space-y-5 border-t border-[#E8E6E0]/60 pt-5">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="size-4 text-[#1A5345]" aria-hidden />
                    <p className="font-serif text-[16px] font-bold text-[#1A1F1E]">Trends overview</p>
                  </div>

                  {vitalProgressData.length > 0 ? (
                    <BriefingChartSection
                      title="Vitals across visits"
                      subtitle="Blood pressure trend for recent consultations"
                      icon={ActivityIcon}
                    >
                      <ChartContainer config={vitalProgressChartConfig} className={CHART_HEIGHT}>
                        <LineChart
                          data={vitalProgressData}
                          margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
                          <XAxis
                            dataKey="visitLabel"
                            tickLine={false}
                            axisLine={false}
                            tick={AXIS_TICK}
                            dy={8}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={AXIS_TICK}
                            domain={["dataMin - 8", "dataMax + 8"]}
                            width={36}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent indicator="dot" className="rounded-xl border-[#E8E6E0] shadow-md" />
                            }
                          />
                          <ChartLegend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#64748b" }}
                          />
                          <Line
                            dataKey="sbp"
                            type="monotone"
                            stroke="var(--color-sbp)"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "var(--color-sbp)", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                          />
                          <Line
                            dataKey="dbp"
                            type="monotone"
                            stroke="var(--color-dbp)"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "var(--color-dbp)", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ChartContainer>
                      <LatestVitalChips point={vitalProgressData[vitalProgressData.length - 1]!} />
                    </BriefingChartSection>
                  ) : null}

                  {trendData.length > 0 ? (
                    <BriefingChartSection
                      title="Lab results & targets"
                      subtitle="Clinical markers compared with care-plan goals"
                      icon={StethoscopeIcon}
                    >
                      <div className="space-y-4">
                        <ChartContainer config={trendChartConfig} className={CHART_HEIGHT}>
                          <LineChart data={trendData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
                            <XAxis
                              dataKey="visitLabel"
                              tickLine={false}
                              axisLine={false}
                              tick={AXIS_TICK}
                              dy={8}
                            />
                            <YAxis
                              yAxisId="bp"
                              tickLine={false}
                              axisLine={false}
                              tick={AXIS_TICK}
                              domain={["dataMin - 8", "dataMax + 8"]}
                              width={36}
                            />
                            <YAxis
                              yAxisId="hba1c"
                              orientation="right"
                              tickLine={false}
                              axisLine={false}
                              tick={AXIS_TICK}
                              domain={[6, 9]}
                              width={32}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent indicator="dot" className="rounded-xl border-[#E8E6E0] shadow-md" />
                              }
                            />
                            <ChartLegend
                              verticalAlign="top"
                              align="right"
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#64748b" }}
                            />
                            <Line
                              yAxisId="bp"
                              dataKey="systolic"
                              type="monotone"
                              stroke="var(--color-systolic)"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "var(--color-systolic)", strokeWidth: 2, stroke: "#fff" }}
                            />
                            <Line
                              yAxisId="bp"
                              dataKey="diastolic"
                              type="monotone"
                              stroke="var(--color-diastolic)"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "var(--color-diastolic)", strokeWidth: 2, stroke: "#fff" }}
                            />
                            <Line
                              yAxisId="hba1c"
                              dataKey="hba1c"
                              type="monotone"
                              stroke="var(--color-hba1c)"
                              strokeWidth={2.5}
                              strokeDasharray="6 4"
                              dot={{ r: 4, fill: "var(--color-hba1c)", strokeWidth: 2, stroke: "#fff" }}
                            />
                          </LineChart>
                        </ChartContainer>
                        <TargetComparisonGrid
                          items={[
                            {
                              label: "Systolic BP",
                              value: trendData[trendData.length - 1]?.systolic ?? 0,
                              target: 130,
                              unit: " mmHg",
                            },
                            {
                              label: "Diastolic BP",
                              value: trendData[trendData.length - 1]?.diastolic ?? 0,
                              target: 80,
                              unit: " mmHg",
                            },
                            {
                              label: "HbA1c",
                              value: trendData[trendData.length - 1]?.hba1c ?? 0,
                              target: 7,
                              unit: "%",
                            },
                          ]}
                        />
                      </div>
                    </BriefingChartSection>
                  ) : null}

                  {medicationAdherenceTrendData.length > 0 || medicationMissedBreakdownData.length > 0 ? (
                    <BriefingChartSection
                      title="Medication adherence"
                      subtitle="Visit-by-visit adherence and gaps by drug"
                      icon={PillIcon}
                    >
                      <div className="space-y-5">
                        {medicationAdherenceTrendData.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[13px] font-semibold text-[#1A1F1E]">Adherence by visit</p>
                            <ChartContainer config={adherenceChartConfig} className={CHART_HEIGHT}>
                              <LineChart
                                data={medicationAdherenceTrendData}
                                margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
                                <XAxis
                                  dataKey="visitLabel"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={AXIS_TICK}
                                  dy={8}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  tickLine={false}
                                  axisLine={false}
                                  tick={AXIS_TICK}
                                  width={36}
                                />
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent indicator="dot" className="rounded-xl border-[#E8E6E0] shadow-md" />
                                  }
                                />
                                <ChartLegend
                                  verticalAlign="top"
                                  align="right"
                                  iconType="circle"
                                  iconSize={8}
                                  wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600, color: "#64748b" }}
                                />
                                <Line
                                  dataKey="adherence"
                                  type="monotone"
                                  stroke="var(--color-adherence)"
                                  strokeWidth={2.5}
                                  dot={{ r: 4, fill: "var(--color-adherence)", strokeWidth: 2, stroke: "#fff" }}
                                />
                                <Line
                                  dataKey="target"
                                  type="monotone"
                                  stroke="var(--color-target)"
                                  strokeWidth={2}
                                  strokeDasharray="6 4"
                                  dot={false}
                                />
                              </LineChart>
                            </ChartContainer>
                          </div>
                        ) : null}

                        {medicationMissedBreakdownData.length > 0 ? (
                          <div className="space-y-2 border-t border-[#E8E6E0]/50 pt-4">
                            <p className="text-[13px] font-semibold text-[#1A1F1E]">Missed doses by medication</p>
                            <MissedDoseBars data={medicationMissedBreakdownData} />
                          </div>
                        ) : null}
                      </div>
                    </BriefingChartSection>
                  ) : null}
                </div>
              ) : null}
    </div>
  )
}
