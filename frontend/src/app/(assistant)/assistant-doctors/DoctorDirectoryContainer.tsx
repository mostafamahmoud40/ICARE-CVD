"use client"

import { useState, useMemo } from "react"
import { MOCK_DOCTORS } from "./assistantDoctors.mock"
import { DoctorCard, AddPractitionerCard } from "./DoctorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SearchIcon, XIcon, UsersIcon, ActivityIcon, ClockIcon, PhoneOffIcon } from "lucide-react"

export function DoctorDirectoryContainer() {
  const doctors = MOCK_DOCTORS
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
                           doc.specialty.toLowerCase().includes(search.toLowerCase())
      const matchesDept = deptFilter === "all" || doc.specialty.toLowerCase().includes(deptFilter)
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [doctors, search, deptFilter, statusFilter])

  const stats = {
    total: doctors.length,
    available: doctors.filter(d => d.status === "available").length,
    inConsultation: doctors.filter(d => d.status === "in-consultation").length,
    away: doctors.filter(d => d.status === "away").length,
    totalWaiting: doctors.reduce((sum, d) => sum + d.patientsWaiting, 0)
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F9F8F5] p-4 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="w-full space-y-6 lg:space-y-8">
        {/* Simple Header */}
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#1A1F1E]">Doctor Directory</h1>
          <p className="mt-1 text-[13px] text-[#6B7870]">
            {stats.total} doctors · {stats.available} available · {stats.totalWaiting} patients waiting
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-center text-emerald-600">
              <ActivityIcon className="size-5" />
            </div>
            <div>
              <div className="text-[18px] font-bold text-[#1A1F1E]">{stats.available}</div>
              <div className="text-[11px] font-medium text-[#6B7870]">Available</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-center text-[#d46a4c]">
              <ClockIcon className="size-5" />
            </div>
            <div>
              <div className="text-[18px] font-bold text-[#1A1F1E]">{stats.inConsultation}</div>
              <div className="text-[11px] font-medium text-[#6B7870]">In Consult</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-center text-[#6B7870]">
              <PhoneOffIcon className="size-5" />
            </div>
            <div>
              <div className="text-[18px] font-bold text-[#1A1F1E]">{stats.away}</div>
              <div className="text-[11px] font-medium text-[#6B7870]">Away</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-center text-[#1A5345]">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <div className="text-[18px] font-bold text-[#1A1F1E]">{stats.totalWaiting}</div>
              <div className="text-[11px] font-medium text-[#6B7870]">Waiting</div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search doctors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 border-[#E8E6E0] bg-white pl-9 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]">
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10 w-full border-[#E8E6E0] bg-white shadow-sm sm:w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="cardiology">Cardiology</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full border-[#E8E6E0] bg-white shadow-sm sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in-consultation">In Consult</SelectItem>
              <SelectItem value="away">Away</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        {(search || deptFilter !== "all" || statusFilter !== "all") && (
          <div className="text-[12px] font-medium text-[#6B7870]">
            Showing {filteredDoctors.length} of {doctors.length}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDoctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
          <AddPractitionerCard />
        </div>

        {/* Empty State */}
        {filteredDoctors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0] bg-white py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
              <SearchIcon className="size-6 text-[#9CA3AF]" />
            </div>
            <p className="mt-3 text-[14px] font-medium text-[#1A1F1E]">No doctors found</p>
            <p className="mt-1 text-[12px] text-[#6B7870]">Adjust your search or filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  )
}
