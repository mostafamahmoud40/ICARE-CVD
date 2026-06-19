"use client"

import { useMemo, useState } from "react"
import type { DoctorPatientsPagePatient, DoctorPatientsPageStats } from "./doctorPatients.types"
import { patientDisplayId } from "./doctorPatients.utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  HeartPulseIcon,
  LayoutGridIcon,
  ListIcon,
  PillIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const riskConfig: Record<DoctorPatientsPagePatient["riskLevel"], { label: string; shortLabel: string; badge: string }> = {
  low: { label: "Low risk", shortLabel: "Low", badge: "bg-emerald-500 text-white" },
  moderate: { label: "Moderate", shortLabel: "Med", badge: "bg-amber-500 text-white" },
  high: { label: "High risk", shortLabel: "High", badge: "bg-rose-500 text-white" },
}

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

function patientAvatarUrl(patient: DoctorPatientsPagePatient) {
  return patient.profileImageUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(patient.id)}`
}

function calcAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function StatCard({ icon: Icon, iconColor, value, label }: {
  icon: React.ElementType
  iconColor: string
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3 group hover:shadow-md transition-all duration-300">
      <Icon className={cn("size-4 sm:size-5 shrink-0 transition-colors duration-300", iconColor)} aria-hidden />
      <div className="min-w-0">
        <div className="text-[16px] font-bold text-[#1A1F1E] sm:text-lg leading-tight transition-colors group-hover:text-[#1A5345]">{value}</div>
        <div className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{label}</div>
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: DoctorPatientsPagePatient["riskLevel"] }) {
  const risk = riskConfig[level]
  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold", risk.badge)}>
      {risk.label}
    </span>
  )
}

function PatientCard({ patient }: { patient: DoctorPatientsPagePatient }) {
  const age = calcAge(patient.dateOfBirth)
  const genderLabel = patient.gender === "male" ? "Male" : patient.gender === "female" ? "Female" : "Other"

  return (
    <Link href={`/doctor-patients/${patient.id}`} className="block h-full">
      <Card className="group relative h-full gap-0 overflow-hidden rounded-3xl border border-[#E8E6E0]/60 bg-white py-0 shadow-sm ring-0 transition-all hover:border-[#A8C4BC]/60 hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-4 flex w-full items-center justify-between gap-2">
            <RiskBadge level={patient.riskLevel} />
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-[#1A5345]/70 tabular-nums">
              {patientDisplayId(patient)}
            </span>
          </div>

          <div className="mb-4 flex flex-col items-center gap-2.5">
            <div className="relative size-16 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm">
              <img
                src={patientAvatarUrl(patient)}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-serif text-[18px] font-bold leading-tight text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                {patient.fullName}
              </span>
              <span className="mt-1 text-[12px] font-medium text-muted-foreground">
                {age}y · {genderLabel} · {patient.bloodType}
              </span>
            </div>
          </div>

          <div className="mb-4 flex w-full items-center rounded-2xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-2.5">
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1">
              <span className="text-[10px] font-semibold text-muted-foreground">Last visit</span>
              <span className="text-[11px] font-bold text-[#1A1F1E] tabular-nums">{fmtShort(patient.lastVisitDate)}</span>
            </div>
            <div className="h-7 w-px shrink-0 bg-[#E8E6E0]/80" />
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1">
              <span className="text-[10px] font-semibold text-muted-foreground">Visits</span>
              <span className="text-[12px] font-bold text-[#1A1F1E] tabular-nums">{patient.totalVisits}</span>
            </div>
            <div className="h-7 w-px shrink-0 bg-[#E8E6E0]/80" />
            <div className="flex flex-[1.2] flex-col items-center justify-center gap-0.5 min-w-0 px-1">
              <span className="text-[10px] font-semibold text-muted-foreground">Condition</span>
              <span className="line-clamp-1 w-full text-center text-[11px] font-bold text-[#1A1F1E]" title={patient.condition}>
                {patient.condition}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-center gap-1.5">
            <span className="flex items-center gap-1 rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
              <PillIcon className="size-2.5" aria-hidden />
              {patient.activeMedications} Rx
            </span>
            {patient.poorComplianceCount > 0 ? (
              <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/15">
                <AlertTriangleIcon className="size-2.5" aria-hidden />
                {patient.poorComplianceCount} alert{patient.poorComplianceCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {patient.allergies.length > 0 ? (
              <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/15">
                <ShieldAlertIcon className="size-2.5" aria-hidden />
                {patient.allergies.length} allergy
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PatientListRow({ patient }: { patient: DoctorPatientsPagePatient }) {
  const age = calcAge(patient.dateOfBirth)
  const genderLabel = patient.gender === "male" ? "Male" : patient.gender === "female" ? "Female" : "Other"

  return (
    <tr className="group cursor-pointer transition-colors hover:bg-[#F9F8F5]/60">
      <td className="py-4 pl-4 pr-4">
        <Link href={`/doctor-patients/${patient.id}`} className="flex items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0] shadow-sm">
            <img src={patientAvatarUrl(patient)} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {patient.fullName}
            </p>
            <p className="truncate text-[12px] font-medium text-muted-foreground">{patientDisplayId(patient)}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4">
        <Link href={`/doctor-patients/${patient.id}`} className="block max-w-[220px]">
          <p className="truncate text-[13px] font-medium text-[#1A1F1E]" title={patient.condition}>
            {patient.condition}
          </p>
        </Link>
      </td>
      <td className="px-4 py-4">
        <Link href={`/doctor-patients/${patient.id}`} className="block text-[13px] font-medium text-[#1A1F1E]">
          {age}y <span className="text-muted-foreground/60">/</span> {genderLabel.charAt(0)}
        </Link>
      </td>
      <td className="px-4 py-4">
        <Link href={`/doctor-patients/${patient.id}`} className="block text-[13px] font-bold tabular-nums text-[#1A1F1E]">
          {fmtShort(patient.lastVisitDate)}
        </Link>
      </td>
      <td className="px-4 py-4">
        <Link href={`/doctor-patients/${patient.id}`} className="inline-block">
          <RiskBadge level={patient.riskLevel} />
        </Link>
      </td>
      <td className="px-4 py-4">
        <Link href={`/doctor-patients/${patient.id}`} className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-lg bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
            <PillIcon className="size-2.5" aria-hidden />
            {patient.activeMedications}
          </span>
          {patient.poorComplianceCount > 0 ? (
            <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/15">
              <AlertTriangleIcon className="size-2.5" aria-hidden />
              {patient.poorComplianceCount}
            </span>
          ) : null}
          {patient.allergies.length > 0 ? (
            <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/15">
              <ShieldAlertIcon className="size-2.5" aria-hidden />
              {patient.allergies.length}
            </span>
          ) : null}
        </Link>
      </td>
      <td className="py-4 pl-4 pr-4 text-right">
        <Link
          href={`/doctor-patients/${patient.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A5345] opacity-0 transition-all group-hover:opacity-100"
        >
          Open
          <ChevronRightIcon className="size-3.5" aria-hidden />
        </Link>
      </td>
    </tr>
  )
}

