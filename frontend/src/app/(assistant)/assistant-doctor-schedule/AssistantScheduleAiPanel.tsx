"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  LightbulbIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  SendIcon,
  SparklesIcon,
  Table2Icon,
} from "lucide-react"
import { toast } from "sonner"

import type { DoctorSchedulePayload } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  at: string
}

export type ScheduleAiNavigateTarget = "week" | "day" | "blocked" | "calendar"

type SuggestionAction =
  | { kind: "navigate"; label: string; target: ScheduleAiNavigateTarget }
  | { kind: "apply"; label: string }

type ScheduleSuggestion = {
  id: string
  title: string
  body: string
  priority: "high" | "medium" | "low"
  action?: SuggestionAction
}

type ScheduleAnalysis = {
  coverageScore: number
  activeDays: number
  totalPeriods: number
  weeklyHours: number
  insights: string[]
  risks: string[]
}

export type AssistantScheduleAiPanelProps = {
  doctorName: string
  schedule: DoctorSchedulePayload
  bookingCount: number
  pausedCount: number
  dayExtrasCount: number
  onNavigate?: (target: ScheduleAiNavigateTarget) => void
  onApplySuggestion?: (suggestionId: string) => void | Promise<void>
}

const PRIORITY_TASK_TYPE: Record<
  ScheduleSuggestion["priority"],
  "danger" | "warning" | "info"
