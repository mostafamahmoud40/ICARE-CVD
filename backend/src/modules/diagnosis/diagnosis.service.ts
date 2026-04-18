import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { diagnosis, patient, doctor } from '../../database/schema';
import type {
  CreateDiagnosisDto,
  UpdateDiagnosisDto,
} from './dto/diagnosis.dto';

@Injectable()
export class DiagnosisService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listDiagnoses(doctorUserId: number, patientId: string) {
    await this.verifyDoctor(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.diagnosis.findMany({
      where: eq(diagnosis.patientId, patientId),
      orderBy: desc(diagnosis.diagnosedAt),
    });
  }

  async getDiagnosis(doctorUserId: number, diagnosisId: string) {
    await this.verifyDoctor(doctorUserId);

    const row = await this.db.query.diagnosis.findFirst({
      where: eq(diagnosis.id, diagnosisId),
    });
    if (!row) throw new NotFoundException('Diagnosis not found');
    return row;
  }

  async createDiagnosis(
    doctorUserId: number,
    patientId: string,
    dto: CreateDiagnosisDto,
  ) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [created] = await this.db
      .insert(diagnosis)
      .values({
        patientId,
        icdCode: dto.icdCode,
        description: dto.description,
        type: dto.type,
        severity: dto.severity,
        confirmation: dto.confirmation,
        onsetDate: dto.onsetDate,
        status: dto.status ?? 'active',
        laterality: dto.laterality,
        nyhaClass: dto.nyhaClass,
        clinicalNotes: dto.clinicalNotes,
        diagnosedByDoctorId: doctorRow.id,
      })
      .returning();

    return created;
  }

  async updateDiagnosis(
    doctorUserId: number,
    diagnosisId: string,
    dto: UpdateDiagnosisDto,
  ) {
    await this.verifyDoctor(doctorUserId);

    const existing = await this.db.query.diagnosis.findFirst({
      where: eq(diagnosis.id, diagnosisId),
    });
    if (!existing) throw new NotFoundException('Diagnosis not found');

    const resolvedAt =
      String(dto.status) === 'resolved' ? new Date() : existing.resolvedAt;

    const [updated] = await this.db
      .update(diagnosis)
      .set({
        ...dto,
        resolvedAt,
        updatedAt: new Date(),
      })
      .where(eq(diagnosis.id, diagnosisId))
      .returning();

    return updated;
  }

  async deleteDiagnosis(doctorUserId: number, diagnosisId: string) {
    await this.verifyDoctor(doctorUserId);

    const existing = await this.db.query.diagnosis.findFirst({
      where: eq(diagnosis.id, diagnosisId),
    });
    if (!existing) throw new NotFoundException('Diagnosis not found');

    await this.db.delete(diagnosis).where(eq(diagnosis.id, diagnosisId));
    return { success: true };
  }

  private async verifyDoctor(userId: number) {
    const row = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!row) throw new NotFoundException('Doctor profile not found');
    return row;
  }
}
