import {
  ConflictException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, gte, lt, ne } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { appointment, doctor, user } from '../../../database/schema';
import { DoctorVerifierService } from '../../../shared/doctor/doctor-verifier.service';
import { AvatarUrlResolver } from '../../../shared/storage/avatar-url.resolver';
import { MinioService } from '../../../shared/storage/minio.service';
import { PATIENT_AVATAR_MIME_TYPES } from '../../../shared/storage/minio.constants';
import {
  buildStaffAvatarPrefix,
  isStaffAvatarStorageKey,
} from '../../../shared/storage/minio-staff-path';
import { UpdateDoctorAccountDto } from './dto/update-doctor-account.dto';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const;

@Injectable()
export class DoctorAccountService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly minioService: MinioService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async getAccount(userId: number) {
    const doctorRow = await this.doctorVerifier.verify(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.mapProfile(doctorRow, userRow);
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

    const userUpdate: {
      name?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string | null;
    } = {};

    if (dto.fullName !== undefined) {
      userUpdate.name = dto.fullName.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (userRow.email !== normalizedEmail) {
        const emailTaken = await this.db.query.user.findFirst({
          where: eq(user.email, normalizedEmail),
        });
        if (emailTaken) {
          throw new ConflictException('Email already exists');
        }
      }
      userUpdate.email = normalizedEmail;
    }

    if (dto.phone !== undefined) {
      userUpdate.phone = dto.phone.trim();
    }

    if (dto.avatarUrl !== undefined) {
      userUpdate.avatarUrl = this.normalizeAvatarStorageValue(dto.avatarUrl);
    }

    if (Object.keys(userUpdate).length > 0) {
      await this.db.update(user).set(userUpdate).where(eq(user.id, userId));
    }

    const doctorUpdate: {
      specialty?: string;
      title?: string;
      experienceYears?: number;
      about?: string | null;
      clinicName?: string;
      clinicLocation?: string;
      clinicConsultationFee?: number;
      onlineConsultationFee?: number;
    } = {};

    if (dto.specialty !== undefined) {
      doctorUpdate.specialty = dto.specialty.trim();
    }
    if (dto.title !== undefined) {
      doctorUpdate.title = dto.title.trim();
    }
    if (dto.experienceYears !== undefined) {
      doctorUpdate.experienceYears = dto.experienceYears;
    }
    if (dto.about !== undefined) {
      doctorUpdate.about = dto.about.trim() || null;
    }
    if (dto.clinicName !== undefined) {
      doctorUpdate.clinicName = dto.clinicName.trim();
    }
    if (dto.clinicLocation !== undefined) {
      doctorUpdate.clinicLocation = dto.clinicLocation.trim();
    }
    if (dto.clinicConsultationFee !== undefined) {
      doctorUpdate.clinicConsultationFee = dto.clinicConsultationFee;
    }
    if (dto.onlineConsultationFee !== undefined) {
      doctorUpdate.onlineConsultationFee = dto.onlineConsultationFee;
    }

    if (Object.keys(doctorUpdate).length > 0) {
      await this.db
        .update(doctor)
        .set(doctorUpdate)
        .where(eq(doctor.id, doctorRow.id));
    }

    return this.getAccount(userId);
  }

  async createAvatarUploadIntent(
    userId: number,
    fileName: string,
    contentType: string,
  ) {
    const doctorRow = await this.doctorVerifier.verify(userId);
    const mimeType = contentType.trim().toLowerCase();
    if (!PATIENT_AVATAR_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported profile photo file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'staff_avatar',
      staffId: doctorRow.id,
      staffRole: 'doctor',
    });
  }

  async setAvatar(userId: number, s3Key: string) {
    const doctorRow = await this.doctorVerifier.verify(userId);
    const key = s3Key.trim();
    const expectedPrefix = `${buildStaffAvatarPrefix('doctor', doctorRow.id)}/`;
    if (
      !key.startsWith(expectedPrefix) &&
      !isStaffAvatarStorageKey(key, doctorRow.id)
    ) {
      throw new BadRequestException('Invalid profile photo storage key');
    }

    await this.db
      .update(user)
      .set({ avatarUrl: key })
      .where(eq(user.id, userId));

    return { avatarUrl: await this.avatarUrlResolver.resolve(key) };
  }

  private normalizeAvatarStorageValue(
    avatarUrl: string | null | undefined,
  ): string | null {
    const trimmed = avatarUrl?.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('/avatars/')) {
      return trimmed;
    }

    const extractedKey =
      this.avatarUrlResolver.extractPatientAvatarKey(trimmed);
    if (extractedKey) {
      return extractedKey.split('?')[0] ?? extractedKey;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      throw new BadRequestException('Invalid profile photo reference');
    }

    throw new BadRequestException('Invalid profile photo reference');
  }

  private async mapProfile(
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
      avatarUrl: await this.avatarUrlResolver.resolve(userRow.avatarUrl),
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
