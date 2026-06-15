"use client"

import { useMemo } from "react"

import type { VitalHistoryRecord } from "./vitals.types"

export type TimeRange = "1W" | "1M" | "3M"

/**
 * Hook to filter vitals data by time range
 * Follows SRP: Single Responsibility - only handles filtering logic
 * Follows DIP: Depends on abstraction (VitalHistoryRecord type) not concrete implementation
 */
export function useVitalsFilter(
  data: VitalHistoryRecord[],
  range: TimeRange,
  referenceDate: Date = new Date("2026-04-15")
): VitalHistoryRecord[] {
  return useMemo(() => {
    const days = range === "1W" ? 7 : range === "1M" ? 30 : 90
    const cutoff = new Date(referenceDate)
    cutoff.setDate(cutoff.getDate() - days)

    return data.filter((record) => new Date(record.date) >= cutoff)
  }, [data, range, referenceDate])
}