> = {
  high: "danger",
  medium: "warning",
  low: "info",
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeToMins(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function computeWeeklyHours(schedule: DoctorSchedulePayload) {
  let mins = 0
  for (const day of schedule.days) {
    if (!day.enabled) continue
    for (const p of day.periods) {
      mins += Math.max(0, timeToMins(p.endTime) - timeToMins(p.startTime))
    }
  }
  return Math.round((mins / 60) * 10) / 10
}

function buildSuggestions(props: AssistantScheduleAiPanelProps): ScheduleSuggestion[] {
  const { schedule, bookingCount, pausedCount, dayExtrasCount } = props
  const activeDays = schedule.days.filter((d) => d.enabled).length
  const totalPeriods = schedule.days.reduce((n, d) => n + (d.enabled ? d.periods.length : 0), 0)
  const suggestions: ScheduleSuggestion[] = []

  if (activeDays < 4) {
    suggestions.push({
      id: "coverage",
      title: "Expand weekly coverage",
      body: `Only ${activeDays} day${activeDays === 1 ? "" : "s"} enabled. Consider adding mid-week slots to reduce patient wait times.`,
      priority: "high",
      action: { kind: "navigate", label: "Open weekly table", target: "week" },
    })
  }

  if (pausedCount > 0) {
    suggestions.push({
      id: "paused",
      title: "Review paused sessions",
      body: `${pausedCount} session${pausedCount === 1 ? " is" : "s are"} paused. Confirm whether they should resume or be removed from the weekly template.`,
      priority: "high",
      action: { kind: "navigate", label: "Review daily sessions", target: "day" },
    })
  }

  if (schedule.bufferBetweenSlotsMinutes < 5) {
    suggestions.push({
      id: "buffer",
      title: "Increase slot buffer",
      body: `Buffer is ${schedule.bufferBetweenSlotsMinutes} min. A 10–15 min gap helps avoid overrun when consultations run long.`,
      priority: "medium",
      action: { kind: "apply", label: "Apply 10 min buffer" },
    })
  }

  if (bookingCount > 0 && activeDays > 0) {
    const perDay = bookingCount / activeDays
    if (perDay >= 3) {
      suggestions.push({
        id: "load",
        title: "High booking density",
        body: `About ${Math.round(perDay)} upcoming booking${perDay >= 2 ? "s" : ""} per active day. Extra hours on busy dates may help.`,
        priority: "medium",
        action: { kind: "navigate", label: "Add extra hours", target: "day" },
      })
    }
  }

  if (schedule.blockedDates.length >= 3) {
    suggestions.push({
      id: "blocked",
      title: "Many blocked dates",
      body: `${schedule.blockedDates.length} full-day blocks on the calendar. Double-check patients aren't booked on those dates.`,
      priority: "medium",
      action: { kind: "navigate", label: "Review blocked dates", target: "blocked" },
    })
  }

  if (dayExtrasCount > 0) {
    suggestions.push({
      id: "extras",
      title: "One-off extra hours in use",
      body: `${dayExtrasCount} date-specific extra window${dayExtrasCount === 1 ? "" : "s"} active. Good for emergencies without changing the weekly template.`,
      priority: "low",
      action: { kind: "navigate", label: "View extra hours", target: "day" },
    })
  }

  if (totalPeriods === 0 && activeDays > 0) {
    suggestions.push({
      id: "periods",
      title: "Add working periods",
      body: "Active days have no time periods yet. Add morning/afternoon blocks in the weekly table.",
      priority: "high",
      action: { kind: "navigate", label: "Open weekly table", target: "week" },
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "ok",
      title: "Schedule looks balanced",
      body: "No obvious gaps from quick rules. Run analysis below or ask in chat for deeper optimization ideas.",
      priority: "low",
    })
  }

  return suggestions
}

function buildAnalysis(props: AssistantScheduleAiPanelProps): ScheduleAnalysis {
  const { schedule, bookingCount, pausedCount } = props
  const activeDays = schedule.days.filter((d) => d.enabled).length
  const totalPeriods = schedule.days.reduce((n, d) => n + (d.enabled ? d.periods.length : 0), 0)
  const weeklyHours = computeWeeklyHours(schedule)
  const insights: string[] = []
  const risks: string[] = []

  insights.push(
    `${activeDays} active weekday${activeDays === 1 ? "" : "s"} with ${totalPeriods} session block${totalPeriods === 1 ? "" : "s"}.`
  )
  insights.push(
    `Roughly ${weeklyHours} clinical hours per week at ${schedule.slotDurationMinutes}-minute slots (${schedule.bufferBetweenSlotsMinutes} min buffer).`
  )

  if (bookingCount > 0) {
    insights.push(`${bookingCount} upcoming booking${bookingCount === 1 ? "" : "s"} in the next two weeks.`)
  }

  const busiest = [...schedule.days]
    .filter((d) => d.enabled)
    .sort((a, b) => b.periods.length - a.periods.length)[0]
  if (busiest && busiest.periods.length > 0) {
    insights.push(
      `Busiest template day: ${busiest.label} (${busiest.periods.length} period${busiest.periods.length === 1 ? "" : "s"}).`
    )
  }

  if (pausedCount > 0) {
    risks.push(`${pausedCount} paused period${pausedCount === 1 ? "" : "s"} may hide capacity from patients.`)
  }
  if (schedule.blockedDates.length > 0) {
    risks.push(`${schedule.blockedDates.length} blocked date${schedule.blockedDates.length === 1 ? "" : "s"} — verify no conflicts with bookings.`)
  }
  if (weeklyHours > 40) {
    risks.push("Weekly hours exceed 40 — watch for clinician fatigue and no-show risk.")
  }
  if (activeDays <= 2) {
    risks.push("Limited weekday coverage may increase queue pressure.")
  }

  const coverageScore = Math.min(
    100,
    Math.round(
      activeDays * 12 +
        totalPeriods * 8 +
        Math.min(weeklyHours, 30) +
        (schedule.bufferBetweenSlotsMinutes >= 10 ? 10 : 0) -
        pausedCount * 5 -
        schedule.blockedDates.length * 2
    )
  )

  return { coverageScore, activeDays, totalPeriods, weeklyHours, insights, risks }
}

function mockChatReply(input: string, doctorName: string): string {
  const q = input.toLowerCase()
  if (q.includes("busy") || q.includes("book")) {
    return `Based on the current draft, I would compare booking density per weekday and suggest one-off extra hours on peak days — without changing ${doctorName}'s weekly template. (Preview reply.)`
  }
  if (q.includes("pause") || q.includes("break")) {
    return "Paused sessions stop new bookings for that block but keep the weekly template. I can flag which paused IDs affect the most upcoming slots once connected to the API. (Preview reply.)"
  }
  if (q.includes("block") || q.includes("vacation")) {
    return "Blocked dates are full-day closures. I would cross-check them against upcoming appointments and list any conflicts for the assistant to resolve. (Preview reply.)"
  }
  return `I understand you're asking about "${input.trim()}". When the backend is connected, I'll read the live schedule, revision history, and bookings to answer with real data. (Preview reply.)`
}

function SectionHeader({
  dotClass,
  title,
  badge,
  action,
}: {
  dotClass: string
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6E0]/60 pb-3">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dotClass)} />
        <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  )
}

function actionButtonClass(taskType: "danger" | "warning" | "info", applied: boolean) {
  if (applied) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
  }
  if (taskType === "danger") return "bg-red-600 hover:bg-red-700 text-white"
  if (taskType === "warning") return "bg-amber-600 hover:bg-amber-700 text-white"
  return "bg-[#1A5345] hover:bg-[#133F34] text-white"
}

