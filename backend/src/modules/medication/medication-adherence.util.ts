type DoseTimeSlot = {
  label: string;
  hour24: number;
};

type DoseLogEntry = {
  takenAt: Date | string;
  skipped: boolean;
};

type DoseSlotStatus = 'taken' | 'missed' | 'skipped' | 'pending';

const TIME_OF_DAY_SLOTS: Record<string, DoseTimeSlot> = {
  morning: { label: 'Morning', hour24: 8 },
  afternoon: { label: 'Afternoon', hour24: 14 },
  evening: { label: 'Evening', hour24: 20 },
};

function normalizeFrequency(frequency: string): string {
  return frequency
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function hourlySlots(intervalHours: number, startHour = 6): DoseTimeSlot[] {
  const count = Math.floor(24 / intervalHours);
  return Array.from({ length: count }, (_, index) => ({
    label: `Dose ${index + 1}`,
    hour24: (startHour + index * intervalHours) % 24,
  }));
}

export function buildDoseSchedule(input: {
  frequency: string;
  timeOfDay?: string[];
}): DoseTimeSlot[] {
  const freq = normalizeFrequency(input.frequency);
  const times = (input.timeOfDay ?? [])
    .map((slot) => TIME_OF_DAY_SLOTS[slot])
    .filter(Boolean);

  if (freq.includes('prn') || freq.includes('as_needed')) {
    return [];
  }

  if (freq.includes('weekly') || freq.includes('monthly')) {
    const primary = times[0] ?? TIME_OF_DAY_SLOTS.morning;
    return [{ ...primary }];
  }

  if (freq.includes('every_3') || freq.includes('q3h')) return hourlySlots(3);
  if (freq.includes('every_4') || freq.includes('q4h')) return hourlySlots(4);
  if (freq.includes('every_6') || freq.includes('q6h')) return hourlySlots(6);

  if (
    freq.includes('every_8') ||
    freq.includes('q8h') ||
    freq.includes('three_times')
  ) {
    if (times.length >= 3) return times.slice(0, 3);
    return [
      { label: 'Morning', hour24: 6 },
      { label: 'Afternoon', hour24: 14 },
      { label: 'Night', hour24: 22 },
    ];
  }

  if (
    freq.includes('every_12') ||
    freq.includes('q12h') ||
    freq.includes('twice')
  ) {
    if (times.length >= 2) return times.slice(0, 2);
    return [
      { label: 'Morning', hour24: 8 },
      { label: 'Evening', hour24: 20 },
    ];
  }

  if (freq.includes('four_times') || freq.includes('qid')) {
    return [
      { label: 'Morning', hour24: 8 },
      { label: 'Noon', hour24: 12 },
      { label: 'Afternoon', hour24: 16 },
      { label: 'Evening', hour24: 20 },
    ];
  }

  if (freq.includes('once') || freq.includes('qd') || freq.includes('daily')) {
    const primary = times[0] ?? TIME_OF_DAY_SLOTS.morning;
    return [{ ...primary }];
  }

  if (times.length > 0) return times;

  const upper = input.frequency.trim().toUpperCase();
  if (upper.includes('BID')) {
    return buildDoseSchedule({
      frequency: 'twice_daily',
      timeOfDay: input.timeOfDay,
    });
  }
  if (upper.includes('TID') || upper.includes('Q8H')) {
    return buildDoseSchedule({
      frequency: 'every_8_hours',
      timeOfDay: input.timeOfDay,
    });
  }
  if (upper.includes('QID')) {
    return buildDoseSchedule({
      frequency: 'four_times_daily',
      timeOfDay: input.timeOfDay,
    });
  }
  if (upper.includes('QD')) {
    return buildDoseSchedule({
      frequency: 'once_daily',
      timeOfDay: input.timeOfDay,
    });
  }
  if (upper.includes('HS')) {
    return [{ label: 'Bedtime', hour24: 22 }];
  }

  return buildDoseSchedule({
    frequency: 'twice_daily',
    timeOfDay: input.timeOfDay,
  });
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
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
  if (freq.includes('weekly')) {
    if (!startDate) return day.getDay() === 1;
    const diffDays = Math.floor(
      (day.getTime() - startDate.getTime()) / 86_400_000,
    );
    return diffDays >= 0 && diffDays % 7 === 0;
  }
  if (freq.includes('monthly')) {
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
  const takenAt =
    log.takenAt instanceof Date ? log.takenAt : new Date(log.takenAt);
  if (dateKeyFromDate(takenAt) !== dayKey) return false;
  const diffHours = Math.abs(takenAt.getHours() - slot.hour24);
  return diffHours <= 3 || diffHours >= 21;
}

function resolveSlotStatus(
  logs: DoseLogEntry[],
  dayKey: string,
  slot: DoseTimeSlot,
  isToday: boolean,
): DoseSlotStatus {
  const matching = logs.filter((log) => matchLogToSlot(log, dayKey, slot));
  const taken = matching.find((log) => !log.skipped);
  if (taken) return 'taken';
  const skipped = matching.find((log) => log.skipped);
  if (skipped) return 'skipped';
  if (isToday && new Date().getHours() < slot.hour24) return 'pending';
  return 'missed';
}

export function compute7DayAdherence(input: {
  frequency: string;
  timeOfDay?: string[];
  startDate?: string | null;
  doseLogs: DoseLogEntry[];
}): {
  adherencePct7d: number;
  adherenceHistory7d: boolean[];
  missedLast7d: number;
} {
  const schedule = buildDoseSchedule({
    frequency: input.frequency,
    timeOfDay: input.timeOfDay,
  });
  const freq = normalizeFrequency(input.frequency);
  const isPrn = freq.includes('prn') || freq.includes('as_needed');
  const startDate = parseDateKey(input.startDate ?? null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adherenceHistory7d: boolean[] = [];
  let takenDue = 0;
  let totalDue = 0;
  let missedLast7d = 0;

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    const dayKey = dateKeyFromDate(day);
    const isToday = index === 6;

    if (startDate && day < startDate) {
      adherenceHistory7d.push(true);
      continue;
    }

    if (isPrn) {
      const dayLogs = input.doseLogs.filter((log) => {
        const takenAt =
          log.takenAt instanceof Date ? log.takenAt : new Date(log.takenAt);
        return dateKeyFromDate(takenAt) === dayKey;
      });
      const hadTaken = dayLogs.some((log) => !log.skipped);
      adherenceHistory7d.push(hadTaken);
      continue;
    }

    if (!isDueOnDay(input.frequency, day, startDate)) {
      adherenceHistory7d.push(true);
      continue;
    }

    if (schedule.length === 0) {
      adherenceHistory7d.push(true);
      continue;
    }

    const dayStatuses = schedule.map((slot) =>
      resolveSlotStatus(input.doseLogs, dayKey, slot, isToday),
    );

    const fullDay = dayStatuses.every((status) => status === 'taken');
    adherenceHistory7d.push(fullDay);

    for (const status of dayStatuses) {
      if (status === 'taken') {
        takenDue += 1;
        totalDue += 1;
      } else if (status === 'missed' || status === 'skipped') {
        totalDue += 1;
        missedLast7d += 1;
      }
    }
  }

  const applicableDays = adherenceHistory7d.filter((_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    if (startDate && day < startDate) return false;
    if (isPrn) return true;
    if (!isDueOnDay(input.frequency, day, startDate)) return false;
    return schedule.length > 0;
  }).length;

  const fullDays = adherenceHistory7d.filter(Boolean).length;
  const adherencePct7d =
    totalDue > 0
      ? Math.round((takenDue / totalDue) * 100)
      : applicableDays > 0
        ? Math.round((fullDays / applicableDays) * 100)
        : 100;

  return { adherencePct7d, adherenceHistory7d, missedLast7d };
}
