import { randomBytes } from 'crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  appointment,
  consultation,
  diagnosis,
  doctor,
  medication,
  patient,
  patientDocument,
  patientHistory,
  user,
} from '../../database/schema';
import {
  PATIENT_AVATAR_MAX_BYTES,
  PATIENT_AVATAR_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import {
  buildMinioObjectPrefix,
  isPatientProfileStorageKey,
} from '../../shared/storage/minio-patient-path';
import { MinioService } from '../../shared/storage/minio.service';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { MailService } from '../../shared/mail/mail.service';
import { allocatePatientNumber } from '../../shared/patient/patient-number';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';
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
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly minioService: MinioService,
    private readonly mailService: MailService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async listPatients() {
    const rows = await this.db
      .select({
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nationalId: patient.nationalId,
        patientNumber: patient.patientNumber,
        bloodType: patient.bloodType,
        address: patient.address,
        heightCm: patient.heightCm,
        weightKg: patient.weightKg,
        smokingStatus: patient.smokingStatus,
        chiefComplaint: patientHistory.chiefComplaint,
        avatarUrl: patient.avatarUrl,
        createdAt: patient.createdAt,
        maritalStatus: patient.maritalStatus,
        occupation: patient.occupation,
        riskLevel: patient.riskLevel,
        condition: sql<string | null>`(
          select ${diagnosis.description}
          from ${diagnosis}
          where ${diagnosis.patientId} = ${patient.id}
          and ${diagnosis.type} = 'primary'
          order by ${diagnosis.diagnosedAt} desc
          limit 1
        )`,
        lastVisitDate: sql<string | null>`(
          coalesce(
            (
              select ${consultation.completedAt}
              from ${consultation}
              where ${consultation.patientId} = ${patient.id}
              and ${consultation.completedAt} is not null
              order by ${consultation.completedAt} desc
              limit 1
            ),
            (
              select ${appointment.scheduledAt}
              from ${appointment}
              where ${appointment.patientId} = ${patient.id}
              and ${appointment.status} != 'cancelled'
              order by ${appointment.scheduledAt} desc
              limit 1
            )
          )
        )`,
        department: sql<string | null>`(
          select ${doctor.specialty}
          from ${appointment}
          inner join ${doctor} on ${appointment.doctorId} = ${doctor.id}
          where ${appointment.patientId} = ${patient.id}
          order by ${appointment.scheduledAt} desc
          limit 1
        )`,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .leftJoin(patientHistory, eq(patientHistory.userId, user.id))
      .where(eq(user.role, 'patient'));

    return Promise.all(
      rows.map(async (r) => ({
        id: r.patientNumber,
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
        avatarUrl: await this.avatarUrlResolver.resolve(r.avatarUrl),
        createdAt: r.createdAt.toISOString(),
        maritalStatus: r.maritalStatus,
        occupation: r.occupation,
        riskLevel: r.riskLevel,
        condition: r.condition,
        lastVisitDate: r.lastVisitDate ? String(r.lastVisitDate) : null,
        department: r.department,
      })),
    );
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

    const avatarUrl = dto.avatarUrl?.trim() ? dto.avatarUrl.trim() : null;

    const insertedUser = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: normalizedEmail,
        phone: dto.phoneNumber.trim(),
        password: passwordHash,
        role: 'patient',
        avatarUrl,
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

    const patientNumber = await allocatePatientNumber(this.db);

    await this.db.insert(patient).values({
      userId,
      patientNumber,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      nationalId: dto.nationalId.trim(),
      bloodType: bloodType as never,
      avatarUrl,
      address: dto.address?.trim() || null,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      smokingStatus: this.mapSmoking(dto.smokingStatus),
      alcoholConsumption: this.mapAlcohol(dto.alcoholConsumption),
      exerciseFrequency: this.mapExercise(dto.exerciseFrequency),
      stressLevel: this.mapStress(dto.stressLevel),
      maritalStatus: dto.maritalStatus as never,
      occupation: dto.occupation?.trim() || null,
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

    let credentialsEmailSent = false;
    let credentialsEmailError: string | null = null;
    try {
      await this.mailService.sendPatientAccountCreatedEmail(
        createdUser.email,
        createdUser.name,
        normalizedEmail,
        tempPassword,
      );
      credentialsEmailSent = true;
      this.logger.log(
        `Login credentials email sent to patient ${createdUser.id} (${createdUser.email})`,
      );
    } catch (err) {
      credentialsEmailError =
        err instanceof Error ? err.message : 'Failed to send login credentials email';
      this.logger.error(
        `Patient ${createdUser.id} created but credentials email failed: ${credentialsEmailError}`,
        err,
      );
    }

    return {
      patient: {
        id: patientNumber,
        fullName: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        nationalId: dto.nationalId.trim(),
        maritalStatus: dto.maritalStatus,
        occupation: dto.occupation?.trim() || null,
      },
      credentialsEmailSent,
      credentialsEmailError,
    };
  }

  async registerPatientDocument(
    patientIdentifier: string,
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

    const patientRow = await findPatientByIdentifier(this.db, patientIdentifier);

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

  async createPatientAvatarUploadIntent(
    patientIdentifier: string,
    fileName: string,
    contentType: string,
  ) {
    const patientRow = await findPatientByIdentifier(this.db, patientIdentifier);
    const mimeType = contentType.trim().toLowerCase();
    if (!PATIENT_AVATAR_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported profile photo file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'patient_avatar',
      patientId: patientRow.id,
      patientNumber: patientRow.patientNumber,
    });
  }

  async setPatientAvatar(patientIdentifier: string, s3Key: string) {
    const patientRow = await findPatientByIdentifier(this.db, patientIdentifier);
    const key = s3Key.trim();
    const expectedPrefix = `${buildMinioObjectPrefix('patient_avatar', patientRow.patientNumber)}/`;
    if (!key.startsWith(expectedPrefix) && !isPatientProfileStorageKey(key, patientRow.patientNumber)) {
      throw new BadRequestException('Invalid profile photo storage key');
    }

    await this.db
      .update(user)
      .set({ avatarUrl: key })
      .where(eq(user.id, patientRow.userId));

    await this.db
      .update(patient)
      .set({ avatarUrl: key })
      .where(eq(patient.id, patientRow.id));

    return { avatarUrl: await this.avatarUrlResolver.resolve(key) };
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

  private mapExercise(
    raw?: string,
  ):
    | 'none'
    | 'rarely-monthly'
    | 'occasional-monthly'
    | '1-week'
    | '1-2'
    | '3-4'
    | '5+'
    | 'daily'
    | undefined {
    if (!raw) return undefined;

    const normalized = new Set([
      'none',
      'rarely-monthly',
      'occasional-monthly',
      '1-week',
      '1-2',
      '3-4',
      '5+',
      'daily',
    ] as const);

    if (normalized.has(raw as never)) {
      return raw as (typeof normalized extends Set<infer T> ? T : never);
    }

    // Legacy assistant UI values
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
