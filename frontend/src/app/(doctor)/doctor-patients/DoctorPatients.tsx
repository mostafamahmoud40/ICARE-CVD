"use client"

import { useMemo, useState } from "react"
import type { DoctorPatientsPagePatient, DoctorPatientsPageStats } from "./doctorPatients.types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  HeartPulseIcon,
  PillIcon,
  ShieldAlertIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"

const riskConfig: Record<DoctorPatientsPagePatient["riskLevel"], { label: string; shortLabel: string; dot: string; badge: string }> = {
  low: { label: "Low Risk", shortLabel: "Low", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  moderate: { label: "Moderate Risk", shortLabel: "Med", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700" },
  high: { label: "High Risk", shortLabel: "High", dot: "bg-red-400", badge: "bg-red-50 text-red-700" },
}

function calcAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function StatCard({ icon: Icon, iconStyle, value, label }: {
  icon: React.ElementType
  iconStyle: string
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-9", iconStyle)}>
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-[#102F27] sm:text-xl">{value}</div>
        <div className="text-[9px] text-muted-foreground sm:text-[11px]">{label}</div>
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: DoctorPatientsPagePatient }) {
  const risk = riskConfig[patient.riskLevel]
  const age = calcAge(patient.dateOfBirth)

  return (
    <Link href={`/doctor-patients/${patient.id}`}>
      <div className="group cursor-pointer rounded-xl border-2 border-[#E5EEEA] bg-white p-3 transition-all hover:border-[#A8C4BC] hover:shadow-sm sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] sm:size-11">
            <UserRoundIcon className="size-4 text-[#1A5345] sm:size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-[12px] font-semibold text-[#102F27] sm:text-[14px]">{patient.fullName}</h3>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]", risk.badge)}>
                <span className={cn("mr-1 inline-block size-1.5 rounded-full", risk.dot)} />
                <span className="hidden sm:inline">{risk.label}</span>
                <span className="sm:hidden">{risk.shortLabel}</span>
              </span>
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground sm:mt-1 sm:gap-2 sm:text-[11px]">
              <span>{age} yrs</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="capitalize">{patient.gender}</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7870] sm:text-[10px]">{patient.bloodType}</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px]">{patient.id}</span>
            </div>

            <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-[11px]">{patient.condition}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[#EEF5F3] px-1.5 py-0.5 text-[9px] font-medium text-[#2C6A5B] sm:px-2 sm:text-[10px]">
                <PillIcon className="size-2.5" />
                {patient.activeMedications} med{patient.activeMedications !== 1 ? "s" : ""}
              </span>
              {patient.poorComplianceCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 sm:px-2 sm:text-[10px]">
                  <AlertTriangleIcon className="size-2.5" />
                  {patient.poorComplianceCount} alert{patient.poorComplianceCount > 1 ? "s" : ""}
                </span>
              )}
              {patient.allergies.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-600 sm:px-2 sm:text-[10px]">
                  <ShieldAlertIcon className="size-2.5" />
                  {patient.allergies.length} allerg{patient.allergies.length !== 1 ? "ies" : "y"}
                </span>
              )}
              {patient.totalVisits > 0 && (
                <span className="rounded-full bg-[#F5F5F3] px-1.5 py-0.5 text-[9px] text-[#6B7870] sm:text-[10px]">
                  {patient.totalVisits} visits
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

type DoctorPatientsProps = {
  patients: DoctorPatientsPagePatient[]
  stats: DoctorPatientsPageStats
}

export function DoctorPatients({ patients, stats }: DoctorPatientsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "moderate" | "high">("all")

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
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A5345] sm:size-9">
            <HeartPulseIcon className="size-4 text-white sm:size-5" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#1A1F1E] sm:text-[15px]">Patient Directory</h2>
            <p className="text-[10px] text-muted-foreground sm:text-[11px]">
              {stats.totalPatients} patients under your care
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard icon={HeartPulseIcon} iconStyle="bg-[#E8F0EE] text-[#1A5345]" value={stats.totalPatients} label="Total Patients" />
          <StatCard icon={AlertTriangleIcon} iconStyle="bg-red-50 text-red-600" value={stats.highRiskCount} label="High Risk" />
          <StatCard icon={AlertTriangleIcon} iconStyle="bg-amber-50 text-amber-600" value={stats.complianceAlertsCount} label="Compliance Alerts" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-64">
            <HeartPulseIcon className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, condition..."
              className="h-8 border-[#E8E6E0] bg-white pl-7 text-[11px] placeholder:text-[#9CA3AF] sm:text-[12px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(["all", "high", "moderate", "low"] as const).map((level) => {
              const labels = { all: "All", high: "High", moderate: "Moderate", low: "Low" }
              return (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-[11px]",
                    riskFilter === level
                      ? "bg-[#1A5345] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                  )}
                >
                  {labels[level]}
                </button>
              )
            })}
          </div>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 sm:py-12">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
              <HeartPulseIcon className="size-6 text-[#9CA3AF] sm:size-7" />
            </div>
            <p className="px-4 text-center text-[12px] text-[#6B7870] sm:text-[13px]">
              {searchQuery || riskFilter !== "all"
                ? "No patients match your filters."
                : "No patients assigned yet."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
