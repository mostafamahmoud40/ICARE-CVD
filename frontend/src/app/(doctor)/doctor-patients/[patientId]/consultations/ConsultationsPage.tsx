"use client"

import React, { useState, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { VisitRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { doctorAvatarUrl, diagnosesScrollbarCss } from "../diagnoses/diagnosis.shared"
import { deleteConsultationReport } from "../../consultationReport.api"
import { DeleteConsultationDialog } from "./DeleteConsultationDialog"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FileTextIcon,
  SearchIcon,
  ClockIcon,
  XIcon,
  ArrowLeftIcon,
  SparklesIcon,
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

function fmtFull(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

type ConsultationsPageProps = {
  patientId: string
  patientName: string
  visits: VisitRecord[]
}

export function ConsultationsPage({ patientId, patientName, visits }: ConsultationsPageProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [localVisits, setLocalVisits] = useState(visits)

  React.useEffect(() => {
    setLocalVisits(visits)
  }, [visits])

  const deleteMutation = useMutation({
    mutationFn: (visitId: string) => deleteConsultationReport(patientId, visitId),
    onSuccess: async (_data, visitId) => {
      setLocalVisits((prev) => prev.filter((visit) => visit.id !== visitId))
      await queryClient.invalidateQueries({ queryKey: ["doctor-patient-record", patientId] })
      showIcareSuccessToast("Consultation deleted", "The visit was removed from the timeline.")
    },
    onError: (error: Error) => {
      showIcareErrorToast("Could not delete consultation", error.message)
    },
  })

  const typeStyles: Record<string, string> = {
    "follow-up": "bg-[#1A5345] text-white",
    "new": "bg-blue-600 text-white",
    "walk-in": "bg-amber-500 text-white",
    "post-procedure": "bg-violet-600 text-white",
    "urgent": "bg-red-600 text-white",
  }

  const typeLabels: Record<string, string> = {
    "follow-up": "Follow up",
    "new": "New",
    "walk-in": "Walk in",
    "post-procedure": "Post procedure",
    "urgent": "Urgent",
  }

  // Filter consultations in memory
  const filteredVisits = useMemo(() => {
    return localVisits.filter((v) => {
      const matchType = selectedType === "all" || v.type === selectedType
      const matchSearch =
        searchTerm.trim() === "" ||
        v.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.diagnosisSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchType && matchSearch
    })
  }, [localVisits, searchTerm, selectedType])

  // Compute stats
  const stats = useMemo(() => {
    const totalCount = localVisits.length
    const totalDuration = localVisits.reduce((acc, curr) => acc + (curr.durationMin || 0), 0)
    const latestDate = localVisits[0]?.date ? fmtFull(localVisits[0].date) : "N/A"
    return { totalCount, totalDuration, latestDate }
  }, [localVisits])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="mb-3 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="h-8 gap-1.5 rounded-lg px-2 text-[12px] font-bold text-[#6B7870] hover:bg-white hover:text-[#1A5345]"
            >
              <Link href={`/doctor-patients/${patientId}`}>
                <ArrowLeftIcon className="size-3.5" aria-hidden />
                Back to patient file
              </Link>
            </Button>
          </div>

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
                  <Link href={`/doctor-patients/${patientId}`} className="text-[11px] font-medium sm:text-[12px]">{patientName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px] font-medium sm:text-[12px] text-[#1A1F1E]">Consultations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Consultation history
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Complete record of visits, complaints, and physician diagnostics for{" "}
                <span className="font-bold text-[#1A1F1E]">{patientName}</span>.
              </p>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Total visits</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {stats.totalCount}
                </span>
              </div>
              <FileTextIcon className="size-5 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Contact time</span>
                <span className="font-serif text-[32px] font-bold leading-none tracking-tight text-[#1A1F1E] tabular-nums">
                  {stats.totalDuration}
                  <span className="ml-1 text-[14px] font-bold text-muted-foreground">mins</span>
                </span>
              </div>
              <ClockIcon className="size-5 shrink-0 text-[#2C6A5B]" strokeWidth={2} aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Latest visit</span>
                <span className="font-serif text-[20px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                  {stats.latestDate}
                </span>
              </div>
              <CalendarDaysIcon className="size-5 shrink-0 text-[#C27D38]" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div className="mt-4 space-y-3 pt-1">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                type="search"
                placeholder="Search by complaint, summary, or doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-9 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1A1F1E]"
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7870]">Filter type:</span>
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                  selectedType === "all"
                    ? "bg-[#1A5345] text-white shadow-sm"
                    : "bg-[#F4F3ED] text-[#6B7870] hover:bg-[#E8E6E0]/70 hover:text-[#1A1F1E]"
                )}
              >
                All
              </button>
              {Object.entries(typeLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                    selectedType === key
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "bg-[#F4F3ED] text-[#6B7870] hover:bg-[#E8E6E0]/70 hover:text-[#1A1F1E]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 custom-scrollbar">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-3 px-0.5">
            <h2 className="font-serif text-[18px] font-bold text-[#1A1F1E]">Visit timeline</h2>
            <span className="rounded-lg bg-[#1A5345] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {filteredVisits.length} visit{filteredVisits.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-12 text-center">
              <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                <SparklesIcon className="size-6 text-[#9CA3AF]" />
              </div>
              <p className="text-[14px] font-bold text-[#1A1F1E]">No consultations found</p>
              <p className="mt-1 text-[12px] font-medium text-[#6B7870] max-w-xs mx-auto">
                We couldn&apos;t find any visit reports matching your current search criteria.
              </p>
              {(searchTerm || selectedType !== "all") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedType("all")
                  }}
                  className="mt-4 h-8 rounded-lg border-[#E8E6E0] text-[11px] font-bold text-[#1A5345] bg-white hover:bg-[#F9F8F5]"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-[148px] top-4 bottom-4 hidden w-px bg-gradient-to-b from-[#E8E6E0] via-[#E8E6E0] to-transparent lg:block" aria-hidden />

              {filteredVisits.map((v) => (
                <div key={v.id} className="group grid grid-cols-1 gap-4 lg:grid-cols-[148px_minmax(0,1fr)] lg:gap-8">
                  <div className="relative flex flex-row items-baseline justify-between gap-2 pt-1 lg:flex-col lg:items-end lg:justify-start lg:text-right">
                    <p className="text-[14px] font-bold leading-tight text-[#1A1F1E] lg:text-[15px]">
                      {fmtFull(v.date)}
                    </p>
                    <div className="hidden lg:flex absolute -right-[19px] top-[10px] size-5 items-center justify-center" aria-hidden>
                      <div className="size-3.5 rounded-full border-2 border-white bg-[#1A5345] shadow-[0_0_0_2px_rgba(26,83,69,0.1)] transition-transform duration-300 group-hover:scale-125" />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] transition-all hover:border-[#1A5345]/25 hover:shadow-md">
                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                      <Link
                        href={`/doctor-patients/${patientId}/consultations/${v.id}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/80 bg-[#E8F0EE] shadow-sm">
                            <img src={doctorAvatarUrl(v.doctorName)} alt="" className="size-full object-cover" />
                          </div>
                          <p className="text-[13px] font-bold text-[#1A1F1E] sm:text-[14px] group-hover:text-[#1A5345] transition-colors">
                            {v.doctorName}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">
                            {v.chiefComplaint}
                          </p>
                          <span className={cn("rounded-lg px-2 py-0.5 text-[9px] font-bold", typeStyles[v.type] ?? "bg-slate-500 text-white")}>
                            {typeLabels[v.type] ?? v.type}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8F0EE]/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#1A5345]">
                            <ClockIcon className="size-2.5" />
                            {v.durationMin} mins
                          </span>
                        </div>

                        <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-[#6B7870] sm:text-[13px]">
                          <span className="text-[#1A1F1E] font-bold">Summary:</span> {v.diagnosisSummary}
                        </p>
                      </Link>

                      <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                        <Link
                          href={`/doctor-patients/${patientId}/consultations/${v.id}`}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#1A5345] transition-colors hover:text-[#133F34]"
                        >
                          <FileTextIcon className="size-3.5" />
                          <span>Report</span>
                          <ChevronRightIcon className="size-3.5" />
                        </Link>
                        <DeleteConsultationDialog
                          onConfirm={() => deleteMutation.mutate(v.id)}
                          isDeleting={deleteMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: diagnosesScrollbarCss }} />
    </div>
  )
}
