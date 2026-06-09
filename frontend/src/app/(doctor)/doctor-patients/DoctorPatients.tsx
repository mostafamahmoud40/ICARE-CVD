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
  low: { label: "Low Risk", shortLabel: "Low", dot: "bg-emerald-100", badge: "bg-emerald-500 text-white" },
  moderate: { label: "Moderate Risk", shortLabel: "Med", dot: "bg-amber-100", badge: "bg-amber-500 text-white" },
  high: { label: "High Risk", shortLabel: "High", dot: "bg-red-100", badge: "bg-red-500 text-white" },
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
        <div className="text-[9px] font-bold text-muted-foreground sm:text-[10px] uppercase tracking-wider">{label}</div>
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: DoctorPatientsPagePatient }) {
  const risk = riskConfig[patient.riskLevel]
  const age = calcAge(patient.dateOfBirth)

  return (
    <Link href={`/doctor-patients/${patient.id}`}>
      <div className="group cursor-pointer rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-all hover:border-[#A8C4BC]/60 hover:shadow-md sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-4">
          <UserRoundIcon className="size-4 text-[#1A5345] sm:size-5 shrink-0 mt-0.5" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-[12px] font-bold text-[#1A1F1E] sm:text-[14px]">{patient.fullName}</h3>
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px]", risk.badge)}>
                <span className={cn("mr-1 inline-block size-1.5 rounded-full", risk.dot)} />
                <span className="hidden sm:inline">{risk.label}</span>
                <span className="sm:hidden">{risk.shortLabel}</span>
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:mt-1.5 sm:gap-2 sm:text-[11px]">
              <span>{age}y</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="capitalize">{patient.gender}</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="rounded-full bg-[#F9F8F5] border border-[#E8E6E0]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#1A5345] sm:text-[10px]">{patient.bloodType}</span>
              <span className="text-[#E8E6E0]">|</span>
              <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px] tracking-tight">{patient.id}</span>
            </div>

            <p className="mt-1.5 text-[10px] font-medium text-muted-foreground sm:text-[11px] leading-relaxed line-clamp-2">{patient.condition}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[9px] font-bold text-[#1A5345] sm:text-[10px]">
                <PillIcon className="size-2.5" />
                {patient.activeMedications} Rx
              </span>
              {patient.poorComplianceCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 sm:text-[10px]">
                  <AlertTriangleIcon className="size-2.5" />
                  {patient.poorComplianceCount}
                </span>
              )}
              {patient.allergies.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 sm:text-[10px]">
                  <ShieldAlertIcon className="size-2.5" />
                  {patient.allergies.length}
                </span>
              )}
              {patient.totalVisits > 0 && (
                <span className="rounded-full bg-[#F9F8F5] border border-[#E8E6E0]/40 px-2 py-0.5 text-[9px] font-bold text-[#6B7870] sm:text-[10px]">
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <HeartPulseIcon className="size-4 sm:size-5 text-[#1A5345]" aria-hidden />
            <div>
              <h2 className="text-[13px] font-bold text-[#1A1F1E] sm:text-[15px]">Patient Directory</h2>
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                {stats.totalPatients} patients under your care
              </p>
            </div>
          </div>
          <span className="self-start rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
            Active Directory
          </span>
        </header>

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
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            {(["all", "high", "moderate", "low"] as const).map((level) => {
              const labels = { all: "All Levels", high: "High Risk", moderate: "Moderate", low: "Low Risk" }
              return (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all sm:text-[11px]",
                    riskFilter === level
                      ? "bg-[#1A5345] text-white shadow-sm"
                      : "bg-[#F9F8F5] text-[#4F6D64] hover:bg-[#E8F0EE] border border-[#E8E6E0]/60",
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
