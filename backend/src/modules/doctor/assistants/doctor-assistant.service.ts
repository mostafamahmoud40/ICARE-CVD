import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  assistant,
  doctorAssistant,
  user,
} from '../../../database/schema';
import type { AssistantWeeklyShiftDayRow } from '../../../database/schema/doctorAssistant.schema';
import { hashPassword } from '../../auth/password';
import { DoctorVerifierService } from '../../../shared/doctor/doctor-verifier.service';
import { MailService } from '../../../shared/mail/mail.service';
import { AvatarUrlResolver } from '../../../shared/storage/avatar-url.resolver';
import { PATIENT_AVATAR_MIME_TYPES } from '../../../shared/storage/minio.constants';
import { MinioService } from '../../../shared/storage/minio.service';
import { buildStaffAvatarPrefix, isStaffAvatarStorageKey } from '../../../shared/storage/minio-staff-path';
import {
  defaultAssistantWeeklyShifts,
  normalizeAssistantWeeklyShifts,
} from './assistant-shifts.util';
import {
  CreateDoctorAssistantDto,
  UpdateDoctorAssistantDto,
} from './dto/doctor-assistant.dto';
import type { UpdateDoctorAssistantShiftsDto } from './dto/doctor-assistant-shifts.dto';

@Injectable()
export class DoctorAssistantService {
  private readonly logger = new Logger(DoctorAssistantService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly mailService: MailService,
    private readonly minioService: MinioService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async listAssistants(doctorUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const rows = await this.db
      .select({
        id: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        department: assistant.department,
        experienceYears: assistant.experienceYears,
        linkedAt: doctorAssistant.linkedAt,
        createdAt: assistant.createdAt,
      })
      .from(doctorAssistant)
      .innerJoin(assistant, eq(doctorAssistant.assistantId, assistant.id))
      .innerJoin(user, eq(assistant.userId, user.id))
      .where(eq(doctorAssistant.doctorId, doctorRow.id))
      .orderBy(desc(doctorAssistant.linkedAt));

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        avatarUrl: await this.avatarUrlResolver.resolve(row.avatarUrl),
        isActive: row.isActive,
        department: row.department,
        experienceYears: row.experienceYears,
        linkedAt: row.linkedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
    );
  }

