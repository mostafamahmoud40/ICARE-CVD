import type { Appointment } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./shared"
import { ClockIcon, UserIcon } from "lucide-react"
import { formatDateTime } from "./appointments.utils"

type AppointmentRowProps = {
  department: string
  status: Appointment["status"]
  scheduledAt: string
  clinician: string
  notes?: string
}

function AppointmentRow({ department, status, scheduledAt, clinician, notes }: AppointmentRowProps) {
  return (
    <div className="flex flex-col gap-1.5 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[#1A1F1E]">{department}</span>
        <StatusBadge status={status} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B7870]">
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3.5" />
          {formatDateTime(scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <UserIcon className="size-3.5" />
          {clinician}
        </span>
      </div>
      {notes && <p className="text-xs text-[#6B7870]">{notes}</p>}
    </div>
  )
}

type PastAppointmentsSectionProps = {
  appointments: Appointment[]
  className?: string
}

export function PastAppointmentsSection({ appointments, className }: PastAppointmentsSectionProps) {
  if (appointments.length === 0) return null
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <div className="p-6 pb-3">
        <h2 className="text-lg font-semibold text-[#1A1F1E]">Past Appointments</h2>
        <p className="text-sm text-[#6B7870]">Your appointment history</p>
      </div>
      <div className="divide-y divide-[#E8E6E0]">
        {appointments.map((appt) => (
          <AppointmentRow
            key={appt.id}
            department={appt.department}
            status={appt.status}
            scheduledAt={appt.scheduledAt}
            clinician={appt.clinician}
            notes={appt.notes}
          />
        ))}
      </div>
    </div>
  )
}
