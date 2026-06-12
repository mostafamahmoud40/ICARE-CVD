import {
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { user, doctor, assistant } from '../../database/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { AuthJwtService } from '../auth/jwt';
import {
  AddStaffDto,
  DoctorAcceptedVisitModes,
  StaffRole,
} from './dto/add-staff.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly jwtService: AuthJwtService,
  ) {}

  async addStaff(dto: AddStaffDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const inserted = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phoneNumber.trim(),
        avatarUrl: dto.avatarUrl,
        password: passwordHash,
        role: dto.role,
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });

    const createdUser = inserted[0];
    if (!createdUser) {
      throw new UnauthorizedException('Failed to create staff member');
    }

    if (dto.role === StaffRole.Doctor) {
      await this.db.insert(doctor).values({
        userId: createdUser.id,
        specialty: dto.specialty ?? null,
        experienceYears: dto.experienceYears ?? 0,
        acceptedVisitModes:
          dto.acceptedVisitModes ?? DoctorAcceptedVisitModes.Both,
      });
    } else if (dto.role === StaffRole.Assistant) {
      await this.db.insert(assistant).values({
        userId: createdUser.id,
        department: dto.specialty ?? null,
        experienceYears: dto.experienceYears ?? 0,
      });
    }

    const payload = {
      sub: createdUser.id,
      role: createdUser.role,
      email: createdUser.email,
    };

    const accessToken = await this.jwtService.signAccessToken(payload);
    const refreshToken = await this.jwtService.signRefreshToken(payload);
    const accessTokenHash = await hashPassword(accessToken);
    const refreshTokenHash = await hashPassword(refreshToken);

    await this.db
      .update(user)
      .set({
        accessTokenHash,
        accessTokenExpiresAt: new Date(
          Date.now() +
            this.parseDurationMs(process.env.JWT_ACCESS_TTL ?? '15m'),
        ),
        refreshTokenHash,
        refreshTokenExpiresAt: new Date(
          Date.now() +
            this.parseDurationMs(process.env.JWT_REFRESH_TTL ?? '7d'),
        ),
      })
      .where(eq(user.id, createdUser.id));

    return {
      user: createdUser,
      accessToken,
      refreshToken,
    };
  }

  private parseDurationMs(input: string): number {
    const m = input.match(/^(\d+)([smhd])$/);
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(m[1]);
    const unit = m[2];
    const factor =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
    return amount * factor;
  }

  async getStaff() {
    // Get all doctors and assistants
    const doctors = await this.db.query.user.findMany({
      where: eq(user.role, StaffRole.Doctor),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        role: true,
      },
    });

    const assistants = await this.db.query.user.findMany({
      where: eq(user.role, StaffRole.Assistant),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        role: true,
      },
    });

    // Get doctor details
    const doctorDetails = await this.db.query.doctor.findMany();
    const doctorMap = new Map(doctorDetails.map((d) => [d.userId, d]));

    // Get assistant details
    const assistantDetails = await this.db.query.assistant.findMany();
    const assistantMap = new Map(assistantDetails.map((a) => [a.userId, a]));

    const allStaff = [...doctors, ...assistants].map((u) => {
      const docDetail = doctorMap.get(u.id);
      const assDetail = assistantMap.get(u.id);

      return {
        id: u.id,
        fullName: u.name,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        isActive: u.isActive,
        role: u.role as StaffRole,
        specialty: docDetail?.specialty ?? assDetail?.department ?? null,
        experienceYears:
          docDetail?.experienceYears ?? assDetail?.experienceYears ?? 0,
        acceptedVisitModes:
          docDetail?.acceptedVisitModes ?? null,
        createdAt:
          (docDetail?.createdAt ?? assDetail?.createdAt)?.toISOString() ??
          new Date().toISOString(),
      };
    });

    return allStaff;
  }

  async updateStaff(id: number, dto: AddStaffDto) {
    const existing = await this.db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    if (existing.email !== dto.email.toLowerCase().trim()) {
      const emailExists = await this.db.query.user.findFirst({
        where: eq(user.email, dto.email.toLowerCase().trim()),
      });
      if (emailExists) {
        throw new UnauthorizedException('Email already exists');
      }
    }

    const passwordHash = await hashPassword(dto.password);

    const updated = await this.db
      .update(user)
      .set({
        name: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phoneNumber.trim(),
        avatarUrl: dto.avatarUrl,
        password: passwordHash,
        role: dto.role,
      })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });

    const updatedUser = updated[0];
    if (!updatedUser) {
      throw new UnauthorizedException('Failed to update staff member');
    }

    const roleChanged = existing.role !== dto.role;

    if (roleChanged) {
      await this.handleRoleChange(existing.role, dto.role, id, dto);
    } else {
      await this.updateRoleSpecificProfile(existing.role, id, dto);
    }

    return {
      user: updatedUser,
      message: 'Staff member updated successfully',
    };
  }

  private async handleRoleChange(
    previousRole: string,
    newRole: string,
    userId: number,
    dto: AddStaffDto,
  ): Promise<void> {
    await this.deleteRoleSpecificProfile(previousRole, userId);
    await this.createRoleSpecificProfile(newRole, userId, dto);
  }

  private async deleteRoleSpecificProfile(
    role: string,
    userId: number,
  ): Promise<void> {
    if (role === StaffRole.Doctor) {
      await this.db.delete(doctor).where(eq(doctor.userId, userId));
    } else if (role === StaffRole.Assistant) {
      await this.db.delete(assistant).where(eq(assistant.userId, userId));
    }
  }

  private async createRoleSpecificProfile(
    role: string,
    userId: number,
    dto: AddStaffDto,
  ): Promise<void> {
    if (role === StaffRole.Doctor) {
      await this.db.insert(doctor).values({
        userId,
        specialty: dto.specialty ?? null,
        experienceYears: dto.experienceYears ?? 0,
        acceptedVisitModes:
          dto.acceptedVisitModes ?? DoctorAcceptedVisitModes.Both,
      });
    } else if (role === StaffRole.Assistant) {
      await this.db.insert(assistant).values({
        userId,
        department: dto.specialty ?? null,
        experienceYears: dto.experienceYears ?? 0,
      });
    }
  }

  private async updateRoleSpecificProfile(
    role: string,
    userId: number,
    dto: AddStaffDto,
  ): Promise<void> {
    if (role === StaffRole.Doctor) {
      await this.db
        .update(doctor)
        .set({
          specialty: dto.specialty ?? null,
          experienceYears: dto.experienceYears ?? 0,
          acceptedVisitModes:
            dto.acceptedVisitModes ?? DoctorAcceptedVisitModes.Both,
        })
        .where(eq(doctor.userId, userId));
    } else if (role === StaffRole.Assistant) {
      await this.db
        .update(assistant)
        .set({
          department: dto.specialty ?? null,
          experienceYears: dto.experienceYears ?? 0,
        })
        .where(eq(assistant.userId, userId));
    }
  }

  async deleteStaff(id: number) {
    const existing = await this.db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    await this.db.delete(user).where(eq(user.id, id));

    return {
      message: 'Staff member deleted successfully',
      id,
    };
  }

  async updateStaffStatus(id: number, isActive: boolean) {
    const existing = await this.db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    await this.db
      .update(user)
      .set({ isActive })
      .where(eq(user.id, id));

    return {
      message: 'Staff member status updated successfully',
      id,
      isActive,
    };
  }
}
