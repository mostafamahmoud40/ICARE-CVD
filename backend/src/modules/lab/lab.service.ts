import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  labOrder,
  labOrderItem,
  labReportPanel,
  labResult,
  patient,
  patientDocument,
} from '../../database/schema';
import { MINIO_CATEGORY_PREFIX } from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  CreateLabOrderDto,
  CreateLabResultDto,
  ImportLabReportPanelDto,
  UpdateLabOrderDto,
} from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly minioService: MinioService,
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
    const orderedBy =
      dto.orderedBy ??
      analysis.facility?.doctorName ??
      doctorRow.userId.toString();

    const [panel] = await this.db
      .insert(labReportPanel)
      .values({
        patientId,
        documentId: dto.documentId,
        consultationId: dto.consultationId,
        panelTitle: dto.panelTitle ?? document.fileName ?? 'Lab report',
        analysisJson: JSON.stringify(dto.analysis),
        summary,
        orderedBy,
        resultAt,
      })
      .returning();

    const rows = analysis.results ?? [];
    if (rows.length > 0) {
      await this.db.insert(labResult).values(
        rows
          .filter((row) => row.testName && row.value)
          .map((row) => ({
            patientId,
            documentId: dto.documentId,
            testName: String(row.testName).slice(0, 200),
            value: String(row.value).slice(0, 100),
            unit: row.unit ? String(row.unit).slice(0, 50) : null,
            referenceRange: row.referenceRange
              ? String(row.referenceRange).slice(0, 120)
              : null,
            status: this.mapAiStatus(row.status),
            orderedBy,
            resultAt,
          })),
      );
    }

    return {
      ...panel,
      document,
    };
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
        if (doc.s3Key.startsWith(`${MINIO_CATEGORY_PREFIX.lab_report}/`)) {
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
