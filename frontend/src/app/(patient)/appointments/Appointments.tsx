"use client"

import type { AppointmentsPageData } from "./appointments.types"
import { Skeleton } from "@/components/ui/skeleton"
import { MyAppointments } from "./MyAppointments"
import { useAppointments } from "./useAppointments"

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-2xl" />
    </div>
  )
}

function AppointmentsContent({
  data,
  onCancelAppointment,
}: {
  data: AppointmentsPageData
  onCancelAppointment: (appointmentId: string) => Promise<unknown>
}) {
  return (
    <MyAppointments
      appointments={data.appointments}
      upcoming={data.upcoming}
      past={data.past}
      onCancelAppointment={onCancelAppointment}
    />
  )
}

export function Appointments() {
  const { data, isLoading, cancelAppointment } = useAppointments()
  return (
    <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      {isLoading ? <LoadingSkeleton /> : null}
      {data ? (
        <AppointmentsContent data={data} onCancelAppointment={cancelAppointment} />
      ) : null}
    </main>
  )
}
