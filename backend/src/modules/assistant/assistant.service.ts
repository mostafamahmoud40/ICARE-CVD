import { randomBytes } from 'crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  medication,
  patient,
  patientDocument,
  patientHistory,
  user,
} from '../../database/schema';
import { chiefComplaints } from '../auth/dto/register-step-3.dto';
import { hashPassword } from '../auth/password';

import { CreatePatientDto } from './dto/create-patient.dto';
import {
  parseMedicationCompliance,
  parseMedicationType,
} from '../medication/medication-insert.helpers';

const CHIEF_SET = new Set<string>(chiefComplaints);

const BLOOD_TYPES = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

type PatientDocumentCategory =
  | 'lab_report'
  | 'imaging'
  | 'ecg'
  | 'prescription'
  | 'referral'
  | 'other';

@Injectable()
export class AssistantService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listPatients() {
    const rows = await this.db
      .select({
        id: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nationalId: patient.nationalId,
        bloodType: patient.bloodType,
        address: patient.address,
        heightCm: patient.heightCm,
        weightKg: patient.weightKg,
        smokingStatus: patient.smokingStatus,
        chiefComplaint: patientHistory.chiefComplaint,
        createdAt: patient.createdAt,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .leftJoin(patientHistory, eq(patientHistory.userId, user.id))
      .where(eq(user.role, 'patient'));

    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      dateOfBirth: r.dateOfBirth
        ? r.dateOfBirth.toISOString().slice(0, 10)
        : null,
      gender: r.gender,
      nationalId: r.nationalId,
      bloodType: r.bloodType,
      address: r.address,
      heightCm: r.heightCm,
      weightKg: r.weightKg,
      smokingStatus: r.smokingStatus,
      chiefComplaint: r.chiefComplaint,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createPatient(dto: CreatePatientDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const tempPassword = randomBytes(24).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);

    const chief =
      dto.chiefComplaint && CHIEF_SET.has(dto.chiefComplaint)
        ? dto.chiefComplaint
        : 'other';

    const bloodType =
      dto.bloodType && BLOOD_TYPES.has(dto.bloodType)
        ? dto.bloodType
        : undefined;

    const insertedUser = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phoneNumber.trim(),
        password: passwordHash,
        role: 'patient',
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });

    const createdUser = insertedUser[0];
    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }

    const userId = createdUser.id;

    await this.db.insert(patient).values({
      userId,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      nationalId: dto.nationalId.trim(),
      bloodType: bloodType as never,
      address: dto.address?.trim() || null,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      smokingStatus: this.mapSmoking(dto.smokingStatus),
      alcoholConsumption: this.mapAlcohol(dto.alcoholConsumption),
      exerciseFrequency: this.mapExercise(dto.exerciseFrequency),
      stressLevel: this.mapStress(dto.stressLevel),
    });

    await this.db.insert(patientHistory).values({
      userId,
      chiefComplaint: chief as never,
      chiefComplaintOtherText: dto.otherChiefComplaint?.trim() || null,
      medicalHistoryNotes: dto.medicalHistoryNotes?.trim() || null,
      noCardiacHistory: false,
      noNonCardiacHistory: false,
    });

    const medRows = (dto.medications ?? [])
      .map((m) => {
        if (!m.name?.trim() || !m.dose?.trim() || !m.frequency?.trim()) {
          return null;
        }
        const medType = parseMedicationType(m.type);
        if (!medType) return null;
        return {
          userId,
          name: m.name.trim(),
          dose: m.dose.trim(),
          frequency: m.frequency.trim(),
          type: medType,
          compliance: parseMedicationCompliance(m.compliance),
          sideEffects: m.sideEffects?.trim() || null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (medRows.length > 0) {
      await this.db.insert(medication).values(medRows);
    }

    const allergyRows = (dto.allergies ?? [])
      .filter((a) => a.allergen?.trim() && a.category)
      .map((a) => ({
        userId,
        category: a.category,
        allergen: a.allergen.trim(),
        reaction: a.reaction?.trim() || null,
      }));

    if (allergyRows.length > 0) {
      await this.db.insert(allergy).values(allergyRows);
    }

    return {
      patient: {
        id: createdUser.id,
        fullName: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        nationalId: dto.nationalId.trim(),
      },
    };
  }

  async registerPatientDocument(
    patientUserId: number,
    assistantUserId: number,
    dto: {
      fileName: string;
      contentType: string;
      category: PatientDocumentCategory;
      title?: string;
      s3Key: string;
      fileSize?: number;
    },
  ) {
    if (!dto.s3Key?.trim()) {
      throw new BadRequestException('s3Key is required');
    }

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, patientUserId),
    });
    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }

    const [doc] = await this.db
      .insert(patientDocument)
      .values({
        userId: patientRow.userId,
        patientId: patientRow.id,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.fileSize ?? null,
        category: dto.category,
        title: dto.title ?? null,
        uploadedByUserId: assistantUserId,
        s3Key: dto.s3Key,
      })
      .returning();

    return doc;
  }

  private mapSmoking(
    raw?: string,
  ):
    | 'never'
    | 'former-5'
    | 'former-10'
    | 'former-15'
    | 'former-20'
    | 'current-5'
    | 'current-10'
    | 'current-15'
    | 'current-20'
    | undefined {
    if (!raw) return undefined;
    if (raw === 'never') return 'never';
    if (raw === 'former') return 'former-5';
    if (raw === 'current') return 'current-5';
    return undefined;
  }

  private mapAlcohol(
    raw?: string,
  ): 'none' | 'rarely' | 'weekly' | 'daily' | undefined {
    if (!raw) return undefined;
    if (raw === 'none') return 'none';
    if (raw === 'occasional') return 'rarely';
    if (raw === 'moderate') return 'weekly';
    if (raw === 'heavy') return 'daily';
    return undefined;
  }

  private mapExercise(raw?: string): 'none' | '1-2' | '3-4' | '5+' | undefined {
    if (!raw) return undefined;
    if (raw === 'sedentary') return 'none';
    if (raw === 'light') return '1-2';
    if (raw === 'moderate') return '3-4';
    if (raw === 'active') return '5+';
    return undefined;
  }

  private mapStress(raw?: string): 'low' | 'moderate' | 'high' | undefined {
    if (!raw) return undefined;
    if (raw === 'low' || raw === 'moderate' || raw === 'high') return raw;
    return undefined;
  }
}
