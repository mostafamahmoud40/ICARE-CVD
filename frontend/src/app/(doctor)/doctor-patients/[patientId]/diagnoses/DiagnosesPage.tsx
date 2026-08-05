"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { DiagnosisRecord, DoctorPatientsPagePatient } from "../../doctorPatients.types"
import { DIAGNOSIS_CATEGORY_LABELS } from "../../doctorPatients.types"
import Link from "next/link"
import {
  ClipboardCheckIcon,
  PlusIcon,
  PencilIcon,
  SearchIcon,
  StethoscopeIcon,
  RefreshCwIcon,
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
import { DiagnosisForm } from "./DiagnosisForm"
import type { DiagnosisFormValues } from "./diagnosisForm.types"
import {
  DiagnosedByCell,
  StatusBadge,
  TypeBadge,
  buildDiagnosisNotes,
  diagnosesScrollbarCss,
  emptyDiagnosisForm,
  fmtShort,
  toDiagnosisForm,
} from "./diagnosis.shared"

type TypeFilter = "all" | DiagnosisRecord["type"]

type DiagnosesPageProps = {
  patient: DoctorPatientsPagePatient
  diagnoses: DiagnosisRecord[]
}

export function DiagnosesPage({ patient, diagnoses: initialDiagnoses }: DiagnosesPageProps) {
  const router = useRouter()
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>(initialDiagnoses)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<DiagnosisFormValues>(emptyDiagnosisForm())
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  const primaryCount = diagnoses.filter((d) => d.type === "primary").length
  const chronicCount = diagnoses.filter((d) => d.status === "chronic").length

  const filteredDiagnoses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return diagnoses.filter((d) => {
      const matchesType = typeFilter === "all" || d.type === typeFilter
      const matchesSearch =
        !q ||
        d.icdCode.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q) ||
        d.diagnosedBy.toLowerCase().includes(q) ||
        DIAGNOSIS_CATEGORY_LABELS[d.category].toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [diagnoses, searchQuery, typeFilter])

  function handleSave(data: DiagnosisFormValues) {
    const now = new Date().toISOString().slice(0, 10)
    const nowIso = new Date().toISOString()
    const notes = buildDiagnosisNotes(data)

    if (editingId) {
      setDiagnoses((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                icdCode: data.icdCode,
                description: data.description,
                category: data.category,
                chronicFlag: data.chronicFlag,
                infectiousFlag: data.infectiousFlag,
                type: data.type,
                severity: data.severity,
                status: data.status,
                notes,
                updatedAt: nowIso,
              }
            : d,
        ),
      )
    } else {
      const newDiagnosis: DiagnosisRecord = {
        id: `dx-${Date.now()}`,
        icdCode: data.icdCode || "N/A",
        description: data.description,
        category: data.category,
        chronicFlag: data.chronicFlag,
        infectiousFlag: data.infectiousFlag,
        type: data.type,
        severity: data.severity,
        diagnosedAt: now,
        diagnosedBy: "Dr. Mahmoud",
        status: data.status,
        notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      setDiagnoses((prev) => [newDiagnosis, ...prev])
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  function openDetail(d: DiagnosisRecord) {
    router.push(`/doctor-patients/${patient.id}/diagnoses/${d.id}`)
  }

  function openEdit(d: DiagnosisRecord) {
    setEditingId(d.id)
    setEditForm(toDiagnosisForm(d))
    setDialogOpen(true)
  }

  function openAdd() {
    setEditingId(null)
    setEditForm(emptyDiagnosisForm())
    setDialogOpen(true)
  }

  function resetFilters() {
    setSearchQuery("")
    setTypeFilter("all")
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
                    <Link href="/doctor-patients" className="text-[11px] font-medium sm:text-[12px]">
                      Patients
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/doctor-patients/${patient.id}`}
                      className="text-[11px] font-medium sm:text-[12px]"
                    >
                      {patient.fullName}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[11px] font-medium sm:text-[12px]">
                    Diagnoses &amp; Conditions
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Diagnoses &amp; Conditions
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Problem list and clinical conditions for{" "}
                <span className="font-bold text-[#1A1F1E]">{patient.fullName}</span>
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={openAdd}
              className="h-8 gap-2 self-start rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
            >
              <PlusIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              Add diagnosis
            </Button>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total diagnoses
                </span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {diagnoses.length}
                </span>
              </div>
              <ClipboardCheckIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  Primary
                </span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {primaryCount}
                </span>
              </div>
              <StethoscopeIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  Chronic
                </span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {chronicCount}
                </span>
              </div>
              <ClipboardCheckIcon className="size-5 shrink-0 text-[#CC5533]" strokeWidth={2} aria-hidden />
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
                placeholder="Search ICD, description, or notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value="all" className="h-10 cursor-pointer text-[#152a24]">
                    All types
                  </SelectItem>
                  <SelectItem value="primary" className="h-10 cursor-pointer text-[#152a24]">
                    Primary
                  </SelectItem>
                  <SelectItem value="secondary" className="h-10 cursor-pointer text-[#152a24]">
                    Secondary
                  </SelectItem>
                  <SelectItem value="differential" className="h-10 cursor-pointer text-[#152a24]">
                    Differential
                  </SelectItem>
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

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
        <div className="custom-scrollbar w-full space-y-4">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Problem list</h2>
            <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {filteredDiagnoses.length} record{filteredDiagnoses.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                    <th className="py-4 pl-4 pr-4">ICD code</th>
                    <th className="px-4 py-4">Description</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Diagnosed by</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Clinical notes</th>
                    <th className="py-4 pl-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {filteredDiagnoses.length === 0 ? (
                    <tr>
                      <td className="px-4 py-20 text-center" colSpan={9}>
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <ClipboardCheckIcon className="mb-4 size-12 stroke-[1.25]" aria-hidden />
                          <p className="text-[16px] font-bold text-[#1A1F1E]">
                            {diagnoses.length === 0 ? "No diagnoses recorded" : "No diagnoses match"}
                          </p>
                          <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]">
                            {diagnoses.length === 0
                              ? "Add the first diagnosis for this patient\u2019s problem list."
                              : "Try changing search or filters."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDiagnoses.map((d) => (
                      <tr
                        key={d.id}
                        className="cursor-pointer transition-colors hover:bg-[#F9F8F5]/60"
                        onClick={() => openDetail(d)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            openDetail(d)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${d.description}`}
                      >
                        <td className="py-4 pl-4 pr-4">
                          <span className="font-mono text-[14px] font-bold text-[#6B7870]">{d.icdCode}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-[240px] text-[15px] font-bold text-[#1A1F1E]">{d.description}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[13px] font-semibold text-[#1A5345] sm:text-[14px]">
                            {DIAGNOSIS_CATEGORY_LABELS[d.category]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <TypeBadge type={d.type} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-4 py-4">
                          <DiagnosedByCell name={d.diagnosedBy} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[15px] font-bold tabular-nums text-[#1A1F1E]">
                            {fmtShort(d.diagnosedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-[280px] truncate text-[13px] font-medium leading-relaxed text-[#6B7870] sm:text-[14px]" title={d.notes}>
                            {d.notes || "—"}
                          </p>
                        </td>
                        <td className="py-4 pl-4 pr-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 border-0 bg-transparent text-[#6B7870] shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345]"
                            onClick={(event) => {
                              event.stopPropagation()
                              openEdit(d)
                            }}
                            aria-label={`Edit ${d.description}`}
                          >
                            <PencilIcon className="size-4" strokeWidth={2} aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingId(null)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[720px]">
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
            <DialogTitle className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[24px]">
              {editingId ? "Edit diagnosis" : "Add new diagnosis"}
            </DialogTitle>
            <DialogDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              {editingId
                ? "Update ICD code, category, flags, severity, status, and clinical notes."
                : "Record a new diagnosis on the patient problem list. ICD-10 code and description are required."}
            </DialogDescription>
          </DialogHeader>
          <DiagnosisForm
            initial={editForm}
            onSubmit={handleSave}
            onCancel={() => {
              setDialogOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: diagnosesScrollbarCss }} />
    </div>
  )
}
