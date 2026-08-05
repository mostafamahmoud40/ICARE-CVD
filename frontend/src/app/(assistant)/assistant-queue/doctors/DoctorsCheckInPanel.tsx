"use client"

import { useState } from "react"
import { PauseCircleIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { ActivityLog, AttendanceLog, DoctorStatus } from "./doctors.types"
import { getDoctorQueueState, parseTimeValueToDate } from "./doctors.helpers"
import { ActivityLogPanel } from "./ActivityLogPanel"
import { DoctorAttendanceCard } from "./DoctorAttendanceCard"
import { DoctorAttendanceHistoryTable } from "./DoctorAttendanceHistoryTable"
import { DoctorStatsSummary } from "./DoctorStatsSummary"


export function DoctorsCheckInPanel() {
  const [doctors, setDoctors] = useState<DoctorStatus[]>([
    { id: "1", name: "Dr. Ahmed Hassan", department: "Cardiology",       room: "102",  checkedInAt: null,                   queueStartAt: null,                   isPaused: false, pausedAt: null, avatarSeed: "ahmed_hassan", queueCount: 5 },
    { id: "2", name: "Dr. Sarah Khairy", department: "Internal Medicine", room: "105",  checkedInAt: null,                   queueStartAt: null,                   isPaused: false, pausedAt: null, avatarSeed: "sarah_khairy", queueCount: 3 },
    { id: "3", name: "Dr. Mohamed Ali",  department: "Emergency",         room: "ER-1", checkedInAt: "2026-05-07T08:30:00Z", queueStartAt: "2026-05-07T08:30:00Z", isPaused: false, pausedAt: null, avatarSeed: "mohamed_ali", queueCount: 12 },
    { id: "4", name: "Dr. Youssef Omar", department: "Neurology",         room: "201",  checkedInAt: "2026-05-07T09:00:00Z", queueStartAt: "2026-05-07T09:15:00Z", isPaused: true,  pausedAt: "2026-05-07T10:00:00Z", avatarSeed: "youssef_omar", queueCount: 2 },
    { id: "5", name: "Dr. Layla Mostafa", department: "Cardiology",      room: "103",  checkedInAt: "2026-05-07T07:00:00Z", queueStartAt: "2026-05-07T07:30:00Z", isPaused: false, pausedAt: null, avatarSeed: "layla_mostafa", queueCount: 8 },
    { id: "6", name: "Dr. Omar Hany",    department: "Emergency",         room: "ER-2", checkedInAt: null,                   queueStartAt: null,                   isPaused: false, pausedAt: null, avatarSeed: "omar_hany", queueCount: 0 },
  ])

  // Filters and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: "a1", doctorId: "3", action: "check-in", timestamp: "2026-05-07T08:30:00Z", details: "Emergency" },
    { id: "a2", doctorId: "4", action: "pause", timestamp: "2026-05-07T10:00:00Z" },
    { id: "a3", doctorId: "5", action: "check-in", timestamp: "2026-05-07T07:00:00Z", details: "Cardiology" },
  ])

  // Mock attendance history logs
  const [historyLogs] = useState<AttendanceLog[]>([
    { id: "log-1", doctorId: "3", date: "May 07, 2026", checkIn: "08:30 AM", checkOut: null, duration: null, status: "active" },
    { id: "log-2", doctorId: "4", date: "May 07, 2026", checkIn: "09:00 AM", checkOut: null, duration: null, status: "active" },
    { id: "log-3", doctorId: "1", date: "May 06, 2026", checkIn: "08:15 AM", checkOut: "04:30 PM", duration: "8h 15m", status: "completed" },
    { id: "log-4", doctorId: "2", date: "May 06, 2026", checkIn: "09:00 AM", checkOut: "05:00 PM", duration: "8h 00m", status: "completed" },
    { id: "log-5", doctorId: "3", date: "May 06, 2026", checkIn: "07:30 AM", checkOut: "03:45 PM", duration: "8h 15m", status: "completed" },
  ])

  // Derived unique departments
  const departments = Array.from(new Set(doctors.map(d => d.department)))

  // Filtered doctors
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.room.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = departmentFilter === "all" || doc.department === departmentFilter
    const state = getDoctorQueueState(doc)
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && state === "active") ||
                         (statusFilter === "paused" && state === "paused") ||
                         (statusFilter === "away" && state === "idle")
    return matchesSearch && matchesDept && matchesStatus
  })

  // Add activity log helper
  const addActivity = (doctorId: string, action: ActivityLog["action"], details?: string) => {
    setActivityLogs(prev => [{
      id: `a${Date.now()}`,
      doctorId,
      action,
      timestamp: new Date().toISOString(),
      details
    }, ...prev].slice(0, 20))
  }

  const handleCheckIn = (id: string) => {
    const doc = doctors.find(d => d.id === id)
    const isCheckingIn = !doc?.checkedInAt
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : {
      ...d,
      checkedInAt:  d.checkedInAt ? null : new Date().toISOString(),
      queueStartAt: d.checkedInAt ? null : d.queueStartAt,
      isPaused: false,
      pausedAt: null,
    }))
    addActivity(id, isCheckingIn ? "check-in" : "check-out", doc?.department)
  }

  const handleTogglePause = (id: string) => {
    const doc = doctors.find(d => d.id === id)
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : {
      ...d,
      isPaused: !d.isPaused,
      pausedAt: d.isPaused ? null : new Date().toISOString(),
    }))
    addActivity(id, doc?.isPaused ? "resume" : "pause")
  }

  const handleSetTime = (id: string, timeValue: string) => {
    if (!timeValue) {
      setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: null }))
      return
    }

    const date = parseTimeValueToDate(timeValue)
    if (!date) return

    setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: date.toISOString() }))
    addActivity(id, "set-time", timeValue)
  }

  const handleStartNow = (id: string) =>
    setDoctors((prev) => prev.map((d) => d.id !== id ? d : { ...d, queueStartAt: new Date().toISOString() }))

  const clearFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setStatusFilter("all")
  }

  const hasFilters = searchTerm || departmentFilter !== "all" || statusFilter !== "all"

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F9F8F5]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[18px] font-bold text-[#1A1F1E]">Doctors Attendance</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {doctors.length} doctors · {doctors.filter(d => d.checkedInAt).length} active
          </p>
        </div>
        <ActivityLogPanel logs={activityLogs} />
      </div>

      {/* Stats Summary */}
      <DoctorStatsSummary doctors={doctors} />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
          <Input
            type="text"
            placeholder="Search doctor, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-lg border-[#E8E6E0] bg-white text-[13px]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#102F27] focus:border-[#1A5345] focus:outline-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#102F27] focus:border-[#1A5345] focus:outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="away">Away</option>
        </select>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[#E8E6E0] bg-white text-[12px] font-medium text-[#6B7870] hover:text-[#1A5345] hover:border-[#1A5345]/30 transition-colors"
          >
            <RotateCcwIcon className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {hasFilters && (
        <div className="mb-4 text-[12px] text-muted-foreground">
          Showing {filteredDoctors.length} of {doctors.length} doctors
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => (
          <DoctorAttendanceCard
            key={doc.id}
            doc={doc}
            onCheckIn={handleCheckIn}
            onTogglePause={handleTogglePause}
            onSetTime={handleSetTime}
            onStartNow={handleStartNow}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredDoctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F5F3]">
            <SearchIcon className="size-6 text-[#9CA3AF]" />
          </div>
          <p className="mt-3 text-[13px] font-medium text-[#6B7870]">No doctors found</p>
          <p className="text-[12px] text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      )}

      <DoctorAttendanceHistoryTable logs={historyLogs} doctors={doctors} />
    </div>
  )
}
