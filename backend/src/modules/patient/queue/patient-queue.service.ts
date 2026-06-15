import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider';
import {
  appointment,
  doctor,
  patient,
  patientQueue,
  user,
} from '../../../database/schema';

const AVG_EXAM_MIN = 10;
const CLINIC_NAME = 'ICARE-CVD';

@Injectable()
export class PatientQueueService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getTodayQueue(userId: number) {
    // ── 1. Resolve patient row ──────────────────────────────────────────────
    const [patientRow] = await this.db
      .select({
        id: patient.id,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nationalId: patient.nationalId,
      })
      .from(patient)
      .where(eq(patient.userId, userId))
      .limit(1);

    if (!patientRow) return { visit: null, page: null };

    // ── 2. Today's bounds ──────────────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // ── 3. Today's active appointment for this patient ─────────────────────
    const [apptRow] = await this.db
      .select({
        apptId: appointment.id,
        doctorId: appointment.doctorId,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.patientId, patientRow.id),
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
          ne(appointment.status, 'cancelled'),
        ),
      )
      .limit(1);

    if (!apptRow) return { visit: null, page: this.buildPage(patientRow) };

    // ── 4. Queue entry for this appointment ────────────────────────────────
    const [queueRow] = await this.db
      .select({
        id: patientQueue.id,
        status: patientQueue.status,
        roomNumber: patientQueue.roomNumber,
        estimatedDurationMin: patientQueue.estimatedDurationMin,
        arrivedAt: patientQueue.arrivedAt,
        waitingSince: patientQueue.waitingSince,
        startedAt: patientQueue.startedAt,
        completedAt: patientQueue.completedAt,
      })
      .from(patientQueue)
      .where(eq(patientQueue.appointmentId, apptRow.apptId))
      .limit(1);

    if (!queueRow) return { visit: null, page: this.buildPage(patientRow) };

    // ── 5. Doctor info ─────────────────────────────────────────────────────
    const [doctorRow] = await this.db
      .select({
        id: doctor.id,
        title: doctor.title,
        specialty: doctor.specialty,
        clinicName: doctor.clinicName,
        clinicLocation: doctor.clinicLocation,
        name: user.name,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.id, apptRow.doctorId))
      .limit(1);

    // ── 6. All of today's queue entries for this doctor ────────────────────
    // (sorted by scheduledAt to assign stable ticket numbers)
    const allEntries = await this.db
      .select({
        id: patientQueue.id,
        status: patientQueue.status,
        scheduledAt: appointment.scheduledAt,
        startedAt: patientQueue.startedAt,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(
          eq(appointment.doctorId, apptRow.doctorId),
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
        ),
      )
      .orderBy(appointment.scheduledAt);

    // ── 7. Compute ticket numbers ──────────────────────────────────────────
    const ticketMap = new Map<string, number>();
    allEntries.forEach((e, idx) => ticketMap.set(e.id, idx + 1));

    const yourTurnNumber = ticketMap.get(queueRow.id) ?? null;

    // Currently in-consultation patient (the one being called now)
    const inConsultEntry = allEntries.find(
      (e) => e.status === 'in-consultation',
    );
    const nowCallingNumber = inConsultEntry
      ? (ticketMap.get(inConsultEntry.id) ?? null)
      : null;

    // Cancelled ticket numbers
    const cancelledTicketNumbers = allEntries
      .filter((e) => e.status === 'cancelled' || e.status === 'no-show')
      .map((e) => ticketMap.get(e.id))
      .filter((n): n is number => n !== undefined);

    // People ahead = active entries scheduled before this patient
    const myScheduledAt = apptRow.scheduledAt;
    const peopleAhead = allEntries.filter(
      (e) =>
        e.scheduledAt < myScheduledAt &&
        (e.status === 'waiting' ||
          e.status === 'arrived' ||
          e.status === 'in-consultation'),
    ).length;

    const avgExamMin =
      (queueRow.estimatedDurationMin ?? AVG_EXAM_MIN);
    const estimatedWaitMin = Math.max(0, peopleAhead * avgExamMin);

    const estimatedFinishTime = new Date(
      Date.now() + estimatedWaitMin * 60 * 1000 + avgExamMin * 60 * 1000,
    ).toISOString();

    const clinicName = doctorRow?.clinicName ?? CLINIC_NAME;
    const department = doctorRow?.specialty ?? 'Cardiology';
    const doctorName = doctorRow?.name ? `Dr. ${doctorRow.name}` : 'Your Doctor';
    const doctorTitle = doctorRow?.title ?? null;
    const roomLabel = queueRow.roomNumber
      ? `${queueRow.roomNumber} · ${doctorRow?.clinicLocation ?? 'Clinic'}`
      : null;

    // ── 8. Stages ──────────────────────────────────────────────────────────
    const stages = this.buildStages(queueRow, doctorName, queueRow.roomNumber);

    // ── 9. Instructions ───────────────────────────────────────────────────
    const instructions = this.buildInstructions();

    // ── 10. Page context ───────────────────────────────────────────────────
    const page = this.buildPage(patientRow, clinicName, department);

    return {
      page,
      visit: {
        queueEntryId: queueRow.id,
        status: queueRow.status,
        scheduledTime: apptRow.scheduledAt.toISOString(),
        doctorName,
        doctorTitle,
        department,
        roomNumber: queueRow.roomNumber ?? null,
        doctorLocationDetail: roomLabel,
        nowCallingNumber,
        yourTurnNumber,
        peopleAhead,
        estimatedWaitMin,
        averageExamMin: avgExamMin,
        estimatedFinishTime,
        callingLocationLabel: inConsultEntry
          ? (queueRow.roomNumber ?? 'Consultation Room')
          : null,
        cancelledTicketNumbers,
        arrivedAt: queueRow.arrivedAt?.toISOString() ?? null,
        waitingSince: queueRow.waitingSince?.toISOString() ?? null,
        startedAt: queueRow.startedAt?.toISOString() ?? null,
        completedAt: queueRow.completedAt?.toISOString() ?? null,
        visitTypeLabel: this.visitTypeLabel(apptRow.visitType),
        stages,
        instructions,
        alertsNote: null,
      },
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private visitTypeLabel(visitType: string): string {
    if (visitType === 'virtual') return 'Virtual consultation';
    if (visitType === 'follow-up') return "Follow-up visit";
    return "Today's clinic visit";
  }

  private computeAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age;
  }

  private buildPage(
    patientRow: {
      id: string;
      dateOfBirth: Date;
      gender: string;
      nationalId: string | null;
    },
    clinicName = CLINIC_NAME,
    department = 'Cardiology department',
  ) {
    return {
      clinicName,
      departmentLabel: department,
      fileNumber: `CV-${patientRow.id.slice(0, 5).toUpperCase()}`,
      genderLabel:
        patientRow.gender === 'female'
          ? 'Female'
          : patientRow.gender === 'other'
            ? 'Other'
            : 'Male',
      age: this.computeAge(patientRow.dateOfBirth),
    };
  }

  private buildStages(
    queueRow: {
      status: string;
      arrivedAt: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      roomNumber: string | null;
    },
    doctorName: string,
    roomNumber: string | null,
  ) {
    const fmt = (d: Date | null) =>
      d
        ? new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).format(d)
        : undefined;

    const status = queueRow.status;
    const isAfter = (s: string) => {
      const order = [
        'scheduled',
        'arrived',
        'waiting',
        'in-consultation',
        'completed',
      ];
      return order.indexOf(status) > order.indexOf(s);
    };

    const checkInStatus =
      status === 'scheduled'
        ? 'pending'
        : 'done';

    const waitingStatus =
      status === 'scheduled' || status === 'arrived'
        ? 'pending'
        : status === 'waiting'
          ? 'in-progress'
          : 'done';

    const examStatus =
      status === 'in-consultation'
        ? 'in-progress'
        : isAfter('in-consultation')
          ? 'done'
          : 'pending';

    return [
      {
        id: 'check-in',
        title: 'Check-in',
        detail: 'Registered at reception',
        status: checkInStatus,
        timeLabel: fmt(queueRow.arrivedAt ?? null),
        locationLabel: 'Reception',
      },
      {
        id: 'wait-exam',
        title: 'Waiting for examination',
        detail: `With ${doctorName}${roomNumber ? ` · ${roomNumber}` : ''}`,
        status: waitingStatus,
        locationLabel: 'Waiting area',
      },
      {
        id: 'exam',
        title: 'Examination & consultation',
        detail: 'Starts when your turn number is called',
        status: examStatus,
        timeLabel: fmt(queueRow.startedAt ?? null),
        locationLabel: roomNumber ?? undefined,
      },
      {
        id: 'prescription',
        title: 'Prescription from your doctor',
        detail: 'Issued at the end of your consultation',
        status: isAfter('completed') ? 'done' : status === 'completed' ? 'in-progress' : 'pending',
      },
    ];
  }

  private buildInstructions() {
    return [
      {
        id: 'i1',
        icon: 'shield',
        title: 'Relax in our lounge',
        body: 'Please make yourself comfortable nearby. We will call your number as soon as the doctor is ready for you.',
      },
      {
        id: 'i2',
        icon: 'file',
        title: 'Prepare your documents',
        body: 'Having your ID and insurance card handy helps us get you to your doctor faster and smoother.',
      },
      {
        id: 'i3',
        icon: 'clock',
        title: 'About your wait time',
        body: 'Our times are estimates as we give each patient the care they need. Thank you for your patience!',
      },
      {
        id: 'i4',
        icon: 'heart',
        title: 'Your health updates',
        body: 'Feel free to share any new symptoms or medication changes with the nurse before your visit begins.',
      },
    ];
  }
}
