"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import type {
  AssistantDashboardData,
  AssistantTask,
  AssignedCase,
  DoctorSupport,
  AssistantActivity,
} from "./assistantDashboard.types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  ActivityIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  HistoryIcon,
  InboxIcon,
  ListOrderedIcon,
  MessageCircleIcon,
  PillIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import * as RechartsPrimitive from "recharts"

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date())
}

type DashboardQuickAction = {
  href: string
  label: string
  description: string
  icon: React.ElementType
}

const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    href: "/assistant-appointments",
    label: "Appointments",
    description: "Book, move, or cancel visits",
    icon: CalendarPlusIcon,
  },
  {
    href: "/assistant-patients",
    label: "Patients",
    description: "Register or open a chart",
    icon: UserPlusIcon,
  },
  {
    href: "/assistant-medications",
    label: "Medications",
    description: "Adherence & follow-ups",
    icon: PillIcon,
  },
  {
    href: "/assistant-inbox",
    label: "Inbox",
    description: "Triage messages & alerts",
    icon: InboxIcon,
  },
  {
    href: "/assistant-queue/live-desk",
    label: "Patient queue",
    description: "Front-desk flow & wait list",
    icon: ListOrderedIcon,
  },
  {
    href: "/assistant-chats",
    label: "Team chat",
    description: "Message doctors & staff",
    icon: MessageCircleIcon,
  },
]

function taskStatusStyles(status: AssistantTask["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "in-progress":
      return "border-[#CC5533]/25 bg-[#CC5533]/10 text-[#A34429]"
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-gray-200 bg-gray-50 text-gray-700"
  }
}

function taskStatusIcon(status: AssistantTask["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircleIcon className="mr-1 size-3" />
    case "in-progress":
      return <ClockIcon className="mr-1 size-3" />
    case "pending":
      return <AlertCircleIcon className="mr-1 size-3" />
  }
}

function caseStatusStyles(status: AssignedCase["status"]) {
  switch (status) {
    case "active":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "monitoring":
      return "border-[#E8C4B8] bg-[#CC5533]/10 text-[#CC5533]"
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-gray-200 bg-gray-50 text-gray-700"
  }
}

const taskStatusChartConfig = {
  completed: { label: "Completed", color: "#1A5345" },
  inProgress: { label: "In Progress", color: "#CC5533" },
  pending: { label: "Pending", color: "#E89042" },
} satisfies ChartConfig

const supportTypeChartConfig = {
  cases: { label: "Cases" },
  consultation: { label: "Consultation", color: "#1A5345" },
  "patient-monitoring": { label: "Monitoring", color: "#CC5533" },
  documentation: { label: "Documentation", color: "#3C57D0" },
  general: { label: "General", color: "#48A879" },
} satisfies ChartConfig

const caseStatusChartConfig = {
  cases: { label: "Cases" },
  active: { label: "Active", color: "#1A5345" },
  monitoring: { label: "Monitoring", color: "#CC5533" },
  completed: { label: "Completed", color: "#48A879" },
} satisfies ChartConfig

function activityTypeConfig(type: AssistantActivity["type"]) {
  switch (type) {
    case "task-completed":
      return { icon: CheckCircleIcon, bg: "bg-emerald-100", text: "text-emerald-700" }
    case "case-updated":
      return { icon: ActivityIcon, bg: "bg-[#CC5533]/12", text: "text-[#CC5533]" }
    case "support-provided":
      return { icon: StethoscopeIcon, bg: "bg-[#CC5533]/8", text: "text-[#A34429]" }
    case "document-submitted":
      return { icon: FileTextIcon, bg: "bg-cyan-100", text: "text-cyan-700" }
    default:
      return { icon: ActivityIcon, bg: "bg-gray-100", text: "text-gray-700" }
  }
}

