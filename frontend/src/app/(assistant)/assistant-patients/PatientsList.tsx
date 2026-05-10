"use client"

import { useState } from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  ActivityIcon,
  UsersIcon,
  FilterIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon,
  UserPlusIcon,
  LayoutGridIcon,
  ListIcon,
  MoreVerticalIcon,
  EditIcon,
  ArchiveIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { showIcareToast } from "@/components/shared/icare-toast"

import type { CreatedPatient } from "./addPatient.types"
import { AddPatient } from "./AddPatient"
import type { useAddPatient } from "./useAddPatient"

type PatientsListProps = {
  patients: CreatedPatient[]
  addPatientState: ReturnType<typeof useAddPatient>
}

type SortOption = "lastVisit" | "riskLevel" | "name"
type StatusFilter = "all" | "in-treatment" | "discharged" | "monitoring"
type RiskFilter = "all" | "high" | "moderate" | "stable"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

function getAvatarColor(id: number): string {
  const colors = [
    { bg: "#E89042", text: "#fff" },
    { bg: "#1A5345", text: "#fff" },
    { bg: "#5a6d66", text: "#fff" },
    { bg: "#E15C5C", text: "#fff" },
  ]
  return colors[id % colors.length].bg
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    "in-treatment": { bg: "#1A534515", text: "#1A5345", label: "In Treatment" },
    discharged: { bg: "#6B728015", text: "#6B7280", label: "Discharged" },
    monitoring: { bg: "#1E40AF15", text: "#1E40AF", label: "Monitoring" },
  }
  const style = variants[status] || variants.monitoring

  return (
    <span
      className="inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-[12px] font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "#FEE2E215", text: "#B91C1C", label: "High Risk" },
    moderate: { bg: "#FEF3C715", text: "#B45309", label: "Moderate" },
    stable: { bg: "#1A534515", text: "#1A5345", label: "Stable" },
  }
  const style = variants[level] || variants.stable

  return (
    <span
      className="inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-[12px] font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

export function PatientsList({ patients, addPatientState }: PatientsListProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("lastVisit")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [scheduleVisitPatient, setScheduleVisitPatient] = useState<CreatedPatient | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<string>("")

  const itemsPerPage = 10

  // Filter and sort patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = (patient.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (patient.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    // Mock status/risk filtering since we don't have these fields in the actual data yet
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePatientAdded = () => {
    if (addPatientState.isSuccess) {
      setIsSheetOpen(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#F9F8F5] animate-in fade-in duration-500 overflow-hidden">

      {/* Sticky Top Section (Header + Toolbar) */}
      <div className="flex-none border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/95 px-8 pt-8 pb-4 backdrop-blur-md z-20">
        <div className="w-full h-full">
          {/* Header Row */}
          {/* Header Row */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1A1F1E] font-serif leading-tight">Patient Directory</h1>
              <p className="mt-1 text-[15px] font-medium text-muted-foreground">
                Managing <span className="text-[#1A1F1E] font-bold">{patients.length.toLocaleString()}</span> active cardiovascular records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-11 gap-2 rounded-xl border border-[#E8E6E0] bg-white px-5 text-[14px] font-semibold text-[#1A1F1E] hover:bg-slate-50 hover:text-[#1A5345] shadow-sm transition-all"
              >
                <DownloadIcon className="size-4 text-muted-foreground" strokeWidth={2} />
                Export Data
              </Button>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="h-11 gap-2 rounded-xl bg-[#1A5345] px-6 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(26,83,69,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#133F34] hover:shadow-[0_6px_20px_rgba(26,83,69,0.25)] border-0"
                  >
                    <UserPlusIcon className="size-4.5" strokeWidth={2.5} />
                    Add Patient
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="!w-full sm:!max-w-2xl md:!max-w-3xl lg:!max-w-4xl p-0 border-l border-[#E8E6E0]/60 bg-[#F9F8F5] shadow-2xl flex flex-col h-full"
                >
                  <SheetTitle className="sr-only">Register New Patient</SheetTitle>
                  <AddPatient {...addPatientState} onSuccess={handlePatientAdded} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Premium Analytics Banner */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <div className="flex items-center justify-between rounded-2xl bg-white p-6 border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(26,83,69,0.08)] transition-all group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#1A5345]/[0.03] to-transparent pointer-events-none" />
              <div className="flex flex-col gap-1.5 z-10">
                <span className="text-[14px] font-medium text-muted-foreground">Total Patients</span>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] leading-none font-bold text-[#1A1F1E] tracking-tight">{patients.length.toLocaleString()}</span>
                  <span className="text-[12px] font-bold text-[#1A5345] bg-[#1A5345]/10 px-2 py-0.5 rounded-md mb-1">+12%</span>
                </div>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#F4F3ED] group-hover:bg-[#1A5345] transition-colors duration-300 z-10 ring-4 ring-white">
                <UsersIcon className="size-5.5 text-[#1A5345] group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white p-6 border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(232,52,94,0.08)] transition-all group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#E8345E]/[0.03] to-transparent pointer-events-none" />
              <div className="flex flex-col gap-1.5 z-10">
                <span className="text-[14px] font-medium text-muted-foreground">High Risk</span>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] leading-none font-bold text-[#1A1F1E] tracking-tight">{Math.floor(patients.length * 0.25) || 12}</span>
                  <span className="text-[12px] font-bold text-[#E8345E] bg-[#E8345E]/10 px-2 py-0.5 rounded-md mb-1">+4%</span>
                </div>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#F4F3ED] group-hover:bg-[#E8345E] transition-colors duration-300 z-10 ring-4 ring-white">
                <ActivityIcon className="size-5.5 text-[#E8345E] group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white p-6 border border-[#E8E6E0]/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(232,144,66,0.08)] transition-all group relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[#E89042]/[0.03] to-transparent pointer-events-none" />
              <div className="flex flex-col gap-1.5 z-10">
                <span className="text-[14px] font-medium text-muted-foreground">New This Week</span>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] leading-none font-bold text-[#1A1F1E] tracking-tight">{Math.floor(patients.length * 0.1) || 4}</span>
                  <span className="text-[12px] font-bold text-muted-foreground bg-[#F4F3ED] px-2 py-0.5 rounded-md mb-1">Steady</span>
                </div>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#F4F3ED] group-hover:bg-[#E89042] transition-colors duration-300 z-10 ring-4 ring-white">
                <CalendarIcon className="size-5.5 text-[#E89042] group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Minimalist Toolbar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
            <div className="relative group w-full max-w-[320px]">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-[#1A5345] transition-colors" strokeWidth={2} />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border border-[#E8E6E0]/80 bg-white pl-10 pr-4 text-[14px] shadow-sm focus-visible:border-[#1A5345] focus-visible:ring-1 focus-visible:ring-[#1A5345] transition-all placeholder:text-muted-foreground/70"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex bg-white rounded-lg p-1 border border-[#E8E6E0]/80 shadow-sm mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "size-8 rounded-md transition-all",
                    viewMode === "grid" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                  )}
                >
                  <LayoutGridIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "size-8 rounded-md transition-all",
                    viewMode === "list" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                  )}
                >
                  <ListIcon className="size-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-10 rounded-full border border-[#E8E6E0]/80 bg-white px-4 text-[14px] font-semibold text-[#1A1F1E] hover:bg-slate-50 shadow-sm transition-all focus:ring-1 focus:ring-[#1A5345] gap-2">
                  <span className="text-muted-foreground font-medium">Status:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0]/60 shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-treatment">In Treatment</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                <SelectTrigger className="h-10 rounded-full border border-[#E8E6E0]/80 bg-white px-4 text-[14px] font-semibold text-[#1A1F1E] hover:bg-slate-50 shadow-sm transition-all focus:ring-1 focus:ring-[#1A5345] gap-2">
                  <span className="text-muted-foreground font-medium">Risk:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E8E6E0]/60 shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="size-10 rounded-full border border-[#E8E6E0]/80 bg-white text-muted-foreground hover:bg-slate-50 hover:text-[#1A5345] transition-colors shadow-sm ml-1">
                <RefreshCwIcon className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content (Seamless Table / Grid) */}
      <div className="flex-1 overflow-auto bg-[#F9F8F5] px-8 relative">
        <div className="w-full h-full pb-6 pt-2">
          {viewMode === "list" ? (
            <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
              <table className="w-full text-left border-collapse bg-white">
              <thead className="sticky top-0 z-10">
                <tr className="text-[15px] font-serif font-bold text-[#1A5345]/90 bg-[#F4F3ED]/90 backdrop-blur-md shadow-[0_1px_0_0_#E8E6E0] transition-colors">
                  <th className="py-4 pr-4 pl-4">Patient Name</th>
                  <th className="py-4 px-4">Condition</th>
                  <th className="py-4 px-4">Doctor</th>
                  <th className="py-4 px-4">Age / Sex</th>
                  <th className="py-4 px-4">Last Visit</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Risk Level</th>
                  <th className="py-4 pl-4 pr-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/40">
                {addPatientState.isLoadingPatients ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="py-4 pr-4 pl-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-11 rounded-full shrink-0 bg-slate-200" />
                          <div className="flex flex-col gap-2 w-full max-w-[150px]">
                            <Skeleton className="h-4 w-full bg-slate-200" />
                            <Skeleton className="h-3 w-2/3 bg-slate-200" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-32 bg-slate-200" /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-8 rounded-full shrink-0 bg-slate-200" />
                          <Skeleton className="h-4 w-24 bg-slate-200" />
                        </div>
                      </td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-16 bg-slate-200" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-200" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-6 w-24 rounded-full bg-slate-200" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 bg-slate-200" /></td>
                      <td className="py-4 pl-4 pr-4 text-right"><Skeleton className="size-8 rounded-lg ml-auto bg-slate-200" /></td>
                    </tr>
                  ))
                ) : paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="flex size-14 items-center justify-center rounded-full bg-slate-50 border border-[#E8E6E0]/60 mb-4 ring-4 ring-slate-50/50">
                          <SearchIcon className="size-5 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-[15px] font-bold text-[#1A1F1E]">No patients found</h3>
                        <p className="text-[14px] font-medium text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient, index) => {
                    const mockStatuses = ["in-treatment", "discharged", "monitoring", "in-treatment"]
                    const mockRisks = ["high", "moderate", "stable", "high"]
                    const mockConditions = [
                      "Hypertension Stage II",
                      "Post-MI Recovery",
                      "Atrial Fibrillation",
                      "Coronary Artery Disease",
                    ]
                    const mockLastVisits = [
                      "2023-10-12",
                      "2023-10-09",
                      "2023-10-14",
                      "2023-10-15",
                    ]
                    const mockDoctors = [
                      { name: "Dr. Sarah Jenkins", id: 101 },
                      { name: "Dr. Michael Chen", id: 102 },
                      { name: "Dr. Emily Roberts", id: 103 },
                      { name: "Dr. James Wilson", id: 104 },
                    ]

                    const status = mockStatuses[index % mockStatuses.length]
                    const risk = mockRisks[index % mockRisks.length]
                    const condition = mockConditions[index % mockConditions.length]
                    const lastVisit = mockLastVisits[index % mockLastVisits.length]
                    const doctor = mockDoctors[index % mockDoctors.length]

                    const age = patient.dateOfBirth
                      ? Math.floor(
                        (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                      )
                      : "—"

                    return (
                      <tr key={patient.id} className="group hover:bg-slate-100/80 transition-colors duration-200 ease-out cursor-pointer">
                        <td className="py-4 pr-4 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-11 shrink-0 rounded-full overflow-hidden border border-[#E8E6E0] shadow-sm">
                              <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt={patient.fullName} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center gap-0.5">
                              <div className="text-[15px] font-bold text-[#1A1F1E] truncate group-hover:text-[#1A5345] transition-colors">{patient.fullName}</div>
                              <div className="text-[13px] font-medium text-muted-foreground truncate">
                                #CVD-{String(patient.id).padStart(4, "0")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] font-medium text-[#1A1F1E]">
                            {condition}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative size-8 rounded-full overflow-hidden border border-[#E8E6E0] shadow-sm">
                              <img src={`https://i.pravatar.cc/150?u=${doctor.id}`} alt={doctor.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[14px] font-medium text-[#1A1F1E]">
                              {doctor.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] font-medium text-[#1A1F1E]">
                            {age} <span className="text-muted-foreground/60 mx-0.5">/</span> {(patient.gender ?? "—").charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-[14px] font-semibold text-[#1A1F1E]">{formatDate(lastVisit)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-4 px-4">
                          <RiskBadge level={risk} />
                        </td>
                        <td className="py-4 pl-4 pr-4 text-right">
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground opacity-40 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-sm hover:text-[#1A1F1E]">
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 w-48">
                                <Link href={`/assistant-patients/${patient.id}`}>
                                  <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                    <FileTextIcon className="size-4 text-[#1A5345]" />
                                    View Full Record
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                  <MessageSquareIcon className="size-4 text-[#E89042]" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setScheduleVisitPatient(patient)} className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                  <CalendarIcon className="size-4 text-[#E8345E]" />
                                  Schedule Visit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg p-2.5 cursor-pointer font-semibold text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2">
                                    <ArchiveIcon className="size-4" />
                                    Archive Patient
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent className="rounded-2xl border-[#E8E6E0]/60 shadow-2xl p-6 sm:max-w-[425px]">
                              <AlertDialogHeader className="mb-2">
                                <AlertDialogTitle className="text-xl font-bold text-[#1A1F1E]">Archive Patient</AlertDialogTitle>
                                <AlertDialogDescription className="text-[14px] text-muted-foreground leading-relaxed mt-2">
                                  Are you sure you want to archive <span className="font-semibold text-[#1A1F1E]">{patient.fullName}</span>? This action requires doctor approval. A request will be sent to the assigned doctor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="rounded-xl px-5 border-[#E8E6E0]/60 text-[#1A1F1E] hover:bg-slate-50">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="rounded-xl px-5 bg-red-600 hover:bg-red-700 text-white shadow-md transition-all border-0">
                                  Send Request
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4 px-2">
              {addPatientState.isLoadingPatients ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="rounded-3xl border-[#E8E6E0]/60 shadow-sm bg-white overflow-hidden animate-pulse">
                    <CardContent className="p-6 flex flex-col gap-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-12 rounded-full shrink-0 bg-slate-200" />
                        <div className="flex flex-col gap-2 w-full">
                          <Skeleton className="h-4 w-3/4 bg-slate-200" />
                          <Skeleton className="h-3 w-1/2 bg-slate-200" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full bg-slate-200" />
                        <Skeleton className="h-10 w-full bg-slate-200" />
                      </div>
                      <div className="pt-4 border-t border-[#E8E6E0]/40 flex justify-between">
                        <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
                        <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : paginatedPatients.length === 0 ? (
                <div className="col-span-full py-24 text-center">
                  <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="flex size-14 items-center justify-center rounded-full bg-slate-50 border border-[#E8E6E0]/60 mb-4 ring-4 ring-slate-50/50">
                      <SearchIcon className="size-5 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1A1F1E]">No patients found</h3>
                    <p className="text-[14px] font-medium text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                  </div>
                </div>
              ) : (
                paginatedPatients.map((patient, index) => {
                  const mockStatuses = ["in-treatment", "discharged", "monitoring", "in-treatment"]
                  const mockRisks = ["high", "moderate", "stable", "high"]
                  const mockConditions = [
                    "Hypertension Stage II",
                    "Post-MI Recovery",
                    "Atrial Fibrillation",
                    "Coronary Artery Disease",
                  ]
                  const mockLastVisits = [
                    "2023-10-12",
                    "2023-10-09",
                    "2023-10-14",
                    "2023-10-15",
                  ]

                  const status = mockStatuses[index % mockStatuses.length]
                  const risk = mockRisks[index % mockRisks.length]
                  const condition = mockConditions[index % mockConditions.length]
                  const lastVisit = mockLastVisits[index % mockLastVisits.length]

                  const age = patient.dateOfBirth
                    ? Math.floor(
                      (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                    )
                    : "—"

                  return (
                    <Card key={patient.id} className="rounded-3xl border-[#E8E6E0]/60 shadow-[0_4px_20px_-4px_rgba(26,83,69,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(26,83,69,0.12)] hover:border-[#1A5345]/20 transition-all bg-white group overflow-hidden relative">
                      <CardContent className="p-5 flex flex-col items-center relative">
                        {/* Top row: Badge and More options */}
                        <div className="flex w-full justify-between items-start mb-4">
                          <StatusBadge status={status} />

                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-[#1A1F1E] hover:bg-slate-50 rounded-lg -mr-2 -mt-1 transition-all">
                                  <MoreVerticalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 bg-white">
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-slate-50 py-2">
                                  <EditIcon className="size-3.5 text-muted-foreground" />
                                  Edit Patient
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-slate-50 py-2">
                                  <ActivityIcon className="size-3.5 text-muted-foreground" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-slate-50 py-2">
                                  <DownloadIcon className="size-3.5 text-muted-foreground" />
                                  Export Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2.5 text-[13px] font-semibold text-red-600 focus:text-red-700 cursor-pointer rounded-lg focus:bg-red-50 py-2">
                                    <ArchiveIcon className="size-3.5" />
                                    Archive Patient
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent className="rounded-2xl border-[#E8E6E0]/60 shadow-2xl p-6 sm:max-w-[425px]">
                              <AlertDialogHeader className="mb-2">
                                <AlertDialogTitle className="text-xl font-bold text-[#1A1F1E]">Archive Patient</AlertDialogTitle>
                                <AlertDialogDescription className="text-[14px] text-muted-foreground leading-relaxed mt-2">
                                  Are you sure you want to archive <span className="font-semibold text-[#1A1F1E]">{patient.fullName}</span>? This action requires doctor approval. A request will be sent to the assigned doctor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="rounded-xl px-5 border-[#E8E6E0]/60 text-[#1A1F1E] hover:bg-slate-50">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="rounded-xl px-5 bg-red-600 hover:bg-red-700 text-white shadow-md transition-all border-0">
                                  Send Request
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center gap-2 mb-6">
                          <div className="relative size-[68px] rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-[#E8E6E0]">
                            <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt={patient.fullName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col items-center text-center mt-2">
                            <span className="text-[12px] font-semibold text-muted-foreground">#PT{String(patient.id).padStart(4, "0")}</span>
                            <span className="text-[16px] font-bold text-[#1A1F1E] mt-0.5">{patient.fullName}</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="w-full flex items-stretch border border-[#E8E6E0] rounded-xl py-2.5 mb-4">
                          <div className="flex-1 flex flex-col items-center justify-center gap-1 px-1">
                            <span className="text-[11px] font-bold text-[#1A1F1E]">Last Visit</span>
                            <span className="text-[11px] font-medium text-muted-foreground text-center">{formatDate(lastVisit)}</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center gap-1 px-1 border-x border-[#E8E6E0]">
                            <span className="text-[11px] font-bold text-[#1A1F1E]">Gender</span>
                            <span className="text-[11px] font-medium text-muted-foreground text-center">{patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Male"}</span>
                          </div>
                          <div className="flex-[1.5] flex flex-col items-center justify-center gap-1 px-2 min-w-0">
                            <span className="text-[11px] font-bold text-[#1A1F1E]">Condition</span>
                            <span className="text-[11px] font-medium text-muted-foreground truncate w-full text-center" title={condition}>{condition}</span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex w-full gap-2">
                          <Link href={`/assistant-patients/${patient.id}`} className="flex-1">
                            <Button className="w-full bg-[#0A0A0A] hover:bg-black text-white h-10 rounded-lg text-[13px] font-semibold transition-all">
                              View Record
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" className="size-10 shrink-0 rounded-lg border-[#E8E6E0]/80 bg-white text-muted-foreground hover:text-[#E89042] hover:bg-[#E89042]/5 hover:border-[#E89042]/30 transition-all shadow-sm" title="Send Message">
                            <MessageSquareIcon className="size-4" />
                          </Button>
                          <Button onClick={() => setScheduleVisitPatient(patient)} variant="outline" size="icon" className="size-10 shrink-0 rounded-lg border-[#E8E6E0]/80 bg-white text-muted-foreground hover:text-[#E8345E] hover:bg-[#E8345E]/5 hover:border-[#E8345E]/30 transition-all shadow-sm" title="Schedule Visit">
                            <CalendarIcon className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer (Pagination) */}
      <div className="flex-none border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/95 px-8 py-3 backdrop-blur-sm z-20">
        <div className="mx-auto max-w-[1800px] flex items-center justify-between">
          <p className="text-[12px] font-medium text-muted-foreground">
            Showing <span className="text-[#1A1F1E] font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#1A1F1E] font-bold">{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</span> of <span className="text-[#1A1F1E] font-bold">{filteredPatients.length.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-md border-transparent text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "size-7 rounded-md text-[12px] font-bold transition-all",
                    currentPage === page
                      ? "bg-[#1A5345] text-white border-0 shadow-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                  )}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            {totalPages > 5 && <span className="px-2 text-muted-foreground/60 text-[12px]">...</span>}
            {totalPages > 5 && (
              <Button
                variant="outline"
                size="icon"
                className="size-7 rounded-md border-transparent bg-transparent text-[12px] font-bold text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-md border-transparent text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Visit Dialog */}
      <Dialog 
        open={!!scheduleVisitPatient} 
        onOpenChange={(open) => {
          if (!open) {
            setScheduleVisitPatient(null)
            setSelectedDate("")
            setSelectedSlot("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 shadow-2xl bg-white gap-0">
          <div className="bg-[#F9F8F5] border-b border-[#E8E6E0]/60 px-6 py-5 flex flex-col gap-1.5">
            <DialogTitle className="text-xl font-bold text-[#1A1F1E] font-serif">Schedule Visit</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground font-medium">
              Book a new appointment for <span className="font-bold text-[#1A1F1E]">{scheduleVisitPatient?.fullName}</span>.
            </DialogDescription>
          </div>
          
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#1A1F1E]">Date</label>
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => { 
                  setSelectedDate(e.target.value)
                  setSelectedSlot("") 
                }}
                className="h-11 rounded-xl border-[#E8E6E0] shadow-sm text-[14px] focus-visible:ring-[#1A5345]" 
              />
            </div>

            {selectedDate ? (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="text-[13px] font-bold text-[#1A1F1E]">Available Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {["09:00 AM", "09:30 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "h-10 rounded-xl text-[13px] font-semibold border transition-all",
                        selectedSlot === slot
                          ? "bg-[#1A5345] border-[#1A5345] text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)]"
                          : "bg-white border-[#E8E6E0]/80 text-[#6B7870] hover:border-[#1A5345]/40 hover:bg-[#1A5345]/5 hover:text-[#1A5345]"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1A1F1E]">Available Slots</label>
                <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50">
                  <span className="text-[13px] text-muted-foreground font-medium flex items-center gap-2">
                    <CalendarIcon className="size-4 opacity-50" />
                    Please select a date first
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1A1F1E]">Assigned Doctor</label>
                <Select defaultValue="dr-sarah">
                  <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] shadow-sm text-[14px]">
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="w-[var(--radix-select-trigger-width)] rounded-xl border-[#E8E6E0]/60 shadow-lg">
                    <SelectItem value="dr-sarah">Dr. Sarah Jenkins</SelectItem>
                    <SelectItem value="dr-michael">Dr. Michael Chen</SelectItem>
                    <SelectItem value="dr-emily">Dr. Emily Roberts</SelectItem>
                    <SelectItem value="dr-james">Dr. James Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1A1F1E]">Type of Visit</label>
                <Select defaultValue="follow-up">
                  <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] shadow-sm text-[14px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="w-[var(--radix-select-trigger-width)] rounded-xl border-[#E8E6E0]/60 shadow-lg">
                    <SelectItem value="follow-up">Routine Follow-up</SelectItem>
                    <SelectItem value="consultation">Initial Consultation</SelectItem>
                    <SelectItem value="test">Diagnostic Test</SelectItem>
                    <SelectItem value="emergency">Urgent Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#1A1F1E]">Notes (Optional)</label>
              <Input placeholder="E.g. Fasting required for blood work" className="h-11 rounded-xl border-[#E8E6E0] shadow-sm text-[14px] focus-visible:ring-[#1A5345] placeholder:text-muted-foreground/60" />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/50 flex justify-end gap-3">
            <Button 
              variant="outline" 
              className="h-11 rounded-xl px-5 border-[#E8E6E0]/80 text-[#1A1F1E] font-semibold hover:bg-white shadow-sm" 
              onClick={() => {
                setScheduleVisitPatient(null)
                setSelectedDate("")
                setSelectedSlot("")
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!selectedDate || !selectedSlot}
              className="h-11 rounded-xl px-6 bg-[#1A5345] text-white font-bold hover:bg-[#133F34] disabled:opacity-50 disabled:hover:-translate-y-0 shadow-[0_4px_14px_rgba(26,83,69,0.2)] disabled:shadow-none transition-all hover:-translate-y-0.5 border-0" 
              onClick={() => {
                const patientName = scheduleVisitPatient?.fullName;
                const slot = selectedSlot;
                const date = formatDate(selectedDate);
                
                showIcareToast({
                  title: "Visit Scheduled",
                  icon: CalendarIcon,
                  description: (
                    <span>
                      Appointment for{" "}
                      <span className="font-bold text-[#1A1F1E]">{patientName}</span> is confirmed on{" "}
                      <span className="font-semibold text-[#1A1F1E]">{date}</span> at{" "}
                      <span className="font-semibold text-[#1A1F1E]">{slot}</span>.
                    </span>
                  ),
                })
                
                setScheduleVisitPatient(null)
                setSelectedDate("")
                setSelectedSlot("")
              }}
            >
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
