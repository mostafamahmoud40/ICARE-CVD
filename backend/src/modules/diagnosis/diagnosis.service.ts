import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { diagnosis, patient } from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  CreateDiagnosisDto,
  UpdateDiagnosisDto,
} from './dto/diagnosis.dto';

@Injectable()
export class DiagnosisService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async listDiagnoses(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

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
    await this.doctorVerifier.verify(doctorUserId);

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
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

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
        category: dto.category ?? 'other',
        chronicFlag: dto.chronicFlag ?? false,
        infectiousFlag: dto.infectiousFlag ?? false,
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
    await this.doctorVerifier.verify(doctorUserId);

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
    await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.diagnosis.findFirst({
      where: eq(diagnosis.id, diagnosisId),
    });
    if (!existing) throw new NotFoundException('Diagnosis not found');

    await this.db.delete(diagnosis).where(eq(diagnosis.id, diagnosisId));
    return { success: true };
  }
}
