"use client"

import { MOCK_DOCTORS } from "./assistantDoctors.mock"
import { DoctorCard, AddPractitionerCard } from "./DoctorCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DoctorDirectoryContainer() {
  const doctors = MOCK_DOCTORS

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1A5345] tracking-tight">Doctor Directory</h1>
          <p className="text-[14px] text-[#6B7870] mt-2 font-medium max-w-xl">
            Manage and monitor clinical staff availability and patient loads across all cardiology departments.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#6B7870] uppercase tracking-wider">Department</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-white h-10 rounded-[10px] border-[#E8E6E0] font-medium text-[#1A1F1E] shadow-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E8E6E0]">
                <SelectItem value="all" className="rounded-lg">All Departments</SelectItem>
                <SelectItem value="cardiology" className="rounded-lg">Cardiology</SelectItem>
                <SelectItem value="surgery" className="rounded-lg">Surgery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#6B7870] uppercase tracking-wider">Availability</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] bg-white h-10 rounded-[10px] border-[#E8E6E0] font-medium text-[#1A1F1E] shadow-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E8E6E0]">
                <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                <SelectItem value="available" className="rounded-lg">Available</SelectItem>
                <SelectItem value="in-consultation" className="rounded-lg">In Consultation</SelectItem>
                <SelectItem value="away" className="rounded-lg">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {doctors.map((doc) => (
          <DoctorCard key={doc.id} doctor={doc} />
        ))}
        <AddPractitionerCard />
      </div>
    </div>
  )
}
