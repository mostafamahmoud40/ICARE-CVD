import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { patient, user } from '../../../database/schema';
import { AvatarUrlResolver } from '../../../shared/storage/avatar-url.resolver';
import { MinioService } from '../../../shared/storage/minio.service';
import {
  MINIO_CATEGORY_PREFIX,
  PATIENT_AVATAR_MIME_TYPES,
} from '../../../shared/storage/minio.constants';
import { UpdatePatientAccountDto } from './dto/update-patient-account.dto';

@Injectable()
export class PatientAccountService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly minioService: MinioService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async getAccount(userId: number) {
    const patientRow = await this.findPatientByUserId(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    return { profile: this.mapProfile(patientRow, userRow) };
  }

  async updateAccount(userId: number, dto: UpdatePatientAccountDto) {
    const patientRow = await this.findPatientByUserId(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (userRow.email !== normalizedEmail) {
        const emailTaken = await this.db.query.user.findFirst({
          where: eq(user.email, normalizedEmail),
        });
        if (emailTaken) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    const userUpdate: Partial<typeof user.$inferInsert> = {};
    if (dto.fullName !== undefined) userUpdate.name = dto.fullName.trim();
    if (dto.email !== undefined) userUpdate.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) userUpdate.phone = dto.phone.trim() || null;
    if (dto.avatarUrl !== undefined) {
      userUpdate.avatarUrl = dto.avatarUrl.trim() || null;
    }

    if (Object.keys(userUpdate).length > 0) {
      await this.db.update(user).set(userUpdate).where(eq(user.id, userId));
    }

    const patientUpdate: Partial<typeof patient.$inferInsert> = {};
    if (dto.address !== undefined) {
      patientUpdate.address = dto.address.trim() || null;
    }
    if (dto.avatarUrl !== undefined) {
      patientUpdate.avatarUrl = dto.avatarUrl.trim() || null;
    }
    if (dto.maritalStatus !== undefined) {
      patientUpdate.maritalStatus = dto.maritalStatus || null;
    }
    if (dto.occupation !== undefined) {
      patientUpdate.occupation = dto.occupation.trim() || null;
    }

    if (Object.keys(patientUpdate).length > 0) {
      await this.db
        .update(patient)
        .set(patientUpdate)
        .where(eq(patient.id, patientRow.id));
    }

    return this.getAccount(userId);
  }

  async createAvatarUploadIntent(
    userId: number,
    fileName: string,
    contentType: string,
  ) {
    const patientRow = await this.findPatientByUserId(userId);
    const mimeType = contentType.trim().toLowerCase();
    if (!PATIENT_AVATAR_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported profile photo file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'patient_avatar',
      patientId: patientRow.id,
    });
  }

  async setAvatar(userId: number, s3Key: string) {
    const patientRow = await this.findPatientByUserId(userId);
    const key = s3Key.trim();
    const expectedPrefix = `${MINIO_CATEGORY_PREFIX.patient_avatar}/${patientRow.id}/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new BadRequestException('Invalid profile photo storage key');
    }

    await this.db
      .update(user)
      .set({ avatarUrl: key })
      .where(eq(user.id, userId));

    await this.db
      .update(patient)
      .set({ avatarUrl: key })
      .where(eq(patient.id, patientRow.id));

    return { avatarUrl: await this.avatarUrlResolver.resolve(key) };
  }

  private async findPatientByUserId(userId: number) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }
    return patientRow;
  }

  private mapProfile(
    patientRow: typeof patient.$inferSelect,
    userRow: typeof user.$inferSelect,
  ) {
    const avatarUrl = patientRow.avatarUrl ?? userRow.avatarUrl ?? null;
    const dateOfBirth = patientRow.dateOfBirth.toISOString().slice(0, 10);

    return {
      id: patientRow.id,
      fullName: userRow.name,
      email: userRow.email,
      phone: userRow.phone ?? '',
      avatarUrl,
      role: 'patient' as const,
      dateOfBirth,
      age: this.computeAge(patientRow.dateOfBirth),
      gender: patientRow.gender,
      bloodType: patientRow.bloodType,
      nationalId: patientRow.nationalId ?? '',
      address: patientRow.address ?? '',
      maritalStatus: patientRow.maritalStatus,
      occupation: patientRow.occupation ?? '',
      heightCm: patientRow.heightCm ?? null,
      weightKg: patientRow.weightKg ?? null,
      bmi: patientRow.bmi ?? null,
      smokingStatus: patientRow.smokingStatus,
      riskLevel: patientRow.riskLevel,
      memberSince: patientRow.createdAt.toISOString(),
    };
  }

  private computeAge(dob: Date) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  }
}
