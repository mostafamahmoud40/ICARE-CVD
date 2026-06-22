import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  doctor,
  patient,
  procedureConsent,
  procedureOrder,
  procedureRequirement,
  user,
} from '../../database/schema';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { MinioService } from '../../shared/storage/minio.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildProcedureAttachmentKey,
  combineScheduleDateTime,
  computeAgeYears,
  DEFAULT_PROCEDURE_REQUIREMENTS,
  formatDurationLabel,
  formatTimeInClinic,
  mapConsultationPriority,
  mapOperatingRoomLabel,
  mapProcedureTypeLabel,
  parseProcedureDetailsJson,
} from './procedure.mapper';
import type {
  CreateProcedureRequirementDto,
  SaveProcedureConsentDto,
  UpdateProcedureRequirementDto,
} from './dto/procedure.dto';

type OrderRow = typeof procedureOrder.$inferSelect;
const patientUser = alias(user, 'patient_user');
const doctorUser = alias(user, 'doctor_user');

@Injectable()
export class ProcedureService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly avatarUrlResolver: AvatarUrlResolver,
    private readonly minioService: MinioService,
    private readonly notifications: NotificationsService,
  ) {}

  async listAssistantOrders() {
    return this.listOrders();
  }

  async listDoctorOrders(doctorUserId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, doctorUserId),
    });
    if (!doctorRow) return [];

    const rows = await this.db
      .select({ id: procedureOrder.id })
      .from(procedureOrder)
      .where(eq(procedureOrder.doctorId, doctorRow.id))
      .orderBy(desc(procedureOrder.scheduledAt));

    return this.mapOrdersByIds(rows.map((row) => row.id));
  }

  async getAssistantStats() {
    const rows = await this.db
      .select({ status: procedureOrder.status })
      .from(procedureOrder);

    return {
      total: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      inProgress: rows.filter((row) => row.status === 'in-progress').length,
      completed: rows.filter((row) => row.status === 'completed').length,
    };
  }

  async listSchedule(dateIso: string, search?: string) {
    const dayStart = new Date(`${dateIso}T00:00:00`);
    const dayEnd = new Date(`${dateIso}T23:59:59.999`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const rows = await this.db
      .select({ id: procedureOrder.id })
      .from(procedureOrder)
      .where(
        and(
          gte(procedureOrder.scheduledAt, dayStart),
          lte(procedureOrder.scheduledAt, dayEnd),
          inArray(procedureOrder.status, ['pending', 'in-progress', 'completed']),
        ),
      )
      .orderBy(asc(procedureOrder.scheduledAt));

    const orders = await this.mapOrdersByIds(rows.map((row) => row.id));
    const mapped = orders.map((order) => this.toScheduledOperation(order));
    const q = search?.trim().toLowerCase();
    if (!q) return mapped;
    return mapped.filter(
      (op) =>
        op.patientName.toLowerCase().includes(q) ||
        op.procedureName.toLowerCase().includes(q) ||
        op.patientId.toLowerCase().includes(q),
    );
  }

  async listHistory(range: string, search?: string) {
    const now = new Date();
    let from: Date | null = null;
    if (range === '7days') {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
    } else if (range === '30days') {
      from = new Date(now);
      from.setDate(from.getDate() - 30);
    } else if (range === '3months') {
      from = new Date(now);
      from.setMonth(from.getMonth() - 3);
    }

    const conditions = [eq(procedureOrder.status, 'completed')];
    if (from) {
      conditions.push(gte(procedureOrder.scheduledAt, from));
    }

    const rows = await this.db
      .select({ id: procedureOrder.id })
      .from(procedureOrder)
      .where(and(...conditions))
      .orderBy(desc(procedureOrder.scheduledAt));

    const orders = await this.mapOrdersByIds(rows.map((row) => row.id));
    const mapped = orders.map((order) => this.toScheduledOperation(order));
    const q = search?.trim().toLowerCase();
    if (!q) return mapped;
    return mapped.filter(
      (op) =>
        op.patientName.toLowerCase().includes(q) ||
        op.procedureName.toLowerCase().includes(q) ||
        op.patientId.toLowerCase().includes(q),
    );
  }

  async toggleRequirement(
    orderId: string,
    requirementId: string,
    isDone: boolean,
  ) {
    const [updated] = await this.db
      .update(procedureRequirement)
      .set({
        isDone,
        completedAt: isDone ? new Date() : null,
      })
      .where(
        and(
          eq(procedureRequirement.id, requirementId),
          eq(procedureRequirement.orderId, orderId),
        ),
      )
      .returning();

    if (!updated) throw new NotFoundException('Requirement not found');
    return updated;
  }

  async uploadRequirementAttachment(
    orderId: string,
    requirementId: string,
    file: Express.Multer.File,
  ) {
    const context = await this.getOrderContext(orderId);
    const key = buildProcedureAttachmentKey(
      context.patientNumber,
      orderId,
      file.originalname,
    );
    await this.minioService.putObjectBuffer({
      key,
      body: file.buffer,
      contentType: file.mimetype || 'application/octet-stream',
    });

    const [updated] = await this.db
      .update(procedureRequirement)
      .set({
        attachmentKey: key,
        attachmentName: file.originalname,
        isDone: true,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(procedureRequirement.id, requirementId),
          eq(procedureRequirement.orderId, orderId),
        ),
      )
      .returning();

    if (!updated) throw new NotFoundException('Requirement not found');
    return updated;
  }

  async addRequirement(orderId: string, dto: CreateProcedureRequirementDto) {
    const maxSort = await this.db
      .select({ value: sql<number>`coalesce(max(${procedureRequirement.sortOrder}), -1)` })
      .from(procedureRequirement)
      .where(eq(procedureRequirement.orderId, orderId));

    const [created] = await this.db
      .insert(procedureRequirement)
      .values({
        orderId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        kind: 'standard',
        allowsAttachment: dto.allowsAttachment,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        sortOrder: (maxSort[0]?.value ?? -1) + 1,
      })
      .returning();

    return created;
  }

  async editRequirement(
    orderId: string,
    requirementId: string,
    dto: UpdateProcedureRequirementDto,
  ) {
    const [updated] = await this.db
      .update(procedureRequirement)
      .set({
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        allowsAttachment: dto.allowsAttachment,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      })
      .where(
        and(
          eq(procedureRequirement.id, requirementId),
          eq(procedureRequirement.orderId, orderId),
        ),
      )
      .returning();

    if (!updated) throw new NotFoundException('Requirement not found');
    return updated;
  }

  async deleteRequirement(orderId: string, requirementId: string) {
    const [deleted] = await this.db
      .delete(procedureRequirement)
      .where(
        and(
          eq(procedureRequirement.id, requirementId),
          eq(procedureRequirement.orderId, orderId),
        ),
      )
      .returning();

    if (!deleted) throw new NotFoundException('Requirement not found');
    return { ok: true };
  }

  async notifyPatient(orderId: string) {
    const context = await this.getOrderContext(orderId);
    await this.notifications.dispatch({
      userId: context.patientUserId,
      kind: 'procedure',
      title: 'Procedure preparation update',
      body: `Your care team updated preparation steps for ${context.procedureName}. Please review your checklist.`,
      href: '/patient-dashboard',
      metadata: { procedureOrderId: orderId },
    });
    return { ok: true };
  }

  async saveConsent(
    orderId: string,
    dto: SaveProcedureConsentDto,
    file?: Express.Multer.File,
  ) {
    const context = await this.getOrderContext(orderId);
    const requirement = await this.db.query.procedureRequirement.findFirst({
      where: and(
        eq(procedureRequirement.orderId, orderId),
        eq(procedureRequirement.id, dto.requirementId),
      ),
    });
    if (!requirement) throw new NotFoundException('Consent requirement not found');

    let attachmentKey: string | null = null;
    let attachmentName: string | null = null;
    if (file) {
      attachmentKey = buildProcedureAttachmentKey(
        context.patientNumber,
        orderId,
        file.originalname,
      );
      await this.minioService.putObjectBuffer({
        key: attachmentKey,
        body: file.buffer,
        contentType: file.mimetype || 'application/octet-stream',
      });
      attachmentName = file.originalname;
    }

    await this.db
      .insert(procedureConsent)
      .values({
        orderId,
        requirementId: dto.requirementId,
        signerType: dto.signerType,
        signerName: dto.signerName.trim(),
        guardianRelationship: dto.guardianRelationship?.trim() || null,
        collectionMethod: dto.collectionMethod,
        signatureDataUrl: dto.signatureDataUrl ?? null,
        attachmentKey,
        attachmentName,
        signedAt: new Date(dto.signedAt),
      })
      .onConflictDoUpdate({
        target: procedureConsent.orderId,
        set: {
          requirementId: dto.requirementId,
          signerType: dto.signerType,
          signerName: dto.signerName.trim(),
          guardianRelationship: dto.guardianRelationship?.trim() || null,
          collectionMethod: dto.collectionMethod,
          signatureDataUrl: dto.signatureDataUrl ?? null,
          attachmentKey,
          attachmentName,
          signedAt: new Date(dto.signedAt),
        },
      });

    await this.db
      .update(procedureRequirement)
      .set({
        isDone: true,
        completedAt: new Date(dto.signedAt),
        attachmentKey: attachmentKey ?? requirement.attachmentKey,
        attachmentName: attachmentName ?? requirement.attachmentName,
      })
      .where(eq(procedureRequirement.id, dto.requirementId));

    return { ok: true };
  }

  async syncFromConsultation(input: {
    consultationId: string;
    patientId: string;
    doctorId: string;
    procedureDetailsRaw: string | null | undefined;
  }) {
    const parsed = parseProcedureDetailsJson(input.procedureDetailsRaw);
    if (!parsed?.procedureType?.trim() && !parsed?.surgeryDate?.trim()) {
      return null;
    }

    const scheduledAt = combineScheduleDateTime(
      parsed.surgeryDate,
      parsed.startTime,
    );
    const durationMinutes = parsed.estimatedDurationMin ?? null;
    const scheduledEndAt =
      scheduledAt && durationMinutes
        ? new Date(scheduledAt.getTime() + durationMinutes * 60_000)
        : null;

    const existing = await this.db.query.procedureOrder.findFirst({
      where: eq(procedureOrder.consultationId, input.consultationId),
    });

    const values = {
      patientId: input.patientId,
      doctorId: input.doctorId,
      consultationId: input.consultationId,
      procedureName: mapProcedureTypeLabel(parsed.procedureType),
      department: parsed.surgicalSpecialty?.trim() || 'Cardiology',
      scheduledAt,
      scheduledEndAt,
      status: 'pending' as const,
      priority: mapConsultationPriority(parsed.priority),
      location: mapOperatingRoomLabel(parsed.operatingRoom),
      teamStatus: 'Scheduled',
      durationMinutes,
      notes: parsed.clinicalNotes?.trim() || null,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(procedureOrder)
        .set(values)
        .where(eq(procedureOrder.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(procedureOrder)
      .values(values)
      .returning();

    await this.db.insert(procedureRequirement).values(
      DEFAULT_PROCEDURE_REQUIREMENTS.map((item) => ({
        orderId: created.id,
        title: item.title,
        description: item.description,
        kind: item.kind,
        allowsAttachment: item.allowsAttachment,
        sortOrder: item.sortOrder,
      })),
    );

    const assistantUserIds = await this.listActiveAssistantUserIds();
    await Promise.all(
      assistantUserIds.map((userId) =>
        this.notifications.dispatch({
          userId,
          kind: 'procedure',
          title: 'New procedure scheduled',
          body: `${values.procedureName} was scheduled and needs preparation.`,
          href: '/assistant-procedures',
          metadata: { procedureOrderId: created.id, consultationId: input.consultationId },
        }),
      ),
    );

    return created;
  }

  private async listOrders() {
    const rows = await this.db
      .select({ id: procedureOrder.id })
      .from(procedureOrder)
      .orderBy(desc(procedureOrder.createdAt));
    return this.mapOrdersByIds(rows.map((row) => row.id));
  }

  private async mapOrdersByIds(orderIds: string[]) {
    if (orderIds.length === 0) return [];

    const rows = await this.db
      .select({
        order: procedureOrder,
        patientNumber: patient.patientNumber,
        patientDob: patient.dateOfBirth,
        patientGender: patient.gender,
        patientAvatar: patient.avatarUrl,
        patientUserAvatar: patientUser.avatarUrl,
        patientName: patientUser.name,
        patientPhone: patientUser.phone,
        patientUserId: patientUser.id,
        doctorName: doctorUser.name,
        doctorSpecialty: doctor.specialty,
      })
      .from(procedureOrder)
      .innerJoin(patient, eq(procedureOrder.patientId, patient.id))
      .innerJoin(patientUser, eq(patient.userId, patientUser.id))
      .innerJoin(doctor, eq(procedureOrder.doctorId, doctor.id))
      .innerJoin(doctorUser, eq(doctor.userId, doctorUser.id))
      .where(inArray(procedureOrder.id, orderIds));

    const requirements = await this.db
      .select()
      .from(procedureRequirement)
      .where(inArray(procedureRequirement.orderId, orderIds))
      .orderBy(asc(procedureRequirement.sortOrder));

    const consents = await this.db
      .select()
      .from(procedureConsent)
      .where(inArray(procedureConsent.orderId, orderIds));

    const requirementIds = requirements.map((row) => row.id);
    const attachmentUrls = new Map<string, string | null>();
    await Promise.all(
      requirements
        .filter((row) => row.attachmentKey)
        .map(async (row) => {
          attachmentUrls.set(
            row.id,
            await this.avatarUrlResolver.resolve(row.attachmentKey),
          );
        }),
    );

    const consentAttachmentUrls = new Map<string, string | null>();
    await Promise.all(
      consents
        .filter((row) => row.attachmentKey)
        .map(async (row) => {
          consentAttachmentUrls.set(
            row.orderId,
            await this.avatarUrlResolver.resolve(row.attachmentKey),
          );
        }),
    );

    const orderMap = new Map(
      rows.map((row) => {
        const patientAvatarUrl = row.patientAvatar ?? row.patientUserAvatar;
        return [
          row.order.id,
          {
            row,
            patientAvatarUrlPromise: this.avatarUrlResolver.resolve(patientAvatarUrl),
          },
        ];
      }),
    );

    const avatarByOrder = new Map<string, string | null>();
    await Promise.all(
      [...orderMap.entries()].map(async ([orderId, value]) => {
        avatarByOrder.set(orderId, await value.patientAvatarUrlPromise);
      }),
    );

    const byOrderId = new Map<string, ReturnType<ProcedureService['buildOrderDto']>>();
    for (const orderId of orderIds) {
      const entry = orderMap.get(orderId);
      if (!entry) continue;
      const orderRequirements = requirements.filter((row) => row.orderId === orderId);
      const consent = consents.find((row) => row.orderId === orderId) ?? null;
      byOrderId.set(
        orderId,
        this.buildOrderDto({
          row: entry.row,
          patientAvatarUrl: avatarByOrder.get(orderId) ?? null,
          requirements: orderRequirements,
          consent,
          requirementAttachmentUrls: attachmentUrls,
          consentAttachmentUrl: consent
            ? (consentAttachmentUrls.get(orderId) ?? null)
            : null,
        }),
      );
    }

    return orderIds
      .map((orderId) => byOrderId.get(orderId))
      .filter((order): order is NonNullable<typeof order> => Boolean(order));
  }

  private buildOrderDto(input: {
    row: {
      order: OrderRow;
      patientNumber: string;
      patientDob: Date;
      patientGender: 'male' | 'female' | 'other';
      patientName: string;
      patientPhone: string | null;
      doctorName: string;
      doctorSpecialty: string | null;
    };
    patientAvatarUrl: string | null;
    requirements: Array<typeof procedureRequirement.$inferSelect>;
    consent: typeof procedureConsent.$inferSelect | null;
    requirementAttachmentUrls: Map<string, string | null>;
    consentAttachmentUrl: string | null;
  }) {
    const { row } = input;
    return {
      id: row.order.id,
      patientId: row.patientNumber,
      patientName: row.patientName,
      patientAge: computeAgeYears(row.patientDob),
      patientPhone: row.patientPhone,
      patientAvatarUrl: input.patientAvatarUrl,
      patientGender: row.patientGender,
      doctorName: row.doctorName,
      department: row.doctorSpecialty ?? row.order.department,
      procedureName: row.order.procedureName,
      scheduledAt: row.order.scheduledAt?.toISOString() ?? null,
      scheduledEndAt: row.order.scheduledEndAt?.toISOString() ?? null,
      actualEndAt: row.order.actualEndAt?.toISOString() ?? null,
      location: row.order.location,
      teamStatus: row.order.teamStatus,
      durationMinutes: row.order.durationMinutes,
      riskScore: row.order.riskScore,
      riskTags: row.order.riskTags ?? [],
      status: row.order.status,
      priority: row.order.priority,
      notes: row.order.notes,
      createdAt: row.order.createdAt.toISOString(),
      requirements: input.requirements.map((req) => ({
        id: req.id,
        title: req.title,
        description: req.description,
        kind: req.kind,
        allowsAttachment: req.allowsAttachment,
        dueAt: req.dueAt?.toISOString() ?? null,
        isDone: req.isDone,
        completedAt: req.completedAt?.toISOString() ?? null,
        attachmentUrl: req.attachmentKey
          ? (input.requirementAttachmentUrls.get(req.id) ?? null)
          : null,
        attachmentName: req.attachmentName,
      })),
      consent: input.consent
        ? {
            requirementId: input.consent.requirementId,
            signerType: input.consent.signerType,
            signerName: input.consent.signerName,
            guardianRelationship: input.consent.guardianRelationship,
            collectionMethod: input.consent.collectionMethod,
            signatureDataUrl: input.consent.signatureDataUrl,
            attachmentUrl: input.consentAttachmentUrl,
            attachmentName: input.consent.attachmentName,
            signedAt: input.consent.signedAt.toISOString(),
          }
        : null,
    };
  }

  private toScheduledOperation(order: Awaited<ReturnType<ProcedureService['mapOrdersByIds']>>[number]) {
    const scheduledAt = order.scheduledAt ? new Date(order.scheduledAt) : null;
    const scheduledEndAt = order.scheduledEndAt
      ? new Date(order.scheduledEndAt)
      : scheduledAt && order.durationMinutes
        ? new Date(scheduledAt.getTime() + order.durationMinutes * 60_000)
        : null;
    const actualEndAt = order.actualEndAt ? new Date(order.actualEndAt) : null;

    const startTime = scheduledAt ? formatTimeInClinic(scheduledAt) : '—';
    const endTime = scheduledEndAt ? formatTimeInClinic(scheduledEndAt) : '—';
    const endActual = actualEndAt ? formatTimeInClinic(actualEndAt) : undefined;

    return {
      id: order.id,
      startTime,
      endTime,
      endTimeExpected: endTime,
      endTimeActual: endActual,
      patientName: order.patientName,
      patientId: order.patientId,
      patientAvatarUrl: order.patientAvatarUrl,
      age: order.patientAge,
      gender:
        order.patientGender === 'female'
          ? ('F' as const)
          : order.patientGender === 'male'
            ? ('M' as const)
            : ('M' as const),
      procedureName: order.procedureName,
      riskScore: order.riskScore ?? '',
      location: order.location ?? 'Cardiac OR-1',
      riskTags: order.riskTags ?? [],
      duration: formatDurationLabel(order.durationMinutes),
      status: order.status,
      priority: order.priority,
      teamStatus: order.teamStatus ?? 'Scheduled',
      notes: order.notes ?? undefined,
    };
  }

  private async getOrderContext(orderId: string) {
    const [row] = await this.db
      .select({
        patientNumber: patient.patientNumber,
        patientUserId: patientUser.id,
        procedureName: procedureOrder.procedureName,
      })
      .from(procedureOrder)
      .innerJoin(patient, eq(procedureOrder.patientId, patient.id))
      .innerJoin(patientUser, eq(patient.userId, patientUser.id))
      .where(eq(procedureOrder.id, orderId))
      .limit(1);

    if (!row) throw new NotFoundException('Procedure order not found');
    return row;
  }

  private async listActiveAssistantUserIds() {
    const rows = await this.db
      .select({ userId: user.id })
      .from(user)
      .where(and(eq(user.role, 'assistant'), eq(user.isActive, true)));

    return rows.map((row) => row.userId);
  }
}
