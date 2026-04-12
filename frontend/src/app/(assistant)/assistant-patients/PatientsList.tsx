"use client"

import { useState } from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon,
  UserPlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
    "in-treatment": { bg: "#DCF4E7", text: "#1A5345", label: "IN-TREATMENT" },
    discharged: { bg: "#E5E7EB", text: "#6B7280", label: "DISCHARGED" },
    monitoring: { bg: "#DBEAFE", text: "#1E40AF", label: "MONITORING" },
  }
  const style = variants[status] || variants.monitoring

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, { dot: string; text: string; label: string }> = {
    high: { dot: "#E15C5C", text: "#E15C5C", label: "HIGH RISK" },
    moderate: { dot: "#E89042", text: "#A16207", label: "MODERATE" },
    stable: { dot: "#10B981", text: "#059669", label: "STABLE" },
  }
  const style = variants[level] || variants.stable

  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ backgroundColor: style.dot }} />
      <span className="text-sm font-medium" style={{ color: style.text }}>
        {style.label}
      </span>
    </div>
  )
}

export function PatientsList({ patients, addPatientState }: PatientsListProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("lastVisit")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  // Filter and sort patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    
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
    <div className="w-full space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#152A24]">Patient Directory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor {patients.length.toLocaleString()} active cardiovascular records.
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              className="gap-2 rounded-xl bg-[#1A5345] px-6 hover:bg-[#1A5345]/90"
            >
              <UserPlusIcon className="size-4" />
              Add New Patient
            </Button>
          </SheetTrigger>
          <SheetContent
            side="center"
            className="max-w-5xl !border-0 !bg-transparent p-0 !shadow-none"
          >
            <SheetTitle className="sr-only">Register New Patient</SheetTitle>
            <AddPatient {...addPatientState} onSuccess={handlePatientAdded} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="size-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-32 border-0 bg-transparent font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-treatment">In Treatment</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
              <SelectTrigger className="w-32 border-0 bg-transparent font-medium">
                <SelectValue placeholder="All Risks" />
                <ChevronDownIcon className="size-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>SORT BY</span>
              <div className="flex gap-1">
                {[
                  { key: "lastVisit", label: "Last Visit" },
                  { key: "riskLevel", label: "Risk Level" },
                  { key: "name", label: "Name" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key as SortOption)}
                    className={`px-2 py-1 font-medium transition-colors ${
                      sortBy === opt.key
                        ? "border-b-2 border-[#1A5345] text-[#1A5345]"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" className="gap-2 rounded-xl border-gray-200">
              <RefreshCwIcon className="size-4" />
              Sync Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search patients by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl border-gray-200 pl-10"
        />
      </div>

      {/* Patients Table */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Patient Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ID Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Age / Sex
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Last Visit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Risk Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <SearchIcon className="size-8" />
                      <p>No patients found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient, index) => {
                  // Mock data for fields we don't have yet
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
                    <tr key={patient.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: getAvatarColor(patient.id) }}
                          >
                            {getInitials(patient.fullName)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{patient.fullName}</div>
                            <div className="text-sm text-gray-500">{condition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-600">
                          #CVD-{String(patient.id).padStart(4, "0")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {age} / {(patient.gender ?? "—").charAt(0).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{formatDate(lastVisit)}</div>
                        <div className="text-xs text-gray-400">Echocardiogram</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={risk} />
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="size-8 p-0">
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Record</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of{" "}
            {filteredPatients.length.toLocaleString()} patients
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
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
                  size="sm"
                  className={`size-8 p-0 ${
                    currentPage === page ? "bg-[#1A5345]" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
            {totalPages > 5 && (
              <Button
                variant="outline"
                size="sm"
                className="size-8 p-0"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
