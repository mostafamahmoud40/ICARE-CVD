import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthJwtService } from './jwt';
import { hashPassword, verifyPassword } from './password';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  familyHistory,
  medication,
  patient,
  patientHistory,
  user,
  patientDocument,
  patientDocumentNotes,
} from '../../database/schema';
import { RegisterStep2Dto } from './dto/register-step-2.dto';
import { RegisterStep3Dto } from './dto/register-step-3.dto';
import { RegisterStep4Dto } from './dto/register-step-4.dto';
import { MailService } from '../../shared/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly authJwtService: AuthJwtService,
    private readonly mailService: MailService,
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

    return {
      accessToken,
      refreshToken,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role,
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

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.db.query.user.findFirst({
      where: eq(user.email, dto.email.toLowerCase().trim()),
    });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const inserted = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phoneNumber.trim(),
        password: passwordHash,
        role: 'patient',
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

    const createdUser = inserted[0];
    if (!createdUser) {
      throw new UnauthorizedException('Failed to create user');
    }

    const payload = {
      sub: createdUser.id,
      role: createdUser.role,
      email: createdUser.email,
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
      .where(eq(user.id, createdUser.id));

    void this.mailService
      .sendWelcomeEmail(createdUser.email, createdUser.name)
      .catch(() => undefined);

    return {
      accessToken,
      refreshToken,
      user: createdUser,
    };
  }

  async registerStep2(userId: number, dto: RegisterStep2Dto) {
    const existingPatient = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (existingPatient) {
      throw new UnauthorizedException('Patient profile already exists');
    }

    const inserted = await this.db
      .insert(patient)
      .values({
        userId,
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
      .filter(
        (item) =>
          typeof item?.name === 'string' &&
          item.name.trim() &&
          typeof item?.dose === 'string' &&
          item.dose.trim() &&
          typeof item?.frequency === 'string' &&
          item.frequency.trim() &&
          typeof item?.type === 'string' &&
          item.type.trim(),
      )
      .map((item) => ({
        // Drizzle enum column expects exact union literals.
        compliance:
          item.compliance === 'good' || item.compliance === 'poor'
            ? (item.compliance as 'good' | 'poor')
            : null,
        userId,
        name: item.name.trim(),
        dose: item.dose.trim(),
        frequency: item.frequency.trim(),
        type: item.type as never,
        sideEffects:
          typeof item.sideEffects === 'string'
            ? item.sideEffects.trim() || null
            : null,
      }));

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
    // Frontend uploads files to S3 first, then sends metadata here
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
        category: file.category || null, // Can be null
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
