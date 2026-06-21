"use client"

import { useState } from "react"
import { useAssistantPageTranslations, useAssistantSharedTranslations } from "../use-assistant-i18n"
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
  StethoscopeIcon,
  BrainIcon,
  BabyIcon,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { showIcareToast } from "@/components/shared/icare-toast"
import { PatientAvatar } from "@/components/shared/PatientAvatar"

import type { CreatedPatient } from "./addPatient.types"
import { mapListPatientDisplay } from "./assistantPatientProfile.mapper"
import { AddPatient } from "./AddPatient"
import type { useAddPatient } from "./useAddPatient"

function PatientListAvatar({
  patient,
}: {
  patient: Pick<CreatedPatient, "avatarUrl" | "fullName">
}) {
  return (
    <PatientAvatar
      name={patient.fullName?.trim() || "Patient"}
      avatarUrl={patient.avatarUrl}
      sizes="40px"
      initialsClassName="text-[13px]"
    />
  )
}

type PatientsListProps = {
  patients: CreatedPatient[]
  addPatientState: ReturnType<typeof useAddPatient>
  initialSearchQuery?: string
  initialSheetOpen?: boolean
}

type SortOption = "lastVisit" | "riskLevel" | "name"
type StatusFilter = "all" | "in-treatment" | "discharged" | "monitoring"
type RiskFilter = "all" | "high" | "moderate" | "stable"

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const ts = useAssistantSharedTranslations()
  const variants: Record<string, { className: string; labelKey: "statusInTreatment" | "statusDischarged" | "statusMonitoring" }> = {
    "in-treatment": { className: "bg-[#1A5345] text-white", labelKey: "statusInTreatment" },
    discharged: { className: "bg-[#6B7870] text-white", labelKey: "statusDischarged" },
    monitoring: { className: "bg-[#3B82F6] text-white", labelKey: "statusMonitoring" },
  }
  const style = variants[status] || variants.monitoring

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold", style.className)}
    >
      {ts(style.labelKey)}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  const ts = useAssistantSharedTranslations()
  const variants: Record<string, { className: string; labelKey: "riskHigh" | "riskModerate" | "riskStable" }> = {
    high: { className: "bg-rose-500 text-white", labelKey: "riskHigh" },
    moderate: { className: "bg-amber-500 text-white", labelKey: "riskModerate" },
    stable: { className: "bg-emerald-500 text-white", labelKey: "riskStable" },
  }
  const style = variants[level] || variants.stable

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold", style.className)}
    >
      {ts(style.labelKey)}
    </span>
  )
}

type DepartmentConfig = {
  name: string
  color: string
  emoji?: string
  icon?: React.ElementType
}

function DepartmentBadge({ department }: { department: DepartmentConfig }) {
  const Icon = department.icon
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7870]">
      {department.emoji ? (
        <span className="text-[14px] leading-none" aria-hidden>
          {department.emoji}
        </span>
      ) : Icon ? (
        <Icon className="size-3.5" style={{ color: department.color }} strokeWidth={2} aria-hidden />
      ) : null}
      {department.name}
    </span>
  )
}

function departmentFromName(name: string): DepartmentConfig {
  return { name, icon: StethoscopeIcon, color: "#1A5345" }
}

