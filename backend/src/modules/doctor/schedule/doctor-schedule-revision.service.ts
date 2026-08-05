import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  doctorScheduleRevision,
  type DoctorScheduleSnapshot,
} from '../../../database/schema/doctorScheduleRevision.schema';

export type ScheduleRevisionActor = {
  userId: number;
  role: string;
  source: string;
};

@Injectable()
export class DoctorScheduleRevisionService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async recordRevision(
    doctorId: string,
    snapshot: DoctorScheduleSnapshot,
    actor?: ScheduleRevisionActor,
  ) {
    const [{ next }] = await this.db
      .select({
        next: sql<number>`coalesce(max(${doctorScheduleRevision.revisionNumber}), 0) + 1`,
      })
      .from(doctorScheduleRevision)
      .where(eq(doctorScheduleRevision.doctorId, doctorId));

    const revisionNumber = Number(next) || 1;

    const [created] = await this.db
      .insert(doctorScheduleRevision)
      .values({
        doctorId,
        revisionNumber,
        snapshot,
        changedByUserId: actor?.userId ?? null,
        changedByRole: actor?.role ?? null,
        changeSource: actor?.source ?? null,
      })
      .returning();

    return {
      id: created.id,
      revisionNumber: created.revisionNumber,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async listRevisions(doctorId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const rows = await this.db.query.doctorScheduleRevision.findMany({
      where: eq(doctorScheduleRevision.doctorId, doctorId),
      orderBy: [desc(doctorScheduleRevision.revisionNumber)],
      limit: safeLimit,
    });

    return rows.map((row) => ({
      id: row.id,
      revisionNumber: row.revisionNumber,
      changedByUserId: row.changedByUserId,
      changedByRole: row.changedByRole,
      changeSource: row.changeSource,
      createdAt: row.createdAt.toISOString(),
      snapshotSummary: this.summarizeSnapshot(row.snapshot),
    }));
  }

  async getRevision(doctorId: string, revisionId: string) {
    const row = await this.db.query.doctorScheduleRevision.findFirst({
      where: eq(doctorScheduleRevision.id, revisionId),
    });

    if (!row || row.doctorId !== doctorId) {
      throw new NotFoundException('Schedule revision not found');
    }

    return {
      id: row.id,
      revisionNumber: row.revisionNumber,
      changedByUserId: row.changedByUserId,
      changedByRole: row.changedByRole,
      changeSource: row.changeSource,
      createdAt: row.createdAt.toISOString(),
      snapshot: row.snapshot,
    };
  }

  private summarizeSnapshot(snapshot: DoctorScheduleSnapshot) {
    const enabledDays = snapshot.days.filter((d) => d.enabled).length;
    const periodCount = snapshot.days.reduce((n, d) => n + d.periods.length, 0);
    return {
      slotDurationMinutes: snapshot.slotDurationMinutes,
      bufferBetweenSlotsMinutes: snapshot.bufferBetweenSlotsMinutes,
      enabledDays,
      periodCount,
      blockedDatesCount: snapshot.blockedDates.length,
      pausedPeriodsCount: snapshot.pausedPeriodIds.length,
      dayExtrasCount: snapshot.dayExtras?.length ?? 0,
    };
  }
}