export function AssistantScheduleAiPanel({
  doctorName,
  schedule,
  bookingCount,
  pausedCount,
  dayExtrasCount,
  onNavigate,
  onApplySuggestion,
}: AssistantScheduleAiPanelProps) {
  const panelProps = React.useMemo(
    () => ({ doctorName, schedule, bookingCount, pausedCount, dayExtrasCount }),
    [doctorName, schedule, bookingCount, pausedCount, dayExtrasCount]
  )

  const suggestions = React.useMemo(() => buildSuggestions(panelProps), [panelProps])
  const liveMetrics = React.useMemo(() => buildAnalysis(panelProps), [panelProps])

  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysisReady, setAnalysisReady] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Schedule assistant for ${doctorName}. Ask about coverage, bookings, paused sessions, or blocked dates. (Preview — not connected yet.)`,
      at: new Date().toISOString(),
    },
  ])
  const [chatInput, setChatInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [applyingId, setApplyingId] = React.useState<string | null>(null)
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(() => new Set())
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleAnalyze = () => {
    setAnalyzing(true)
    setAnalysisReady(false)
    window.setTimeout(() => {
      setAnalysisReady(true)
      setAnalyzing(false)
    }, 900)
  }

  const handleSuggestionAction = async (s: ScheduleSuggestion) => {
    if (!s.action || appliedIds.has(s.id) || applyingId === s.id) return

    if (s.action.kind === "navigate") {
      onNavigate?.(s.action.target)
      toast.message("Opening schedule view", {
        description: `${s.action.label} — preview navigation.`,
      })
      return
    }

    setApplyingId(s.id)
    try {
      await onApplySuggestion?.(s.id)
      await new Promise((resolve) => window.setTimeout(resolve, 500))
      setAppliedIds((prev) => new Set(prev).add(s.id))
      toast.success("Suggestion applied", {
        description: "Preview — save the schedule to persist changes.",
      })
    } catch {
      toast.error("Could not apply suggestion", {
        description: "Preview action failed. Try again later.",
      })
    } finally {
      setApplyingId(null)
    }
  }

  const handleSendChat = () => {
    const text = chatInput.trim()
    if (!text || isTyping) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setChatInput("")
    setIsTyping(true)

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: mockChatReply(text, doctorName),
          at: new Date().toISOString(),
        },
      ])
      setIsTyping(false)
    }, 800)
  }

  return (
    <div className="-mx-6 space-y-8 bg-[#F9F8F5] px-6 py-6 sm:-mx-8 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="border-l-[3px] border-[#CC5533] pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[12px]">
            Schedule intelligence
          </p>
          <h2 className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
            {doctorName}&apos;s schedule overview
          </h2>
          <p className="text-[13px] font-medium text-[#6B7870]">
            Suggestions, analysis, and chat — preview UI aligned with the assistant command center.
          </p>
        </div>
        <span className="w-fit rounded-lg bg-[#1A5345]/10 px-2.5 py-1 text-[11px] font-bold text-[#1A5345]">
          Preview mode
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <BarChart3Icon className="absolute right-4 top-4 size-5 text-[#1A5345]" aria-hidden />
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            Coverage score
          </p>
          <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">
            {liveMetrics.coverageScore}
          </h3>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">
            Based on active days, periods &amp; buffer
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <CalendarDaysIcon className="absolute right-4 top-4 size-5 text-[#CC5533]" aria-hidden />
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            Active days
          </p>
          <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">
            {liveMetrics.activeDays}
            <span className="font-sans text-[16px] font-medium text-muted-foreground"> / 7</span>
          </h3>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">
            {liveMetrics.totalPeriods} session block{liveMetrics.totalPeriods === 1 ? "" : "s"}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <ClockIcon className="absolute right-4 top-4 size-5 text-emerald-600" aria-hidden />
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            Weekly hours
          </p>
          <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">
            {liveMetrics.weeklyHours}
            <span className="font-sans text-[16px] font-medium text-muted-foreground"> hrs</span>
          </h3>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">
            {schedule.slotDurationMinutes} min slots · {schedule.bufferBetweenSlotsMinutes} min buffer
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <Table2Icon className="absolute right-4 top-4 size-5 text-[#1A5345]" aria-hidden />
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            Upcoming bookings
          </p>
          <h3 className="mt-2 font-serif text-[32px] font-bold text-[#1A1F1E]">{bookingCount}</h3>
          <p className="mt-3 text-[11px] font-medium text-emerald-700">
            {pausedCount > 0 ? `${pausedCount} paused session${pausedCount === 1 ? "" : "s"}` : "Next 14 days"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <SectionHeader
              dotClass="bg-[#CC5533]"
              title="Suggestions"
              badge={
                <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  {suggestions.length} items
                </span>
              }
            />

            <div className="grid gap-4">
              {suggestions.map((s) => {
                const taskType = PRIORITY_TASK_TYPE[s.priority]
                const isApplied = appliedIds.has(s.id)
                const isApplying = applyingId === s.id
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-2xl border bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md",
                      taskType === "danger"
                        ? "border-l-4 border-l-red-500 border-[#E8E6E0]/60"
                        : taskType === "warning"
                          ? "border-l-4 border-l-amber-500 border-[#E8E6E0]/60"
                          : "border-l-4 border-l-[#1A5345] border-[#E8E6E0]/60",
                      isApplied && "ring-1 ring-emerald-200/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-[15px] font-bold text-[#1A1F1E]">{s.title}</h4>
                        <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </div>
                      <LightbulbIcon
                        className={cn(
                          "size-5 shrink-0",
                          taskType === "danger"
                            ? "text-red-600"
                            : taskType === "warning"
                              ? "text-amber-600"
                              : "text-[#1A5345]"
                        )}
                        aria-hidden
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E6E0]/40 pt-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {isApplied ? (
                          <>
                            <CheckIcon className="size-3.5 text-emerald-600" aria-hidden />
                            <span className="text-emerald-700">Applied</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                            {s.priority} priority
                          </>
                        )}
                      </span>
                      {s.action ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={isApplied ? "outline" : "default"}
                          disabled={isApplied || isApplying}
                          className={cn(
                            "h-8 rounded-lg px-4 text-[12px] font-bold shadow-sm",
                            actionButtonClass(taskType, isApplied)
                          )}
                          onClick={() => void handleSuggestionAction(s)}
                        >
                          {isApplying ? (
                            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                          ) : isApplied ? (
                            <>
                              <CheckIcon className="mr-1.5 size-3.5" aria-hidden />
                              Done
                            </>
                          ) : (
                            <>
                              {s.action.label}
                              <ArrowRightIcon className="ml-1.5 size-3.5" aria-hidden />
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader
              dotClass="bg-[#1A5345]"
              title="Schedule analysis"
              action={
                <Button
                  type="button"
                  size="sm"
                  disabled={analyzing}
                  className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:bg-[#133F34]"
                  onClick={handleAnalyze}
                >
                  {analyzing ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <BarChart3Icon className="size-3.5" aria-hidden />
                  )}
                  {analyzing ? "Analyzing…" : "Run analysis"}
                </Button>
              }
            />

            {!analysisReady && !analyzing ? (
              <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-8 text-center">
                <BarChart3Icon className="mx-auto mb-2 size-8 text-muted-foreground/40" aria-hidden />
                <p className="text-[13px] font-bold text-muted-foreground">
                  Run analysis to generate insights and risk flags from the current draft.
                </p>
              </div>
            ) : null}

            {analyzing ? (
              <div className="flex items-center justify-center rounded-2xl border border-[#E8E6E0]/60 bg-white py-12">
                <Loader2Icon className="size-8 animate-spin text-[#1A5345]" aria-hidden />
              </div>
            ) : null}

            {analysisReady && !analyzing ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {liveMetrics.insights.length > 0 ? (
                  <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Insights
                    </p>
                    <ul className="space-y-2">
                      {liveMetrics.insights.map((line) => (
                        <li
                          key={line}
                          className="rounded-xl border border-[#E8E6E0]/50 bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] font-medium text-[#1A1F1E]"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {liveMetrics.risks.length > 0 ? (
                  <div className="rounded-2xl border border-l-4 border-l-amber-500 border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
                    <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-amber-800">
                      <AlertTriangleIcon className="size-3.5" aria-hidden />
                      Risks &amp; flags
                    </p>
                    <ul className="space-y-2">
                      {liveMetrics.risks.map((line) => (
                        <li
                          key={line}
                          className="text-[13px] font-medium leading-relaxed text-muted-foreground"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 text-[13px] font-medium text-muted-foreground shadow-sm">
                    No risk flags detected on this draft.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            dotClass="bg-[#1A5345]"
            title="Schedule chat"
            badge={
              <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                Preview
              </span>
            }
          />

          <div className="flex min-h-[min(520px,62vh)] flex-col rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
            <ScrollArea className="min-h-0 flex-1 px-3 py-3">
              <div className="space-y-3 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-xl border p-3.5 transition-all",
                      msg.role === "user"
                        ? "ml-6 border-[#1A5345]/20 bg-[#E8F0EE]/60"
                        : "mr-2 border-[#E8E6E0]/60 bg-white hover:shadow-sm"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {msg.role === "user" ? "You" : "Assistant"}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {formatTime(msg.at)}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {isTyping ? (
                  <div className="mr-2 flex items-center gap-2 rounded-xl border border-[#E8E6E0]/60 bg-white px-3.5 py-3 text-[13px] text-muted-foreground">
                    <Loader2Icon className="size-3.5 animate-spin text-[#1A5345]" aria-hidden />
                    Thinking…
                  </div>
                ) : null}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-[#E8E6E0]/60 p-3">
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Ask about coverage, busy days, or blocked dates…"
                  className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[13px]"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendChat()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1.5 self-end rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
                  disabled={!chatInput.trim() || isTyping}
                  onClick={handleSendChat}
                >
                  <SendIcon className="size-3.5" aria-hidden />
                  Send message
                </Button>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground">
            <MessageSquareTextIcon className="mt-0.5 size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
            Chat will connect to the schedule API and revision history in a later release.
          </p>
        </div>
      </div>
    </div>
  )
}
