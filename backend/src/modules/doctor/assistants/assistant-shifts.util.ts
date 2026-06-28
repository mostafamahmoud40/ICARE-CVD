import type { AssistantWeeklyShiftDayRow } from '../../../database/schema/doctorAssistant.schema';

export const ASSISTANT_SHIFT_WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type AssistantShiftWeekday =
  (typeof ASSISTANT_SHIFT_WEEKDAYS)[number];

export function defaultAssistantWeeklyShifts(): AssistantWeeklyShiftDayRow[] {
  return ASSISTANT_SHIFT_WEEKDAYS.map((weekday) => ({
    weekday,
    status: 'holiday',
    startTime: null,
    endTime: null,
    note: null,
  }));
}

function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function normalizeAssistantWeeklyShifts(
  days: AssistantWeeklyShiftDayRow[],
): AssistantWeeklyShiftDayRow[] {
  const byWeekday = new Map(days.map((day) => [day.weekday, day]));
  return ASSISTANT_SHIFT_WEEKDAYS.map((weekday) => {
    const row = byWeekday.get(weekday);
    if (!row) {
      return {
        weekday,
        status: 'holiday' as const,
        startTime: null,
        endTime: null,
        note: null,
      };
    }

    if (row.status === 'holiday') {
      return {
        weekday,
        status: 'holiday' as const,
        startTime: null,
        endTime: null,
        note: row.note?.trim() || null,
      };
    }

    const startTime = row.startTime?.trim() || null;
    const endTime = row.endTime?.trim() || null;
    if (!startTime || !endTime) {
      throw new Error(`Shift times are required for ${weekday}`);
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new Error(`End time must be after start time for ${weekday}`);
    }

    return {
      weekday,
      status: row.status,
      startTime,
      endTime,
      note: row.note?.trim() || null,
    };
  });
}
