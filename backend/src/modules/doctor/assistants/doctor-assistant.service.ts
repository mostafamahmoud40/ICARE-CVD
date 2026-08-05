import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { assistant, doctorAssistant, user } from '../../../database/schema';
import { hashPassword } from '../../auth/password';
import { DoctorVerifierService } from '../../../shared/doctor/doctor-verifier.service';
import {
  CreateDoctorAssistantDto,
  UpdateDoctorAssistantDto,
} from './dto/doctor-assistant.dto';

@Injectable()
export class DoctorAssistantService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
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

    return rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      isActive: row.isActive,
      department: row.department,
      experienceYears: row.experienceYears,
      linkedAt: row.linkedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
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

    const passwordHash = await hashPassword(dto.password);

    const insertedUsers = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phoneNumber.trim(),
        avatarUrl: dto.avatarUrl,
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
      password?: string;
    } = {
      name: dto.fullName.trim(),
      email: normalizedEmail,
      phone: dto.phoneNumber.trim(),
    };

    if (dto.avatarUrl) {
      userUpdate.avatarUrl = dto.avatarUrl;
    }

    if (dto.password?.trim()) {
      userUpdate.password = await hashPassword(dto.password);
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
}