export function PatientsList({ patients, addPatientState, initialSearchQuery = "", initialSheetOpen = false }: PatientsListProps) {
  const { t, ts } = useAssistantPageTranslations("patients")
  const [isSheetOpen, setIsSheetOpen] = useState(initialSheetOpen)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
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
      {/* Premium Header — matching Medications page style */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      {ts("breadcrumbDashboard")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">{t("breadcrumb")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                {t("title")}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {t("subtitle", { count: patients.length.toLocaleString() })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
              >
                <DownloadIcon className="size-3.5 text-muted-foreground" />
                {ts("export")}
              </Button>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
                  >
                    <UserPlusIcon className="size-3.5" strokeWidth={2.5} />
                    {t("addPatient")}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="!w-full sm:!max-w-2xl md:!max-w-3xl lg:!max-w-4xl p-0 border-l border-[#E8E6E0]/60 bg-[#F9F8F5] shadow-2xl flex flex-col h-full"
                >
                  <SheetTitle className="sr-only">{t("registerNewPatient")}</SheetTitle>
                  <AddPatient {...addPatientState} onSuccess={handlePatientAdded} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Premium Analytics Banner — matching Medication Detail Snapshot style */}
          <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-[#E8E6E0] shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold text-[#6B7870] uppercase tracking-tight">{t("totalPatients")}</span>
                <div className="flex items-end gap-2">
                  <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                    {patients.length.toLocaleString()}
                  </span>
                  <span className="mb-0.5 rounded-lg bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    +12%
                  </span>
                </div>
              </div>
              <UsersIcon className="size-5 text-[#1A5345] shrink-0" strokeWidth={2} />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-[#E8E6E0] shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold text-[#6B7870] uppercase tracking-tight">{t("highRisk")}</span>
                <div className="flex items-end gap-2">
                  <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                    {Math.floor(patients.length * 0.25) || 12}
                  </span>
                  <span className="mb-0.5 rounded-lg bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    +4%
                  </span>
                </div>
              </div>
              <ActivityIcon className="size-5 text-rose-600 shrink-0" strokeWidth={2} />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-[#E8E6E0] shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold text-[#6B7870] uppercase tracking-tight">{t("newThisWeek")}</span>
                <div className="flex items-end gap-2">
                  <span className="text-[20px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                    {Math.floor(patients.length * 0.1) || 4}
                  </span>
                  <span className="mb-0.5 rounded-lg bg-[#1A5345] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    {t("steady")}
                  </span>
                </div>
              </div>
              <CalendarIcon className="size-5 text-[#CC5533] shrink-0" strokeWidth={2} />
            </div>
          </div>

          {/* Minimalist Toolbar — matching standard Premium Compact style */}
          <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative flex-1 sm:flex-none sm:w-[240px]">
              <SearchIcon 
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]" 
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder={ts("searchByNameOrId")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex bg-white rounded-lg p-0.5 border border-[#E8E6E0] shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "size-7 rounded-md transition-all",
                    viewMode === "grid" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <LayoutGridIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "size-7 rounded-md transition-all",
                    viewMode === "list" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <ListIcon className="size-3.5" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-8 w-full sm:w-[130px] rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50 shadow-sm transition-all focus:ring-0">
                  <SelectValue placeholder={t("statusFilter")} />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">{t("allStatus")}</SelectItem>
                  <SelectItem value="in-treatment" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">In Treatment</SelectItem>
                  <SelectItem value="discharged" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">Discharged</SelectItem>
                  <SelectItem value="monitoring" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">Monitoring</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                <SelectTrigger className="h-8 w-full sm:w-[130px] rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50 shadow-sm transition-all focus:ring-0">
                  <SelectValue placeholder={t("riskFilter")} />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">All risk</SelectItem>
                  <SelectItem value="high" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">High Risk</SelectItem>
                  <SelectItem value="moderate" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">Moderate</SelectItem>
                  <SelectItem value="stable" className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">Stable</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] hover:bg-transparent hover:text-[#1A5345] shadow-none transition-colors"
              >
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
                <tr className="text-[15px] font-serif font-bold text-[#1A1F1E] bg-[#F4F3ED]/90 backdrop-blur-md shadow-[0_1px_0_0_#E8E6E0] transition-colors">
                  <th className="py-4 pe-4 ps-4">{ts("tablePatientName")}</th>
                  <th className="py-4 px-4">{ts("tableCondition")}</th>
                  <th className="py-4 px-4">{ts("department")}</th>
                  <th className="py-4 px-4">{ts("tableAgeSex")}</th>
                  <th className="py-4 px-4">{ts("tableLastVisit")}</th>
                  <th className="py-4 px-4">{ts("tableStatus")}</th>
                  <th className="py-4 px-4">{ts("tableRiskLevel")}</th>
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
                        <h3 className="text-[15px] font-bold text-[#1A1F1E]">{t("noPatients")}</h3>
                        <p className="text-[14px] font-medium text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((patient) => {
                    const display = mapListPatientDisplay(patient)
                    const condition = display.condition
                    const lastVisit = display.lastVisit
                    const status = display.status
                    const risk = display.risk
                    const department = departmentFromName(display.departmentName)

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
                              <PatientListAvatar patient={patient} />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center gap-0.5">
                              <div className="text-[15px] font-bold text-[#1A1F1E] truncate group-hover:text-[#1A5345] transition-colors">{patient.fullName}</div>
                              <div className="text-[13px] font-medium text-muted-foreground truncate">
                                {patient.id}
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
                          <DepartmentBadge department={department} />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] font-medium text-[#1A1F1E]">
                            {age} <span className="text-muted-foreground/60 mx-0.5">/</span> {(patient.gender ?? "—").charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-[14px] font-semibold text-[#1A1F1E]">{formatDate(lastVisit ?? null)}</div>
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
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8 border-0 bg-transparent text-muted-foreground opacity-40 group-hover:opacity-100 transition-all hover:bg-transparent hover:text-[#1A5345] shadow-none"
                                >
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 w-48">
                                <Link href={`/assistant-patients/${patient.id}`}>
                                  <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                    <FileTextIcon className="size-4 text-[#1A5345]" />
                                    {t("viewFullRecord")}
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                  <MessageSquareIcon className="size-4 text-[#E89042]" />
                                  {t("sendMessage")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setScheduleVisitPatient(patient)} className="rounded-lg p-2.5 cursor-pointer font-medium text-[#6B7870] focus:bg-slate-50 focus:text-[#1A1F1E] flex items-center gap-2">
                                  <CalendarIcon className="size-4 text-[#E8345E]" />
                                  {t("scheduleVisit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg p-2.5 cursor-pointer font-semibold text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2">
                                    <ArchiveIcon className="size-4" />
                                    {t("archivePatient")}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent className="rounded-2xl border-[#E8E6E0]/60 shadow-2xl p-6 sm:max-w-[425px]">
                              <AlertDialogHeader className="mb-2">
                                <AlertDialogTitle className="text-xl font-bold text-[#1A1F1E]">{t("archiveTitle")}</AlertDialogTitle>
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
            <div className="grid grid-cols-1 items-start gap-6 py-4 px-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <h3 className="text-[15px] font-bold text-[#1A1F1E]">{t("noPatients")}</h3>
                    <p className="text-[14px] font-medium text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                  </div>
                </div>
              ) : (
                paginatedPatients.map((patient) => {
                  const display = mapListPatientDisplay(patient)
                  const condition = display.condition
                  const lastVisit = display.lastVisit
                  const status = display.status

                  const age = patient.dateOfBirth
                    ? Math.floor(
                      (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                    )
                    : "—"

                  return (
                    <Card key={patient.id} className="group relative h-fit w-full gap-0 self-start overflow-hidden rounded-3xl border border-[#E8E6E0]/60 bg-white py-0 shadow-sm ring-0 transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col p-5">
                        {/* Top row: Badge and More options */}
                        <div className="mb-4 flex w-full items-start justify-between">
                          <StatusBadge status={status} />

                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8 border-0 bg-transparent text-muted-foreground transition-colors hover:bg-transparent hover:text-[#1A5345] shadow-none -mr-2 -mt-1"
                                >
                                  <MoreVerticalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E8E6E0]/60 shadow-lg p-1.5 bg-white">
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-[#F9F8F5] py-2.5">
                                  <EditIcon className="size-3.5 text-[#6B7870]" />
                                  Edit Patient
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-[#F9F8F5] py-2.5">
                                  <ActivityIcon className="size-3.5 text-[#6B7870]" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2.5 text-[13px] font-medium text-[#1A1F1E] cursor-pointer rounded-lg focus:bg-[#F9F8F5] py-2.5">
                                  <DownloadIcon className="size-3.5 text-[#6B7870]" />
                                  {ts("export")} Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1.5" />
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2.5 text-[13px] font-bold text-red-600 focus:text-red-700 cursor-pointer rounded-lg focus:bg-red-50 py-2.5">
                                    <ArchiveIcon className="size-3.5" />
                                    {t("archivePatient")}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent className="rounded-3xl border border-[#E8E6E0]/60 shadow-2xl bg-white p-6 sm:max-w-[440px]">
                              <AlertDialogHeader className="mb-2">
                                <AlertDialogTitle className="text-[22px] font-bold text-[#1A1F1E] font-serif tracking-tight">{t("archiveTitle")}</AlertDialogTitle>
                                <AlertDialogDescription className="text-[14px] text-muted-foreground leading-relaxed mt-2">
                                  Are you sure you want to archive <span className="font-bold text-[#1A1F1E]">{patient.fullName}</span>? This action requires doctor approval. A request will be sent to the assigned doctor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 flex items-center justify-end gap-3">
                                <AlertDialogCancel className="h-10 rounded-xl px-5 border-[#E8E6E0]/80 bg-white text-[13px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-slate-50 transition-all m-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="h-10 rounded-xl border-0 bg-red-600 px-5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-red-700 m-0">
                                  Send Request
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Avatar & Name */}
                        <div className="mb-4 flex flex-col items-center gap-2.5">
                          <div className="relative size-16 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm">
                            <PatientListAvatar patient={patient} />
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-[11px] font-bold tracking-wide text-[#1A5345]/70">{patient.id}</span>
                            <span className="mt-0.5 font-serif text-[18px] font-bold leading-tight text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">{patient.fullName}</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="mb-4 flex w-full items-center rounded-2xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-2.5">
                          <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground">Last visit</span>
                            <span className="text-[12px] font-bold text-[#1A1F1E]">{formatDate(lastVisit ?? null)}</span>
                          </div>
                          <div className="h-7 w-px bg-[#E8E6E0]/80" />
                          <div className="flex-1 flex flex-col items-center justify-center gap-1">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gender</span>
                            <span className="text-[13px] font-bold text-[#1A1F1E]">{patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Male"}</span>
                          </div>
                          <div className="w-[1px] h-8 bg-[#E8E6E0]/80"></div>
                          <div className="flex-[1.2] flex flex-col items-center justify-center gap-1 min-w-0 px-2">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Condition</span>
                            <span className="text-[13px] font-bold text-[#1A1F1E] truncate w-full text-center" title={condition}>{condition}</span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex w-full gap-2 mt-auto">
                          <Link href={`/assistant-patients/${patient.id}`} className="flex-1">
                            <Button size="sm" className="h-8 w-full rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[#133F34]">
                              View Record
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]" title="Send Message">
                            <MessageSquareIcon className="size-4" />
                          </Button>
                          <Button onClick={() => setScheduleVisitPatient(patient)} variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]" title="Schedule Visit">
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
            <DialogTitle className="text-xl font-bold text-[#1A1F1E] font-serif">{t("scheduleVisit")}</DialogTitle>
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
