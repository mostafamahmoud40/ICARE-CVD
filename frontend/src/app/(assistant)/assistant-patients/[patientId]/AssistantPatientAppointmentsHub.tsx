"use client"

import {
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarPlusIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
  MoreVerticalIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { showIcareToast } from "@/components/shared/icare-toast"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import type { AssistantAppointmentRow, AssistantPatientSummary } from "./assistantPatientProfile.types"
import { APPOINTMENT_TABLE_GRID } from "./assistantPatientProfile.constants"
import {
  appointmentClipboardText,
  copyAssistantPatientRowToClipboard as copyToClipboard,
} from "./assistantPatientProfile.clipboard"

type AssistantPatientAppointmentsHubProps = {
  appointments: AssistantAppointmentRow[]
  patient: Pick<AssistantPatientSummary, "name">
  appointmentDetail: AssistantAppointmentRow | null
  onAppointmentDetailChange: (row: AssistantAppointmentRow | null) => void
  emptyHubMessage: (section: string) => string
}

export function AssistantPatientAppointmentsHub({
  appointments,
  patient,
  appointmentDetail,
  onAppointmentDetailChange,
  emptyHubMessage,
}: AssistantPatientAppointmentsHubProps) {
  return (
<div className="w-full px-4 sm:px-8 py-8 flex flex-col">
  <div className="flex items-center justify-between mb-8">
    <div>
      <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Appointments</h2>
      <p className="text-[13px] font-medium text-muted-foreground mt-1">Manage and schedule patient visits</p>
    </div>
    <Button className="bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl shadow-[0_2px_10px_rgba(26,83,69,0.2)] h-10 px-4 font-bold text-[13px] transition-all border-0">
      <CalendarPlusIcon className="size-4 mr-2" strokeWidth={2.5} />
      Book Appointment
    </Button>
  </div>

  <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
    <div className="overflow-x-auto custom-scrollbar">
      <div className="min-w-[960px]">
        <div
          className={`${APPOINTMENT_TABLE_GRID} border-b border-[#E8E6E0]/80 bg-[#F0EFEA] py-3.5 text-left`}
          role="row"
        >
          <span className="text-[15px] font-bold text-[#1A1F1E]">Date</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Visit type · location</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Doctor</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Department</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Time</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Booked by</span>
          <span className="text-[15px] font-bold text-[#1A1F1E]">Status</span>
          <span className="sr-only">Actions</span>
        </div>

        {appointments.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-5 py-10 text-center text-[14px] font-medium text-muted-foreground">
              {emptyHubMessage("appointments")}
            </td>
          </tr>
        ) : appointments.map((app) => (
          <div
            key={app.id}
            role="row"
            className={`${APPOINTMENT_TABLE_GRID} group cursor-pointer border-b border-[#E8E6E0]/50 py-4 last:border-b-0 transition-colors hover:bg-[#F9F8F5]/70`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
              <span className="text-[14px] font-bold text-[#1A1F1E]">{app.date}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="min-w-0 truncate text-[13px] font-semibold text-[#1A1F1E]">
                {app.type}
              </span>
              <div className="flex items-center gap-1.5">
                {app.visitMode === "video" ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-200/90 bg-violet-50/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-900 normal-case">
                    <VideoIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                    Virtual
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#E8E6E0] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1A1F1E]">
                    <Building2Icon className="size-3 shrink-0 text-[#1A5345]/80" strokeWidth={2} aria-hidden />
                    In clinic
                  </span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
                <PatientAvatar
                  name={app.doctor.name}
                  avatarUrl={app.doctor.avatar}
                  sizes="36px"
                  initialsClassName="text-[10px]"
                />
              </div>
              <p className="min-w-0 truncate text-[14px] font-bold text-[#1A5345] transition-colors group-hover:text-[#1A1F1E]">
                {app.doctor.name}
              </p>
            </div>
            <p className="min-w-0 truncate text-[13px] font-medium text-[#1A1F1E]">{app.doctor.department}</p>
            <div className="flex min-w-0 items-center gap-2">
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 tabular-nums text-[13px] font-semibold text-[#1A1F1E]">{app.time}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 truncate text-[13px] font-medium text-[#1A1F1E]">{app.bookedBy}</span>
            </div>
            <div className="min-w-0">
              {app.status === "Upcoming" && (
                <Badge className="border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-blue-700 shadow-sm hover:bg-blue-50 w-fit">
                  Upcoming
                </Badge>
              )}
              {app.status === "Completed" && (
                <Badge className="w-fit border border-[#1A5345]/20 bg-[#E8F0EE] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#1A5345] shadow-sm hover:bg-[#E8F0EE]">
                  Completed
                </Badge>
              )}
              {app.status === "Canceled" && (
                <Badge className="w-fit border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-red-700 shadow-sm hover:bg-red-50">
                  Canceled
                </Badge>
              )}
            </div>
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-muted-foreground group-hover:bg-white group-hover:text-[#1A1F1E]"
                    aria-label={`More actions for appointment ${app.date}`}
                  >
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border-[#E8E6E0]/80 p-1.5 shadow-lg"
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() => onAppointmentDetailChange(app)}
                  >
                    <EyeIcon className="size-4 text-[#1A5345]" />
                    View appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() =>
                      void copyToClipboard(
                        "Appointment details copied",
                        appointmentClipboardText(app, patient.name)
                      )
                    }
                  >
                    <CopyIcon className="size-4 text-muted-foreground" />
                    Copy details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#E8E6E0]/60" />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                    onClick={() =>
                      showIcareToast({
                        title: "Reschedule",
                        description:
                          "Scheduling integration is not connected yet. Use the clinic calendar or EHR.",
                        icon: CalendarClockIcon,
                      })
                    }
                  >
                    <CalendarClockIcon className="size-4 text-muted-foreground" />
                    Reschedule…
                  </DropdownMenuItem>
                  {app.status === "Upcoming" && (
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium text-amber-800 focus:bg-amber-50"
                      onClick={() =>
                        showIcareToast({
                          title: "Cancellation request",
                          description:
                            "Patient notifications and slot release will run when scheduling is connected.",
                          icon: XIcon,
                        })
                      }
                    >
                      <XIcon className="size-4" />
                      Cancel appointment…
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <Dialog
    open={appointmentDetail != null}
    onOpenChange={(open) => !open && onAppointmentDetailChange(null)}
  >
    <DialogContent className="max-w-md rounded-2xl border-[#E8E6E0]">
      <DialogHeader>
        <DialogTitle className="font-serif text-lg text-[#1A1F1E]">
          {appointmentDetail?.type}
        </DialogTitle>
        <p className="text-[13px] font-medium text-muted-foreground">
          {appointmentDetail?.date} · {appointmentDetail?.time}
        </p>
      </DialogHeader>
      {appointmentDetail && (
        <div className="flex flex-col gap-4 text-[13px]">
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/50 p-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-white">
              <PatientAvatar
                name={appointmentDetail.doctor.name}
                avatarUrl={appointmentDetail.doctor.avatar}
                sizes="44px"
                initialsClassName="text-[12px]"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1A5345]">{appointmentDetail.doctor.name}</p>
              <p className="text-[12px] font-medium text-muted-foreground">
                {appointmentDetail.doctor.department}
              </p>
            </div>
          </div>
          <dl className="grid gap-2">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted-foreground">Visit location</dt>
              <dd className="flex items-center justify-end gap-1.5 font-bold text-[#1A1F1E]">
                {appointmentDetail.visitMode === "video" ? (
                  <>
                    <VideoIcon className="size-4 text-violet-700" strokeWidth={2} aria-hidden />
                    Virtual
                  </>
                ) : (
                  <>
                    <Building2Icon className="size-4 text-[#1A5345]" strokeWidth={2} aria-hidden />
                    In clinic
                  </>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted-foreground">Status</dt>
              <dd className="font-bold text-[#1A1F1E]">{appointmentDetail.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted-foreground">Booked by</dt>
              <dd className="text-right font-medium text-[#1A1F1E]">
                {appointmentDetail.bookedBy}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </DialogContent>
  </Dialog>
</div>
  )
}
