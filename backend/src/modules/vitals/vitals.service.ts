import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { vitalReading, patient } from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  CreateVitalReadingDto,
  UpdateVitalReadingDto,
} from './dto/vitals.dto';

@Injectable()
export class VitalsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async listVitals(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.vitalReading.findMany({
      where: and(eq(vitalReading.patientId, patientId)),
      orderBy: desc(vitalReading.createdAt),
    });
  }

  async getVital(doctorUserId: number, vitalId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.vitalReading.findFirst({
      where: eq(vitalReading.id, vitalId),
    });
    if (!row) throw new NotFoundException('Vital reading not found');
    return row;
  }

  async createVital(
    doctorUserId: number,
    patientId: string,
    dto: CreateVitalReadingDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [reading] = await this.db
      .insert(vitalReading)
      .values({
        patientId,
        date: dto.date ? new Date(dto.date) : undefined,
        time: dto.time,
        source: dto.source ?? 'clinic',
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        heartRate: dto.heartRate,
        oxygenSaturation: dto.oxygenSaturation,
        temperature: dto.temperature?.toString(),
        weight: dto.weight?.toString(),
        bloodSugar: dto.bloodSugar,
        notes: dto.notes,
        recordedByUserId: doctorRow.userId,
      })
      .returning();

    return reading;
  }

  async updateVital(
    doctorUserId: number,
    vitalId: string,
    dto: UpdateVitalReadingDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.vitalReading.findFirst({
      where: eq(vitalReading.id, vitalId),
    });
    if (!existing) throw new NotFoundException('Vital reading not found');

    const [updated] = await this.db
      .update(vitalReading)
      .set({
        systolicBp: dto.systolicBp ?? existing.systolicBp,
        diastolicBp: dto.diastolicBp ?? existing.diastolicBp,
        heartRate: dto.heartRate ?? existing.heartRate,
        oxygenSaturation: dto.oxygenSaturation ?? existing.oxygenSaturation,
        temperature: dto.temperature?.toString() ?? existing.temperature,
        weight: dto.weight?.toString() ?? existing.weight,
        bloodSugar: dto.bloodSugar ?? existing.bloodSugar,
        notes: dto.notes ?? existing.notes,
        source: dto.source ?? existing.source,
      })
      .where(eq(vitalReading.id, vitalId))
      .returning();

    return updated;
  }

  async deleteVital(doctorUserId: number, vitalId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.vitalReading.findFirst({
      where: eq(vitalReading.id, vitalId),
    });
    if (!existing) throw new NotFoundException('Vital reading not found');

    await this.db.delete(vitalReading).where(eq(vitalReading.id, vitalId));
    return { success: true };
  }

  async getVitalStats(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const readings = await this.db.query.vitalReading.findMany({
      where: eq(vitalReading.patientId, patientId),
      orderBy: desc(vitalReading.createdAt),
      limit: 30,
    });

    if (readings.length === 0) {
      return {
        totalReadings: 0,
        latestBp: null,
        latestHeartRate: null,
        latestOxygenSaturation: null,
        latestTemperature: null,
        latestWeight: null,
        latestBloodSugar: null,
      };
    }

    const latest = readings[0];
    return {
      totalReadings: readings.length,
      latestBp:
        latest.systolicBp && latest.diastolicBp
          ? `${latest.systolicBp}/${latest.diastolicBp}`
          : null,
      latestHeartRate: latest.heartRate,
      latestOxygenSaturation: latest.oxygenSaturation,
      latestTemperature: latest.temperature,
      latestWeight: latest.weight,
      latestBloodSugar: latest.bloodSugar,
    };
  }
}
