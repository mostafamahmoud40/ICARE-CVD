import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lt } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  blockedDates,
  doctor,
  doctorSchedule,
  scheduleDayExtra,
} from '../../database/schema';
import { mergePeriodsForDate } from '../doctor/schedule/schedule-periods.util';

/** Schedule slots and availability queries (SRP). */
@Injectable()
export class DoctorAvailabilityService {
  private readonly clinicTimeZone = 'Africa/Cairo';

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getDoctorAvailability(doctorId: string, from?: string, days = 14) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });
    if (!doctorRow) {
      throw new NotFoundException('Doctor not found');
    }

    const schedule = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    if (!schedule) {
      return {
        monthLabel: this.getMonthLabel(new Date()),
        days: [],
        timeSlotsByDate: {},
      };
    }

    const start = from ? this.parseDateOnly(from) : this.startOfDay(new Date());
    const safeDays = Math.min(Math.max(days, 1), 31);
    const endExclusive = new Date(start);
    endExclusive.setDate(endExclusive.getDate() + safeDays);

    const blocked = await this.db.query.blockedDates.findMany({
      where: and(
        eq(blockedDates.doctorId, doctorId),
        gte(blockedDates.date, this.toDateOnly(start)),
        lt(blockedDates.date, this.toDateOnly(endExclusive)),
      ),
      orderBy: (bd) => [asc(bd.date)],
    });
    const blockedSet = new Set(blocked.map((b) => b.date));

    const extras = await this.db.query.scheduleDayExtra.findMany({
      where: and(
        eq(scheduleDayExtra.doctorId, doctorId),
        gte(scheduleDayExtra.date, this.toDateOnly(start)),
        lt(scheduleDayExtra.date, this.toDateOnly(endExclusive)),
      ),
      orderBy: (row, { asc: ascCol }) => [
        ascCol(row.date),
        ascCol(row.startTime),
      ],
    });
    const extrasByDate = new Map<
      string,
      Array<{ startTime: string; endTime: string }>
    >();
    for (const extra of extras) {
      const list = extrasByDate.get(extra.date) ?? [];
      list.push({ startTime: extra.startTime, endTime: extra.endTime });
      extrasByDate.set(extra.date, list);
    }

    const apptQueryStart = new Date(start);
    apptQueryStart.setDate(apptQueryStart.getDate() - 1);
    const apptQueryEnd = new Date(endExclusive);
    apptQueryEnd.setDate(apptQueryEnd.getDate() + 1);

    const appts = await this.db.query.appointment.findMany({
      where: and(
        eq(appointment.doctorId, doctorId),
        gte(appointment.scheduledAt, apptQueryStart),
        lt(appointment.scheduledAt, apptQueryEnd),
      ),
      orderBy: (a) => [asc(a.scheduledAt)],
    });

    const appointmentCountByDate = new Map<string, number>();
    const bookedTimesByDate = new Map<string, Set<string>>();
    for (const a of appts) {
      if (a.status === 'cancelled') continue;
      const key = this.toDateOnly(a.scheduledAt);
      if (
        key < this.toDateOnly(start) ||
        key >= this.toDateOnly(endExclusive)
      ) {
        continue;
      }
      appointmentCountByDate.set(
        key,
        (appointmentCountByDate.get(key) ?? 0) + 1,
      );
      const time = this.toHHMM(a.scheduledAt);
      const set = bookedTimesByDate.get(key) ?? new Set<string>();
      set.add(time);
      bookedTimesByDate.set(key, set);
    }

    const daysPayload: Array<{
      day: string;
      date: number;
      fullDate: string;
      disabled?: boolean;
      label?: string;
    }> = [];
    const timeSlotsByDate: Record<
      string,
      Array<{
        time: string;
        available: boolean;
        recommended?: boolean;
        label?: string;
      }>
    > = {};

    const clinicNow = this.getClinicNow();

    for (let i = 0; i < safeDays; i += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const fullDate = this.toDateOnly(current);
      const isPastDay = fullDate < clinicNow.today;
      const weekday = this.weekdayId(current);
      const dayConfig = schedule.days.find((d) => d.weekday === weekday);
      const blockedDay = blockedSet.has(fullDate);
      const maxPerDay = dayConfig?.maxAppointmentsPerDay ?? null;
      const appointmentCount = appointmentCountByDate.get(fullDate) ?? 0;
      const dateExtras = extrasByDate.get(fullDate) ?? [];
      const weeklyEnabled = !!dayConfig?.enabled;
      const hasExtras = dateExtras.length > 0;
      const enabled = (weeklyEnabled || hasExtras) && !blockedDay;
      const reachedLimit = maxPerDay !== null && appointmentCount >= maxPerDay;

      daysPayload.push({
        day: this.weekdayLabelShort(current),
        date: current.getDate(),
        fullDate,
        disabled: !enabled || reachedLimit || isPastDay,
      });

      if (!enabled || reachedLimit || isPastDay) {
        timeSlotsByDate[fullDate] = [];
        continue;
      }

      const weeklyPeriods = weeklyEnabled ? (dayConfig?.periods ?? []) : [];
      const periods = mergePeriodsForDate(weeklyPeriods, dateExtras);
      if (periods.length === 0) {
        timeSlotsByDate[fullDate] = [];
        continue;
      }

      const unavailable = dayConfig?.unavailableBlocks ?? [];
      const bookedSet = bookedTimesByDate.get(fullDate) ?? new Set<string>();
      const slots = this.generateSlots(
        periods,
        unavailable,
        schedule.slotDurationMinutes,
        schedule.bufferBetweenSlotsMinutes,
      )
        .filter((slotTime) => !this.isSlotInPast(fullDate, slotTime, clinicNow))
        .map((slotTime) => {
          const booked = bookedSet.has(slotTime);
          return {
            time: this.toAmPm(slotTime),
            available: !booked,
            label: booked ? 'Booked' : undefined,
          };
        });

      timeSlotsByDate[fullDate] = slots;
      const isFullyBooked =
        slots.length > 0 && slots.every((slot) => !slot.available);
      if (isFullyBooked) {
        const targetDay = daysPayload.find((d) => d.fullDate === fullDate);
        if (targetDay) {
          targetDay.label = 'Booked';
          targetDay.disabled = true;
        }
      }
    }

    return {
      monthLabel: this.getMonthLabel(start),
      days: daysPayload,
      timeSlotsByDate,
    };
  }

  async summarizeDoctorAvailability(doctorId: string): Promise<{
    nextAvailableSlot: string | null;
    availability: 'Available' | 'Limited' | 'Unavailable';
  }> {
    const data = await this.getDoctorAvailability(doctorId, undefined, 14);
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    let nextAvailableSlot: string | null = null;
    let availableIn7Days = 0;

    for (const day of data.days) {
      if (day.disabled) continue;
      const slots = data.timeSlotsByDate[day.fullDate] ?? [];
      const availableSlots = slots.filter((slot) => slot.available);
      const dayStart = this.parseDateOnly(day.fullDate).getTime();

      for (const slot of availableSlots) {
        const iso = this.combineDateAndAmPm(day.fullDate, slot.time);
        const slotTime = new Date(iso).getTime();
        if (
          slotTime >= now &&
          (!nextAvailableSlot ||
            slotTime < new Date(nextAvailableSlot).getTime())
        ) {
          nextAvailableSlot = iso;
        }
        if (dayStart <= weekAhead && slotTime >= now) {
          availableIn7Days += 1;
        }
      }
    }

    if (!nextAvailableSlot) {
      return { nextAvailableSlot: null, availability: 'Unavailable' };
    }
    if (availableIn7Days <= 3) {
      return { nextAvailableSlot, availability: 'Limited' };
    }
    return { nextAvailableSlot, availability: 'Available' };
  }

  isScheduledAtInPast(scheduledAt: Date): boolean {
    const clinicNow = this.getClinicNow();
    return this.isSlotInPast(
      this.toDateOnly(scheduledAt),
      this.toHHMM(scheduledAt),
      clinicNow,
    );
  }

  private getClinicNow(): { today: string; minutes: number } {
    const now = new Date();
    return {
      today: this.toDateOnly(now),
      minutes: this.hhmmToMinutes(this.toHHMM(now)),
    };
  }

  private isSlotInPast(
    fullDate: string,
    slotHHMM: string,
    clinicNow: { today: string; minutes: number },
  ): boolean {
    if (fullDate < clinicNow.today) return true;
    if (fullDate > clinicNow.today) return false;
    return this.hhmmToMinutes(slotHHMM) <= clinicNow.minutes;
  }

  private generateSlots(
    periods: Array<{ startTime: string; endTime: string }>,
    unavailableBlocks: Array<{ startTime: string; endTime: string }>,
    slotDurationMinutes: number,
    bufferBetweenSlotsMinutes: number,
  ) {
    const slots: string[] = [];
    const step = slotDurationMinutes + bufferBetweenSlotsMinutes;
    for (const period of periods) {
      let cursor = this.hhmmToMinutes(period.startTime);
      const end = this.hhmmToMinutes(period.endTime);
      while (cursor + slotDurationMinutes <= end) {
        const slotEnd = cursor + slotDurationMinutes;
        const overlapsUnavailable = unavailableBlocks.some((b) => {
          const bStart = this.hhmmToMinutes(b.startTime);
          const bEnd = this.hhmmToMinutes(b.endTime);
          return cursor < bEnd && slotEnd > bStart;
        });
        if (!overlapsUnavailable) {
          slots.push(this.minutesToHHMM(cursor));
        }
        cursor += step;
      }
    }
    return slots;
  }

  private hhmmToMinutes(value: string) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToHHMM(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toAmPm(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  private toHHMM(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.clinicTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
  }

  private parseDateOnly(value: string) {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid from date');
    }
    return parsed;
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toDateOnly(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.clinicTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
  }

  private weekdayId(date: Date) {
    const map = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    return map[date.getDay()];
  }

  private weekdayLabelShort(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  private getMonthLabel(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private combineDateAndAmPm(dateOnly: string, ampm: string) {
    const [time, period] = ampm.split(' ');
    const [hhRaw, mmRaw] = time.split(':').map(Number);
    const hours24 =
      period === 'PM' ? (hhRaw % 12) + 12 : hhRaw === 12 ? 0 : hhRaw;
    const d = this.parseDateOnly(dateOnly);
    d.setHours(hours24, mmRaw, 0, 0);
    return d.toISOString();
  }
}
