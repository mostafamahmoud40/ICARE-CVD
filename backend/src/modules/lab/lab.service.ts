import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  doctor,
  labOrder,
  labOrderItem,
  labReportPanel,
  labResult,
  patient,
  patientDocument,
  user,
} from '../../database/schema';
import {
  LAB_REPORT_MAX_BYTES,
  LAB_REPORT_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import { isMinioKeyForCategory } from '../../shared/storage/minio-patient-path';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateLabOrderDto,
  CreateLabResultDto,
  ImportLabReportPanelDto,
  PatientLabReportDocumentDto,
  PatientSubmitLabReportDto,
  UpdateLabOrderDto,
} from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly minioService: MinioService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listLabOrders(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.labOrder.findMany({
      where: eq(labOrder.patientId, patientId),
      orderBy: desc(labOrder.createdAt),
    });
  }

  async getLabOrder(doctorUserId: number, orderId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const order = await this.db.query.labOrder.findFirst({
      where: eq(labOrder.id, orderId),
    });
    if (!order) throw new NotFoundException('Lab order not found');

    const items = await this.db.query.labOrderItem.findMany({
      where: eq(labOrderItem.labOrderId, orderId),
    });

    return { ...order, items };
  }

  async createLabOrder(
    doctorUserId: number,
    patientId: string,
    dto: CreateLabOrderDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [order] = await this.db
      .insert(labOrder)
      .values({
        patientId,
        orderedByDoctorId: doctorRow.id,
        appointmentId: dto.appointmentId,
        priority: dto.priority ?? 'routine',
        notes: dto.notes,
        status: 'ordered',
      })
      .returning();

    if (dto.items && dto.items.length > 0) {
      await this.db.insert(labOrderItem).values(
        dto.items.map((item) => ({
          labOrderId: order.id,
          testName: item.testName,
          loincCode: item.loincCode,
          panel: item.panel,
        })),
      );
    }

    const [doctorUser] = await this.db
      .select({ name: user.name })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.id, doctorRow.id))
      .limit(1);

    const testLabel =
      dto.items?.[0]?.testName?.trim() ||
      dto.items?.[0]?.panel?.trim() ||
      'lab tests';

    void this.notificationsService
      .dispatch({
        userId: patientRow.userId,
        kind: 'lab_result',
        title: 'New lab order',
        body: `Dr. ${doctorUser?.name ?? 'Your doctor'} ordered ${testLabel}.`,
        href: '/lab-orders',
        metadata: { labOrderId: order.id, patientId },
      })
      .catch(() => undefined);

    return this.getLabOrder(doctorUserId, order.id);
  }

  async updateLabOrder(
    doctorUserId: number,
    orderId: string,
    dto: UpdateLabOrderDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.labOrder.findFirst({
      where: eq(labOrder.id, orderId),
    });
    if (!existing) throw new NotFoundException('Lab order not found');

    const [updated] = await this.db
      .update(labOrder)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(labOrder.id, orderId))
      .returning();

    return updated;
  }

  async cancelLabOrder(doctorUserId: number, orderId: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.labOrder.findFirst({
      where: eq(labOrder.id, orderId),
    });
    if (!existing) throw new NotFoundException('Lab order not found');

    const [updated] = await this.db
      .update(labOrder)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledByUserId: doctorRow.userId,
        updatedAt: new Date(),
      })
      .where(eq(labOrder.id, orderId))
      .returning();

    return updated;
  }

  async listPatientLabOrders(userId: number) {
    const patientRow = await this.findPatientByUserId(userId);

    const orders = await this.db.query.labOrder.findMany({
      where: and(
        eq(labOrder.patientId, patientRow.id),
        inArray(labOrder.status, ['ordered', 'collected', 'resulted', 'cancelled']),
      ),
      orderBy: desc(labOrder.createdAt),
    });

    if (orders.length === 0) return [];

    const orderIds = orders.map((order) => order.id);
    const doctorIds = [
      ...new Set(
        orders
          .map((order) => order.orderedByDoctorId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [items, doctors] = await Promise.all([
      this.db.query.labOrderItem.findMany({
        where: inArray(labOrderItem.labOrderId, orderIds),
      }),
      doctorIds.length === 0
        ? Promise.resolve([])
        : this.db
            .select({
              doctorId: doctor.id,
              doctorName: user.name,
            })
            .from(doctor)
            .innerJoin(user, eq(doctor.userId, user.id))
            .where(inArray(doctor.id, doctorIds)),
    ]);

    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsByOrder.get(item.labOrderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.labOrderId, list);
    }

    const doctorNameById = new Map<string, string>();
    for (const row of doctors) {
      doctorNameById.set(row.doctorId, row.doctorName ?? 'Doctor');
    }

    return orders.map((order) => {
      const orderItems = itemsByOrder.get(order.id) ?? [];
      const dueAt = this.computeLabOrderDueAt(order.createdAt, order.priority);
      const doctorName = order.orderedByDoctorId
        ? this.formatDoctorName(doctorNameById.get(order.orderedByDoctorId))
        : 'Your doctor';

      return {
        id: order.id,
        title: this.buildLabOrderTitle(orderItems),
        tests: orderItems.map((item) => item.testName),
        orderedAt: order.createdAt.toISOString(),
        dueAt: dueAt.toISOString(),
        doctorName,
        status: this.mapPatientLabOrderStatus(order.status, dueAt),
        notes: order.notes ?? undefined,
        priority: order.priority,
      };
    });
  }

  async createPatientLabReportUploadIntent(
    userId: number,
    orderId: string,
    fileName: string,
    contentType: string,
  ) {
    const { patientRow, order } = await this.requirePatientLabOrder(
      userId,
      orderId,
    );
    this.assertLabOrderAcceptsUpload(order);

    const mimeType = contentType.trim().toLowerCase();
    if (!LAB_REPORT_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported lab report file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'lab_report',
      patientId: patientRow.id,
      patientNumber: patientRow.patientNumber,
    });
  }

  async createPatientLabReportDocument(
    userId: number,
    orderId: string,
    dto: PatientLabReportDocumentDto,
  ) {
    const { patientRow, order } = await this.requirePatientLabOrder(
      userId,
      orderId,
    );
    this.assertLabOrderAcceptsUpload(order);

    if (!isMinioKeyForCategory(dto.s3Key, 'lab_report', patientRow.patientNumber)) {
      throw new BadRequestException('Invalid lab report storage key');
    }

    if (dto.fileSize > LAB_REPORT_MAX_BYTES) {
      throw new BadRequestException('Lab report file exceeds allowed size');
    }

    const [doc] = await this.db
      .insert(patientDocument)
      .values({
        userId: patientRow.userId,
        patientId: patientRow.id,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.fileSize,
        category: 'lab_report',
        uploadedByUserId: userId,
        s3Key: dto.s3Key,
      })
      .returning();

    return doc;
  }

  async submitPatientLabReport(
    userId: number,
    orderId: string,
    dto: PatientSubmitLabReportDto,
  ) {
    const { patientRow, order } = await this.requirePatientLabOrder(
      userId,
      orderId,
    );
    this.assertLabOrderAcceptsUpload(order);

    const document = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, dto.documentId),
        eq(patientDocument.patientId, patientRow.id),
      ),
    });
    if (!document) throw new NotFoundException('Document not found');

    const panel = await this.persistLabReportPanel({
      patientId: patientRow.id,
      document,
      labOrderId: orderId,
      panelTitle: dto.panelTitle,
      analysis: dto.analysis,
      orderedBy: 'Patient upload',
    });

    await this.db
      .update(labOrder)
      .set({
        status: 'resulted',
        updatedAt: new Date(),
      })
      .where(eq(labOrder.id, orderId));

    const [doctorUser] = order.orderedByDoctorId
      ? await this.db
          .select({ userId: user.id, name: user.name })
          .from(doctor)
          .innerJoin(user, eq(doctor.userId, user.id))
          .where(eq(doctor.id, order.orderedByDoctorId))
          .limit(1)
      : [];

    if (doctorUser) {
      const [patientUser] = await this.db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, patientRow.userId))
        .limit(1);

      void this.notificationsService
        .dispatch({
          userId: doctorUser.userId,
          kind: 'lab_result',
          title: 'Lab report uploaded',
          body: `${patientUser?.name ?? 'A patient'} uploaded lab results for ${dto.panelTitle}.`,
          href: `/doctor-patients/${patientRow.id}`,
          metadata: { labOrderId: orderId, patientId: patientRow.id },
        })
        .catch(() => undefined);
    }

    return panel;
  }

  async listLabResults(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.labResult.findMany({
      where: eq(labResult.patientId, patientId),
      orderBy: desc(labResult.resultAt),
    });
  }

  async listPatientLabResults(userId: number) {
    const patientRow = await this.findPatientByUserId(userId);

    const rows = await this.db.query.labResult.findMany({
      where: eq(labResult.patientId, patientRow.id),
      orderBy: desc(labResult.resultAt),
      limit: 24,
    });

    return rows.map((row) => ({
      id: row.id,
      testName: row.testName,
      value: row.value,
      unit: row.unit,
      referenceRange: row.referenceRange,
      status: row.status,
      resultAt: row.resultAt.toISOString(),
    }));
  }

  async createLabResult(
    doctorUserId: number,
    patientId: string,
    dto: CreateLabResultDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [result] = await this.db
      .insert(labResult)
      .values({
        patientId,
        labOrderItemId: dto.labOrderItemId,
        documentId: dto.documentId,
        testName: dto.testName,
        value: dto.value,
        unit: dto.unit,
        referenceRange: dto.referenceRange,
        status: dto.status ?? 'normal',
      })
      .returning();

    if (result.status && result.status !== 'normal') {
      void this.notificationsService
        .dispatch({
          userId: patientRow.userId,
          kind: 'lab_result',
          title: 'Lab result available',
          body: `Your ${result.testName} result is ready to review.`,
          href: '/lab-orders',
          metadata: { labResultId: result.id, patientId },
        })
        .catch(() => undefined);
    }

    return result;
  }

  async listLabReportPanels(
    doctorUserId: number,
    patientId: string,
    consultationId?: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const conditions = [eq(labReportPanel.patientId, patientId)];
    if (consultationId) {
      conditions.push(eq(labReportPanel.consultationId, consultationId));
    }

    const panels = await this.db.query.labReportPanel.findMany({
      where: and(...conditions),
      orderBy: desc(labReportPanel.createdAt),
    });

    const documentIds = panels
      .map((panel) => panel.documentId)
      .filter((id): id is string => Boolean(id));

    const documents =
      documentIds.length === 0
        ? []
        : await this.db.query.patientDocument.findMany({
            where: eq(patientDocument.patientId, patientId),
          });

    const docById = new Map(documents.map((doc) => [doc.id, doc]));

    return panels.map((panel) => ({
      ...panel,
      document: panel.documentId ? docById.get(panel.documentId) ?? null : null,
    }));
  }

  async importLabReportPanel(
    doctorUserId: number,
    patientId: string,
    dto: ImportLabReportPanelDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const document = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, dto.documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!document) throw new NotFoundException('Document not found');

    const analysis = dto.analysis as {
      facility?: { doctorName?: string };
    };

    const orderedBy =
      dto.orderedBy ??
      analysis.facility?.doctorName ??
      doctorRow.userId.toString();

    return this.persistLabReportPanel({
      patientId,
      document,
      labOrderId: dto.labOrderId,
      consultationId: dto.consultationId,
      panelTitle: dto.panelTitle,
      analysis: dto.analysis,
      orderedBy,
    });
  }

  async deleteLabReportPanel(
    doctorUserId: number,
    patientId: string,
    panelId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const panel = await this.db.query.labReportPanel.findFirst({
      where: and(
        eq(labReportPanel.id, panelId),
        eq(labReportPanel.patientId, patientId),
      ),
    });
    if (!panel) throw new NotFoundException('Lab report panel not found');

    if (panel.documentId) {
      await this.db
        .delete(labResult)
        .where(eq(labResult.documentId, panel.documentId));

      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, panel.documentId),
      });
      if (doc) {
        if (isMinioKeyForCategory(doc.s3Key, 'lab_report')) {
          await this.minioService.deleteObject(doc.s3Key);
        }
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db.delete(labReportPanel).where(eq(labReportPanel.id, panelId));

    return { success: true };
  }

  private async findPatientByUserId(userId: number) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (!patientRow) {
      throw new NotFoundException('Patient profile not found');
    }
    return patientRow;
  }

  private async requirePatientLabOrder(userId: number, orderId: string) {
    const patientRow = await this.findPatientByUserId(userId);
    const order = await this.db.query.labOrder.findFirst({
      where: and(
        eq(labOrder.id, orderId),
        eq(labOrder.patientId, patientRow.id),
      ),
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return { patientRow, order };
  }

  private assertLabOrderAcceptsUpload(order: typeof labOrder.$inferSelect) {
    if (order.status === 'cancelled') {
      throw new BadRequestException('This lab order was cancelled');
    }
    if (order.status === 'resulted') {
      throw new BadRequestException('Results were already uploaded for this order');
    }
  }

  private computeLabOrderDueAt(
    createdAt: Date,
    priority: 'routine' | 'urgent' | 'stat',
  ) {
    const due = new Date(createdAt);
    const days =
      priority === 'stat' ? 1 : priority === 'urgent' ? 3 : 7;
    due.setDate(due.getDate() + days);
    due.setHours(23, 59, 0, 0);
    return due;
  }

  private mapPatientLabOrderStatus(
    status: 'draft' | 'ordered' | 'collected' | 'resulted' | 'cancelled',
    dueAt: Date,
  ): 'ordered' | 'uploaded' | 'missing' | 'cancelled' {
    if (status === 'cancelled') return 'cancelled';
    if (status === 'resulted') return 'uploaded';
    if (new Date() > dueAt) return 'missing';
    return 'ordered';
  }

  private buildLabOrderTitle(items: Array<{ testName: string; panel: string | null }>) {
    const panels = [
      ...new Set(items.map((item) => item.panel?.trim()).filter(Boolean)),
    ] as string[];

    if (panels.length === 1) return panels[0];
    if (panels.length > 1) return panels.join(' & ');

    const tests = items.map((item) => item.testName).filter(Boolean);
    if (tests.length <= 3) return tests.join(', ');
    return `${tests.slice(0, 2).join(', ')} & ${tests.length - 2} more`;
  }

  private formatDoctorName(name: string | undefined) {
    const trimmed = name?.trim() || 'Doctor';
    return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
  }

  private async persistLabReportPanel(params: {
    patientId: string;
    document: typeof patientDocument.$inferSelect;
    labOrderId?: string;
    consultationId?: string;
    panelTitle?: string;
    analysis: Record<string, unknown>;
    orderedBy: string;
  }) {
    const analysis = params.analysis as {
      facility?: { doctorName?: string };
      patient?: { dateReported?: string };
      results?: Array<{
        testName?: string;
        value?: string;
        unit?: string;
        referenceRange?: string;
        status?: string;
      }>;
      summary?: string;
    };

    const summary =
      typeof analysis.summary === 'string' ? analysis.summary : null;
    const resultAt = analysis.patient?.dateReported
      ? new Date(analysis.patient.dateReported)
      : new Date();

    const [panel] = await this.db
      .insert(labReportPanel)
      .values({
        patientId: params.patientId,
        documentId: params.document.id,
        consultationId: params.consultationId,
        labOrderId: params.labOrderId,
        panelTitle:
          params.panelTitle ?? params.document.fileName ?? 'Lab report',
        analysisJson: JSON.stringify(params.analysis),
        summary,
        orderedBy: params.orderedBy,
        resultAt,
      })
      .returning();

    await this.insertLabResultsFromAnalysis({
      patientId: params.patientId,
      documentId: params.document.id,
      analysis,
      orderedBy: params.orderedBy,
      resultAt,
    });

    return {
      ...panel,
      document: params.document,
    };
  }

  private async insertLabResultsFromAnalysis(params: {
    patientId: string;
    documentId: string;
    analysis: {
      results?: Array<{
        testName?: string;
        value?: string;
        unit?: string;
        referenceRange?: string;
        status?: string;
      }>;
    };
    orderedBy: string;
    resultAt: Date;
  }) {
    const rows = params.analysis.results ?? [];
    if (rows.length === 0) return;

    await this.db.insert(labResult).values(
      rows
        .filter((row) => row.testName && row.value)
        .map((row) => ({
          patientId: params.patientId,
          documentId: params.documentId,
          testName: String(row.testName).slice(0, 200),
          value: String(row.value).slice(0, 100),
          unit: row.unit ? String(row.unit).slice(0, 50) : null,
          referenceRange: row.referenceRange
            ? String(row.referenceRange).slice(0, 120)
            : null,
          status: this.mapAiStatus(row.status),
          orderedBy: params.orderedBy,
          resultAt: params.resultAt,
        })),
    );
  }

  private mapAiStatus(
    status: string | undefined,
  ): 'normal' | 'high' | 'low' | 'critical' {
    const normalized = String(status ?? 'normal').trim().toLowerCase();
    if (
      normalized === 'high' ||
      normalized === 'low' ||
      normalized === 'critical'
    ) {
      return normalized;
    }
    return 'normal';
  }
}
