"use client"

import { ActivityIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VitalHistoryRecord } from "./vitals.mock"

export interface VitalsHistoryListProps {
  data: VitalHistoryRecord[]
  className?: string
}

export function VitalsHistoryList({ data, className }: VitalsHistoryListProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse bg-white text-left">
          <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
            <tr className="font-serif text-[15px] font-bold text-[#1A1F1E]">
              <th className="py-4 pl-4 pr-4">Date</th>
              <th className="px-4 py-4">Blood pressure</th>
              <th className="px-4 py-4">Heart rate</th>
              <th className="px-4 py-4">SpO₂</th>
              <th className="px-4 py-4">Weight</th>
              <th className="px-4 py-4">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6E0]/40">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <ActivityIcon className="mb-4 size-12 stroke-[1.25]" aria-hidden />
                    <p className="text-[16px] font-bold text-[#1A1F1E]">No measurements found</p>
                    <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                      No vitals readings for the selected time period.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr
                  key={record.date}
                  className="border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50"
                >
                  <td className="py-4 pl-4 pr-4">
                    <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {record.systolic && record.diastolic ? (
                      <span className="text-[14px] font-medium text-[#1A1F1E]/80">
                        {record.systolic}/{record.diastolic}
                        <span className="ml-1 text-[12px] text-muted-foreground">mmHg</span>
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {record.heartRate ? (
                      <span className="text-[14px] font-medium text-[#1A1F1E]/80">
                        {record.heartRate}
                        <span className="ml-1 text-[12px] text-muted-foreground">bpm</span>
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {record.spo2 ? (
                      <span className="text-[14px] font-medium text-[#1A1F1E]/80">
                        {record.spo2}
                        <span className="ml-1 text-[12px] text-muted-foreground">%</span>
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {record.weight ? (
                      <span className="text-[14px] font-medium text-[#1A1F1E]/80">
                        {record.weight}
                        <span className="ml-1 text-[12px] text-muted-foreground">kg</span>
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {record.aiNote ? (
                      <span className="text-[13px] font-medium text-[#6B7870]">{record.aiNote}</span>
                    ) : (
                      <span className="text-[14px] font-medium text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
