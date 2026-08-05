import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { Database } from '../../database/drizzle.provider';
import { patient } from '../../database/schema';

const PATIENT_NUMBER_RE = /^P-\d+$/i;

export function isPatientNumber(identifier: string): boolean {
  return PATIENT_NUMBER_RE.test(identifier.trim());
}

export async function findPatientByIdentifier(
  db: Database,
  identifier: string,
) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new NotFoundException('Patient not found');
  }

  if (isPatientNumber(trimmed)) {
    const byNumber = await db.query.patient.findFirst({
      where: eq(patient.patientNumber, trimmed.toUpperCase()),
    });
    if (byNumber) return byNumber;
  }

  const byUuid = await db.query.patient.findFirst({
    where: eq(patient.id, trimmed),
  });
  if (byUuid) return byUuid;

  throw new NotFoundException('Patient not found');
}
