import {
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  assistant,
  doctor,
  patient,
  pendingRegistration,
  user,
} from '../../database/schema';
import { hashPassword } from '../auth/password';
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

  async getDashboard(adminUserId: number) {
    const adminUser = await this.db.query.user.findFirst({
      where: eq(user.id, adminUserId),
    });
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    const [
      totalUsersRow,
      doctorsRow,
      patientsRow,
      assistantsRow,
      adminsRow,
      pendingRow,
      recentPatients,
      recentDoctors,
      recentAssistants,
      recentPending,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(user),
      this.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, StaffRole.Doctor)),
      this.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, 'patient')),
      this.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, 'assistant')),
      this.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, 'admin')),
      this.db.select({ count: count() }).from(pendingRegistration),
      this.db
        .select({
          userId: user.id,
          fullName: user.name,
          email: user.email,
          isActive: user.isActive,
          joinedAt: patient.createdAt,
        })
        .from(patient)
        .innerJoin(user, eq(patient.userId, user.id))
        .orderBy(desc(patient.createdAt))
        .limit(5),
      this.db
        .select({
          userId: user.id,
          fullName: user.name,
          email: user.email,
          isActive: user.isActive,
          joinedAt: doctor.createdAt,
        })
        .from(doctor)
        .innerJoin(user, eq(doctor.userId, user.id))
        .orderBy(desc(doctor.createdAt))
        .limit(5),
      this.db
        .select({
          userId: user.id,
          fullName: user.name,
          email: user.email,
          isActive: user.isActive,
          joinedAt: assistant.createdAt,
        })
        .from(assistant)
        .innerJoin(user, eq(assistant.userId, user.id))
        .orderBy(desc(assistant.createdAt))
        .limit(5),
      this.db
        .select({
          id: pendingRegistration.id,
          fullName: pendingRegistration.name,
          email: pendingRegistration.email,
          joinedAt: pendingRegistration.createdAt,
        })
        .from(pendingRegistration)
        .orderBy(desc(pendingRegistration.createdAt))
        .limit(5),
    ]);

    const recentSignups = [
      ...recentPatients.map((row) => ({
        id: `USR-${row.userId}`,
        fullName: row.fullName,
        email: row.email,
        role: 'patient' as const,
        status: row.isActive ? ('active' as const) : ('suspended' as const),
        joinedAt: row.joinedAt.toISOString(),
      })),
      ...recentDoctors.map((row) => ({
        id: `USR-${row.userId}`,
        fullName: row.fullName,
        email: row.email,
        role: 'doctor' as const,
        status: row.isActive ? ('active' as const) : ('suspended' as const),
        joinedAt: row.joinedAt.toISOString(),
      })),
      ...recentAssistants.map((row) => ({
        id: `USR-${row.userId}`,
        fullName: row.fullName,
        email: row.email,
        role: 'assistant' as const,
        status: row.isActive ? ('active' as const) : ('suspended' as const),
        joinedAt: row.joinedAt.toISOString(),
      })),
      ...recentPending.map((row) => ({
        id: `PND-${row.id}`,
        fullName: row.fullName,
        email: row.email,
        role: 'patient' as const,
        status: 'pending' as const,
        joinedAt: row.joinedAt.toISOString(),
      })),
    ]
      .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt))
      .slice(0, 8);

    const recentActivity = [
      ...recentPending.map((row) => ({
        id: `pending-${row.id}`,
        summary: 'Registration awaiting email verification',
        actor: row.fullName,
        at: row.joinedAt.toISOString(),
      })),
      ...recentPatients.slice(0, 3).map((row) => ({
        id: `patient-${row.userId}`,
        summary: 'New patient profile created',
        actor: row.fullName,
        at: row.joinedAt.toISOString(),
      })),
      ...recentDoctors.slice(0, 3).map((row) => ({
        id: `doctor-${row.userId}`,
        summary: 'New doctor profile created',
        actor: row.fullName,
        at: row.joinedAt.toISOString(),
      })),
    ]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 8);

    return {
      admin: {
        fullName: adminUser.name,
        email: adminUser.email,
      },
      counts: {
        totalUsers: totalUsersRow[0]?.count ?? 0,
        doctors: doctorsRow[0]?.count ?? 0,
        patients: patientsRow[0]?.count ?? 0,
        assistants: assistantsRow[0]?.count ?? 0,
        admins: adminsRow[0]?.count ?? 0,
        pendingVerifications: pendingRow[0]?.count ?? 0,
      },
      recentSignups,
      recentActivity,
    };
  }

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
        acceptedVisitModes: docDetail?.acceptedVisitModes ?? null,
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

    const roleChanged = (existing.role as StaffRole) !== dto.role;

    if (roleChanged) {
      await this.handleRoleChange(
        existing.role as StaffRole,
        dto.role,
        id,
        dto,
      );
    } else {
      await this.updateRoleSpecificProfile(existing.role as StaffRole, id, dto);
    }

    return {
      user: updatedUser,
      message: 'Staff member updated successfully',
    };
  }

  private async handleRoleChange(
    previousRole: StaffRole,
    newRole: StaffRole,
    userId: number,
    dto: AddStaffDto,
  ): Promise<void> {
    await this.deleteRoleSpecificProfile(previousRole, userId);
    await this.createRoleSpecificProfile(newRole, userId, dto);
  }

  private async deleteRoleSpecificProfile(
    role: StaffRole,
    userId: number,
  ): Promise<void> {
    if (role === StaffRole.Doctor) {
      await this.db.delete(doctor).where(eq(doctor.userId, userId));
    } else if (role === StaffRole.Assistant) {
      await this.db.delete(assistant).where(eq(assistant.userId, userId));
    }
  }

  private async createRoleSpecificProfile(
    role: StaffRole,
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
    role: StaffRole,
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

    await this.db.update(user).set({ isActive }).where(eq(user.id, id));

    return {
      message: 'Staff member status updated successfully',
      id,
      isActive,
    };
  }
}
