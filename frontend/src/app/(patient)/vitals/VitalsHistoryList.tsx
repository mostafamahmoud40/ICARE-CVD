"use client"

import {
  ActivityIcon,
  HeartIcon,
  HeartPulseIcon,
  WeightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { VitalHistoryRecord } from "./vitals.mock"

/**
 * VitalsHistoryList Component
 * 
 * SOLID Principles:
 * - SRP: Only renders the vitals history table
 * - OCP: Accepts className for extension without modifying component
 * - ISP: Only requires data prop, no unnecessary dependencies
 * - DIP: Depends on VitalHistoryRecord abstraction, not concrete mock data
 */
export interface VitalsHistoryListProps {
  data: VitalHistoryRecord[]
  className?: string
}

export function VitalsHistoryList({ data, className }: VitalsHistoryListProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-4 sm:px-6">
        <h3 className="font-heading text-base font-medium">Measurement History</h3>
        <p className="text-sm text-muted-foreground">
          Previous vitals readings for the selected time period
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Blood Pressure
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Heart Rate
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                SpO₂
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Weight
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                AI Note
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground sm:px-6">
                  No measurements found for the selected period
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={record.date}
                  className={`border-b last:border-b-0 ${
                    index % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {record.systolic && record.diastolic ? (
                      <span className="inline-flex items-center gap-1">
                        <HeartPulseIcon className="size-3.5 text-[#1a5345]" />
                        {record.systolic}/{record.diastolic}
                        <span className="text-xs text-muted-foreground">mmHg</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.heartRate ? (
                      <span className="inline-flex items-center gap-1">
                        <HeartIcon className="size-3.5 text-[#c45d4b]" />
                        {record.heartRate}
                        <span className="text-xs text-muted-foreground">bpm</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.spo2 ? (
                      <span className="inline-flex items-center gap-1">
                        <ActivityIcon className="size-3.5 text-[#2d8a9e]" />
                        {record.spo2}
                        <span className="text-xs text-muted-foreground">%</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.weight ? (
                      <span className="inline-flex items-center gap-1">
                        <WeightIcon className="size-3.5 text-[#8E7043]" />
                        {record.weight}
                        <span className="text-xs text-muted-foreground">kg</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.aiNote ? (
                      <span
                        className={cn(
                          "text-[13px] font-medium",
                          record.aiNoteType === "normal" && "text-[#1a5345] dark:text-emerald-400",
                          record.aiNoteType === "alert" && "rounded-full border border-[#D9C4A9] bg-[#F7F1E6] px-2 py-0.5 text-[11px] font-semibold text-[#8E7043] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
                          record.aiNoteType === "monitoring" && "text-[#6B7870] dark:text-muted-foreground",
                          record.aiNoteType === "info" && "text-[#6B7870] dark:text-muted-foreground"
                        )}
                      >
                        {record.aiNote}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
