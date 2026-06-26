"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Building2Icon,
  CalendarClockIcon,
  ClockIcon,
  FileTextIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AssistantPatientProfileTabId, AssistantPatientSummary, VitalSummaryCard } from "./assistantPatientProfile.types"
import { AssistantPatientMedicationsTab } from "./AssistantPatientMedicationsTab"
import { AssistantPatientProfileOverviewTab } from "./AssistantPatientProfileOverviewTab"

import type { LucideIcon } from "lucide-react"

type ProfileTab = {
  id: AssistantPatientProfileTabId
  label: string
  icon: LucideIcon
}

type AssistantPatientProfileDashboardProps = {
  patient: AssistantPatientSummary
  vitals: VitalSummaryCard[]
  tabs: ProfileTab[]
  activeTab: AssistantPatientProfileTabId
  onActiveTabChange: (tab: AssistantPatientProfileTabId) => void
  patientId: string
}

export function AssistantPatientProfileDashboard({
  patient,
  vitals,
  tabs,
  activeTab,
  onActiveTabChange,
  patientId,
}: AssistantPatientProfileDashboardProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">

  {/* Appointments / Visits Summary */}
  <div className="rounded-xl border border-[#E8E6E0]/70 bg-white px-4 py-4 sm:px-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E6E0]/50 pb-3">
      <h2 className="text-[14px] font-bold text-[#1A1F1E] sm:text-[18px]">
        Appointments
      </h2>
      <Button variant="outline" size="sm" className="h-8 rounded-lg border-[#E8E6E0] px-4 text-[12px] font-semibold text-[#1A1F1E] hover:bg-slate-50 hover:text-[#1A5345] transition-all shadow-sm">
        View All
      </Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Upcoming Appointment */}
      <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:border-[#1A5345]/30 hover:shadow-md transition-all group p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between z-10">
          <Badge className="rounded-lg bg-[#E89042] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0">
            Upcoming
          </Badge>
          <div className="flex size-9 items-center justify-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] text-[#D9772B] shadow-sm">
            <VideoIcon className="size-4" strokeWidth={2} />
          </div>
        </div>

        <hr className="border-[#E8E6E0]/60 z-10" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-[#1A5345]/70 mb-0.5">Department</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Cardiology</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-[#1A5345]/70 mb-0.5">Doctor</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Dr. Andrew Clark</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-[#1A5345]/70 mb-0.5">Date & Time</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">21 Dec 2026, 07:00 AM</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-[#1A5345]/70 mb-0.5">Booked On</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">20 Dec 2026</span>
          </div>
        </div>
        <div className="z-10 mt-1 border-t border-[#E8E6E0]/70 pt-4">
          <p className="mb-3 text-[11px] font-medium text-muted-foreground">
            Need to change this visit?
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
            <Button
              type="button"
              className="h-8 flex-1 gap-2 rounded-lg bg-[#1A5345] px-3 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
              aria-label="Reschedule this appointment"
            >
              <CalendarClockIcon className="size-3.5 shrink-0" strokeWidth={2.5} />
              Reschedule
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 flex-1 gap-2 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#6B7870] shadow-sm hover:bg-slate-50 hover:text-rose-600 sm:flex-initial sm:min-w-[7.5rem]"
                  aria-label="Cancel this appointment"
                >
                  <XIcon className="size-3.5 shrink-0" strokeWidth={2.5} />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this upcoming appointment with Dr. Andrew Clark? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">Yes, Cancel It</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Completed Appointment */}
      <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:border-[#1A5345]/30 hover:shadow-md transition-all group p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between z-10">
          <Badge className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm border-0">
            Completed
          </Badge>
          <div className="flex size-9 items-center justify-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] text-[#1A5345] shadow-sm">
            <Building2Icon className="size-4" strokeWidth={2} />
          </div>
        </div>

        <hr className="border-[#E8E6E0]/60 z-10" />

        <div className="grid grid-cols-2 gap-y-5 gap-x-3 z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-muted-foreground mb-0.5">Department</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Radiology</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-muted-foreground mb-0.5">Doctor</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Dr. Laura Mitchell</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-muted-foreground mb-0.5">Date & Time</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">15 Jan 2026, 10:35 AM</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-muted-foreground mb-0.5">Booked On</span>
            <span className="text-[14px] font-bold text-[#1A1F1E] truncate">13 Jan 2026</span>
          </div>
        </div>
        <div className="z-10 mt-1 border-t border-[#E8E6E0]/70 pt-4">
          <p className="mb-3 text-[11px] font-medium text-muted-foreground">
            Report and visit summary are available.
          </p>
          <Button
            type="button"
            className="h-8 w-full gap-2 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
            aria-label="View report for this completed appointment"
          >
            <FileTextIcon className="size-3.5 shrink-0" strokeWidth={2.5} />
            View Report
          </Button>
        </div>
      </div>
    </div>
  </div>

  {/* Vital signs — last recorded (mock) */}
  <div
    id="patient-vitals"
    className="scroll-mt-28 rounded-xl border border-[#E8E6E0]/70 bg-white px-4 py-4 sm:px-5"
  >
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[#E8E6E0]/50 pb-3">
      <h2 className="text-[14px] font-bold text-[#1A1F1E]">Vital signs</h2>
      <span className="text-[12px] font-medium text-muted-foreground">
        Past data
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-x-4 sm:gap-y-4">
      {vitals.map((v) => {
        const Icon = v.icon
        const isCritical = v.status === "critical"
        return (
          <div key={v.label} className="flex min-w-0 gap-2.5">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${isCritical ? 'bg-red-50 border-red-200' : 'border-[#E8E6E0]/60 bg-[#FAFAF8]'}`}
              aria-hidden
            >
              <Icon className={`size-4 ${isCritical ? 'text-red-600' : v.iconClass}`} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[11px] font-medium leading-tight ${isCritical ? "text-red-500" : "text-muted-foreground"}`}>{v.label}</p>
              <p className={`mt-0.5 text-[14px] font-semibold tabular-nums leading-tight ${isCritical ? "text-red-600" : "text-[#1A1F1E]"}`}>
                {v.value}
                <span className={`text-[12px] font-normal ${isCritical ? "text-red-500" : "text-muted-foreground"}`}> {v.unit}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  </div>

  {/* Custom Tabs Navigation */}
  <div className="flex items-center gap-2 border-b border-[#E8E6E0] mt-2 overflow-x-auto custom-scrollbar pb-px">
    {tabs.map((tab) => {
      const Icon = tab.icon
      const isActive = activeTab === tab.id
      return (
        <button
          key={tab.id}
          onClick={() => onActiveTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap text-[14px] font-bold outline-none ${
            isActive
              ? "border-[#1A5345] text-[#1A5345]"
              : "border-transparent text-muted-foreground hover:text-[#1A1F1E] hover:bg-slate-50 rounded-t-lg"
          }`}
        >
          <Icon className="size-4" />
          {tab.label}
        </button>
      )
    })}
  </div>

  {/* Tab Content Area */}
  <div className="bg-white rounded-2xl border border-[#E8E6E0]/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 min-h-[400px]">

      {activeTab === "overview" && (
        <AssistantPatientProfileOverviewTab patient={patient} />
      )}

  {activeTab === "medications" && (
    <AssistantPatientMedicationsTab patientId={patientId} />
  )}

  {activeTab !== "overview" && activeTab !== "medications" && (
    <div className="flex h-64 flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-50 border border-[#E8E6E0]/60 mb-4 ring-4 ring-slate-50/50">
        <ClockIcon className="size-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-[16px] font-bold text-[#1A1F1E]">No Data Available Yet</h3>
      <p className="text-[14px] font-medium text-muted-foreground mt-1 max-w-[300px]">
        The {tabs.find(t => t.id === activeTab)?.label} section is empty or pending synchronization.
      </p>
    </div>
  )}

    </div>
    </div>
  )
}
