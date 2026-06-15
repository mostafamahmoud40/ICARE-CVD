"use client"

import React, { useMemo, useState } from "react"
import type { DoctorPatientsPagePatient, LabResult } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TestTube2Icon,
  UploadIcon,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DiagnosedByCell, diagnosesScrollbarCss } from "../diagnoses/diagnosis.shared"

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

type LabOrderFormData = {
  tests: string
  priority: "routine" | "urgent" | "stat"
  notes: string
}

type AddLabResultForm = {
  testName: string
  value: string
  unit: string
  referenceRange: string
  status: LabResult["status"]
  date: string
  orderedBy: string
}

type StatusFilter = "all" | "abnormal" | "normal"

const DEFAULT_ORDERED_BY = "Dr. Mahmoud"

const MOCK_PANEL_TEMPLATES: Record<string, Omit<LabResult, "id" | "date" | "orderedBy">[]> = {
  lipid: [
    { testName: "Total Cholesterol", value: "215", unit: "mg/dL", referenceRange: "< 200 mg/dL", status: "high" },
    { testName: "LDL Cholesterol", value: "138", unit: "mg/dL", referenceRange: "< 100 mg/dL", status: "high" },
    { testName: "HDL Cholesterol", value: "42", unit: "mg/dL", referenceRange: "> 40 mg/dL", status: "normal" },
    { testName: "Triglycerides", value: "168", unit: "mg/dL", referenceRange: "< 150 mg/dL", status: "high" },
  ],
  hba1c: [
    { testName: "HbA1c", value: "7.0", unit: "%", referenceRange: "< 6.5%", status: "high" },
    { testName: "Fasting Blood Sugar", value: "128", unit: "mg/dL", referenceRange: "70-100 mg/dL", status: "high" },
  ],
  cbc: [
    { testName: "WBC", value: "7.2", unit: "x10³/µL", referenceRange: "4.5-11.0", status: "normal" },
    { testName: "RBC", value: "4.8", unit: "x10⁶/µL", referenceRange: "4.5-5.5", status: "normal" },
    { testName: "Hemoglobin", value: "14.1", unit: "g/dL", referenceRange: "13.5-17.5", status: "normal" },
    { testName: "Platelets", value: "245", unit: "x10³/µL", referenceRange: "150-400", status: "normal" },
  ],
  metabolic: [
    { testName: "Sodium", value: "139", unit: "mEq/L", referenceRange: "136-145 mEq/L", status: "normal" },
    { testName: "Potassium", value: "4.1", unit: "mEq/L", referenceRange: "3.5-5.0 mEq/L", status: "normal" },
    { testName: "Serum Creatinine", value: "1.0", unit: "mg/dL", referenceRange: "0.7-1.3 mg/dL", status: "normal" },
    { testName: "BUN", value: "16", unit: "mg/dL", referenceRange: "7-20 mg/dL", status: "normal" },
  ],
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function emptyAddForm(): AddLabResultForm {
  return {
    testName: "",
    value: "",
    unit: "",
    referenceRange: "",
    status: "normal",
    date: todayIso(),
    orderedBy: DEFAULT_ORDERED_BY,
  }
}

function detectPanelTemplate(fileName: string): keyof typeof MOCK_PANEL_TEMPLATES | "generic" {
  const name = fileName.toLowerCase()
  if (name.includes("lipid")) return "lipid"
  if (name.includes("hba1c") || name.includes("a1c") || name.includes("glucose") || name.includes("sugar")) return "hba1c"
  if (name.includes("cbc") || name.includes("blood count")) return "cbc"
  if (name.includes("metabolic") || name.includes("bmp") || name.includes("cmp") || name.includes("electrolyte")) return "metabolic"
  return "generic"
}

const COMMON_TESTS = [
  "Complete Blood Count (CBC)",
  "Lipid Panel",
  "HbA1c",
  "Fasting Blood Sugar",
  "Basic Metabolic Panel (BMP)",
  "Comprehensive Metabolic Panel (CMP)",
  "Liver Function Tests (LFTs)",
  "Thyroid Panel (TSH, T3, T4)",
  "Cardiac Enzymes (Troponin, CK-MB)",
  "BNP / NT-proBNP",
  "CRP (C-Reactive Protein)",
  "ESR (Erythrocyte Sedimentation Rate)",
  "Urinalysis",
  "PT/INR",
  "Serum Creatinine / BUN",
  "Electrolytes (Na, K, Cl, Ca)",
  "Vitamin D",
  "Iron Studies",
]

const statusBadgeStyles: Record<LabResult["status"], string> = {
  normal: "bg-emerald-600 text-white",
  high: "bg-red-600 text-white",
  low: "bg-amber-500 text-white",
  critical: "bg-red-600 text-white shadow-sm",
}

const statusValueStyles: Record<LabResult["status"], string> = {
  normal: "text-[#1A1F1E]",
  high: "text-red-600",
  low: "text-amber-600",
  critical: "text-red-700 font-bold",
}

type LabResultsPageProps = {
  patient: DoctorPatientsPagePatient
  labResults: LabResult[]
}

function isAbnormal(status: LabResult["status"]) {
  return status === "high" || status === "low" || status === "critical"
}

export function LabResultsPage({ patient, labResults: initialLabResults }: LabResultsPageProps) {
  const [results, setResults] = useState<LabResult[]>(initialLabResults)
  const [orderDialog, setOrderDialog] = useState(false)
  const [addDialog, setAddDialog] = useState(false)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [addForm, setAddForm] = useState<AddLabResultForm>(emptyAddForm)
  const [uploadFileName, setUploadFileName] = useState("")
  const [uploadDate, setUploadDate] = useState(todayIso())
  const [orderForm, setOrderForm] = useState<LabOrderFormData>({ tests: "", priority: "routine", notes: "" })
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const basePath = `/doctor-patients/${patient.id}`

  const stats = useMemo(() => {
    const abnormalCount = results.filter((r) => isAbnormal(r.status)).length
    const normalCount = results.filter((r) => r.status === "normal").length
    const panelDates = new Set(results.map((r) => r.date))
    return {
      total: results.length,
      panels: panelDates.size,
      abnormal: abnormalCount,
      normal: normalCount,
      latestDate: results.length > 0
        ? fmtShort([...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)
        : "N/A",
    }
  }, [results])

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return results.filter((r) => {
      const matchesSearch = !q || r.testName.toLowerCase().includes(q) || r.orderedBy.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "abnormal" && isAbnormal(r.status)) ||
        (statusFilter === "normal" && r.status === "normal")
      return matchesSearch && matchesStatus
    })
  }, [results, searchQuery, statusFilter])

  const grouped = useMemo(() => {
    return filteredResults.reduce<Record<string, LabResult[]>>((acc, r) => {
      const key = r.date
      if (!acc[key]) acc[key] = []
      acc[key].push(r)
      return acc
    }, {})
  }, [filteredResults])

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  function toggleTest(test: string) {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    )
  }

  function submitOrder() {
    const tests = [
      ...selectedTests,
      ...(orderForm.tests.trim() ? [orderForm.tests.trim()] : []),
    ]
    if (tests.length === 0) return

    const orderDate = todayIso()
    const newResults: LabResult[] = tests.map((testName, index) => ({
      id: `lab-${Date.now()}-${index}`,
      testName,
      value: "Pending",
      unit: "",
      referenceRange: "",
      status: "normal",
      date: orderDate,
      orderedBy: DEFAULT_ORDERED_BY,
    }))

    setResults((prev) => [...newResults, ...prev])
    setOrderDialog(false)
    setSelectedTests([])
    setOrderForm({ tests: "", priority: "routine", notes: "" })
  }

  function submitAddResult() {
    if (!addForm.testName.trim() || !addForm.value.trim()) return

    const newResult: LabResult = {
      id: `lab-${Date.now()}`,
      testName: addForm.testName.trim(),
      value: addForm.value.trim(),
      unit: addForm.unit.trim(),
      referenceRange: addForm.referenceRange.trim(),
      status: addForm.status,
      date: addForm.date,
      orderedBy: addForm.orderedBy.trim() || DEFAULT_ORDERED_BY,
    }

    setResults((prev) => [newResult, ...prev])
    setAddDialog(false)
    setAddForm(emptyAddForm())
  }

  function handleUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setUploadFileName(file.name)
  }

  function submitUpload() {
    if (!uploadFileName.trim()) return

    const templateKey = detectPanelTemplate(uploadFileName)
    const baseId = Date.now()

    const newResults: LabResult[] =
      templateKey === "generic"
        ? [{
            id: `lab-${baseId}`,
            testName: uploadFileName.replace(/\.[^.]+$/, ""),
            value: "See attached report",
            unit: "",
            referenceRange: "",
            status: "normal",
            date: uploadDate,
            orderedBy: DEFAULT_ORDERED_BY,
          }]
        : MOCK_PANEL_TEMPLATES[templateKey].map((row, index) => ({
            id: `lab-${baseId}-${index}`,
            ...row,
            date: uploadDate,
            orderedBy: DEFAULT_ORDERED_BY,
          }))

    setResults((prev) => [...newResults, ...prev])
    setUploadDialog(false)
    setUploadFileName("")
    setUploadDate(todayIso())
  }

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("all")
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[11px] sm:text-[12px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-patients" className="text-[11px] font-medium sm:text-[12px]">Patients</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={basePath} className="text-[11px] font-medium sm:text-[12px]">{patient.fullName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[11px] font-medium sm:text-[12px]">Lab results</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Lab results
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Laboratory panels and test values for{" "}
                <span className="font-bold text-[#1A1F1E]">{patient.fullName}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setUploadDialog(true)}
                className="h-8 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
              >
                <UploadIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                Upload report
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddDialog(true)}
                className="h-8 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
              >
                <PlusIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                Add result
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setOrderDialog(true)}
                className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
              >
                <FlaskConicalIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                Order tests
              </Button>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total tests</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">{stats.total}</span>
              </div>
              <TestTube2Icon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Panels</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">{stats.panels}</span>
              </div>
              <FlaskConicalIcon className="size-5 shrink-0 text-[#2C6A5B]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Abnormal</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-red-600 tabular-nums">{stats.abnormal}</span>
              </div>
              <AlertTriangleIcon className="size-5 shrink-0 text-red-600" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Latest panel</span>
                <span className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E]">{stats.latestDate}</span>
              </div>
              <CheckCircle2Icon className="size-5 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative flex-1 sm:w-[260px] sm:flex-none">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search test name or ordered by…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="h-10 cursor-pointer text-[#152a24]">All results</SelectItem>
                  <SelectItem value="abnormal" className="h-10 cursor-pointer text-[#152a24]">Abnormal only</SelectItem>
                  <SelectItem value="normal" className="h-10 cursor-pointer text-[#152a24]">Normal only</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                onClick={resetFilters}
                aria-label="Reset filters"
              >
                <RefreshCwIcon className="size-4" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 custom-scrollbar">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Result panels</h2>
            <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {filteredResults.length} test{filteredResults.length === 1 ? "" : "s"}
            </span>
          </div>

          {dates.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-12 text-center">
              <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                <FlaskConicalIcon className="size-6 text-[#9CA3AF]" aria-hidden />
              </div>
              <p className="text-[14px] font-bold text-[#1A1F1E]">No lab results found</p>
              <p className="mt-1 text-[12px] font-medium text-[#6B7870] max-w-xs mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No tests match your current search or filter criteria."
                  : "Upload a lab report or add a result to start building the panel."}
              </p>
              {(searchQuery || statusFilter !== "all") ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 h-8 rounded-lg border-[#E8E6E0] text-[11px] font-bold text-[#1A5345] bg-white hover:bg-[#F9F8F5]"
                >
                  Clear filters
                </Button>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadDialog(true)}
                    className="h-8 gap-1.5 rounded-lg border-[#E8E6E0] text-[11px] font-bold text-[#1A5345] bg-white hover:bg-[#F9F8F5]"
                  >
                    <UploadIcon className="size-3.5" aria-hidden />
                    Upload report
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAddDialog(true)}
                    className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[11px] font-bold text-white hover:bg-[#133F34]"
                  >
                    <PlusIcon className="size-3.5" aria-hidden />
                    Add result
                  </Button>
                </div>
              )}
            </div>
          ) : (
            dates.map((date) => {
              const panel = grouped[date]
              const abnormalInPanel = panel.filter((r) => isAbnormal(r.status)).length

              return (
                <div key={date} className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6E0]/60 bg-[#F4F3ED]/50 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <FlaskConicalIcon className="size-4 text-[#1A5345]" aria-hidden />
                      <h3 className="font-serif text-[15px] font-bold text-[#1A1F1E]">{fmtShort(date)}</h3>
                      <span className="rounded-lg bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {panel.length} test{panel.length === 1 ? "" : "s"}
                      </span>
                      {abnormalInPanel > 0 ? (
                        <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {abnormalInPanel} abnormal
                        </span>
                      ) : null}
                    </div>
                    <DiagnosedByCell name={panel[0]?.orderedBy ?? "\u2014"} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full border-collapse bg-white text-left">
                      <thead className="bg-[#F4F3ED]/90">
                        <tr className="font-serif text-[13px] font-bold text-[#1A1F1E]">
                          <th className="py-3 pl-4 pr-4">Test</th>
                          <th className="px-4 py-3">Result</th>
                          <th className="hidden px-4 py-3 sm:table-cell">Reference range</th>
                          <th className="py-3 pl-4 pr-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E6E0]/40">
                        {panel.map((r) => (
                          <tr key={r.id} className="transition-colors hover:bg-[#F9F8F5]/60">
                            <td className="py-3.5 pl-4 pr-4 text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">{r.testName}</td>
                            <td className={cn("px-4 py-3.5 text-[12px] font-bold tabular-nums sm:text-[13px]", statusValueStyles[r.status])}>
                              {r.value}
                              {r.unit ? <span className="ml-1 text-[11px] font-medium text-muted-foreground">{r.unit}</span> : null}
                            </td>
                            <td className="hidden px-4 py-3.5 text-[12px] font-medium text-[#6B7870] sm:table-cell">
                              {r.referenceRange || "\u2014"}
                            </td>
                            <td className="py-3.5 pl-4 pr-4 text-right">
                              <span className={cn(
                                "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize",
                                statusBadgeStyles[r.status],
                                r.status === "critical" && "animate-pulse"
                              )}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[720px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              Order new lab tests
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Select common panels or add a custom test for {patient.fullName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Select tests</Label>
              <div className="mt-2 grid max-h-[200px] grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {COMMON_TESTS.map((test) => (
                  <button
                    key={test}
                    type="button"
                    onClick={() => toggleTest(test)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors sm:text-[12px]",
                      selectedTests.includes(test)
                        ? "border-[#1A5345] bg-[#EEF5F3] text-[#1A5345] font-bold"
                        : "border-[#E8E6E0] bg-white text-[#1A1F1E] hover:border-[#1A5345]/30"
                    )}
                  >
                    {test}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Custom test name</Label>
              <Input
                value={orderForm.tests}
                onChange={(e) => setOrderForm((f) => ({ ...f, tests: e.target.value }))}
                placeholder="Or type a custom test name…"
                className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Priority</Label>
              <Select value={orderForm.priority} onValueChange={(v) => setOrderForm((f) => ({ ...f, priority: v as LabOrderFormData["priority"] }))}>
                <SelectTrigger className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Clinical notes</Label>
              <Textarea
                value={orderForm.notes}
                onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Reason for ordering, clinical context…"
                className="mt-1.5 min-h-[72px] rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#E8E6E0]/60 pt-4">
              <span className="text-[11px] font-medium text-[#6B7870]">
                {selectedTests.length > 0 ? `${selectedTests.length} test(s) selected` : "No tests selected"}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOrderDialog(false)}
                  className="h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={submitOrder}
                  className="h-8 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
                  disabled={selectedTests.length === 0 && !orderForm.tests}
                >
                  Submit order
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              Add lab result
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Enter a single test value for {patient.fullName}. Saved locally as mock data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Test name</Label>
              <Input
                value={addForm.testName}
                onChange={(e) => setAddForm((f) => ({ ...f, testName: e.target.value }))}
                placeholder="e.g. HbA1c"
                className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Result</Label>
                <Input
                  value={addForm.value}
                  onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="e.g. 7.2"
                  className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
                />
              </div>
              <div>
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Unit</Label>
                <Input
                  value={addForm.unit}
                  onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="e.g. %"
                  className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
                />
              </div>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Reference range</Label>
              <Input
                value={addForm.referenceRange}
                onChange={(e) => setAddForm((f) => ({ ...f, referenceRange: e.target.value }))}
                placeholder="e.g. < 6.5%"
                className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Status</Label>
                <Select value={addForm.status} onValueChange={(v) => setAddForm((f) => ({ ...f, status: v as LabResult["status"] }))}>
                  <SelectTrigger className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] font-bold text-[#1A1F1E]">Panel date</Label>
                <Input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
                />
              </div>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Ordered by</Label>
              <Input
                value={addForm.orderedBy}
                onChange={(e) => setAddForm((f) => ({ ...f, orderedBy: e.target.value }))}
                className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E8E6E0]/60 pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddDialog(false)}
                className="h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={submitAddResult}
                disabled={!addForm.testName.trim() || !addForm.value.trim()}
                className="h-8 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
              >
                Save result
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              Upload lab report
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Mock upload — adds sample panel values based on the file name (lipid, HbA1c, CBC, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Lab report file</Label>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#E8E6E0] bg-white px-4 py-6 text-center transition-colors hover:border-[#1A5345]/40 hover:bg-[#F9F8F5]">
                <UploadIcon className="size-6 text-[#1A5345]" aria-hidden />
                <span className="text-[12px] font-bold text-[#1A1F1E]">
                  {uploadFileName || "Click to choose a file"}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">PDF, JPG, PNG — mock data only</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={handleUploadFileChange}
                />
              </label>
            </div>

            <div>
              <Label className="text-[12px] font-bold text-[#1A1F1E]">Panel date</Label>
              <Input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="mt-1.5 h-8 rounded-lg border-[#E8E6E0] text-[12px] font-medium"
              />
            </div>

            <p className="rounded-lg bg-[#EEF5F3] px-3 py-2 text-[11px] font-medium leading-relaxed text-[#1A5345]">
              Tip: name the file with keywords like <strong>Lipid_Panel</strong>, <strong>HbA1c</strong>, or <strong>CBC</strong> to auto-fill a full mock panel.
            </p>

            <div className="flex justify-end gap-2 border-t border-[#E8E6E0]/60 pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setUploadDialog(false)
                  setUploadFileName("")
                  setUploadDate(todayIso())
                }}
                className="h-8 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={submitUpload}
                disabled={!uploadFileName.trim()}
                className="h-8 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
              >
                Import mock panel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: diagnosesScrollbarCss }} />
    </div>
  )
}
