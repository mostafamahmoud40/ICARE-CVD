"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertTriangleIcon, PillIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

import {
  AdherencePill,
  formatPatientRowId,
  prescriptionsListSearchInputClassName,
  prescriptionsScrollbarCss,
} from "./doctorPrescriptions.shared"
import type { PatientInfo, PatientPrescription } from "./doctorPrescriptions.types"
import { useDoctorPrescriptions } from "./useDoctorPrescriptions"

function getPatientMetrics(patientId: string, prescriptions: PatientPrescription[]) {
  const rxs = prescriptions.filter((r) => r.patientId === patientId)
  const active = rxs.filter((r) => r.status === "active")
  const poor = active.filter((r) => r.compliance === "poor")
  const avgAdherence =
    active.length > 0
      ? Math.round(active.reduce((sum, r) => sum + r.adherencePercent, 0) / active.length)
      : 0
  return {
    activeCount: active.length,
    poorCount: poor.length,
    avgAdherence,
  }
}

export function DoctorPrescriptionsList() {
  const { data, isLoading } = useDoctorPrescriptions()
  const [searchTerm, setSearchTerm] = useState("")
  const [poorComplianceOnly, setPoorComplianceOnly] = useState(false)

  const filteredPatients = useMemo(() => {
    let list = data.patients
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => p.fullName.toLowerCase().includes(q))
    }
    if (poorComplianceOnly) {
      list = list.filter((p) => {
        const { poorCount } = getPatientMetrics(p.id, data.prescriptions)
        return poorCount > 0
      })
    }
    return list
  }, [data.patients, data.prescriptions, searchTerm, poorComplianceOnly])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Prescriptions
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Patient prescriptions
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Manage prescriptions and monitor adherence across your patients.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                  Active prescriptions
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-bold leading-none text-[#1A5345] tabular-nums sm:text-[17px]">
                    {data.stats.activePrescriptions}
                  </span>
                  <PillIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                  Poor compliance
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-bold leading-none text-amber-600 tabular-nums sm:text-[17px]">
                    {data.stats.poorComplianceCount}
                  </span>
                  <AlertTriangleIcon className="size-5 shrink-0 text-amber-600" aria-hidden />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative w-full sm:min-w-0 sm:max-w-[min(100%,360px)] sm:flex-1 lg:max-w-[400px]">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search patient…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={prescriptionsListSearchInputClassName()}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 px-1">
              <Checkbox
                checked={poorComplianceOnly}
                onCheckedChange={(v) => setPoorComplianceOnly(Boolean(v))}
                className="rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
              />
              <span className="text-[12px] font-bold text-muted-foreground transition-colors hover:text-[#1A1F1E]">
                Poor compliance only
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                    <th className="py-4 pl-4 pr-4">Patient</th>
                    <th className="px-4 py-4">Active Rx</th>
                    <th className="px-4 py-4">Poor compliance</th>
                    <th className="px-4 py-4">Adherence</th>
                    <th className="px-4 py-4">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-4 pl-4 pr-4" colSpan={5}>
                            <Skeleton className="h-12 w-full rounded-lg" />
                          </td>
                        </tr>
                      ))
                    : filteredPatients.length === 0
                      ? (
                          <tr>
                            <td className="px-4 py-20 text-center" colSpan={5}>
                              <div className="flex flex-col items-center justify-center opacity-50">
                                <PillIcon className="mb-4 size-12 stroke-[1.25]" />
                                <p className="text-[16px] font-bold text-[#1A1F1E]">No patients match</p>
                                <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                                  Try changing search or filters.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      : (
                          filteredPatients.map((patient) => (
                            <PatientRow
                              key={patient.id}
                              patient={patient}
                              prescriptions={data.prescriptions}
                            />
                          ))
                        )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: prescriptionsScrollbarCss() }} />
    </div>
  )
}

function PatientRow({
  patient,
  prescriptions,
}: {
  patient: PatientInfo
  prescriptions: PatientPrescription[]
}) {
  const router = useRouter()
  const { activeCount, poorCount, avgAdherence } = getPatientMetrics(patient.id, prescriptions)
  const href = `/doctor-prescriptions/${patient.id}`

  return (
    <tr
      role="link"
      tabIndex={0}
      className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(href)
        }
      }}
    >
      <td className="py-4 pl-4 pr-4">
        <Link
          href={href}
          className="flex items-start gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
            <Image
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patient.fullName.replace(/\s+/g, ""))}`}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {patient.fullName}
            </p>
            <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
              {formatPatientRowId(patient.id)}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4 align-middle">
        <span className="text-[14px] font-medium text-[#1A1F1E]/80">{activeCount}</span>
      </td>
      <td className="px-4 py-4 align-middle">
        {poorCount > 0 ? (
          <div className="inline-flex items-center gap-1.5" aria-label={`${poorCount} poor compliance`}>
            <AlertTriangleIcon className="size-4 shrink-0 text-amber-600" aria-hidden />
            <span className="text-[14px] font-semibold tabular-nums text-[#1A1F1E]">{poorCount}</span>
          </div>
        ) : (
          <span className="text-[14px] font-semibold tabular-nums text-[#1A1F1E]">0</span>
        )}
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[14px] font-bold tabular-nums",
              avgAdherence >= 85
                ? "text-emerald-600"
                : avgAdherence >= 65
                  ? "text-amber-600"
                  : "text-rose-600",
            )}
          >
            {avgAdherence}%
          </span>
          {activeCount > 0 ? <AdherencePill pct={avgAdherence} /> : null}
        </div>
      </td>
      <td className="px-4 py-4 align-middle">
        <span className="text-[14px] font-medium capitalize text-[#1A1F1E]/80">{patient.gender}</span>
      </td>
    </tr>
  )
}
