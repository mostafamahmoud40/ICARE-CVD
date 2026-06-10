export type TimePeriod = { startTime: string; endTime: string };

export function timeToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/** Merge weekly periods with date-specific extras for slot generation only. */
export function mergePeriodsForDate(
  weeklyPeriods: TimePeriod[],
  extraPeriods: TimePeriod[],
): TimePeriod[] {
  if (extraPeriods.length === 0) return weeklyPeriods;
  return [...weeklyPeriods, ...extraPeriods];
}

export function validateTimePeriod(startTime: string, endTime: string): void {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start >= end) {
    throw new Error('endTime must be after startTime');
  }
}
