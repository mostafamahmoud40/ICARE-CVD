import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { notifyPatientDataChanged } from '../../shared/patient-data-notifier';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  doctor,
  doctorPatient,
  patient,
  user,
  vitalReading,
} from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateVitalReadingDto,
  UpdateVitalReadingDto,
} from './dto/vitals.dto';
import {
  aggregateReadingsByDate,
  buildAiAnalysisItems,
  buildClinicalAlert,
  buildCurrentVitals,
  buildKpiBadges,
  buildTrendSummary,
  isAbnormalVitalReading,
  type VitalReadingSnapshot,
} from './vitals-analytics';

@Injectable()
export class VitalsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly notificationsService: NotificationsService,
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

    notifyPatientDataChanged(patientId, 'vital');

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

  // ===================== PATIENT ENDPOINTS =====================

  async getPatientVitalsOverview(userId: number) {
    const patientRow = await this.getPatientByUserId(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const readings = await this.db.query.vitalReading.findMany({
      where: and(
        eq(vitalReading.patientId, patientRow.id),
        gte(vitalReading.date, cutoff),
      ),
      orderBy: [desc(vitalReading.date), desc(vitalReading.createdAt)],
    });

    const snapshots = readings.map((row) => this.toReadingSnapshot(row));
    const history = aggregateReadingsByDate(snapshots);
    const current = buildCurrentVitals(history);
    const alert = buildClinicalAlert(snapshots, history);
    const summary = buildTrendSummary(history);
    const aiAnalysis = buildAiAnalysisItems(history);
    const kpiBadges = buildKpiBadges(current);

    return {
      history,
      current,
      alert,
      summary,
      aiAnalysis,
      kpiBadges,
    };
  }

  async createPatientVital(userId: number, dto: CreateVitalReadingDto) {
    if (
      dto.systolicBp == null &&
      dto.diastolicBp == null &&
      dto.heartRate == null &&
      dto.oxygenSaturation == null &&
      dto.temperature == null &&
      dto.weight == null &&
      dto.bloodSugar == null
    ) {
      throw new BadRequestException('At least one vital measurement is required');
    }

    if (
      (dto.systolicBp != null && dto.diastolicBp == null) ||
      (dto.systolicBp == null && dto.diastolicBp != null)
    ) {
      throw new BadRequestException(
        'Blood pressure requires both systolic and diastolic values',
      );
    }

    const patientRow = await this.getPatientByUserId(userId);

    const [reading] = await this.db
      .insert(vitalReading)
      .values({
        patientId: patientRow.id,
        date: dto.date ? new Date(dto.date) : undefined,
        time: dto.time,
        source: 'home',
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        heartRate: dto.heartRate,
        oxygenSaturation: dto.oxygenSaturation,
        temperature: dto.temperature?.toString(),
        weight: dto.weight?.toString(),
        bloodSugar: dto.bloodSugar,
        notes: dto.notes,
        recordedByUserId: userId,
      })
      .returning();

    const snapshot = this.toReadingSnapshot(reading);
    if (isAbnormalVitalReading(snapshot)) {
      await this.notifyCareTeam(patientRow.id, patientRow.userId, snapshot);
    }

    notifyPatientDataChanged(patientRow.id, 'vital');

    return reading;
  }

  private async getPatientByUserId(userId: number) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (!patientRow) {
      throw new NotFoundException('Patient profile not found');
    }
    return patientRow;
  }

  private toReadingSnapshot(
    row: typeof vitalReading.$inferSelect,
  ): VitalReadingSnapshot {
    return {
      date: row.date,
      systolicBp: row.systolicBp,
      diastolicBp: row.diastolicBp,
      heartRate: row.heartRate,
      oxygenSaturation: row.oxygenSaturation,
      temperature: row.temperature,
      weight: row.weight,
      notes: row.notes,
    };
  }

  private async notifyCareTeam(
    patientId: string,
    patientUserId: number,
    reading: VitalReadingSnapshot,
  ) {
    const [patientUser] = await this.db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, patientUserId))
      .limit(1);

    const assignments = await this.db
      .select({ doctorUserId: doctor.userId })
      .from(doctorPatient)
      .innerJoin(doctor, eq(doctorPatient.doctorId, doctor.id))
      .where(
        and(
          eq(doctorPatient.patientId, patientId),
          eq(doctorPatient.status, 'active'),
        ),
      );

    const label = reading.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const body =
      reading.systolicBp != null && reading.diastolicBp != null
        ? `${patientUser?.name ?? 'Patient'} logged ${reading.systolicBp}/${reading.diastolicBp} mmHg on ${label}.`
        : `${patientUser?.name ?? 'Patient'} logged abnormal vitals on ${label}.`;

    await Promise.all(
      assignments.map((assignment) =>
        this.notificationsService.dispatch({
          userId: assignment.doctorUserId,
          kind: 'vitals_alert',
          title: 'Critical vitals alert',
          body,
          href: `/doctor-patients/${patientId}/vitals`,
          metadata: {
            patientId,
            systolicBp: reading.systolicBp,
            diastolicBp: reading.diastolicBp,
            heartRate: reading.heartRate,
            oxygenSaturation: reading.oxygenSaturation,
          },
        }),
      ),
    );
  }
}
