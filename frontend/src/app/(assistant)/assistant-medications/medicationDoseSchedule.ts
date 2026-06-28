export type DoseTimeSlot = {
  time: string;
  label: string;
  /** Hour of day (0–23) used for matching dose logs. */
  hour24: number;
};

export type DoseSlotStatus = "taken" | "missed" | "skipped" | "pending";

export type TimelineDose = {
  time: string;
  label: string;
  status: DoseSlotStatus;
};

export type TimelineDay = {
  date: string;
  dateKey: string;
  doses: TimelineDose[];
  hasExpectedDoses: boolean;
};

export type AdherenceTimelineStats = {
  adheredDays: number;
  partialDays: number;
  missedDays: number;
  totalDays: number;
};

export type DoseLogEntry = {
  takenAt: string;
  skipped: boolean;
};

const TIME_OF_DAY_SLOTS: Record<string, { time: string; label: string; hour24: number }> = {
  morning: { time: "08:00 AM", label: "Morning", hour24: 8 },
  afternoon: { time: "02:00 PM", label: "Afternoon", hour24: 14 },
  evening: { time: "08:00 PM", label: "Evening", hour24: 20 },
};

function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:00 ${period}`;
}

function normalizeFrequency(frequency: string): string {
  return frequency.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function hourlySlots(intervalHours: number, startHour = 6): DoseTimeSlot[] {
  const count = Math.floor(24 / intervalHours);
  return Array.from({ length: count }, (_, index) => {
    const hour24 = (startHour + index * intervalHours) % 24;
    return {
      time: formatHour(hour24),
      label: `Dose ${index + 1}`,
      hour24,
    };
  });
}

/** Build expected dose clock times from frequency + optional time-of-day presets. */
export function buildDoseSchedule(input: {
  frequency: string;
  timeOfDay?: string[];
}): DoseTimeSlot[] {
  const freq = normalizeFrequency(input.frequency);
  const times = (input.timeOfDay ?? [])
    .map((slot) => TIME_OF_DAY_SLOTS[slot])
    .filter(Boolean);

  if (freq.includes("prn") || freq.includes("as_needed")) {
    return [];
  }

  if (freq.includes("weekly") || freq.includes("monthly")) {
    const primary = times[0] ?? TIME_OF_DAY_SLOTS.morning;
    return [{ ...primary, hour24: primary.hour24 }];
  }

  if (freq.includes("every_3") || freq.includes("q3h")) {
    return hourlySlots(3);
  }
  if (freq.includes("every_4") || freq.includes("q4h")) {
    return hourlySlots(4);
  }
  if (freq.includes("every_6") || freq.includes("q6h")) {
    return hourlySlots(6);
  }
  if (freq.includes("every_8") || freq.includes("q8h") || freq.includes("three_times")) {
    if (times.length >= 3) {
      return times.slice(0, 3).map((slot) => ({ ...slot }));
    }
    return [
      { time: "06:00 AM", label: "Morning", hour24: 6 },
      { time: "02:00 PM", label: "Afternoon", hour24: 14 },
      { time: "10:00 PM", label: "Night", hour24: 22 },
    ];
  }
  if (freq.includes("every_12") || freq.includes("q12h") || freq.includes("twice")) {
    if (times.length >= 2) {
      return times.slice(0, 2).map((slot) => ({ ...slot }));
    }
    return [
      { time: "08:00 AM", label: "Morning", hour24: 8 },
      { time: "08:00 PM", label: "Evening", hour24: 20 },
    ];
  }
  if (freq.includes("four_times") || freq.includes("qid")) {
    return [
      { time: "08:00 AM", label: "Morning", hour24: 8 },
      { time: "12:00 PM", label: "Noon", hour24: 12 },
      { time: "04:00 PM", label: "Afternoon", hour24: 16 },
      { time: "08:00 PM", label: "Evening", hour24: 20 },
    ];
  }
  if (freq.includes("once") || freq.includes("qd") || freq.includes("daily")) {
    const primary = times[0] ?? TIME_OF_DAY_SLOTS.morning;
    return [{ ...primary, hour24: primary.hour24 }];
  }

  if (times.length > 0) {
    return times.map((slot) => ({ ...slot }));
  }

  const upper = input.frequency.trim().toUpperCase();
  if (upper.includes("BID")) {
    return buildDoseSchedule({ frequency: "twice_daily", timeOfDay: input.timeOfDay });
  }
  if (upper.includes("TID") || upper.includes("Q8H")) {
    return buildDoseSchedule({ frequency: "every_8_hours", timeOfDay: input.timeOfDay });
  }
  if (upper.includes("QID")) {
    return buildDoseSchedule({ frequency: "four_times_daily", timeOfDay: input.timeOfDay });
  }
  if (upper.includes("QD")) {
    return buildDoseSchedule({ frequency: "once_daily", timeOfDay: input.timeOfDay });
  }
  if (upper.includes("HS")) {
    return [{ time: "10:00 PM", label: "Bedtime", hour24: 22 }];
  }

  return buildDoseSchedule({ frequency: "twice_daily", timeOfDay: input.timeOfDay });
}

export function isHighFrequencySchedule(doseTimes: DoseTimeSlot[]) {
  return doseTimes.length > 4;
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDueOnDay(
  frequency: string,
  day: Date,
  startDate: Date | null,
): boolean {
  const freq = normalizeFrequency(frequency);
  if (freq.includes("weekly")) {
    if (!startDate) return day.getDay() === 1;
    const diffDays = Math.floor(
      (day.getTime() - startDate.getTime()) / 86_400_000,
    );
    return diffDays >= 0 && diffDays % 7 === 0;
  }
  if (freq.includes("monthly")) {
    if (!startDate) return day.getDate() === 1;
    return day.getDate() === startDate.getDate();
  }
  return true;
}

function matchLogToSlot(
  log: DoseLogEntry,
  dayKey: string,
  slot: DoseTimeSlot,
): boolean {
  const takenAt = new Date(log.takenAt);
  if (dateKeyFromDate(takenAt) !== dayKey) return false;
  const diffHours = Math.abs(takenAt.getHours() - slot.hour24);
  return diffHours <= 3 || diffHours >= 21;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLogTime(takenAt: string): string {
  return new Date(takenAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPrnTimelineDay(dayKey: string, logs: DoseLogEntry[]): TimelineDay {
  const dayLogs = logs.filter((log) => dateKeyFromDate(new Date(log.takenAt)) === dayKey);
  return {
    dateKey: dayKey,
    date: formatDisplayDate(new Date(`${dayKey}T12:00:00`)),
    hasExpectedDoses: dayLogs.length > 0,
    doses: dayLogs.map((log) => ({
      time: formatLogTime(log.takenAt),
      label: log.skipped ? "Skipped dose" : "Logged dose",
      status: log.skipped ? "skipped" : "taken",
    })),
  };
}

export function buildMedicationAdherenceTimeline(input: {
  frequency: string;
  timeOfDay?: string[];
  startDate?: string | null;
  doseLogs: DoseLogEntry[];
  days?: number;
}): { timeline: TimelineDay[]; stats: AdherenceTimelineStats } {
  const days = input.days ?? 30;
  const schedule = buildDoseSchedule({
    frequency: input.frequency,
    timeOfDay: input.timeOfDay,
  });
  const freq = normalizeFrequency(input.frequency);
  const isPrn = freq.includes("prn") || freq.includes("as_needed");
  const startDate = parseDateKey(input.startDate ?? null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeline: TimelineDay[] = [];
  let adheredDays = 0;
  let partialDays = 0;
  let missedDays = 0;
  let totalDays = 0;

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dayKey = dateKeyFromDate(day);

    if (startDate && day < startDate) {
      continue;
    }

    if (isPrn) {
      const prnDay = buildPrnTimelineDay(dayKey, input.doseLogs);
      if (prnDay.doses.length > 0) {
        timeline.push(prnDay);
        totalDays += 1;
        adheredDays += 1;
      }
      continue;
    }

    if (!isDueOnDay(input.frequency, day, startDate)) {
      continue;
    }

    const isToday = offset === 0;
    const dayDoses: TimelineDose[] = schedule.map((slot) => {
      const matching = input.doseLogs.filter((log) => matchLogToSlot(log, dayKey, slot));
      const taken = matching.find((log) => !log.skipped);
      if (taken) {
        return { time: slot.time, label: slot.label, status: "taken" };
      }
      const skipped = matching.find((log) => log.skipped);
      if (skipped) {
        return { time: slot.time, label: slot.label, status: "skipped" };
      }
      if (isToday && new Date().getHours() < slot.hour24) {
        return { time: slot.time, label: slot.label, status: "pending" };
      }
      return { time: slot.time, label: slot.label, status: "missed" };
    });

    timeline.push({
      dateKey: dayKey,
      date: formatDisplayDate(day),
      hasExpectedDoses: true,
      doses: dayDoses,
    });

    totalDays += 1;
    const takenCount = dayDoses.filter((dose) => dose.status === "taken").length;
    const missedCount = dayDoses.filter(
      (dose) => dose.status === "missed" || dose.status === "skipped",
    ).length;

    if (takenCount === dayDoses.length && dayDoses.length > 0) {
      adheredDays += 1;
    } else if (takenCount > 0 && missedCount > 0) {
      partialDays += 1;
    } else if (missedCount > 0) {
      missedDays += 1;
    }
  }

  return {
    timeline,
    stats: {
      adheredDays,
      partialDays,
      missedDays,
      totalDays,
    },
  };
}

/** @deprecated Use buildDoseSchedule instead. */
export function buildDoseTimesFromFrequency(frequencyLabel: string): DoseTimeSlot[] {
  return buildDoseSchedule({ frequency: frequencyLabel });
}
