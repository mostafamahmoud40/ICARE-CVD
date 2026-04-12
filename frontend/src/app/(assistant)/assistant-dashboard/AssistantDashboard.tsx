"use client"

import * as React from "react"
import type {
  AssistantDashboardData,
  AssistantTask,
  AssignedCase,
  DoctorSupport,
  AssistantActivity,
} from "./assistantDashboard.types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from "lucide-react"

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function taskStatusStyles(status: AssistantTask["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "in-progress":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function taskStatusIcon(status: AssistantTask["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircleIcon className="size-4" />
    case "in-progress":
      return <ClockIcon className="size-4" />
    case "pending":
      return <AlertCircleIcon className="size-4" />
  }
}

function caseStatusStyles(status: AssignedCase["status"]) {
  switch (status) {
    case "active":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "monitoring":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "completed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function activityTypeStyles(type: AssistantActivity["type"]) {
  switch (type) {
    case "task-completed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "case-updated":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "support-provided":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
    case "document-submitted":
      return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function TaskRow({ task }: { task: AssistantTask }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{task.title}</span>
        <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${taskStatusStyles(task.status)}`}>
          {taskStatusIcon(task.status)}
          {task.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">{task.description}</div>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <div>Assigned by: {task.assignedBy}</div>
        <div>Due: {formatDateTime(task.dueAt)}</div>
      </div>
    </div>
  )
}

function CaseRow({ assignedCase }: { assignedCase: AssignedCase }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{assignedCase.patientName}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${caseStatusStyles(assignedCase.status)}`}>
          {assignedCase.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">{assignedCase.condition}</div>
      <div className="text-xs text-muted-foreground">
        ID: {assignedCase.patientId} · Doctor: {assignedCase.primaryDoctor} · Assigned: {formatDateTime(assignedCase.assignedAt)}
      </div>
    </div>
  )
}

function DoctorSupportRow({ support }: { support: DoctorSupport }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{support.doctorName}</span>
        <span className="text-xs text-muted-foreground">{support.department}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {support.supportType} · {support.casesSupported} case{support.casesSupported !== 1 ? 's' : ''} supported
      </div>
      <div className="text-xs text-muted-foreground">
        Last interaction: {formatDateTime(support.lastInteraction)}
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: AssistantActivity }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{item.summary}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${activityTypeStyles(item.type)}`}>
          {item.type.replace(/-/g, " ")}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{formatDateTime(item.at)}</div>
    </div>
  )
}

function AssistantHeader({ data }: { data: AssistantDashboardData }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {data.assistant.fullName}
      </h1>
      <p className="text-sm text-muted-foreground">
        {data.assistant.department} Department · {data.assistant.experienceYears} years experience
      </p>
    </div>
  )
}

function AssistantDashboardContent({ data }: { data: AssistantDashboardData }) {
  const { stats } = data

  return (
    <div className="space-y-6">
      <AssistantHeader data={data} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active tasks</CardTitle>
            <CardDescription>Pending & in-progress tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{stats.activeTasks}</div>
            <div className="mt-1 text-xs text-muted-foreground">Tasks to complete</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assigned cases</CardTitle>
            <CardDescription>Patients under care.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{stats.assignedCases}</div>
            <div className="mt-1 text-xs text-muted-foreground">Active monitoring</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hours this week</CardTitle>
            <CardDescription>Time logged in system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{stats.hoursThisWeek}</div>
            <div className="mt-1 text-xs text-muted-foreground">Hours worked</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Supported doctors</CardTitle>
            <CardDescription>Team collaboration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{stats.supportedDoctors}</div>
            <div className="mt-1 text-xs text-muted-foreground">Doctor partners</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active tasks</CardTitle>
            <CardDescription>Your current workload (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.tasks.slice(0, 3).map((task, idx) => (
              <div key={task.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <TaskRow task={task} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Assigned cases</CardTitle>
            <CardDescription>Patients you are supporting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assignedCases.slice(0, 3).map((assignedCase, idx) => (
              <div key={assignedCase.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <CaseRow assignedCase={assignedCase} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Doctor support</CardTitle>
            <CardDescription>Collaboration with medical team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.doctorSupport.map((support, idx) => (
              <div key={support.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <DoctorSupportRow support={support} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your recent actions (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.map((item, idx) => (
              <div key={item.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <ActivityRow item={item} />
              </div>
            ))}
          </CardContent>
        </Card>
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
  return (
    <main className="w-full space-y-6 p-4">
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-9 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {error?.message || "An error occurred while loading your dashboard."}
          </AlertDescription>
        </Alert>
      ) : data ? (
        <AssistantDashboardContent data={data} />
      ) : null}
    </main>
  )
}