function TaskRow({ task }: { task: AssistantTask }) {
  return (
    <div className="group flex flex-col gap-2 p-4 transition-colors hover:bg-[#F9F8F5]/50 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
          {task.title}
        </span>
        <Badge variant="secondary" className={cn("px-2 py-0 text-[10px] font-bold uppercase tracking-wider", taskStatusStyles(task.status))}>
          {taskStatusIcon(task.status)}
          {task.status}
        </Badge>
      </div>
      <div className="text-[13px] font-medium text-muted-foreground">{task.description}</div>
      <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1"><UsersIcon className="size-3.5" /> {task.assignedBy}</span>
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3.5 text-[#CC5533]" aria-hidden />
          Due: {formatDateTime(task.dueAt)}
        </span>
      </div>
    </div>
  )
}

function CaseRow({ assignedCase }: { assignedCase: AssignedCase }) {
  return (
    <Link
      href={`/assistant-patients/${encodeURIComponent(assignedCase.patientId)}`}
      className="group flex items-start gap-4 p-4 transition-colors hover:bg-[#F9F8F5]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A5345]/25 sm:p-5"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
        <Image
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(assignedCase.patientName.replace(/\s+/g, ""))}`}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
            {assignedCase.patientName}
          </span>
          <Badge variant="secondary" className={cn("px-2 py-0 text-[10px] font-bold uppercase tracking-wider", caseStatusStyles(assignedCase.status))}>
            {assignedCase.status}
          </Badge>
        </div>
        <div className="mt-0.5 text-[13px] font-medium text-muted-foreground line-clamp-1">{assignedCase.condition}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span>ID: {assignedCase.patientId}</span>
          <span className="flex items-center gap-1"><StethoscopeIcon className="size-3.5" /> {assignedCase.primaryDoctor}</span>
        </div>
      </div>
    </Link>
  )
}

function DoctorSupportRow({ support }: { support: DoctorSupport }) {
  return (
    <div className="group flex items-start gap-4 p-4 transition-colors hover:bg-[#F9F8F5]/50 sm:p-5">
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
        <Image
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(support.doctorName.replace(/\s+/g, ""))}`}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex flex-col">
            <span className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {support.doctorName}
            </span>
            <span className="text-[12px] font-semibold text-[#d46a4c]">{support.department}</span>
          </div>
          <Link href="/assistant-chats" className="flex size-7 items-center justify-center rounded-lg bg-white border border-[#E8E6E0] shadow-sm transition-colors hover:bg-gray-50">
            <MessageCircleIcon className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
        <div className="mt-1.5 text-[12px] font-medium text-muted-foreground">
          {support.supportType} · <span className="font-bold text-[#1A1F1E]">{support.casesSupported}</span> case{support.casesSupported !== 1 ? 's' : ''} supported
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: AssistantActivity }) {
  const config = activityTypeConfig(item.type)
  const Icon = config.icon
  return (
    <div className="group flex items-start gap-4 p-4 transition-colors hover:bg-[#F9F8F5]/50 sm:p-5">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", config.bg)}>
        <Icon className={cn("size-5", config.text)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <span className="text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
            {item.summary}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {item.type.replace(/-/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          <ClockIcon className="size-3 text-[#CC5533]" aria-hidden />
          {formatDateTime(item.at)}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  colorClass,
  href,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  colorClass: string
  href?: string
}) {
  const shellClass = cn(
    "flex items-center gap-3 overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
    href && "cursor-pointer active:scale-[0.99]",
  )

  const inner = (
    <>
      <div className={cn("flex shrink-0 size-12 items-center justify-center rounded-xl", colorClass)}>
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[20px] font-bold leading-none text-[#1A1F1E] sm:text-[24px]">
          {value}
        </div>
        <div className="mt-1 truncate text-[12px] font-bold capitalize text-muted-foreground">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
          {description}
        </div>
      </div>
      {href ? (
        <ArrowRightIcon
          className="size-4 shrink-0 text-[#CC5533] opacity-0 transition-all group-hover/stat:translate-x-0.5 group-hover/stat:opacity-100"
          aria-hidden
        />
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          shellClass,
          "group/stat block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F8F5]",
        )}
      >
        {inner}
      </Link>
    )
  }

  return <div className={shellClass}>{inner}</div>
}

function DashboardQuickActions() {
  return (
    <Card
      size="sm"
      className="relative overflow-hidden border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] ring-0 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:bg-gradient-to-r before:from-[#1A5345] before:to-[#CC5533]"
    >
      <CardHeader className="border-b border-[#E8E6E0]/50 pb-4">
        <CardTitle className="font-serif text-[17px] font-bold text-[#1A1F1E]">Quick actions</CardTitle>
        <CardDescription className="text-[13px]">
          Shortcuts for booking, patients, and daily workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon
            const accentOrange = index % 2 === 1
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={cn(
                    "flex min-h-[4.25rem] gap-3 rounded-xl border border-[#E8E6E0]/70 bg-[#FBFAF7] p-3.5 transition-all",
                    accentOrange
                      ? "hover:border-[#CC5533]/35 hover:shadow-[0_4px_20px_-6px_rgba(204,85,51,0.12)]"
                      : "hover:border-[#1A5345]/22 hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)]",
                    "hover:bg-white",
                    accentOrange
                      ? "focus-visible:ring-[#CC5533]/35"
                      : "focus-visible:ring-[#1A5345]/28",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F8F5]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm",
                      accentOrange
                        ? "border-[#CC5533]/25 text-[#CC5533]"
                        : "border-[#E8E6E0]/60 text-[#1A5345]",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-[14px] font-bold leading-tight text-[#1A1F1E]">{action.label}</span>
                    <span className="text-[12px] font-medium leading-snug text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function ListContainer({ title, icon: Icon, children, href, viewAllText }: { title: string, icon: React.ElementType, children: React.ReactNode, href: string, viewAllText: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 bg-[#F4F3ED]/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg border border-[#CC5533]/15 bg-gradient-to-br from-white to-[#CC5533]/6 shadow-sm">
            <Icon className="size-4 text-[#1A5345]" />
          </div>
          <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{title}</h2>
        </div>
        <Link
          href={href}
          className="group flex items-center gap-1 text-[12px] font-bold text-[#1A5345] transition-colors hover:text-[#CC5533]"
        >
          {viewAllText}
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="divide-y divide-[#E8E6E0]/40">
        {children}
      </div>
    </div>
  )
}

function AssistantDashboardCharts({ data }: { data: AssistantDashboardData }) {
  const taskChartData = React.useMemo(() => {
    const counts = { completed: 0, inProgress: 0, pending: 0 }
    data.tasks.forEach((t) => {
      if (t.status === "completed") counts.completed++
      else if (t.status === "in-progress") counts.inProgress++
      else counts.pending++
    })
    return [
      { status: "completed", count: counts.completed, fill: "var(--color-completed)" },
      { status: "inProgress", count: counts.inProgress, fill: "var(--color-inProgress)" },
      { status: "pending", count: counts.pending, fill: "var(--color-pending)" },
    ]
  }, [data.tasks])

  const supportChartData = React.useMemo(() => {
    const map: Record<string, number> = {}
    data.doctorSupport.forEach((s) => {
      map[s.supportType] = (map[s.supportType] || 0) + s.casesSupported
    })
    return Object.entries(map).map(([type, cases]) => ({
      type: type as DoctorSupport["supportType"],
      cases,
      fill: supportTypeChartConfig[type as DoctorSupport["supportType"]]?.color ?? "#94a3b8",
    }))
  }, [data.doctorSupport])

  const caseChartData = React.useMemo(() => {
    const counts = { active: 0, monitoring: 0, completed: 0 }
    data.assignedCases.forEach((c) => {
      counts[c.status]++
    })
    return [
      { status: "active", count: counts.active, fill: "var(--color-active)" },
      { status: "monitoring", count: counts.monitoring, fill: "var(--color-monitoring)" },
      { status: "completed", count: counts.completed, fill: "var(--color-completed)" },
    ]
  }, [data.assignedCases])

  const totalTasks = taskChartData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {/* Task Status Donut */}
      <Card className="relative overflow-hidden border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] ring-0 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:bg-gradient-to-r before:from-[#1A5345] before:to-[#CC5533]">
        <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-[#CC5533]/15 bg-gradient-to-br from-white to-[#CC5533]/6 shadow-sm">
              <ClipboardListIcon className="size-4 text-[#1A5345]" />
            </div>
            <div>
              <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">Task status</CardTitle>
              <CardDescription className="text-[12px]">Current workload breakdown</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={taskStatusChartConfig} className="mx-auto aspect-square max-h-[220px]">
            <RechartsPrimitive.PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <RechartsPrimitive.Pie
                data={taskChartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={3}
                stroke="white"
              >
                {taskChartData.map((entry, index) => (
                  <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RechartsPrimitive.Pie>
            </RechartsPrimitive.PieChart>
          </ChartContainer>
          {totalTasks > 0 && (
            <div className="mt-2 text-center text-[12px] font-semibold text-muted-foreground">
              {totalTasks} total task{totalTasks !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor Support Bar */}
      <Card className="relative overflow-hidden border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] ring-0 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:bg-gradient-to-r before:from-[#1A5345] before:to-[#CC5533]">
        <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-[#CC5533]/15 bg-gradient-to-br from-white to-[#CC5533]/6 shadow-sm">
              <StethoscopeIcon className="size-4 text-[#1A5345]" />
            </div>
            <div>
              <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">Support by type</CardTitle>
              <CardDescription className="text-[12px]">Cases supported per category</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={supportTypeChartConfig} className="h-[220px] w-full">
            <RechartsPrimitive.BarChart data={supportChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <RechartsPrimitive.CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <RechartsPrimitive.XAxis type="number" hide />
              <RechartsPrimitive.YAxis
                dataKey="type"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tickFormatter={(value: string) =>
                  value
                    .replace("patient-monitoring", "Monitoring")
                    .replace("consultation", "Consult")
                    .replace("documentation", "Docs")
                    .replace("general", "General")
                }
                className="text-[11px] font-medium"
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <RechartsPrimitive.Bar dataKey="cases" radius={[0, 6, 6, 0]} barSize={24}>
                {supportChartData.map((entry, index) => (
                  <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RechartsPrimitive.Bar>
            </RechartsPrimitive.BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Case Status Bar */}
      <Card className="relative overflow-hidden border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] ring-0 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:bg-gradient-to-r before:from-[#1A5345] before:to-[#CC5533]">
        <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-[#CC5533]/15 bg-gradient-to-br from-white to-[#CC5533]/6 shadow-sm">
              <UsersIcon className="size-4 text-[#1A5345]" />
            </div>
            <div>
              <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">Case status</CardTitle>
              <CardDescription className="text-[12px]">Assigned cases breakdown</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={caseStatusChartConfig} className="h-[220px] w-full">
            <RechartsPrimitive.BarChart data={caseChartData} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
              <RechartsPrimitive.XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
                className="text-[11px] font-medium"
              />
              <RechartsPrimitive.YAxis hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <RechartsPrimitive.Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                {caseChartData.map((entry, index) => (
                  <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RechartsPrimitive.Bar>
            </RechartsPrimitive.BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function AssistantDashboardContent({ data }: { data: AssistantDashboardData }) {
  const { stats } = data

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      {/* Header section matching the Medications layout */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <p className="border-l-[3px] border-[#CC5533] pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[12px]">
            {formatTodayHeading()}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Welcome back, {data.assistant.fullName}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {data.assistant.department} Department · {data.assistant.experienceYears} years experience
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button
                asChild
                variant="outline"
                className="h-10 shrink-0 rounded-xl border-[#E8E6E0] bg-white px-4 text-[13px] font-bold text-[#1A1F1E] shadow-sm hover:border-[#CC5533]/35 hover:bg-[#FFFCFA] hover:text-[#1A5345] sm:px-5"
              >
                <Link href="/assistant-patients?add=1">
                  <UserPlusIcon className="mr-2 size-4" aria-hidden />
                  Register patient
                </Link>
              </Button>
              <Button
                asChild
                className="h-10 shrink-0 rounded-xl border-0 bg-[#1A5345] px-4 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(26,83,69,0.25)] hover:bg-[#133F34] sm:px-5"
              >
                <Link href="/assistant-appointments?create=1">
                  <CalendarPlusIcon className="mr-2 size-4" aria-hidden />
                  New booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="w-full min-w-0">
          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title="Active tasks"
              value={stats.activeTasks}
              description="Pending & in-progress"
              icon={ClipboardListIcon}
              colorClass="bg-[#E8F0EE] text-[#1A5345]"
              href="/assistant-procedures"
            />
            <StatCard
              title="Assigned cases"
              value={stats.assignedCases}
              description="Patients under care"
              icon={UsersIcon}
              colorClass="bg-[#CC5533]/12 text-[#CC5533]"
              href="/assistant-patients"
            />
            <StatCard
              title="Hours this week"
              value={stats.hoursThisWeek}
              description="Time logged in the system"
              icon={CalendarClockIcon}
              colorClass="bg-[#CC5533]/16 text-[#B84A2E]"
            />
            <StatCard
              title="Supported doctors"
              value={stats.supportedDoctors}
              description="Active collaborations"
              icon={StethoscopeIcon}
              colorClass="bg-[#CC5533]/10 text-[#CC5533]"
              href="/assistant-doctors"
            />
          </div>

          <div className="mt-6 sm:mt-8">
            <DashboardQuickActions />
          </div>

          {/* Charts Section */}
          <div className="mt-8 space-y-6 sm:mt-10">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#CC5533]" aria-hidden />
              <h2 className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[19px]">Insights</h2>
            </div>
            <AssistantDashboardCharts data={data} />
          </div>

          <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#CC5533]" aria-hidden />
              <h2 className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[19px]">Lists & activity</h2>
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="grid gap-6 xl:grid-cols-2">
                <ListContainer title="Active tasks" icon={ClipboardListIcon} href="/assistant-procedures" viewAllText="View all tasks">
                  {data.tasks.slice(0, 4).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ListContainer>

                <ListContainer title="Assigned cases" icon={UsersIcon} href="/assistant-patients" viewAllText="View all patients">
                  {data.assignedCases.slice(0, 4).map((assignedCase) => (
                    <CaseRow key={assignedCase.id} assignedCase={assignedCase} />
                  ))}
                </ListContainer>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ListContainer title="Doctor support" icon={StethoscopeIcon} href="/assistant-doctors" viewAllText="View directory">
                  {data.doctorSupport.slice(0, 4).map((support) => (
                    <DoctorSupportRow key={support.id} support={support} />
                  ))}
                </ListContainer>

                <ListContainer title="Recent activity" icon={HistoryIcon} href="/assistant-account" viewAllText="View history">
                  {data.recentActivity.slice(0, 4).map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </ListContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export type AssistantDashboardProps = {
  data: AssistantDashboardData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function AssistantDashboard({ data, isLoading, isError, error }: AssistantDashboardProps) {
  if (isLoading) {
    return (
      <main className="flex h-[calc(100vh-4rem)] w-full min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 py-6 sm:px-8">
        <div className="w-full min-w-0">
          <div className="w-full rounded-2xl border border-[#E8E6E0]/70 bg-gradient-to-br from-white to-[#E8F0EE]/25 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="mb-3 h-8 w-[min(100%,280px)]" />
            <Skeleton className="h-4 w-[min(100%,420px)]" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="size-12 rounded-xl" />
                </div>
                <Skeleton className="mt-3 h-9 w-16" />
                <Skeleton className="mt-4 h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="mb-4 h-4 w-full max-w-lg" />
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-[4.25rem] rounded-xl" />
              ))}
            </div>
          </div>

          {/* Charts skeleton */}
          <div className="grid gap-6 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                <Skeleton className="mb-3 h-4 w-32" />
                <Skeleton className="mb-5 h-3 w-48" />
                <Skeleton className="mx-auto aspect-square max-h-[220px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="w-full min-w-0 flex-1 bg-[#F9F8F5] p-6 sm:p-8">
        <Alert variant="destructive" className="w-full max-w-none rounded-xl">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error?.message || "An error occurred while loading your dashboard."}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return data ? <AssistantDashboardContent data={data} /> : null
}
