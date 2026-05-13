"use client"

import Link from "next/link"
import {
  ArrowLeftIcon,
  ActivityIcon,
  HeartPulseIcon,
  SyringeIcon,
  FileTextIcon,
  CalendarIcon,
  StethoscopeIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DownloadIcon,
  ShareIcon,
  ClockIcon,
  AlertCircleIcon,
  PillIcon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  EditIcon,
  HeartIcon,
  BriefcaseIcon,
  CalendarPlusIcon,
  HistoryIcon,
  GaugeIcon,
  DropletsIcon,
  ThermometerIcon,
  WindIcon,
  ScaleIcon,
  Building2Icon,
  VideoIcon,
  ShieldAlertIcon,
  FlameIcon,
  DumbbellIcon,
  ShieldIcon,
  UsersIcon,
  QrCodeIcon,
  AlertTriangleIcon,
  CalendarClockIcon,
  XIcon,
  CigaretteIcon,
  BrainIcon,
  SaladIcon,
  MoonIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  UserIcon,
  Quote,
  Printer,
  SendIcon,
  EyeIcon,
  CopyIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from "recharts"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { showIcareToast } from "@/components/shared/icare-toast"

import { MedicalHistory } from "@/components/patient-profile/MedicalHistory"
import { Documents } from "@/components/patient-profile/Documents"

import { useAssistantPatientProfilePage } from "./useAssistantPatientProfilePage"
import {
  MOCK_ACTIVE_MEDICATIONS_ASSISTANT,
  MOCK_APPOINTMENTS,
  MOCK_LAB_RESULTS,
  MOCK_PAST_MEDICATIONS,
  MOCK_PRESCRIPTIONS,
  MOCK_VISIT_HISTORY,
  MOCK_VITALS_HISTORY,
  MOCK_VITALS_TREND,
} from "./assistantPatientProfile.mock"
import {
  APPOINTMENT_TABLE_GRID,
  VITALS_TABLE_GRID,
  VISIT_HISTORY_TABLE_GRID,
} from "./assistantPatientProfile.constants"
import {
  appointmentClipboardText,
  appointmentVisitModeLabel,
  copyAssistantPatientRowToClipboard as copyToClipboard,
  vitalsRecorderInitials,
  vitalsRowClipboardText,
} from "./assistantPatientProfile.clipboard"
import { AddVitalsDialog } from "./AddVitalsDialog"
import { LabReportDialog } from "./LabReportDialog"
import { PrescriptionDialog } from "./PrescriptionDialog"

type AssistantPatientProfilePageProps = {
  patientId: string
}

export function AssistantPatientProfilePage({ patientId: routePatientId }: AssistantPatientProfilePageProps) {
  const {
    patientId,
    patient,
    vitals,
    tabs,
    patientProfilePath,
    hubNavItems,
    hubNavActive,
    hubViewParam,
    showHubSoon,
    activeTab,
    setActiveTab,
    medicationSubTab,
    setMedicationSubTab,
    medicationDetailId,
    setMedicationDetailId,
    medicationDetail,
    isAddVitalsOpen,
    setIsAddVitalsOpen,
    expandedLabId,
    setExpandedLabId,
    selectedLabReport,
    setSelectedLabReport,
    selectedPrescription,
    setSelectedPrescription,
    vitalReadingDetail,
    setVitalReadingDetail,
    appointmentDetail,
    setAppointmentDetail,
  } = useAssistantPatientProfilePage({ routePatientId })

  return (
    <div className="flex h-full flex-col bg-[#F9F8F5] overflow-hidden animate-in fade-in duration-500">
      
      {/* Top bar + patient hub nav (reference: pill tabs under header) */}
      <div className="flex-none z-20 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex w-full items-center justify-between px-8 py-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link href="/assistant-patients">
              <Button variant="ghost" size="icon" className="size-9 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E] border border-transparent hover:border-[#E8E6E0]/60 transition-all">
                <ArrowLeftIcon className="size-4.5" strokeWidth={2} />
              </Button>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-[#1A1F1E] tracking-tight">{patient.name}</h1>
                <span className="inline-flex items-center rounded-full bg-[#1A5345]/10 px-2 py-0.5 text-[11px] font-bold text-[#1A5345]">
                  {patient.status}
                </span>
              </div>
              <span className="text-[13px] font-medium text-muted-foreground">Patient Profile &bull; {patient.mrn}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[13px] font-semibold text-[#1A1F1E] hover:bg-slate-50 hover:text-[#1A5345] shadow-sm transition-all">
              <DownloadIcon className="size-3.5" />
              Export
            </Button>
            <Button className="h-9 gap-2 rounded-lg bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#133F34] shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all border-0">
              <EditIcon className="size-3.5" />
              Edit Profile
            </Button>
          </div>
        </div>

        <nav
          className="border-t border-[#E8E6E0]/50 px-8 pb-3 pt-2"
          aria-label="Patient record sections"
        >
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5 [-webkit-mask-image:linear-gradient(to_right,black_calc(100%_-_12px),transparent)] [mask-image:linear-gradient(to_right,black_calc(100%_-_12px),transparent)] sm:[mask-image:none]">
            {hubNavItems.map((item) => {
              const active = hubNavActive(item.key)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/35 focus-visible:ring-offset-2",
                    active
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-[#1A1F1E] hover:border-[#1A5345]/25 hover:bg-slate-50"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {showHubSoon ? (
          <div className="flex min-h-[min(520px,calc(100vh-200px))] flex-col items-center justify-center px-8 py-24">
            <ClockIcon className="mb-5 size-14 text-muted-foreground/35" strokeWidth={1.25} aria-hidden />
            <p className="text-[clamp(1.5rem,4vw,1.75rem)] font-semibold tracking-tight text-[#1A1F1E]">
              Soon
            </p>
          </div>
        ) : hubViewParam === "documents" ? (
          <Documents />
        ) : hubViewParam === "medical-history" ? (
          <MedicalHistory />
        ) : hubViewParam === "visit-history" ? (
          <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Visit History</h2>
                <p className="text-[13px] font-medium text-muted-foreground mt-1">Timeline of 12 clinical encounters</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="hidden sm:flex items-center bg-white border border-[#E8E6E0] rounded-xl px-1.5 h-10">
                    <button className="px-3 py-1.5 text-[12px] font-bold text-[#1A5345] bg-[#F9F8F5] rounded-lg">All</button>
                    <button className="px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-[#1A1F1E]">Completed</button>
                    <button className="px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-[#1A1F1E]">Cancelled</button>
                 </div>
                 <Button className="bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl shadow-[0_2px_10px_rgba(26,83,69,0.2)] h-10 px-4 font-bold text-[13px] transition-all border-0">
                    <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
                    New Visit
                 </Button>
              </div>
            </div>

            <div className="relative flex flex-col gap-12 pt-4">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[144px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#E8E6E0] via-[#E8E6E0] to-transparent hidden md:block"></div>

              {MOCK_VISIT_HISTORY.map((visit, index) => (
                <div key={visit.id} className="relative flex flex-col md:flex-row gap-6 md:gap-14 group">
                  {/* Date & Node Panel */}
                  <div className="md:w-[120px] shrink-0 md:text-right pt-1 relative">
                    <p className="text-[15px] font-bold text-[#1A1F1E] leading-tight">{visit.date}</p>
                    <p className="text-[12px] font-medium text-muted-foreground mt-1.5">{visit.timeAgo}</p>
                    <div className="mt-4 flex md:justify-end">
                      <Badge variant="outline" className="rounded-lg border-[#E8E6E0] bg-[#F9F8F5]/80 px-2 py-0.5 text-[10px] font-bold text-[#1A5345] shadow-sm">
                        {visit.type}
                      </Badge>
                    </div>
                    
                    {/* Timeline Node */}
                    <div className="hidden md:flex absolute -right-[23px] top-[14px] size-4 items-center justify-center">
                       <div className="size-3 rounded-full border-2 border-white bg-[#1A5345] shadow-[0_0_0_2px_rgba(26,83,69,0.1)] group-hover:scale-125 transition-transform duration-300"></div>
                    </div>
                  </div>

                  {/* Main Card Content */}
                  <div className="flex-1 rounded-xl border border-[#ECEAE4] bg-white p-5 md:p-6 shadow-none hover:border-[#DDD9D0]">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                           <div className="size-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-sm ring-1 ring-[#E8E6E0]/50">
                              <img src={visit.doctor.avatar} alt="" className="size-full object-cover" />
                           </div>
                           <div>
                              <p className="text-[16px] font-bold text-[#1A1F1E] flex items-center gap-1.5 group-hover:text-[#1A5345] transition-colors">
                                 {visit.doctor.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[12px] font-medium text-muted-foreground">{visit.doctor.department}</span>
                                 <span className="size-1 rounded-full bg-muted-foreground/30"></span>
                                 <span className="text-[12px] font-bold text-[#1A5345]/80">Primary Care</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A1F1E]">
                              <DownloadIcon className="size-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-[#F9F8F5] text-muted-foreground hover:text-[#1A1F1E]">
                              <MoreVerticalIcon className="size-4" />
                           </Button>
                        </div>
                      </div>

                      <div className="relative">
                         <Quote className="absolute -left-1 -top-1 size-8 text-[#1A5345]/5 opacity-20" />
                         <p className="text-[15px] text-[#1A1F1E]/90 leading-relaxed font-medium pl-2">
                            {visit.summary}
                         </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E8E6E0]/40">
                         <div className="flex flex-wrap gap-2">
                            {visit.tags.map((tag, idx) => (
                               <div key={idx} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all hover:scale-105 cursor-pointer shadow-sm", tag.color)}>
                                  <tag.icon className="size-3" />
                                  {tag.label}
                               </div>
                            ))}
                         </div>
                        <Button className="h-10 gap-1.5 rounded-lg bg-[#1A5345] px-5 text-[13px] font-semibold text-white hover:bg-[#133F34]">
                          <FileTextIcon className="size-4" strokeWidth={2} />
                            View full visit
                         </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : hubViewParam === "lab-results" ? (
          <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Lab Results</h2>
                <p className="text-[13px] font-medium text-muted-foreground mt-1">Sytematic record of laboratory investigations</p>
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="outline" className="rounded-xl border-[#E8E6E0] text-[#1A1F1E] font-bold h-10 px-4 text-[13px]">
                    <RefreshCwIcon className="size-4 mr-2" />
                    Sync Lab
                 </Button>
                 <Button className="bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl shadow-[0_2px_10px_rgba(26,83,69,0.2)] h-10 px-4 font-bold text-[13px] transition-all border-0">
                    <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
                    Add Result
                 </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
              {/* Table Header Row */}
              <div className="normal-case hidden md:grid grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-6 py-3.5 bg-[#FAFAF8] border-b border-[#E8E6E0]/80">
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Analysis title</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Category</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Date</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Requested by</span>
                <span className="sr-only">Actions</span>
              </div>

              <div className="divide-y divide-[#E8E6E0]/60">
                {MOCK_LAB_RESULTS.map((report) => (
                  <div key={report.id} className="group transition-all duration-200">
                    {/* Report Header Row */}
                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-6 py-5 items-center hover:bg-[#F9F8F5]/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] text-[#1A5345]">
                          <DropletsIcon className="size-5" />
                        </div>
                        <h3 className="text-[15px] font-bold text-[#1A1F1E] truncate">{report.title}</h3>
                      </div>
                      
                      <div className="hidden md:block">
                        <Badge variant="outline" className="rounded-lg border-[#E8E6E0] bg-white text-[11px] font-bold text-[#1A5345] px-2.5 py-0.5">
                          {report.category}
                        </Badge>
                      </div>

                      <div className="hidden md:block">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{report.date}</span>
                      </div>

                      <div className="hidden md:flex items-center gap-3 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
                           <img src={report.doctor.avatar} alt="" className="size-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <p className="min-w-0 truncate text-[14px] font-bold text-[#1A5345]">
                             {report.doctor.name}
                           </p>
                           <p className="text-[10px] font-medium text-muted-foreground">{report.doctor.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          onClick={() => setSelectedLabReport(report)}
                          variant="outline" 
                          className="h-9 rounded-xl border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none"
                        >
                          View Report
                        </Button>
                        <Button variant="ghost" size="icon" className="size-9 rounded-xl border border-transparent text-muted-foreground hover:border-[#E8E6E0] hover:bg-[#F9F8F5] hover:text-[#1A1F1E]">
                          <DownloadIcon className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expandable details removed in favor of Dialog */}
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Report Formal Dialog */}
            <LabReportDialog 
              report={selectedLabReport} 
              isOpen={!!selectedLabReport} 
              onClose={() => setSelectedLabReport(null)} 
            />
          </div>
        ) : hubViewParam === "prescription" ? (
          <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Prescriptions</h2>
                <p className="text-[13px] font-medium text-muted-foreground mt-1">Manage and track patient medication orders</p>
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="outline" className="rounded-xl border-[#E8E6E0] text-[#1A1F1E] font-bold h-10 px-4 text-[13px]">
                    <DownloadIcon className="size-4 mr-2" />
                    Export All
                 </Button>
                 <Button className="bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl shadow-[0_2px_10px_rgba(26,83,69,0.2)] h-10 px-4 font-bold text-[13px] transition-all border-0">
                    <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
                    New Prescription
                 </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-sm">
              {/* Table Header Row */}
              <div className="normal-case hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-[#FAFAF8] border-b border-[#E8E6E0]/80">
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Prescription title</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Prescribed by</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Date</span>
                <span className="text-[14px] font-semibold !normal-case text-[#1A1F1E]">Status</span>
                <span className="sr-only">Actions</span>
              </div>

              <div className="divide-y divide-[#E8E6E0]/60">
                {MOCK_PRESCRIPTIONS.map((pres) => (
                  <div key={pres.id} className="group transition-all duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-5 items-center hover:bg-[#F9F8F5]/40 transition-colors">
                      {/* Title Column */}
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] text-[#1A5345]">
                          <PillIcon className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1A1F1E] truncate">Medication Order #{pres.id.split('-')[1]}</h3>
                          <p className="text-[11px] font-medium text-muted-foreground">{pres.medications.length} items prescribed</p>
                        </div>
                      </div>

                      {/* Prescribed By Column */}
                      <div className="hidden md:flex items-center gap-3 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
                           <img src={pres.doctor.avatar} alt="" className="size-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <p className="min-w-0 truncate text-[14px] font-bold text-[#1A5345]">
                             {pres.doctor.name}
                           </p>
                           <p className="text-[10px] font-medium text-muted-foreground">{pres.doctor.department}</p>
                        </div>
                      </div>

                      {/* Date Column */}
                      <div className="hidden md:block">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{pres.date}</span>
                      </div>

                      {/* Status Column */}
                      <div className="hidden md:block">
                        <Badge variant="outline" className={cn(
                          "rounded-lg border-[#E8E6E0] bg-white text-[11px] font-bold px-2.5 py-0.5",
                          pres.status === "active" ? "text-emerald-700 border-emerald-100 bg-emerald-50/30" : "text-slate-500 border-slate-100 bg-slate-50/30"
                        )}>
                          {pres.status}
                        </Badge>
                      </div>

                      {/* Actions Column */}
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          onClick={() => setSelectedPrescription(pres)}
                          variant="outline" 
                          className="h-9 rounded-xl border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-none"
                        >
                          View RX
                        </Button>
                        <Button variant="ghost" size="icon" className="size-9 rounded-xl border border-transparent text-muted-foreground hover:border-[#E8E6E0] hover:bg-[#F9F8F5] hover:text-[#1A1F1E]">
                          <ShareIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescription Formal Dialog */}
            <PrescriptionDialog 
              prescription={selectedPrescription} 
              isOpen={!!selectedPrescription} 
              onClose={() => setSelectedPrescription(null)} 
            />
          </div>
        ) : hubViewParam === "vitals" ? (
          <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">Vitals History</h2>
                <p className="text-[13px] font-medium text-muted-foreground mt-1">Recorded physical examinations over time</p>
              </div>
              <Button 
                onClick={() => setIsAddVitalsOpen(true)}
                className="bg-[#1A5345] hover:bg-[#1A1F1E] text-white rounded-xl shadow-[0_2px_10px_rgba(26,83,69,0.2)] h-10 px-4 font-bold text-[13px] transition-all border-0"
              >
                <PlusIcon className="size-4 mr-2" strokeWidth={2.5} />
                Add Reading
              </Button>
            </div>

            {/* Vitals Trend Chart Card */}
            <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <ActivityIcon className="size-5 text-[#1A5345]" strokeWidth={2.5} />
                  <h3 className="text-[16px] font-bold text-[#1A1F1E]">Vitals trend</h3>
                </div>
                <Badge className="rounded-lg border-0 bg-[#1A5345] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1A5345]">
                  All recorded measurements
                </Badge>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_VITALS_TREND} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
                      domain={[60, 160]}
                      ticks={[60, 80, 100, 120, 140, 160]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E8E6E0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    />
                    <RechartsLegend 
                      verticalAlign="top" 
                      align="center" 
                      iconType="rect" 
                      height={40}
                      formatter={(value) => <span className="text-[13px] font-bold text-[#64748b] ml-1 capitalize">{value}</span>}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      name="Systolic"
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={{ r: 6, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      name="Diastolic"
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1100px]">
                  <div
                    className={`${VITALS_TABLE_GRID} border-b border-[#E8E6E0]/80 bg-[#F0EFEA] py-3.5 text-left`}
                    role="row"
                  >
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Date</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Time</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">BP</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">HR</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Temp</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">SpO2</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Glu</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Wgt</span>
                    <span className="text-[15px] font-bold text-[#1A1F1E]">Taken by</span>
                    <span className="sr-only">Actions</span>
                  </div>

                  {MOCK_VITALS_HISTORY.map((vh) => (
                    <div
                      key={vh.id}
                      role="row"
                      className={`${VITALS_TABLE_GRID} group cursor-pointer border-b border-[#E8E6E0]/50 py-4 last:border-b-0 transition-colors hover:bg-[#F9F8F5]/70`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.date}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-[13px] font-semibold text-[#1A1F1E]">{vh.time}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A5345]">{vh.bp}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">mmHg</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.hr}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">bpm</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.temp}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">°C</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.spo2}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.glucose}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">mg/dL</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1A1F1E]">{vh.weight}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">kg</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 truncate text-[13px] font-medium text-[#1A1F1E]">{vh.takenBy}</span>
                      </div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-xl text-muted-foreground group-hover:bg-white group-hover:text-[#1A1F1E]"
                              aria-label={`More actions for ${vh.date}`}
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
                              onClick={() => setVitalReadingDetail(vh)}
                            >
                              <EyeIcon className="size-4 text-[#1A5345]" />
                              View reading
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                              onClick={() =>
                                void copyToClipboard(
                                  "Vitals copied",
                                  vitalsRowClipboardText(vh, patient.name)
                                )
                              }
                            >
                              <CopyIcon className="size-4 text-muted-foreground" />
                              Copy values
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E8E6E0]/60" />
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium"
                              onClick={() =>
                                showIcareToast({
                                  title: "Print & PDF export",
                                  description:
                                    "Reporting will be available when the chart is connected to the document service.",
                                  icon: Printer,
                                })
                              }
                            >
                              <Printer className="size-4 text-muted-foreground" />
                              Print / save as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 rounded-lg text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600"
                              onClick={() =>
                                showIcareToast({
                                  title: "Remove reading",
                                  description:
                                    "Deleting vitals requires clinical permissions. Use the connected EHR when available.",
                                  icon: Trash2Icon,
                                })
                              }
                            >
                              <Trash2Icon className="size-4" />
                              Remove from chart…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Dialog
              open={vitalReadingDetail != null}
              onOpenChange={(open) => !open && setVitalReadingDetail(null)}
            >
              <DialogContent
                showCloseButton={false}
                className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl border-[#E8E6E0] p-0 shadow-lg sm:max-w-[520px]"
              >
                {vitalReadingDetail && (
                  <>
                    <div className="relative border-b border-[#E8E6E0] bg-white px-5 pb-5 pt-5 sm:px-6">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-3 top-3 z-10 size-9 rounded-lg text-muted-foreground hover:bg-[#F5F5F3] hover:text-[#1A1F1E]"
                          aria-label="Close"
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </DialogClose>
                      <div className="flex items-start gap-3 pr-8">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] text-[#1A5345]">
                          <ActivityIcon className="size-5" strokeWidth={2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <DialogTitle className="border-0 p-0 font-sans text-lg font-semibold leading-snug tracking-tight text-[#1A1F1E] shadow-none">
                            Vitals reading
                          </DialogTitle>
                          <DialogDescription className="sr-only">
                            Vital signs for {vitalReadingDetail.date} at {vitalReadingDetail.time}.
                            Blood pressure, heart rate, temperature, oxygen saturation, glucose, and
                            weight. Recorded by {vitalReadingDetail.takenBy}.
                          </DialogDescription>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-medium text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                              {vitalReadingDetail.date}
                            </span>
                            <span className="text-[#D4D1C9]" aria-hidden>
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1.5 tabular-nums text-[#1A1F1E]">
                              <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                              {vitalReadingDetail.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAFAF8] px-5 py-4 sm:px-6">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Measurements
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {(
                          [
                            {
                              label: "Blood pressure",
                              value: vitalReadingDetail.bp,
                              unit: "mmHg",
                              Icon: GaugeIcon,
                              accent: true,
                            },
                            {
                              label: "Heart rate",
                              value: vitalReadingDetail.hr,
                              unit: "bpm",
                              Icon: HeartPulseIcon,
                            },
                            {
                              label: "Temperature",
                              value: vitalReadingDetail.temp,
                              unit: "°C",
                              Icon: ThermometerIcon,
                            },
                            {
                              label: "SpO₂",
                              value: vitalReadingDetail.spo2,
                              unit: "%",
                              Icon: WindIcon,
                            },
                            {
                              label: "Glucose",
                              value: vitalReadingDetail.glucose,
                              unit: "mg/dL",
                              Icon: DropletsIcon,
                            },
                            {
                              label: "Weight",
                              value: vitalReadingDetail.weight,
                              unit: "kg",
                              Icon: ScaleIcon,
                            },
                          ] satisfies ReadonlyArray<{
                            label: string
                            value: string
                            unit: string
                            Icon: LucideIcon
                            accent?: boolean
                          }>
                        ).map(({ label, value, unit, Icon, accent = false }) => (
                          <div
                            key={label}
                            className="rounded-lg border border-[#E8E6E0] bg-white p-3"
                          >
                            <div className="mb-1.5 flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-md border",
                                  accent
                                    ? "border-[#1A5345]/15 bg-[#F3F8F6] text-[#1A5345]"
                                    : "border-[#E8E6E0] bg-[#FAFAF8] text-muted-foreground"
                                )}
                              >
                                <Icon className="size-3" strokeWidth={2} aria-hidden />
                              </div>
                              <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
                                {label}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "font-sans text-[18px] font-semibold tabular-nums leading-none tracking-tight sm:text-[19px]",
                                accent ? "text-[#1A5345]" : "text-[#1A1F1E]"
                              )}
                            >
                              {value}
                              <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                                {unit}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-[#E8E6E0] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E8E6E0] bg-[#F9F8F5] text-[10px] font-bold text-[#1A1F1E]"
                          aria-hidden
                        >
                          {vitalsRecorderInitials(vitalReadingDetail.takenBy)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Recorded by
                          </p>
                          <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                            {vitalReadingDetail.takenBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold text-[#1A1F1E] hover:bg-[#F9F8F5]"
                          onClick={() =>
                            void copyToClipboard(
                              "Vitals copied",
                              vitalsRowClipboardText(vitalReadingDetail, patient.name)
                            )
                          }
                        >
                          <CopyIcon className="mr-1.5 size-3.5" />
                          Copy
                        </Button>
                        <DialogClose asChild>
                          <Button
                            type="button"
                            className="h-9 rounded-lg bg-[#1A5345] px-4 text-[12px] font-semibold text-white hover:bg-[#133F34]"
                          >
                            Done
                          </Button>
                        </DialogClose>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ) : hubViewParam === "appointments" ? (
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

                  {MOCK_APPOINTMENTS.map((app) => (
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
                          <img src={app.doctor.avatar} alt="" className="size-full object-cover" />
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
                              onClick={() => setAppointmentDetail(app)}
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
              onOpenChange={(open) => !open && setAppointmentDetail(null)}
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
                        <img
                          src={appointmentDetail.doctor.avatar}
                          alt=""
                          className="size-full object-cover"
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
        ) : (
        <div className="w-full px-8 py-8 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Patient Identity & Info */}
          <div className="w-full lg:w-[440px] shrink-0 flex flex-col gap-6">
            
            {/* Combined Identity & Details Card */}
            <div className="rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
              {/* Header section */}
              <div className="h-24 bg-gradient-to-br from-[#1A5345] to-[#133F34] relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "16px 16px" }}></div>
              </div>
              <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
                <div className="relative size-24 rounded-full border-4 border-white shadow-md bg-slate-100 overflow-hidden -mt-12 mb-3">
                  <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt={patient.name} className="size-full object-cover" />
                </div>
                <h2 className="text-[20px] font-bold text-[#1A1F1E] font-serif">{patient.name}</h2>
                <p className="text-[14px] font-medium text-muted-foreground mt-0.5">{patient.age} yrs &bull; {patient.gender}</p>
                
                <div className="mt-5 w-full flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                    <AlertCircleIcon className="size-3.5" />
                    <span className="text-[12px] font-bold">{patient.riskLevel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-[#1A1F1E] border border-slate-200">
                    <span className="text-[12px] font-bold tracking-widest">{patient.bloodType}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="px-6">
                <hr className="border-[#E8E6E0]/60" />
              </div>

              {/* Details List */}
              <div className="p-6 flex flex-col gap-5">
                <h3 className="text-[14px] font-bold text-[#1A1F1E]">Patient Details</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4">
                  <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <PhoneIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Phone</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <MailIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Email</span>
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-[14px] font-medium text-[#1A1F1E] break-words [overflow-wrap:anywhere] hover:text-[#1A5345] hover:underline"
                      >
                        {patient.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <MapPinIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Address</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E] leading-snug">{patient.address}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <HeartIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Marital Status</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.maritalStatus}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <BriefcaseIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Occupation</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.occupation}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <CalendarPlusIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Registered On</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.dateAdded}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <HistoryIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Last Visit</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.lastVisitDate}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <ScaleIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Height / BMI</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.height} • {patient.bmi}</span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3 sm:col-span-2 mt-2 pt-2 border-t border-[#E8E6E0]/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
                      <AlertTriangleIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-red-500">Allergies & Contraindications</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {patient.allergies.map(allergy => (
                           <span key={allergy} className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[12px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                             {allergy}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-start gap-3 sm:col-span-2 mt-2 pt-2 border-t border-[#E8E6E0]/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <UsersIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Emergency Contact</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.emergencyContact.name} ({patient.emergencyContact.relation})</span>
                      <span className="text-[13px] font-medium text-muted-foreground mt-0.5">{patient.emergencyContact.phone}</span>
                    </div>
                  </div>

                  <div
                    id="patient-insurance"
                    className="flex min-w-0 scroll-mt-28 items-start gap-3 sm:col-span-2 mt-2 pt-2 border-t border-[#E8E6E0]/50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-muted-foreground border border-[#E8E6E0]/60">
                      <ShieldIcon className="size-3.5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">Insurance Info</span>
                      <span className="text-[14px] font-medium text-[#1A1F1E]">{patient.insurance.provider}</span>
                      <span className="text-[13px] font-medium text-muted-foreground mt-0.5">Policy: {patient.insurance.policyNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Care Team */}
            <div className="rounded-2xl border border-[#1A5345]/10 bg-[#1A5345]/[0.02] p-5 flex flex-col gap-5 relative overflow-hidden">
              <StethoscopeIcon className="absolute -right-4 -bottom-4 size-24 text-[#1A5345]/5" strokeWidth={1} />
              <h3 className="text-[14px] font-bold text-[#1A1F1E] z-10 flex items-center justify-between">
                Care Team
                <Button variant="ghost" size="sm" className="h-6 text-[11px] font-semibold text-[#1A5345] hover:bg-[#1A5345]/10 px-2">Message All</Button>
              </h3>
              
              <div className="flex flex-col gap-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full border border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
                     <img src="https://i.pravatar.cc/150?u=dr" alt="Doctor" className="size-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-[#1A1F1E] truncate">{patient.primaryDoctor}</span>
                    <span className="text-[12px] font-medium text-[#1A5345] truncate">Primary Cardiologist</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full border border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
                     <img src="https://i.pravatar.cc/150?u=nurse" alt="Nurse" className="size-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-bold text-[#1A1F1E] truncate">Emily Watson, RN</span>
                    <span className="text-[12px] font-medium text-muted-foreground truncate">Cardiac Care Nurse</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Main Content */}
          <div className="flex-1 flex flex-col min-w-0 gap-6">

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
                    <span className="inline-flex items-center rounded-lg bg-[#E89042]/15 px-2.5 py-1 text-[12px] font-bold text-[#D9772B]">
                      Upcoming
                    </span>
                    <div className="flex size-9 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm ring-4 ring-white">
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
                        className="h-10 flex-1 gap-2 rounded-lg bg-[#1A5345] px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#133F34] sm:h-9"
                        aria-label="Reschedule this appointment"
                      >
                        <CalendarClockIcon className="size-4 shrink-0 opacity-95" strokeWidth={2} />
                        Reschedule
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 flex-1 gap-2 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-semibold text-muted-foreground shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:h-9 sm:flex-initial sm:min-w-[7.5rem]"
                            aria-label="Cancel this appointment"
                          >
                            <XIcon className="size-4 shrink-0" strokeWidth={2} />
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
                    <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
                      Completed
                    </span>
                    <div className="flex size-9 items-center justify-center rounded-xl border border-[#A8C4BC] bg-[#E8F0EE] text-[#00392D] shadow-sm ring-4 ring-white">
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
                      className="h-10 w-full gap-2 rounded-lg bg-[#1A5345] px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#133F34] sm:h-9"
                      aria-label="View report for this completed appointment"
                    >
                      <FileTextIcon className="size-4 shrink-0 opacity-95" strokeWidth={2} />
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
                    onClick={() => setActiveTab(tab.id)}
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
                <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                  
                  {/* Current Condition */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[16px] font-bold text-[#1A1F1E] flex items-center gap-2">
                        <HeartPulseIcon className="size-5 text-[#E8345E]" />
                        Primary Diagnosis
                      </h3>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-[12px] font-semibold text-[#1A5345] hover:bg-[#1A5345]/10">
                        <QrCodeIcon className="size-3.5" />
                        Patient Portal Link
                      </Button>
                    </div>
                    <div className="p-5 rounded-xl bg-[#F8F9FA] border border-[#E8E6E0]/60 flex flex-col gap-2.5">
                      <span className="text-[15px] font-bold text-[#1A1F1E]">{patient.condition}</span>
                      <p className="text-[14px] text-muted-foreground leading-relaxed">
                        Patient presented with stable angina. Scheduled for a follow-up stress test. Currently adhering to medication protocol without reported side effects.
                      </p>
                    </div>
                  </div>

                  {/* Widgets Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk & Adherence */}
                    <div className="flex flex-col gap-4">
                      {/* Risk Score */}
                      <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500">
                              <ShieldAlertIcon className="size-4" strokeWidth={2} aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[14px] font-bold leading-snug text-[#1A1F1E]">CVD risk score</h4>
                              <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
                                Estimated 10-year cardiovascular risk
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-600">
                            {patient.riskLevel}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                          <div className="flex items-baseline gap-1" aria-live="polite">
                            <span className="text-[40px] font-black tabular-nums leading-none tracking-tight text-[#1A1F1E]">
                              {patient.riskScore}
                            </span>
                            <span className="pb-1 text-[18px] font-bold text-muted-foreground">%</span>
                          </div>

                          <div className="min-w-0 flex-1 sm:max-w-[min(100%,280px)]">
                            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                              Risk spectrum
                            </p>
                            <div className="relative px-0.5 pt-0.5">
                              <div
                                className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 shadow-inner ring-1 ring-black/[0.06]"
                                role="presentation"
                              />
                              <div
                                className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#1A1F1E] shadow-md ring-2 ring-white"
                                style={{ left: `${Math.min(100, Math.max(0, patient.riskScore))}%` }}
                                aria-hidden
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                              <span>Low</span>
                              <span>Moderate</span>
                              <span>High</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
                          <AlertTriangleIcon
                            className="mt-0.5 size-4 shrink-0 text-amber-600"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <p className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]/90">
                            Elevated risk due to hypertension and history of smoking. Strict monitoring required.
                          </p>
                        </div>
                      </div>

                      {/* Medication Adherence */}
                      <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-[#E8E6E0]/80 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                            <PillIcon className="size-4" strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-bold leading-snug text-[#1A1F1E]">Medication adherence</h4>
                            <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">
                              Pharmacy fills and self-report (mock)
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                          <div className="flex items-baseline gap-1" aria-live="polite">
                            <span className="text-[40px] font-black tabular-nums leading-none tracking-tight text-[#1A1F1E]">
                              {patient.adherence}
                            </span>
                            <span className="pb-1 text-[18px] font-bold text-muted-foreground">%</span>
                          </div>

                          <div className="min-w-0 flex-1 sm:max-w-[min(100%,280px)]">
                            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
                              Adherence bar
                            </p>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-black/[0.06]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, patient.adherence))}%`,
                                }}
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] p-3">
                          <CheckCircle2Icon
                            className="mt-0.5 size-4 shrink-0 text-emerald-600"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <p className="text-[12px] font-medium leading-relaxed text-[#1A1F1E]/90">
                            Patient has been consistently taking prescribed statins.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Next Steps & Lifestyle */}
                    <div className="flex flex-col gap-4">
                      {/* Next Steps / Action Items */}
                      <div className="rounded-xl border border-[#E8E6E0] bg-white p-5">
                        <h4 className="text-[14px] font-bold text-[#1A1F1E] mb-4 flex items-center gap-2">
                          <CheckCircle2Icon className="size-[18px] text-[#1A5345]" strokeWidth={2} />
                          Action Items
                        </h4>
                        <ul className="flex flex-col gap-3.5">
                          <li className="flex items-center gap-2.5 text-[13px]">
                            <div className="size-[5px] rounded-full bg-[#D9772B] shrink-0" />
                            <span className="text-[#1A1F1E] font-medium leading-snug">Schedule follow-up stress test</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-[13px]">
                            <div className="size-[5px] rounded-full bg-[#1A5345] shrink-0" />
                            <span className="text-[#1A1F1E] font-medium leading-snug">Review latest lipid panel results</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-[13px]">
                            <div className="size-[5px] rounded-full bg-[#1A5345] shrink-0" />
                            <span className="text-[#1A1F1E] font-medium leading-snug">Discuss smoking cessation programs</span>
                          </li>
                        </ul>
                      </div>

                      {/* Lifestyle */}
                      {/* Lifestyle & risk factors */}
                      <div className="rounded-xl border border-[#E8E6E0] bg-white p-5">
                        <h4 className="text-[14px] font-bold text-[#1A1F1E] mb-4 flex items-center gap-2">
                          <ActivityIcon className="size-4 text-[#1A1F1E]" />
                          Lifestyle & risk factors
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <CigaretteIcon className="size-5 mb-2 text-[#4A4F4E]" strokeWidth={2} />
                            <span className={`text-[13px] font-bold ${patient.lifestyle.smoking.color}`}>{patient.lifestyle.smoking.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.smoking.detail}</span>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <ActivityIcon className="size-5 mb-2 text-[#4A4F4E]" strokeWidth={2} />
                            <span className={`text-[13px] font-bold ${patient.lifestyle.exercise.color}`}>{patient.lifestyle.exercise.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.exercise.detail}</span>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <SaladIcon className="size-5 mb-2 text-[#4A4F4E]" strokeWidth={2} />
                            <span className={`text-[13px] font-bold ${patient.lifestyle.diet.color}`}>{patient.lifestyle.diet.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.diet.detail}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <span className={`text-[13px] font-bold mt-7 ${patient.lifestyle.alcohol.color}`}>{patient.lifestyle.alcohol.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.alcohol.detail}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <MoonIcon className="size-5 mb-2 text-[#4A4F4E]" strokeWidth={2} />
                            <span className={`text-[13px] font-bold ${patient.lifestyle.sleep.color}`}>{patient.lifestyle.sleep.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.sleep.detail}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#F6F5F2] min-h-[90px]">
                            <BrainIcon className="size-5 mb-2 text-[#4A4F4E]" strokeWidth={2} />
                            <span className={`text-[13px] font-bold ${patient.lifestyle.stress.color}`}>{patient.lifestyle.stress.status}</span>
                            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{patient.lifestyle.stress.detail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}

              {activeTab === "medications" && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="flex flex-col gap-4 border-b border-[#E8E6E0]/60 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[16px] font-bold text-[#1A1F1E]">Medications</h3>
                      <button
                        type="button"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                        aria-label="Add medication"
                      >
                        <PlusIcon className="size-4" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMedicationSubTab("active")
                          setMedicationDetailId(null)
                        }}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ease-out ${
                          medicationSubTab === "active"
                            ? "scale-[1.02] bg-[#1A5345] text-white shadow-md"
                            : "bg-[#F5F5F3]/80 text-muted-foreground hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMedicationSubTab("past")
                          setMedicationDetailId(null)
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ease-out ${
                          medicationSubTab === "past"
                            ? "scale-[1.02] bg-[#1A5345] text-white shadow-md"
                            : "bg-[#F5F5F3]/80 text-muted-foreground hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                        }`}
                      >
                        <HistoryIcon className="size-3.5" strokeWidth={2} />
                        Past
                      </button>
                    </div>
                    <p className="text-[12px] leading-snug text-muted-foreground">
                      {medicationSubTab === "active"
                        ? "What the patient takes now — use clock times when coaching intake, visit prep, or pharmacy follow-up."
                        : "Ended, discontinued, or completed courses (read-only)."}
                    </p>
                  </div>

                  {medicationSubTab === "active" && (
                  <div className="flex flex-col">
                    {MOCK_ACTIVE_MEDICATIONS_ASSISTANT.map((m) => {
                      const MedIcon = m.Icon
                      return (
                        <div
                          key={m.id}
                          className="group flex flex-col md:flex-row md:items-center py-4 px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-xl hover:bg-[#F9F8F5] transition-colors border-b border-[#E8E6E0]/60 last:border-0"
                        >
                          <div className="flex items-center gap-4 w-full md:w-[28%] shrink-0 mb-4 md:mb-0">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F2F0] group-hover:bg-white transition-colors">
                              <MedIcon className="size-5 text-[#6B7870]" strokeWidth={2} aria-hidden />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-[15px] font-bold text-[#1A1F1E]">{m.name}</h4>
                                <Badge className="bg-[#E5F5EE] text-[#1A5345] hover:bg-[#E5F5EE] border-0 h-5 px-2 rounded-full text-[10px] font-bold tracking-wide shrink-0">
                                  Active
                                </Badge>
                              </div>
                              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">{m.strength}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 w-full md:w-[30%] shrink-0 md:px-4 mb-4 md:mb-0">
                            <span className="text-[12px] font-medium text-muted-foreground">When to take</span>
                            <div className="flex flex-wrap gap-1.5">
                              {m.timesOfDay.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center rounded-full bg-[#E8F0EE] px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-[#1A5345]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <p className="text-[12px] font-medium text-[#1A1F1E]">{m.frequencyLabel}</p>
                            <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">{m.withFood}</p>
                          </div>

                          <div className="flex flex-col gap-1 w-full md:w-[22%] shrink-0 md:px-4 mb-4 md:mb-0">
                            <span className="text-[12px] font-medium text-muted-foreground">Adherence (reported)</span>
                            <span className={`text-[12px] font-bold mt-0.5 ${m.adherenceTextClass}`}>{m.adherencePct}%</span>
                            <div className="h-1.5 w-full bg-[#E8E6E0] rounded-full overflow-hidden mt-0.5 group-hover:bg-[#E8E6E0]/60 transition-colors">
                              <div
                                className={`h-full rounded-full ${m.adherenceBarClass}`}
                                style={{ width: `${m.adherencePct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-[20%] shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-[#E8E6E0]/60 md:border-0 md:pl-4">
                            {m.supply.variant === "warning" ? (
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#D9772B] bg-[#FFF0E0] px-3 py-1.5 rounded-full group-hover:bg-white border border-transparent group-hover:border-[#FFF0E0] transition-colors max-w-[200px]">
                                <AlertTriangleIcon className="size-3.5 shrink-0" aria-hidden />
                                <span className="leading-tight">{m.supply.label}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#1A5345] bg-[#F2FAF6] px-3 py-1.5 rounded-full group-hover:bg-white border border-transparent group-hover:border-[#F2FAF6] transition-colors max-w-[200px]">
                                <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
                                <span className="leading-tight">{m.supply.label}</span>
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-[#1A1F1E] shrink-0"
                                  aria-label={`Actions for ${m.name}`}
                                >
                                  <MoreVerticalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  className="cursor-pointer text-[13px] font-medium"
                                  onSelect={() => setMedicationDetailId(m.id)}
                                >
                                  <FileTextIcon className="mr-2 size-3.5 text-muted-foreground" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-[13px] font-medium">
                                  <EditIcon className="mr-2 size-3.5 text-muted-foreground" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-[13px] font-medium text-red-600 focus:bg-red-50 focus:text-red-600">
                                  <Trash2Icon className="mr-2 size-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )}

                  {medicationSubTab === "past" && (
                    <div className="flex flex-col">
                      {MOCK_PAST_MEDICATIONS.map((p) => (
                        <div
                          key={p.id}
                          className="group flex flex-col gap-3 border-b border-[#E8E6E0]/60 py-4 last:border-0 sm:flex-row sm:items-start sm:gap-4"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                            <HistoryIcon className="size-5 text-[#6B7870]" strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-[15px] font-bold text-[#1A1F1E]">{p.name}</h4>
                              <Badge
                                variant="outline"
                                className={
                                  p.kind === "discontinued"
                                    ? "h-5 border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-900"
                                    : "h-5 border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-900"
                                }
                              >
                                {p.kind === "discontinued" ? "Discontinued" : "Course completed"}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{p.strength}</p>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{p.note}</p>
                            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                              Ended {p.endedOn}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-[#1A1F1E]"
                                aria-label={`Actions for ${p.name}`}
                              >
                                <MoreVerticalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem className="cursor-pointer text-[13px] font-medium">
                                <FileTextIcon className="mr-2 size-3.5 text-muted-foreground" />
                                Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

        </div>
        )}
      </div>

      <Dialog
        open={medicationDetail !== null}
        onOpenChange={(open) => {
          if (!open) setMedicationDetailId(null)
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-[650px] p-0 bg-[#F9F8F5] border-[#E8E6E0]">
          {medicationDetail ? (
            <div className="p-6">
              <DialogHeader className="text-left border-b border-[#E8E6E0]/60 pb-5 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-[#E8E6E0]/60">
                    {medicationDetail.strength.includes("Injection") ? (
                      <SyringeIcon className="size-6 text-[#6B7870]" strokeWidth={2} />
                    ) : (
                      <PillIcon className="size-6 text-[#6B7870]" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-[18px] font-bold text-[#1A1F1E]">{medicationDetail.name}</DialogTitle>
                    <p className="text-[13px] font-medium text-muted-foreground mt-0.5">{medicationDetail.strength}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-6 text-[13px] px-1 pb-2 mt-2">
                
                {/* 1. Schedule & Instructions - Side by side cards */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Schedule Card */}
                  <div className="flex-1 rounded-2xl bg-white p-5 border border-[#E8E6E0]/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <ClockIcon className="size-16" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-7 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                        <ClockIcon className="size-3.5 text-[#1A5345]" />
                      </div>
                      <p className="text-[13px] font-bold text-[#1A1F1E]">Schedule</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {medicationDetail.timesOfDay.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-[13px] font-bold tabular-nums text-[#1A1F1E] shadow-sm border border-[#E8E6E0]/40"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="font-bold text-[#1A5345] text-[14px]">{medicationDetail.frequencyLabel}</p>
                    <p className="font-medium text-muted-foreground text-[12px] mt-0.5">{medicationDetail.details.sigSummary}</p>
                  </div>

                  {/* Instruction Card */}
                  <div className="flex-1 rounded-2xl bg-white p-5 border border-[#E8E6E0]/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <FileTextIcon className="size-16" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-7 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                        <FileTextIcon className="size-3.5 text-[#1A5345]" />
                      </div>
                      <p className="text-[13px] font-bold text-[#1A1F1E]">Instructions</p>
                    </div>
                    
                    <p className="font-semibold text-[#1A1F1E] text-[14px] leading-relaxed mb-4">
                      "{medicationDetail.instructionPatient}"
                    </p>

                    {medicationDetail.withFood && (
                      <span className="inline-flex items-center gap-1.5 bg-white border border-[#E8E6E0]/60 text-[#1A5345] px-2.5 py-1 rounded-lg text-[12px] font-bold shadow-sm">
                        <SaladIcon className="size-3.5" />
                        {medicationDetail.withFood}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Metadata Tags */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#E8E6E0]/80 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex-1 min-w-[120px]">
                    <CalendarIcon className="size-4 text-muted-foreground/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground leading-none mb-1">Therapy Start</span>
                      <span className="font-bold text-[#1A1F1E] text-[12px] leading-none">{medicationDetail.details.startedOn}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#E8E6E0]/80 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex-1 min-w-[120px]">
                    <PillIcon className="size-4 text-muted-foreground/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground leading-none mb-1">Quantity</span>
                      <span className="font-bold text-[#1A1F1E] text-[12px] leading-none">{medicationDetail.details.quantity}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 min-w-[120px] items-center gap-2.5 rounded-xl border border-[#E8E6E0]/80 bg-white px-3 py-2 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                    <RefreshCwIcon className="size-4 shrink-0 text-[#1A5345]/85" strokeWidth={2} aria-hidden />
                    <div className="flex flex-col">
                      <span className="mb-1 text-[10px] font-bold leading-none text-muted-foreground">Refills left</span>
                      <span className="text-[12px] font-bold tabular-nums leading-none text-[#1A1F1E]">
                        {medicationDetail.details.refillsRemaining}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DOCTOR SECTION (DO NOT TOUCH THE STRUCTURE/CLASSES, ONLY MARGINS) */}
                <div className="mt-3 border-t border-[#E8E6E0]/60 pt-5">
                  <p className="text-[12px] font-medium text-muted-foreground mb-3">Prescribing Doctor</p>
                  {/* EXACT HTML FROM PREVIOUS ITERATION */}
                  <div className="group flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-[#F9F8F5] transition-colors cursor-pointer border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F3F2F0] overflow-hidden border border-[#E8E6E0]/60">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${medicationDetail.details.prescriber.replace(' ', '')}&backgroundColor=f3f2f0`} alt="Doctor avatar" className="size-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="text-[14px] font-bold text-[#1A5345] group-hover:text-[#1A1F1E] transition-colors">{medicationDetail.details.prescriber}</p>
                      <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Cardiology Dept.</p>
                    </div>
                    <Button variant="outline" size="icon" className="size-8 text-muted-foreground group-hover:text-[#1A1F1E] group-hover:bg-white shrink-0 shadow-sm border-[#E8E6E0]/80 transition-all rounded-xl">
                      <MailIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AddVitalsDialog open={isAddVitalsOpen} onOpenChange={setIsAddVitalsOpen} />
    </div>
  )
}
