import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  labOrder,
  labOrderItem,
  labResult,
  patient,
} from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  CreateLabOrderDto,
  CreateLabResultDto,
  UpdateLabOrderDto,
} from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
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
}
