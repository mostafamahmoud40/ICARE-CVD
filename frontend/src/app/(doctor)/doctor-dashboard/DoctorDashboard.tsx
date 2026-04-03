"use client"

import * as React from "react"
import type {
  DoctorDashboardData,
  DoctorPatient,
  DoctorAppointment,
  VitalAlert,
  VitalSeverity,
} from "./doctorDashboard.types"
import { useDoctorDashboard } from "./useDoctorDashboard"

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

function severityStyles(severity: VitalSeverity) {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive"
    case "high":
      return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
    case "normal":
    default:
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  }
}

function PatientRow({ patient }: { patient: DoctorPatient }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{patient.fullName}</span>
        <span className="text-xs text-muted-foreground">{patient.id}</span>
      </div>
      <div className="text-sm text-muted-foreground">{patient.condition}</div>
      <div className="text-xs text-muted-foreground">
        Last seen: {formatDateTime(patient.lastSeenAt)}
      </div>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: DoctorAppointment }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{appt.patientName}</span>
        <span className="text-xs text-muted-foreground">{appt.status}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {formatDateTime(appt.scheduledAt)} • {appt.department}
      </div>
      <div className="text-sm">{appt.location}</div>
    </div>
  )
}

function AlertRow({ alert }: { alert: VitalAlert }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{alert.patientName}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs ${severityStyles(alert.severity)}`}>
          {alert.severity}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        {alert.label}: {alert.value}
      </div>
      <div className="text-xs text-muted-foreground">
        Updated: {formatDateTime(alert.at)}
      </div>
    </div>
  )
}

function DoctorHeader({ data }: { data: DoctorDashboardData }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, Dr. {data.doctor.fullName}
      </h1>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <span>Department: {data.doctor.department}</span>
        <span>•</span>
        <span>
          Workload: {data.workload.patientsPerWeek} patients/week
        </span>
      </div>
    </div>
  )
}

function DoctorDashboardContent({ data }: { data: DoctorDashboardData }) {
  return (
    <div className="space-y-6">
      <DoctorHeader data={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Assigned Patients</CardTitle>
            <CardDescription>Your current patient list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assignedPatients.map((p, idx) => (
              <div key={p.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <PatientRow patient={p} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Workload</CardTitle>
            <CardDescription>Capacity and availability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">Patients / week</div>
              <div className="text-3xl font-semibold tracking-tight">
                {data.workload.patientsPerWeek}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">Hours available</div>
              <div className="text-3xl font-semibold tracking-tight">
                {data.workload.hoursAvailable}
              </div>
              <div className="text-xs text-muted-foreground">Mock only for now.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Next visits scheduled for your department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingAppointments.map((appt, idx) => (
              <div key={appt.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <AppointmentRow appt={appt} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Vital Alerts</CardTitle>
            <CardDescription>Needs attention based on mock severity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAlerts.map((alert, idx) => (
              <div key={alert.id}>
                {idx !== 0 ? <Separator className="my-3" /> : null}
                <AlertRow alert={alert} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DoctorDashboard() {
  const { data, isLoading, isError, error } = useDoctorDashboard()

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4">
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
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

      {data ? <DoctorDashboardContent data={data} /> : null}
    </main>
  )
}

