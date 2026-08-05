"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { AssistantAppointments } from "./AssistantAppointments"
import { useAssistantAppointments } from "./useAssistantAppointments"

function AppointmentsShell() {
  const state = useAssistantAppointments()
  const searchParams = useSearchParams()
  const openCreate = searchParams.get("create") === "1"

  return <AssistantAppointments {...state} defaultCreateDialogOpen={openCreate} />
}

function AppointmentsFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 bg-[#F9F8F5] px-6 text-sm text-muted-foreground">
      Loading appointments…
    </div>
  )
}

export function AssistantAppointmentsPageContainer() {
  return (
    <Suspense fallback={<AppointmentsFallback />}>
      <AppointmentsShell />
    </Suspense>
  )
}