  async createAssistant(doctorUserId: number, dto: CreateDoctorAssistantDto) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const tempPassword = randomBytes(24).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);
    const avatarUrl = this.normalizeAvatarStorageValue(dto.avatarUrl);

    const insertedUsers = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phoneNumber.trim(),
        avatarUrl,
        password: passwordHash,
        role: 'assistant',
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      });

    const createdUser = insertedUsers[0];
    if (!createdUser) {
      throw new ConflictException('Failed to create assistant account');
    }

    const insertedAssistants = await this.db
      .insert(assistant)
      .values({
        userId: createdUser.id,
        department: dto.department?.trim() || null,
        experienceYears: dto.experienceYears ?? 0,
      })
      .returning({
        id: assistant.id,
        createdAt: assistant.createdAt,
      });

    const createdAssistant = insertedAssistants[0];
    if (!createdAssistant) {
      throw new ConflictException('Failed to create assistant profile');
    }

    const linkedAt = new Date();
    await this.db.insert(doctorAssistant).values({
      doctorId: doctorRow.id,
      assistantId: createdAssistant.id,
      linkedAt,
    });

    let credentialsEmailSent = false;
    let credentialsEmailError: string | null = null;
    try {
      await this.mailService.sendAssistantAccountCreatedEmail(
        createdUser.email,
        createdUser.name,
        normalizedEmail,
        tempPassword,
      );
      credentialsEmailSent = true;
      this.logger.log(
        `Login credentials email sent to assistant ${createdUser.id} (${createdUser.email})`,
      );
    } catch (err) {
      credentialsEmailError =
        err instanceof Error
          ? err.message
          : 'Failed to send login credentials email';
      this.logger.error(
        `Assistant ${createdUser.id} created but credentials email failed: ${credentialsEmailError}`,
        err,
      );
    }

    return {
      id: createdUser.id,
      fullName: createdUser.name,
      email: createdUser.email,
      phone: createdUser.phone,
      avatarUrl: createdUser.avatarUrl,
      isActive: createdUser.isActive,
      department: dto.department?.trim() || null,
      experienceYears: dto.experienceYears ?? 0,
      linkedAt: linkedAt.toISOString(),
      createdAt: createdAssistant.createdAt.toISOString(),
      credentialsEmailSent,
      credentialsEmailError,
    };
  }

  async updateAssistant(
    doctorUserId: number,
    assistantUserId: number,
    dto: UpdateDoctorAssistantDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { assistantRow } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingUser = await this.db.query.user.findFirst({
      where: eq(user.id, assistantUserId),
    });
    if (!existingUser) {
      throw new NotFoundException('Assistant not found');
    }

    if (existingUser.email !== normalizedEmail) {
      const emailTaken = await this.db.query.user.findFirst({
        where: eq(user.email, normalizedEmail),
      });
      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }
    }

    const userUpdate: {
      name: string;
      email: string;
      phone: string;
      avatarUrl?: string;
    } = {
      name: dto.fullName.trim(),
      email: normalizedEmail,
      phone: dto.phoneNumber.trim(),
    };

    if (dto.avatarUrl !== undefined) {
      userUpdate.avatarUrl =
        this.normalizeAvatarStorageValue(dto.avatarUrl) ?? undefined;
    }

    const updatedUsers = await this.db
      .update(user)
      .set(userUpdate)
      .where(eq(user.id, assistantUserId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      });

    const updatedUser = updatedUsers[0];
    if (!updatedUser) {
      throw new NotFoundException('Assistant not found');
    }

    await this.db
      .update(assistant)
      .set({
        department: dto.department?.trim() || null,
        experienceYears: dto.experienceYears ?? assistantRow.experienceYears,
      })
      .where(eq(assistant.id, assistantRow.id));

    const link = await this.db.query.doctorAssistant.findFirst({
      where: and(
        eq(doctorAssistant.doctorId, doctorRow.id),
        eq(doctorAssistant.assistantId, assistantRow.id),
      ),
    });

    return {
      id: updatedUser.id,
      fullName: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      isActive: updatedUser.isActive,
      department: dto.department?.trim() || null,
      experienceYears: dto.experienceYears ?? assistantRow.experienceYears,
      linkedAt: link?.linkedAt.toISOString() ?? new Date().toISOString(),
      createdAt: assistantRow.createdAt.toISOString(),
    };
  }

  async removeAssistant(doctorUserId: number, assistantUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { assistantRow, link } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );

    await this.db
      .delete(doctorAssistant)
      .where(eq(doctorAssistant.id, link.id));

    return {
      message: 'Assistant removed from your team',
      id: assistantUserId,
      assistantId: assistantRow.id,
    };
  }

  private async verifyDoctorAssistantLink(
    doctorId: string,
    assistantUserId: number,
  ) {
    const assistantRow = await this.db.query.assistant.findFirst({
      where: eq(assistant.userId, assistantUserId),
    });
    if (!assistantRow) {
      throw new NotFoundException('Assistant not found');
    }

    const link = await this.db.query.doctorAssistant.findFirst({
      where: and(
        eq(doctorAssistant.doctorId, doctorId),
        eq(doctorAssistant.assistantId, assistantRow.id),
      ),
    });
    if (!link) {
      throw new ForbiddenException('Assistant is not on your team');
    }

    return { assistantRow, link };
  }

  async updateAssistantStatus(
    doctorUserId: number,
    assistantUserId: number,
    isActive: boolean,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorAssistantLink(doctorRow.id, assistantUserId);

    await this.db
      .update(user)
      .set({ isActive })
      .where(eq(user.id, assistantUserId));

    return {
      message: 'Assistant status updated successfully',
      id: assistantUserId,
      isActive,
    };
  }

  async getAssistantShifts(doctorUserId: number, assistantUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { assistantRow, link } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );

    const assistantUser = await this.db.query.user.findFirst({
      where: eq(user.id, assistantUserId),
    });
    if (!assistantUser) {
      throw new NotFoundException('Assistant not found');
    }

    const stored = link.weeklyShifts ?? [];
    const days =
      stored.length > 0
        ? normalizeAssistantWeeklyShifts(stored)
        : defaultAssistantWeeklyShifts();

    return {
      assistantUserId,
      assistantId: assistantRow.id,
      assistantName: assistantUser.name,
      clinicName: doctorRow.clinicName?.trim() || null,
      days,
    };
  }

  async updateAssistantShifts(
    doctorUserId: number,
    assistantUserId: number,
    dto: UpdateDoctorAssistantShiftsDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { link } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );

    let days: AssistantWeeklyShiftDayRow[];
    try {
      days = normalizeAssistantWeeklyShifts(dto.days);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid shift schedule';
      throw new BadRequestException(message);
    }

    const clinicLabel = doctorRow.clinicName?.trim() || null;
    const daysWithNotes = days.map((day) => {
      if (day.status === 'holiday') return day;
      if (day.note?.trim()) return day;
      return {
        ...day,
        note: clinicLabel,
      };
    });

    await this.db
      .update(doctorAssistant)
      .set({ weeklyShifts: daysWithNotes })
      .where(eq(doctorAssistant.id, link.id));

    return this.getAssistantShifts(doctorUserId, assistantUserId);
  }

  async createAvatarUploadIntent(
    doctorUserId: number,
    assistantUserId: number,
    fileName: string,
    contentType: string,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { assistantRow } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );
    const mimeType = contentType.trim().toLowerCase();
    if (!PATIENT_AVATAR_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported profile photo file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'staff_avatar',
      staffId: assistantRow.id,
      staffRole: 'assistant',
    });
  }

  async setAvatar(
    doctorUserId: number,
    assistantUserId: number,
    s3Key: string,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const { assistantRow } = await this.verifyDoctorAssistantLink(
      doctorRow.id,
      assistantUserId,
    );
    const key = s3Key.trim();
    const expectedPrefix = `${buildStaffAvatarPrefix('assistant', assistantRow.id)}/`;
    if (
      !key.startsWith(expectedPrefix) &&
      !isStaffAvatarStorageKey(key, assistantRow.id)
    ) {
      throw new BadRequestException('Invalid profile photo storage key');
    }

    await this.db
      .update(user)
      .set({ avatarUrl: key })
      .where(eq(user.id, assistantUserId));

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

    if (trimmed.startsWith('staff/')) {
      return trimmed;
    }

    throw new BadRequestException('Invalid profile photo reference');
  }
}
