import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { assistant, user } from '../../../database/schema';
import { UpdateAssistantAccountDto } from './dto/update-assistant-account.dto';

@Injectable()
export class AssistantAccountService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getAccount(userId: number) {
    const assistantRow = await this.findAssistantByUserId(userId);
    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    return { profile: this.mapProfile(assistantRow, userRow) };
  }

  async updateAccount(userId: number, dto: UpdateAssistantAccountDto) {
    const assistantRow = await this.findAssistantByUserId(userId);
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
      .update(assistant)
      .set({
        department: dto.department.trim(),
        experienceYears: dto.experienceYears,
      })
      .where(eq(assistant.id, assistantRow.id));

    return this.getAccount(userId);
  }

  private async findAssistantByUserId(userId: number) {
    const assistantRow = await this.db.query.assistant.findFirst({
      where: eq(assistant.userId, userId),
    });
    if (!assistantRow) {
      throw new NotFoundException('Assistant not found');
    }
    return assistantRow;
  }

  private mapProfile(
    assistantRow: typeof assistant.$inferSelect,
    userRow: typeof user.$inferSelect,
  ) {
    return {
      id: assistantRow.id,
      fullName: userRow.name,
      email: userRow.email,
      phone: userRow.phone ?? '',
      avatarUrl: userRow.avatarUrl,
      role: 'assistant' as const,
      department: assistantRow.department?.trim() || 'General Practice',
      experienceYears: assistantRow.experienceYears ?? 0,
      joinedAt: assistantRow.createdAt.toISOString(),
    };
  }
}