type DoctorPatientsProps = {
  patients: DoctorPatientsPagePatient[]
  stats: DoctorPatientsPageStats
}

export function DoctorPatients({ patients, stats }: DoctorPatientsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "moderate" | "high">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredPatients = useMemo(() => {
    let filtered = patients

    if (riskFilter !== "all") {
      filtered = filtered.filter((p) => p.riskLevel === riskFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.condition.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
    }

    return filtered
  }, [patients, searchQuery, riskFilter])

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9F8F5] p-3 sm:p-4 lg:p-5">
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <StatCard icon={HeartPulseIcon} iconColor="text-[#1A5345]" value={stats.totalPatients} label="Total Patients" />
          <StatCard icon={AlertTriangleIcon} iconColor="text-red-600" value={stats.highRiskCount} label="High Risk" />
          <StatCard icon={AlertTriangleIcon} iconColor="text-amber-600" value={stats.complianceAlertsCount} label="Compliance Alerts" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between bg-white border border-[#E8E6E0]/60 p-2 sm:p-3 rounded-xl shadow-sm">
          <div className="relative w-full sm:w-80">
            <HeartPulseIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#1A5345]/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, condition..."
              className="h-9 border-[#E8E6E0] bg-[#F9F8F5]/50 pl-9 text-[11px] font-medium placeholder:text-muted-foreground sm:text-[12px] focus-visible:ring-[#1A5345] rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#1A5345]"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-lg border border-[#E8E6E0] bg-white p-0.5 shadow-sm sm:flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "size-8 rounded-md transition-all",
                  viewMode === "grid" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50",
                )}
                aria-label="Grid view"
              >
                <LayoutGridIcon className="size-3.5" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "size-8 rounded-md transition-all",
                  viewMode === "list" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50",
                )}
                aria-label="List view"
              >
                <ListIcon className="size-3.5" aria-hidden />
              </Button>
            </div>

            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as typeof riskFilter)}>
            <SelectTrigger className="h-9 w-full rounded-lg border border-[#E8E6E0] bg-[#F9F8F5]/50 px-3 text-[11px] font-bold text-[#1A1F1E] shadow-sm sm:w-[160px] sm:text-[12px] focus:ring-[#1A5345]">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
              <SelectItem value="all" className="h-10 cursor-pointer text-[#152a24]">All levels</SelectItem>
              <SelectItem value="high" className="h-10 cursor-pointer text-[#152a24]">High risk</SelectItem>
              <SelectItem value="moderate" className="h-10 cursor-pointer text-[#152a24]">Moderate</SelectItem>
              <SelectItem value="low" className="h-10 cursor-pointer text-[#152a24]">Low risk</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        {filteredPatients.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full border-collapse bg-white text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#F4F3ED]/90 text-[15px] font-serif font-bold text-[#1A1F1E] shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md transition-colors">
                      <th className="py-4 pl-4 pr-4">Patient Name</th>
                      <th className="px-4 py-4">Condition</th>
                      <th className="px-4 py-4">Age / Sex</th>
                      <th className="px-4 py-4">Last Visit</th>
                      <th className="px-4 py-4">Risk Level</th>
                      <th className="px-4 py-4">Alerts</th>
                      <th className="py-4 pl-4 pr-4 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E0]/40">
                    {filteredPatients.map((patient) => (
                      <PatientListRow key={patient.id} patient={patient} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E0] bg-white py-12 sm:py-20 shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F9F8F5] sm:size-16">
              <HeartPulseIcon className="size-6 text-[#9CA3AF] sm:size-7" />
            </div>
            <p className="px-4 text-center text-[12px] font-medium text-muted-foreground sm:text-[13px]">
              {searchQuery || riskFilter !== "all"
                ? "No patients match your current filters."
                : "Your patient directory is currently empty."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
