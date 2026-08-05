import { randomInt } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, lt, ne } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  appointmentAttachment,
  doctor,
  patient,
  patientQueue,
  user,
} from '../../database/schema';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentPatientNotificationService } from './appointment-patient-notification.service';
import { AppointmentAssistantNotificationService } from './appointment-assistant-notification.service';
import { AppointmentDoctorNotificationService } from './appointment-doctor-notification.service';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { allocatePatientNumber } from '../../shared/patient/patient-number';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';

@Injectable()
export class AppointmentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly appointmentPatientNotifications: AppointmentPatientNotificationService,
    private readonly appointmentAssistantNotifications: AppointmentAssistantNotificationService,
    private readonly appointmentDoctorNotifications: AppointmentDoctorNotificationService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
    private readonly doctorAvailability: DoctorAvailabilityService,
  ) {}

  async listDoctors() {
    const rows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        experienceYears: doctor.experienceYears,
        avatarUrl: user.avatarUrl,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(and(eq(user.role, 'doctor'), eq(user.isActive, true)));

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        name: row.name,
        title: row.specialty ?? 'Cardiologist',
        experience: `${row.experienceYears ?? 0}+ Years Exp.`,
        avatarUrl: await this.avatarUrlResolver.resolve(row.avatarUrl),
        specialties: [
          {
            icon: 'heart',
            label: row.specialty ?? 'Cardiology',
            color: 'primary' as const,
          },
        ],
      })),
    );
  }

  async listDoctorDirectory() {
    const rows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        experienceYears: doctor.experienceYears,
        avatarUrl: user.avatarUrl,
        acceptedVisitModes: doctor.acceptedVisitModes,
        clinicConsultationFee: doctor.clinicConsultationFee,
        onlineConsultationFee: doctor.onlineConsultationFee,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(and(eq(user.role, 'doctor'), eq(user.isActive, true)));

    return Promise.all(rows.map((row) => this.buildDoctorDirectoryEntry(row)));
  }

  async getDoctorDirectoryEntry(doctorId: string) {
    const row = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        experienceYears: doctor.experienceYears,
        avatarUrl: user.avatarUrl,
        acceptedVisitModes: doctor.acceptedVisitModes,
        clinicConsultationFee: doctor.clinicConsultationFee,
        onlineConsultationFee: doctor.onlineConsultationFee,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(
        and(
          eq(doctor.id, doctorId),
          eq(user.role, 'doctor'),
          eq(user.isActive, true),
        ),
      )
      .limit(1);

    if (!row[0]) {
      throw new NotFoundException('Doctor not found');
    }

    return this.buildDoctorDirectoryEntry(row[0]);
  }

  async getDoctorAvailability(doctorId: string, from?: string, days = 14) {
    await this.autoMarkStaleNoShows(doctorId);
    return this.doctorAvailability.getDoctorAvailability(doctorId, from, days);
  }

  async listPatientAppointments(userId: number) {
    await this.autoMarkStaleNoShows();

    const patientRow = await this.getOrCreatePatientProfile(userId);

    let rows: Array<{
      id: string;
      confirmationCode: string;
      scheduledAt: Date;
      visitType: string;
      status: string;
      reason: string | null;
      symptoms: string | null;
      notes: string | null;
      doctorName: string;
      doctorSpecialty: string | null;
      doctorAvatarUrl: string | null;
    }> = [];

    try {
      rows = await this.db
        .select({
          id: appointment.id,
          confirmationCode: appointment.confirmationCode,
          scheduledAt: appointment.scheduledAt,
          visitType: appointment.visitType,
          status: appointment.status,
          reason: appointment.reason,
          symptoms: appointment.symptoms,
          notes: appointment.notes,
          doctorName: user.name,
          doctorSpecialty: doctor.specialty,
          doctorAvatarUrl: user.avatarUrl,
        })
        .from(appointment)
        .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
        .innerJoin(user, eq(doctor.userId, user.id))
        .where(eq(appointment.patientId, patientRow.id))
        .orderBy(desc(appointment.scheduledAt));
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === '42P01') {
        return [];
      }
      throw error;
    }

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        confirmationCode: row.confirmationCode,
        scheduledAt: row.scheduledAt.toISOString(),
        department: row.doctorSpecialty ?? 'Cardiology',
        clinician: row.doctorName,
        clinicianAvatarUrl: await this.avatarUrlResolver.resolve(
          row.doctorAvatarUrl,
        ),
        location:
          row.visitType === 'virtual'
            ? 'Virtual Consultation'
            : 'ICARE-CVD Main Center',
        status: row.status,
        notes: row.notes ?? undefined,
        symptoms: row.symptoms ?? undefined,
        visitType: row.visitType,
        reason: row.reason ?? undefined,
      })),
    );
  }

  async create(userId: number, dto: CreateAppointmentDto) {
    const patientRow = await this.getOrCreatePatientProfile(userId);
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    const doctorExists = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, dto.doctorId),
    });
    if (!doctorExists) {
      throw new NotFoundException('Doctor not found');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    if (this.doctorAvailability.isScheduledAtInPast(scheduledAt)) {
      throw new BadRequestException('Cannot book a slot in the past');
    }

    const alreadyBooked = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.doctorId, dto.doctorId),
        eq(appointment.scheduledAt, scheduledAt),
        ne(appointment.status, 'cancelled'),
      ),
    });
    if (alreadyBooked) {
      throw new BadRequestException('This slot is already booked');
    }

    const code = await this.generateConfirmationCode();
    const [created] = await this.db
      .insert(appointment)
      .values({
        confirmationCode: code,
        patientId: patientRow.id,
        doctorId: dto.doctorId,
        scheduledAt,
        visitType: dto.visitType,
        status: 'scheduled',
        reason,
        symptoms: dto.symptoms ?? null,
      })
      .returning();

    if (dto.attachments && dto.attachments.length > 0) {
      await this.db.insert(appointmentAttachment).values(
        dto.attachments.map((item) => ({
          appointmentId: created.id,
          documentId: item.documentId,
          category: item.category,
        })),
      );
    }

    void this.appointmentPatientNotifications
      .notifyBooked(created.id)
      .catch(() => undefined);
    void this.appointmentAssistantNotifications
      .notifyPatientBooked(created.id)
      .catch(() => undefined);
    void this.appointmentDoctorNotifications
      .notifyPatientBooked(created.id)
      .catch(() => undefined);

    return {
      id: created.id,
      confirmationCode: created.confirmationCode,
      scheduledAt: created.scheduledAt.toISOString(),
      status: created.status,
      visitType: created.visitType,
    };
  }

  async update(
    userId: number,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const patientRow = await this.getOrCreatePatientProfile(userId);

    const existing = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.id, appointmentId),
        eq(appointment.patientId, patientRow.id),
      ),
    });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const [updated] = await this.db
      .update(appointment)
      .set({
        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : existing.scheduledAt,
        status: dto.status ?? existing.status,
        visitType: dto.visitType ?? existing.visitType,
        notes: dto.notes ?? existing.notes,
        cancelledAt:
          dto.status === 'cancelled' ? new Date() : existing.cancelledAt,
        updatedAt: new Date(),
      })
      .where(eq(appointment.id, existing.id))
      .returning();

    void this.appointmentPatientNotifications
      .notifyAfterUpdate(existing, updated)
      .catch(() => undefined);
    void this.appointmentAssistantNotifications
      .notifyAfterPatientUpdate(existing, updated)
      .catch(() => undefined);
    void this.appointmentDoctorNotifications
      .notifyAfterPatientUpdate(existing, updated)
      .catch(() => undefined);

    return {
      id: updated.id,
      confirmationCode: updated.confirmationCode,
      scheduledAt: updated.scheduledAt.toISOString(),
      status: updated.status,
      visitType: updated.visitType,
      notes: updated.notes,
    };
  }

  async cancel(userId: number, appointmentId: string) {
    return this.update(userId, appointmentId, { status: 'cancelled' });
  }

  async findUpcomingByConfirmationCode(
    userId: number,
    confirmationCode: string,
  ) {
    const code = confirmationCode.trim().toUpperCase();
    const appts = await this.listPatientAppointments(userId);
    const match = appts.find(
      (a) =>
        a.confirmationCode.toUpperCase() === code &&
        a.status !== 'cancelled' &&
        new Date(a.scheduledAt) >= new Date(),
    );
    if (!match) {
      throw new NotFoundException(
        `No upcoming appointment found with code ${confirmationCode}`,
      );
    }
    return match;
  }

  async cancelAllUpcoming(userId: number) {
    const appts = await this.listPatientAppointments(userId);
    const upcoming = appts.filter(
      (a) => a.status !== 'cancelled' && new Date(a.scheduledAt) >= new Date(),
    );
    if (upcoming.length === 0) {
      return { cancelledCount: 0, confirmationCodes: [] as string[] };
    }

    const codes: string[] = [];
    for (const appt of upcoming) {
      const result = await this.cancel(userId, appt.id);
      codes.push(result.confirmationCode);
    }
    return { cancelledCount: codes.length, confirmationCodes: codes };
  }

  async rescheduleByConfirmationCode(
    userId: number,
    confirmationCode: string,
    scheduledAt: string,
  ) {
    const existing = await this.findUpcomingByConfirmationCode(
      userId,
      confirmationCode,
    );
    const newDate = new Date(scheduledAt);
    if (Number.isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }

    const row = await this.db.query.appointment.findFirst({
      where: eq(appointment.id, existing.id),
      columns: { doctorId: true },
    });
    if (!row) {
      throw new NotFoundException('Appointment not found');
    }

    const taken = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.doctorId, row.doctorId),
        eq(appointment.scheduledAt, newDate),
        ne(appointment.status, 'cancelled'),
        ne(appointment.id, existing.id),
      ),
    });
    if (taken) {
      throw new BadRequestException('This slot is already booked');
    }

    return this.update(userId, existing.id, { scheduledAt });
  }

  async changeVisitTypeByConfirmationCode(
    userId: number,
    confirmationCode: string,
    visitType: 'clinic' | 'virtual',
  ) {
    const existing = await this.findUpcomingByConfirmationCode(
      userId,
      confirmationCode,
    );
    return this.update(userId, existing.id, { visitType });
  }

  private async generateConfirmationCode() {
    for (let i = 0; i < 10; i += 1) {
      const candidate = `ICV-${randomInt(1000, 10000)}`;
      const exists = await this.db.query.appointment.findFirst({
        where: eq(appointment.confirmationCode, candidate),
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Unable to generate confirmation code');
  }

  private async getOrCreatePatientProfile(userId: number) {
    const existing = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (existing) return existing;

    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }
    if (userRow.role !== 'patient') {
      throw new ForbiddenException('Patient access required');
    }

    const patientNumber = await allocatePatientNumber(this.db);

    const [created] = await this.db
      .insert(patient)
      .values({
        userId,
        patientNumber,
        dateOfBirth: new Date('2000-01-01'),
        gender: 'other',
      })
      .returning();

    return created;
  }

  async autoMarkStaleNoShows(doctorId?: string): Promise<void> {
    const now = new Date();
    const conditions = [
      lt(appointment.scheduledAt, now),
      ne(appointment.status, 'cancelled'),
      ne(appointment.status, 'completed'),
    ];
    if (doctorId) {
      conditions.push(eq(appointment.doctorId, doctorId));
    }

    const rows = await this.db
      .select({
        appointmentId: appointment.id,
        queueId: patientQueue.id,
        queueStatus: patientQueue.status,
      })
      .from(appointment)
      .leftJoin(patientQueue, eq(patientQueue.appointmentId, appointment.id))
      .where(and(...conditions));

    const skipQueueStatuses = new Set([
      'arrived',
      'waiting',
      'in-consultation',
      'report-pending',
      'completed',
      'no-show',
      'cancelled',
    ]);

    for (const row of rows) {
      if (row.queueStatus && skipQueueStatuses.has(row.queueStatus)) {
        continue;
      }

      if (row.queueId) {
        await this.db
          .update(patientQueue)
          .set({ status: 'no-show', updatedAt: now })
          .where(eq(patientQueue.id, row.queueId));
      } else {
        await this.db.insert(patientQueue).values({
          appointmentId: row.appointmentId,
          status: 'no-show',
          priority: 'normal',
          updatedAt: now,
        });
      }
    }
  }

  private async buildDoctorDirectoryEntry(row: {
    id: string;
    name: string;
    specialty: string | null;
    experienceYears: number;
    avatarUrl: string | null;
    acceptedVisitModes: string;
    clinicConsultationFee: number;
    onlineConsultationFee: number;
  }) {
    const specialtyLabel = row.specialty ?? 'General practice';
    await this.autoMarkStaleNoShows(row.id);
    const { nextAvailableSlot, availability } =
      await this.doctorAvailability.summarizeDoctorAvailability(row.id);
    const clinicFee = row.clinicConsultationFee ?? 0;
    const onlineFee = row.onlineConsultationFee ?? 0;
    const consultationFee =
      clinicFee > 0 ? clinicFee : onlineFee > 0 ? onlineFee : 150;

    return {
      id: row.id,
      name: row.name,
      title: specialtyLabel,
      specialty: specialtyLabel,
      experienceYears: row.experienceYears ?? 0,
      avatarUrl: await this.avatarUrlResolver.resolve(row.avatarUrl),
      acceptedVisitModes: this.normalizeAcceptedVisitModes(
        row.acceptedVisitModes,
      ),
      clinicConsultationFee: clinicFee,
      onlineConsultationFee: onlineFee,
      consultationFee,
      nextAvailableSlot,
      availability,
    };
  }

  private normalizeAcceptedVisitModes(
    value: string | null | undefined,
  ): 'clinic' | 'virtual' | 'both' {
    if (value === 'clinic' || value === 'virtual') return value;
    return 'both';
  }
}
