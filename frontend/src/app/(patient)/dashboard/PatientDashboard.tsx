"use client"

import * as React from "react"
import type { PatientDashboardData, Vital } from "./dashboard.types"

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

function formatDate(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date)
}

function VitalCard({ vital }: { vital: Vital }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardDescription className="font-heading">{vital.label}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold tracking-tight">{vital.value}</div>
          {vital.unit ? (
            <div className="text-sm text-muted-foreground">{vital.unit}</div>
          ) : null}
        </div>
        {vital.reference ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Ref: {vital.reference}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Updated: {formatDateTime(vital.lastMeasuredAt)}
        </p>
      </CardContent>
    </Card>
  )
}

function PatientHeader({ data }: { data: PatientDashboardData }) {
  const { patient, lastVitalsAt } = data
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {patient.fullName}
      </h1>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
        <span>Patient ID: {patient.id}</span>
        <span>•</span>
        <span>Last vitals: {formatDateTime(lastVitalsAt)}</span>
      </div>
    </div>
  )
}

function PatientDashboardContent({ data }: { data: PatientDashboardData }) {
  return (
    <div className="space-y-6">
      <PatientHeader data={data} />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-medium">Your Vital Signs</h2>
          <p className="text-sm text-muted-foreground">
            Recent measurements taken by your care team.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.vitals.map((v) => (
            <VitalCard key={v.id} vital={v} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Plan your visits and keep track of dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingAppointments.map((appt, idx) => {
              const showDivider = idx !== 0
              return (
                <div key={appt.id}>
                  {showDivider ? <Separator className="my-3" /> : null}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">
                        {appt.department}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(appt.scheduledAt)} • {appt.clinician}
                    </div>
                    <div className="text-sm">{appt.location}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Medications</CardTitle>
            <CardDescription>
              Your active prescriptions (mock data).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.medications.map((med, idx) => {
              const showDivider = idx !== 0
              return (
                <div key={med.id}>
                  {showDivider ? <Separator className="my-3" /> : null}
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">{med.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {med.dosage} • {med.frequency}
                    </div>
                    {med.lastTakenAt ? (
                      <div className="text-xs text-muted-foreground">
                        Last taken: {formatDate(med.lastTakenAt)}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Care Summary</CardTitle>
          <CardDescription>
            A quick overview of your next steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Last check-up</div>
              <div className="text-base font-medium">
                {formatDateTime(data.careSummary.lastCheckUpAt)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Next follow-up</div>
              <div className="text-base font-medium">
                {formatDateTime(data.careSummary.nextFollowUpAt)}
              </div>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">{data.careSummary.planNote}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export type PatientDashboardProps = {
  data: PatientDashboardData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function PatientDashboard({ data, isLoading, isError, error }: PatientDashboardProps) {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4">
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="h-full">
                <CardContent className="space-y-3 pt-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 pt-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 pt-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
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

      {data ? <PatientDashboardContent data={data} /> : null}
    </main>
  )
}
