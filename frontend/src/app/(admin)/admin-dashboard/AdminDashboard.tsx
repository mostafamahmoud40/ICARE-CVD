"use client"

import type { AdminActivity, AdminDashboardData, AdminUser } from "./adminDashboard.types"

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

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function rolePillClass(role: AdminUser["role"]) {
  switch (role) {
    case "doctor":
      return "border-primary/30 bg-primary/10 text-primary"
    case "assistant":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    case "admin":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    case "patient":
    default:
      return "border-muted-foreground/25 bg-muted text-muted-foreground"
  }
}

function statusPillClass(status: AdminUser["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "pending":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    case "suspended":
      return "bg-destructive/10 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function SignupRow({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{user.fullName}</span>
        <span
          className={`rounded-md border px-2 py-0.5 text-xs font-medium ${rolePillClass(user.role)}`}
        >
          {user.role}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusPillClass(user.status)}`}
        >
          {user.status}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">{user.email}</div>
      <div className="text-xs text-muted-foreground">
        Joined: {formatDateTime(user.joinedAt)} · {user.id}
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: AdminActivity }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-medium">{item.summary}</div>
      <div className="text-sm text-muted-foreground">{item.actor}</div>
      <div className="text-xs text-muted-foreground">{formatDateTime(item.at)}</div>
    </div>
  )
}

function AdminHeader({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {data.admin.fullName}
      </h1>
      <p className="text-sm text-muted-foreground">{data.admin.email}</p>
    </div>
  )
}

function AdminDashboardContent({ data }: { data: AdminDashboardData }) {
  const { counts } = data

  return (
    <div className="space-y-6">
      <AdminHeader data={data} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total users</CardTitle>
            <CardDescription>All roles in the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{counts.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Doctors</CardTitle>
            <CardDescription>Verified clinical accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{counts.doctors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patients</CardTitle>
            <CardDescription>Registered patient profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{counts.patients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending review</CardTitle>
            <CardDescription>Signups awaiting verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {counts.pendingVerifications}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Email OTP registrations not yet verified.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent signups</CardTitle>
            <CardDescription>New accounts in the last few days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentSignups.map((user, idx) => (
              <div key={user.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <SignupRow user={user} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Recent platform events.</CardDescription>
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

export type AdminDashboardProps = {
  data: AdminDashboardData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function AdminDashboard({ data, isLoading, isError, error }: AdminDashboardProps) {
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
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load dashboard."}
          </AlertDescription>
        </Alert>
      ) : null}

      {data ? <AdminDashboardContent data={data} /> : null}
    </main>
  )
}
