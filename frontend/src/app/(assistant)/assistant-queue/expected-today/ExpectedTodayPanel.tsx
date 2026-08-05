"use client"

import { useState } from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  SearchIcon,
  StethoscopeIcon,
  XIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { QueuePatient } from "../assistantQueue.types"
import { ScheduledPatientRow } from "./ScheduledPatientRow"


export function ExpectedTodayPanel({
  patients,
  onSelectPatient,
}: {
  patients: QueuePatient[]
  onSelectPatient: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [doctorFilter, setDoctorFilter] = useState<string>("all")

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         p.assignedDoctor.toLowerCase().includes(search.toLowerCase())
    const matchesDoctor = doctorFilter === "all" || p.assignedDoctor === doctorFilter
    return matchesSearch && matchesDoctor
  })

  // Get unique doctors for filter
  const uniqueDoctors = Array.from(new Set(patients.map(p => p.assignedDoctor)))

  // Group by doctor
  const byDoctor = filteredPatients.reduce<Record<string, QueuePatient[]>>((acc, p) => {
    const key = p.assignedDoctor
    acc[key] = acc[key] ?? []
    acc[key].push(p)
    return acc
  }, {})

  // Stats
  const stats = {
    total: patients.length,
    totalDoctors: uniqueDoctors.length,
    urgent: patients.filter(p => p.priority === "urgent" || p.priority === "emergency").length,
  }

  if (patients.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center bg-[#F9F8F5]">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
          <CalendarDaysIcon className="size-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">All expected patients have arrived</p>
        <p className="mt-1 text-[12px] text-muted-foreground">No pending scheduled arrivals remaining for today.</p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F9F8F5]">
      {/* Header with Stats */}
      <div className="sticky top-0 z-10 bg-[#F9F8F5] border-b border-[#E8E6E0] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#1A1F1E]">Expected Today</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              Check-in patients scheduled for today's clinical sessions.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search patient or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-[#E8E6E0]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-white border-[#E8E6E0]">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {uniqueDoctors.map(doc => (
                <SelectItem key={doc} value={doc}>{doc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {(search || doctorFilter !== "all") && (
          <div className="mt-3 text-[12px] text-muted-foreground">
            Showing {filteredPatients.length} of {patients.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {Object.entries(byDoctor).map(([doctor, list]) => {
          // Sort list by scheduled time to ensure consecutive order
          const sortedList = [...list].sort((a, b) => 
            new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
          )

          return (
            <div key={doctor} className="bg-white rounded-2xl border border-[#E8E6E0]/60 p-4 shadow-sm">
              {/* Doctor Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E8E6E0]/50">
                <StethoscopeIcon className="size-5 text-[#1A5345] shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-[#1A1F1E] truncate">{doctor}</h3>
                  <p className="text-[11px] font-medium text-muted-foreground">{list.length} scheduled today</p>
                </div>
                <span className="rounded-lg bg-[#E8F0EE] px-2.5 py-1 text-[11px] font-bold text-[#1A5345] shadow-sm">
                  {list.filter(p => new Date(p.scheduledTime) < new Date()).length} waiting
                </span>
              </div>

              {/* Patient List */}
              <div className="space-y-2.5">
                {sortedList.map((p) => (
                  <ScheduledPatientRow
                    key={p.queueEntryId}
                    patient={p}
                    onSelect={onSelectPatient}
                    onMarkArrived={(id) => console.log("Mark arrived:", id)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Empty filtered state */}
        {filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-[#E8E6E0]">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
              <SearchIcon className="size-7 text-[#9CA3AF]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#6B7870]">No patients found</p>
            <p className="text-[13px] text-muted-foreground mt-1">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearch(""); setDoctorFilter("all") }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#1A5345] text-white text-[13px] font-medium hover:bg-[#0F3D32] transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
