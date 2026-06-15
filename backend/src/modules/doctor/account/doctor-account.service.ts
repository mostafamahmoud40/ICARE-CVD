import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, gte, lt, ne } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { appointment, doctor, user } from '../../../database/schema';
import { DoctorVerifierService } from '../../../shared/doctor/doctor-verifier.service';
import { UpdateDoctorAccountDto } from './dto/update-doctor-account.dto';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const;

@Injectable()
export class DoctorAccountService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async getAccount(userId: number) {
    const doctorRow = await this.doctorVerifier.verify(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    const profile = this.mapProfile(doctorRow, userRow);
    const practiceStats = await this.getPracticeStats(doctorRow.id);
    const weeklySnapshot = await this.getWeeklySnapshot(doctorRow.id);

    return { profile, practiceStats, weeklySnapshot };
  }

  async updateAccount(userId: number, dto: UpdateDoctorAccountDto) {
    const doctorRow = await this.doctorVerifier.verify(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    if (userRow.email !== normalizedEmail) {
      const emailTaken = await this.db.query.user.findFirst({
        where: eq(user.email, normalizedEmail),
      });
      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }
    }

    const avatarUrl = dto.avatarUrl?.trim() ? dto.avatarUrl.trim() : null;

    await this.db
      .update(user)
      .set({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phone.trim(),
        avatarUrl,
      })
      .where(eq(user.id, userId));

    await this.db
      .update(doctor)
      .set({
        specialty: dto.specialty.trim(),
        title: dto.title.trim(),
        experienceYears: dto.experienceYears,
        about: dto.about.trim() || null,
        clinicName: dto.clinicName.trim(),
        clinicLocation: dto.clinicLocation.trim(),
        clinicConsultationFee: dto.clinicConsultationFee,
        onlineConsultationFee: dto.onlineConsultationFee,
      })
      .where(eq(doctor.id, doctorRow.id));

    return this.getAccount(userId);
  }

  private mapProfile(
    doctorRow: typeof doctor.$inferSelect,
    userRow: typeof user.$inferSelect,
  ) {
    const specialty = doctorRow.specialty?.trim() || 'General practice';
    const title = doctorRow.title?.trim() || specialty;

    return {
      id: doctorRow.id,
      fullName: userRow.name,
      email: userRow.email,
      phone: userRow.phone ?? '',
      avatarUrl: userRow.avatarUrl,
      specialty,
      title,
      experienceYears: doctorRow.experienceYears ?? 0,
      clinicName: doctorRow.clinicName?.trim() || '',
      clinicLocation: doctorRow.clinicLocation?.trim() || '',
      licenseNumber: doctorRow.licenseNumber?.trim() || '',
      joinedAt: doctorRow.createdAt.toISOString(),
      acceptedVisitModes: this.normalizeAcceptedVisitModes(
        doctorRow.acceptedVisitModes,
      ),
      languages: Array.isArray(doctorRow.languages)
        ? doctorRow.languages.filter((item) => typeof item === 'string')
        : [],
      about: doctorRow.about?.trim() || '',
      clinicConsultationFee: doctorRow.clinicConsultationFee ?? 0,
      onlineConsultationFee: doctorRow.onlineConsultationFee ?? 0,
    };
  }

  private async getPracticeStats(doctorId: string) {
    const todayStart = this.startOfDay(new Date());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = this.startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [patientsTodayRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          gte(appointment.scheduledAt, todayStart),
          lt(appointment.scheduledAt, todayEnd),
          ne(appointment.status, 'cancelled'),
        ),
      );

    const [appointmentsThisWeekRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          gte(appointment.scheduledAt, weekStart),
          lt(appointment.scheduledAt, weekEnd),
          ne(appointment.status, 'cancelled'),
        ),
      );

    const [completedConsultationsRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          eq(appointment.status, 'completed'),
        ),
      );

    return {
      patientsToday: patientsTodayRow.count,
      appointmentsThisWeek: appointmentsThisWeekRow.count,
      completedConsultations: completedConsultationsRow.count,
    };
  }

  private async getWeeklySnapshot(doctorId: string) {
    const weekStart = this.startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const rows = await this.db
      .select({
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          gte(appointment.scheduledAt, weekStart),
          lt(appointment.scheduledAt, weekEnd),
        ),
      );

    const buckets = WEEKDAY_LABELS.map((day) => ({
      day,
      appointments: 0,
      completed: 0,
      cancellations: 0,
    }));

    for (const row of rows) {
      const dayIndex = row.scheduledAt.getDay();
      if (dayIndex < 0 || dayIndex > 4) continue;

      const bucket = buckets[dayIndex];
      if (!bucket) continue;

      if (row.status === 'cancelled') {
        bucket.cancellations += 1;
        continue;
      }

      bucket.appointments += 1;
      if (row.status === 'completed') {
        bucket.completed += 1;
      }
    }

    return buckets;
  }

  private normalizeAcceptedVisitModes(
    value: string | null | undefined,
  ): 'clinic' | 'virtual' | 'both' {
    if (value === 'clinic' || value === 'virtual') return value;
    return 'both';
  }

  private startOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private startOfWeek(date: Date) {
    const next = this.startOfDay(date);
    next.setDate(next.getDate() - next.getDay());
    return next;
  }
}
