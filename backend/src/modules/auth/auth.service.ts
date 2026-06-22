import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomBytes, randomInt } from 'crypto';
import { AuthJwtService } from './jwt';
import { hashPassword, verifyPassword } from './password';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { ResendRegistrationOtpDto } from './dto/resend-registration-otp.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  familyHistory,
  medication,
  patient,
  patientHistory,
  pendingRegistration,
  user,
  patientDocument,
  patientDocumentNotes,
} from '../../database/schema';
import { RegisterStep2Dto } from './dto/register-step-2.dto';
import { RegisterStep3Dto } from './dto/register-step-3.dto';
import { RegisterStep4Dto } from './dto/register-step-4.dto';
import { MailService } from '../../shared/mail/mail.service';
import { allocatePatientNumber } from '../../shared/patient/patient-number';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import {
  parseMedicationCompliance,
  parseMedicationType,
} from '../medication/medication-insert.helpers';


@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly authJwtService: AuthJwtService,
    private readonly mailService: MailService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    if (!userRecord || !userRecord.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(
      userRecord.password,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: userRecord.id,
      role: userRecord.role,
      email: userRecord.email,
    };

    const accessToken = await this.authJwtService.signAccessToken(payload);
    const refreshToken = await this.authJwtService.signRefreshToken(payload);
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
      .where(eq(user.id, userRecord.id));

    let avatarUrl = userRecord.avatarUrl;
    if (userRecord.role === 'patient') {
      const patientRecord = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userRecord.id),
        columns: { avatarUrl: true },
      });
      avatarUrl = patientRecord?.avatarUrl ?? userRecord.avatarUrl;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role,
        avatarUrl: await this.avatarUrlResolver.resolve(avatarUrl),
      },
    };
  }

  async getMe(userId: number) {
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord || !userRecord.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    let avatarUrl = userRecord.avatarUrl;
    if (userRecord.role === 'patient') {
      const patientRecord = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userId),
        columns: { avatarUrl: true },
      });
      avatarUrl = patientRecord?.avatarUrl ?? userRecord.avatarUrl;
    }

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      avatarUrl: await this.avatarUrlResolver.resolve(avatarUrl),
    };
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });
    if (existing?.isActive) {
      throw new UnauthorizedException('Email already exists');
    }

    if (existing && !existing.isActive) {
      const linkedPatient = await this.db.query.patient.findFirst({
        where: eq(patient.userId, existing.id),
        columns: { id: true },
      });
      if (!linkedPatient) {
        await this.db.delete(user).where(eq(user.id, existing.id));
      } else {
        throw new UnauthorizedException('Email already exists');
      }
    }

    const passwordHash = await hashPassword(dto.password);
    const otpCode = String(randomInt(100000, 1000000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const pendingValues = {
      email: normalizedEmail,
      name: dto.fullName.trim(),
      phone: dto.phoneNumber.trim(),
      password: passwordHash,
      otpCode,
      otpExpiresAt,
    };

    const existingPending = await this.db.query.pendingRegistration.findFirst({
      where: eq(pendingRegistration.email, normalizedEmail),
    });

    if (existingPending) {
      await this.db
        .update(pendingRegistration)
        .set(pendingValues)
        .where(eq(pendingRegistration.id, existingPending.id));
    } else {
      await this.db.insert(pendingRegistration).values(pendingValues);
    }

    await this.mailService.sendRegistrationOtpEmail(
      normalizedEmail,
      otpCode,
    );

    return {
      requiresEmailVerification: true,
      email: normalizedEmail,
      message: 'Verification code sent to your email. Enter it to create your account.',
    };
  }

  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const pending = await this.db.query.pendingRegistration.findFirst({
      where: eq(pendingRegistration.email, normalizedEmail),
    });

    if (!pending) {
      throw new BadRequestException(
        'No pending registration found for this email. Please start again.',
      );
    }

    if (pending.otpExpiresAt < new Date()) {
      throw new BadRequestException(
        'Your verification code has expired. Tap Resend code to get a new one.',
      );
    }

    if (pending.otpCode !== dto.code) {
      throw new BadRequestException(
        'Incorrect verification code. Please check the code and try again, or resend a new one.',
      );
    }

    const activeUser = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });
    if (activeUser?.isActive) {
      await this.db
        .delete(pendingRegistration)
        .where(eq(pendingRegistration.id, pending.id));
      throw new BadRequestException('This email is already registered.');
    }

    const inserted = await this.db
      .insert(user)
      .values({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        password: pending.password,
        role: 'patient',
        isActive: true,
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      });

    const createdUser = inserted[0];
    if (!createdUser) {
      throw new BadRequestException('Failed to create account.');
    }

    await this.db
      .delete(pendingRegistration)
      .where(eq(pendingRegistration.id, pending.id));

    void this.mailService
      .sendWelcomeEmail(createdUser.email, createdUser.name)
      .catch(() => undefined);

    return this.issueAuthTokensForUser(createdUser);
  }

  async resendRegistrationOtp(dto: ResendRegistrationOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const pending = await this.db.query.pendingRegistration.findFirst({
      where: eq(pendingRegistration.email, normalizedEmail),
    });

    if (!pending) {
      return {
        message:
          'No pending registration was found for this email. Go back and submit your account details again.',
      };
    }

    const otpCode = String(randomInt(100000, 1000000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.db
      .update(pendingRegistration)
      .set({ otpCode, otpExpiresAt })
      .where(eq(pendingRegistration.id, pending.id));

    await this.mailService.sendRegistrationOtpEmail(normalizedEmail, otpCode);

    return {
      message: 'A new verification code has been sent to your email.',
    };
  }

  private async issueAuthTokensForUser(userRecord: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: (typeof user.$inferSelect)['role'];
    avatarUrl: string | null;
  }) {
    const payload = {
      sub: userRecord.id,
      role: userRecord.role,
      email: userRecord.email,
    };

    const accessToken = await this.authJwtService.signAccessToken(payload);
    const refreshToken = await this.authJwtService.signRefreshToken(payload);
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
      .where(eq(user.id, userRecord.id));

    let avatarUrl = userRecord.avatarUrl;
    if (userRecord.role === 'patient') {
      const patientRecord = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userRecord.id),
        columns: { avatarUrl: true },
      });
      avatarUrl = patientRecord?.avatarUrl ?? userRecord.avatarUrl;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role,
        avatarUrl: await this.avatarUrlResolver.resolve(avatarUrl),
      },
      message: 'Email verified. Your account is now active.',
    };
  }

  async registerStep2(userId: number, dto: RegisterStep2Dto) {
    const existingPatient = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (existingPatient) {
      throw new UnauthorizedException('Patient profile already exists');
    }

    const patientNumber = await allocatePatientNumber(this.db);

    const inserted = await this.db
      .insert(patient)
      .values({
        userId,
        patientNumber,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        nationalId: dto.nationalId,
        bloodType: dto.bloodType as never,
        address: dto.address,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        maritalStatus: dto.maritalStatus as never,
        occupation: dto.occupation,
        smokingStatus: dto.smokingStatus as never,
        alcoholConsumption: dto.alcoholConsumption as never,
        caffeineIntake: dto.caffeineIntake ?? 0,
        recreationalDrugUse: dto.recreationalDrugUse as never,
        exerciseFrequency: dto.exerciseFrequency as never,
        exerciseDuration: dto.exerciseDuration as never,
        exerciseType: dto.exerciseType as never,
        physicalActivityLevel: dto.physicalActivityLevel as never,
        dietaryHabits: dto.dietaryHabits as never,
        stressLevel: dto.stressLevel as never,
      })
      .returning({
        id: patient.id,
        userId: patient.userId,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
      });

    const created = inserted[0];
    if (!created) {
      throw new UnauthorizedException('Failed to create patient profile');
    }

    return { patient: created };
  }

  async registerStep3(userId: number, dto: RegisterStep3Dto) {
    const existingHistory = await this.db.query.patientHistory.findFirst({
      where: eq(patientHistory.userId, userId),
    });
    if (existingHistory) {
      throw new UnauthorizedException('Medical history already exists');
    }

    const inserted = await this.db
      .insert(patientHistory)
      .values({
        userId,
        chiefComplaint: dto.chiefComplaint,
        chiefComplaintOtherText: dto.chiefComplaintOtherText?.trim(),
        hpiData: dto.hpiData,
        noCardiacHistory: dto.noCardiacHistory ?? false,
        pastCardiacHistory: dto.pastCardiacHistory,
        noNonCardiacHistory: dto.noNonCardiacHistory ?? false,
        pastNonCardiacHistory: dto.pastNonCardiacHistory,
        cardiovascularRiskFactors: dto.cardiovascularRiskFactors,
        medicalHistoryNotes: dto.medicalHistoryNotes?.trim() || null,
      })
      .returning({
        id: patientHistory.id,
        userId: patientHistory.userId,
      });

    const createdHistory = inserted[0];
    if (!createdHistory) {
      throw new UnauthorizedException('Failed to create medical history');
    }

    const familyRows = (dto.familyHistory ?? [])
      .filter(
        (item) =>
          typeof item?.relationship === 'string' &&
          item.relationship.trim() &&
          typeof item?.condition === 'string' &&
          item.condition.trim(),
      )
      .map((item) => ({
        userId,
        hasFamilyHistory: dto.hasFamilyHistory ?? false,
        relationship: item.relationship.trim(),
        condition: item.condition.trim(),
        details:
          typeof item.details === 'string' ? item.details.trim() || null : null,
      }));

    if (familyRows.length > 0) {
      await this.db.insert(familyHistory).values(familyRows);
    }

    const medicationRows = (dto.medications ?? [])
      .map((item) => {
        if (
          typeof item?.name !== 'string' ||
          !item.name.trim() ||
          typeof item?.dose !== 'string' ||
          !item.dose.trim() ||
          typeof item?.frequency !== 'string' ||
          !item.frequency.trim()
        ) {
          return null;
        }
        const medType = parseMedicationType(item.type);
        if (!medType) return null;
        return {
          userId,
          name: item.name.trim(),
          dose: item.dose.trim(),
          frequency: item.frequency.trim(),
          type: medType,
          compliance: parseMedicationCompliance(item.compliance),
          sideEffects:
            typeof item.sideEffects === 'string'
              ? item.sideEffects.trim() || null
              : null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (medicationRows.length > 0) {
      await this.db.insert(medication).values(medicationRows);
    }

    const allergyRows = [
      ...(dto.drugAllergies ?? []).map((item) => ({
        ...item,
        category: 'drug',
      })),
      ...(dto.foodAllergies ?? []).map((item) => ({
        ...item,
        category: 'food',
      })),
      ...(dto.otherAllergies ?? []).map((item) => ({
        ...item,
        category: 'other',
      })),
    ]
      .filter(
        (item) => typeof item?.allergen === 'string' && item.allergen.trim(),
      )
      .map((item) => ({
        userId,
        category: item.category as 'drug' | 'food' | 'other',
        allergen: item.allergen.trim(),
        reaction:
          typeof item.reaction === 'string'
            ? item.reaction.trim() || null
            : null,
      }));

    if (allergyRows.length > 0) {
      await this.db.insert(allergy).values(allergyRows);
    }

    return {
      patientHistory: createdHistory,
      familyHistoryCount: familyRows.length,
      medicationCount: medicationRows.length,
      allergyCount: allergyRows.length,
    };
  }

  /** Step 1 – send a 6-digit OTP to the given email. */
  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    // Always return 200 to avoid leaking whether email exists
    if (!userRecord || !userRecord.isActive) {
      return { message: 'If that email is registered, an OTP has been sent.' };
    }

    const otpCode = String(randomInt(100000, 1000000)); // 6 digits
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.db
      .update(user)
      .set({ otpCode, otpExpiresAt, otpResetToken: null, otpResetTokenExpiresAt: null })
      .where(eq(user.id, userRecord.id));

    await this.mailService.sendOtpEmail(normalizedEmail, otpCode);

    return { message: 'If that email is registered, an OTP has been sent.' };
  }

  /** Step 2 – verify OTP, return a short-lived reset token. */
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    if (
      !userRecord ||
      !userRecord.isActive ||
      !userRecord.otpCode ||
      !userRecord.otpExpiresAt ||
      userRecord.otpCode !== dto.code ||
      userRecord.otpExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    const resetToken = randomBytes(32).toString('hex');
    const otpResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.db
      .update(user)
      .set({
        otpCode: null,
        otpExpiresAt: null,
        otpResetToken: resetToken,
        otpResetTokenExpiresAt,
      })
      .where(eq(user.id, userRecord.id));

    return { resetToken, message: 'OTP verified. Use the reset token to set a new password.' };
  }

  /** Step 3 – set a new password using the reset token from step 2. */
  async resetPasswordWithToken(dto: ResetPasswordWithTokenDto) {
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.otpResetToken, dto.resetToken),
    });

    if (
      !userRecord ||
      !userRecord.otpResetTokenExpiresAt ||
      userRecord.otpResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }

    const newPasswordHash = await hashPassword(dto.password);

    await this.db
      .update(user)
      .set({
        password: newPasswordHash,
        otpResetToken: null,
        otpResetTokenExpiresAt: null,
      })
      .where(eq(user.id, userRecord.id));

    return { message: 'Password updated successfully. Please log in with your new password.' };
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

  async registerStep4(userId: number, dto: RegisterStep4Dto) {
    // Step 4: Save document metadata to database and documents notes
    // Frontend uploads files to MinIO first, then sends metadata here
    // SOLID: Data persistence separated from business logic

    const files = dto.files ?? [];

    if (files.length === 0 && !dto.notes) {
      return {
        success: true,
        message: 'No documents or notes provided',
        documentsCount: 0,
      };
    }

    // Save documents to database
    const savedDocuments: Array<{
      id: string;
      fileName: string | null;
      category: string | null;
    }> = [];

    if (files.length > 0) {
      const documentRecords = files.map((file) => ({
        userId,
        s3Key: file.s3Key || '', // Ensure not undefined
        fileName: file.name || file.fileName || 'Unnamed', // Use first available name
        contentType: file.mimeType || 'application/octet-stream',
        sizeBytes: file.size || file.fileSize || 0, // Use first available size
        category:
          (file.category as
            | 'lab_report'
            | 'imaging'
            | 'ecg'
            | 'prescription'
            | 'referral'
            | 'other') || null,
      }));

      const inserted = await this.db
        .insert(patientDocument)
        .values(documentRecords)
        .returning({
          id: patientDocument.id,
          fileName: patientDocument.fileName,
          category: patientDocument.category,
        });

      savedDocuments.push(...inserted);
    }

    // Save notes if provided
    if (dto.notes?.trim()) {
      await this.db
        .insert(patientDocumentNotes)
        .values({
          userId,
          notes: dto.notes.trim(),
        })
        .onConflictDoUpdate({
          target: patientDocumentNotes.userId,
          set: {
            notes: dto.notes.trim(),
            updatedAt: new Date(),
          },
        });
    }

    return {
      success: true,
      message: `${savedDocuments.length} document(s) uploaded successfully`,
      documentsCount: savedDocuments.length,
      documents: savedDocuments,
    };
  }
}
