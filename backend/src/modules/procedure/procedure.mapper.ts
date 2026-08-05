import { randomUUID } from 'crypto';

import { buildPatientStoragePrefix } from '../../shared/storage/minio-patient-path';

const PROCEDURE_TYPE_LABELS: Record<string, string> = {
  coronary_artery_bypass: 'Coronary Artery Bypass Graft (CABG)',
  valve_replacement: 'Valve Replacement',
  valve_repair: 'Valve Repair',
  pacemaker_implant: 'Pacemaker Implantation',
  icd_implant: 'ICD Implantation',
  cardiac_catheterization: 'Cardiac Catheterization',
  angioplasty: 'Percutaneous Coronary Intervention (PCI)',
  aortic_repair: 'Aortic Repair / Replacement',
  pericardiectomy: 'Pericardiectomy',
  other: 'Other',
};

const OPERATING_ROOM_LABELS: Record<string, string> = {
  'OR-1': 'Cardiac OR-1',
  'OR-2': 'Cardiac OR-2',
  'OR-3': 'Cardiac OR-3',
  'OR-4': 'Cardiac OR-4',
  'Cath-Lab-1': 'Cath Lab',
  'Cath-Lab-2': 'Cath Lab',
};

const CLINIC_TIME_ZONE = 'Africa/Cairo';

export function mapProcedureTypeLabel(value: string | undefined): string {
  if (!value?.trim()) return 'Cardiac procedure';
  return PROCEDURE_TYPE_LABELS[value.trim()] ?? value.trim();
}

export function mapOperatingRoomLabel(
  value: string | undefined,
): string | null {
  if (!value?.trim()) return null;
  return OPERATING_ROOM_LABELS[value.trim()] ?? value.trim();
}

export function mapConsultationPriority(
  value: string | undefined,
): 'normal' | 'urgent' | 'emergency' {
  if (value === 'urgent' || value === 'emergency') return value;
  return 'normal';
}

export function computeAgeYears(dateOfBirth: Date | string): number {
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export function formatTimeInClinic(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CLINIC_TIME_ZONE,
  });
}

export function formatDurationLabel(
  minutes: number | null | undefined,
): string {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

export function buildProcedureAttachmentKey(
  patientNumber: string,
  orderId: string,
  fileName: string,
): string {
  const safeName = fileName.trim().replace(/[^\w.-]+/g, '_') || 'attachment';
  return `${buildPatientStoragePrefix(patientNumber, 'documents', 'procedures', orderId)}/${randomUUID()}-${safeName}`;
}

export function parseProcedureDetailsJson(raw: string | null | undefined) {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as {
      procedureType?: string;
      surgicalSpecialty?: string;
      surgeryDate?: string;
      startTime?: string;
      operatingRoom?: string;
      anesthesiaType?: string;
      asaClassification?: string;
      estimatedDurationMin?: number;
      priority?: string;
      clinicalNotes?: string;
    };
  } catch {
    return null;
  }
}

export function combineScheduleDateTime(
  surgeryDate: string | undefined,
  startTime: string | undefined,
): Date | null {
  if (!surgeryDate?.trim()) return null;
  const time = startTime?.trim() || '09:00';
  const iso = `${surgeryDate.trim()}T${time}:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const DEFAULT_PROCEDURE_REQUIREMENTS = [
  {
    kind: 'consent' as const,
    title: 'Signed consent form',
    description:
      'Patient or legal guardian must sign the procedure consent form',
    allowsAttachment: true,
    sortOrder: 0,
  },
  {
    kind: 'standard' as const,
    title: 'CBC & Coagulation panel',
    description: 'Full blood count + PT/INR/aPTT',
    allowsAttachment: true,
    sortOrder: 1,
  },
  {
    kind: 'standard' as const,
    title: 'Fasting confirmation',
    description: 'Confirm patient fasting requirements are met',
    allowsAttachment: false,
    sortOrder: 2,
  },
  {
    kind: 'standard' as const,
    title: 'IV access established',
    description: 'IV cannula placed before transfer to procedure room',
    allowsAttachment: false,
    sortOrder: 3,
  },
];
