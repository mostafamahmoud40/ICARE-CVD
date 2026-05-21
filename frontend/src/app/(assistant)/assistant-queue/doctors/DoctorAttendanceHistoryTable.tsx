"use client"

import Image from "next/image"
import type { AttendanceLog, DoctorStatus } from "./doctors.types"
import { cn } from "@/lib/utils"

export function DoctorAttendanceHistoryTable({ logs, doctors }: { logs: AttendanceLog[], doctors: DoctorStatus[] }) {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-[#1A1F1E]">Recent Attendance Logs</h3>
        <p className="text-[12px] text-[#6B7870] mt-0.5">Check-in and check-out history for the past week.</p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#FAFAF8] border-b border-[#E8E6E0]/60">
              <tr>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Doctor</th>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Date</th>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Check-in</th>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Check-out</th>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Duration</th>
                <th className="px-4 py-2.5 font-semibold text-[#6B7870] text-[12px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E0]/40">
              {logs.map((log) => {
                const doc = doctors.find(d => d.id === log.doctorId)
                return (
                  <tr key={log.id} className="transition-colors hover:bg-[#F9F8F5]/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative size-7 overflow-hidden rounded-full border border-[#E8E6E0] bg-[#F5F5F3]">
                          <Image 
                            src={`https://i.pravatar.cc/150?u=${doc?.avatarSeed || doc?.id || "doc"}`} 
                            alt={doc?.name || "Doctor"} 
                            fill 
                            className="object-cover" 
                            sizes="28px" 
                            unoptimized
                          />
                        </div>
                        <span className="font-semibold text-[#1A1F1E]">{doc?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#1A1F1E]">{log.date}</td>
                    <td className="px-4 py-2.5 text-[#1A1F1E]">{log.checkIn}</td>
                    <td className="px-4 py-2.5 text-[#1A1F1E]">{log.checkOut || "-"}</td>
                    <td className="px-4 py-2.5 text-[#1A1F1E]">{log.duration || "-"}</td>
                    <td className="px-4 py-2.5">
                      {log.status === "active" ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="size-1.5 rounded-full bg-gray-400" />
                          <span className="text-[11px] font-medium">Completed</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

