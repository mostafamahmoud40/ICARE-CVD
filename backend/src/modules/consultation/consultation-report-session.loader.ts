import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/drizzle.provider';
import {
  consultationCineMriAnalysis,
  consultationCtAnalysis,
  consultationEcgAnalysis,
  consultationEcgClsAnalysis,
  consultationEchoAnalysis,
  consultationXrayAnalysis,
  labOrder,
  labOrderItem,
  labReportPanel,
} from '../../database/schema';

export type ConsultationReportAiStudy = {
  id: string;
  modality:
    | 'ct'
    | 'xray'
    | 'ecg'
    | 'echo'
    | 'cine_mri'
    | 'ecg_classification'
    | 'lab_panel';
  title: string;
  fileName: string | null;
  summary: string;
  details: string | null;
  createdAt: string;
};

export type ConsultationReportOverrides = {
  medicalHistorySummary?: string;
  procedureDetailsSummary?: string;
  aiStudies?: Record<
    string,
    {
      title?: string;
      summary?: string;
      details?: string | null;
      hidden?: boolean;
    }
  >;
};

export function parseReportOverrides(
  raw: string | null | undefined,
): ConsultationReportOverrides | null {
  return safeJsonParse<ConsultationReportOverrides>(raw);
}

export function applyReportOverrides(params: {
  medicalHistorySummary: string | null;
  procedureDetailsSummary: string | null;
  aiStudies: ConsultationReportAiStudy[];
  overrides: ConsultationReportOverrides | null;
}): {
  medicalHistorySummary: string | null;
  procedureDetailsSummary: string | null;
  aiStudies: ConsultationReportAiStudy[];
} {
  const overrides = params.overrides;
  if (!overrides) {
    return {
      medicalHistorySummary: params.medicalHistorySummary,
      procedureDetailsSummary: params.procedureDetailsSummary,
      aiStudies: params.aiStudies,
    };
  }

  const aiStudies = params.aiStudies
    .map((study) => {
      const patch = overrides.aiStudies?.[study.id];
      if (patch?.hidden) return null;
      if (!patch) return study;
      return {
        ...study,
        title: patch.title ?? study.title,
        summary: patch.summary ?? study.summary,
        details: patch.details !== undefined ? patch.details : study.details,
      };
    })
    .filter((study): study is ConsultationReportAiStudy => study !== null);

  return {
    medicalHistorySummary:
      overrides.medicalHistorySummary ?? params.medicalHistorySummary,
    procedureDetailsSummary:
      overrides.procedureDetailsSummary ?? params.procedureDetailsSummary,
    aiStudies,
  };
}

export type ConsultationReportTestOrder = {
  id: string;
  tests: string[];
  priority: string;
  status: string;
  notes: string | null;
};

export type ConsultationReportHomeMeasurement = {
  metric: string;
  frequency: string;
  notes: string | null;
};

function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function pickText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function summarizeEcgAiReport(raw: string | null): string | null {
  const parsed = safeJsonParse<Record<string, unknown>>(raw);
  if (!parsed) return null;
  const candidates = [
    'summary',
    'report',
    'interpretation',
    'findings',
    'conclusion',
  ];
  for (const key of candidates) {
    const value = parsed[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item) => String(item)).join('; ');
    }
  }
  return null;
}

function summarizeClassification(raw: string): string | null {
  const parsed = safeJsonParse<Record<string, unknown>>(raw);
  if (!parsed) return null;
  if (typeof parsed.label === 'string') return parsed.label;
  if (typeof parsed.prediction === 'string') return parsed.prediction;
  if (typeof parsed.class === 'string') return parsed.class;
  if (typeof parsed.diagnosis === 'string') return parsed.diagnosis;
  return null;
}

export function formatMedicalHistorySummary(
  raw: string | null | undefined,
): string | null {
  const parsed = safeJsonParse<{
    noCardiacHistory?: boolean;
    cardiacNotes?: string;
    noNonCardiacHistory?: boolean;
    nonCardiacNotes?: string;
    noKnownAllergies?: boolean;
    noChronicConditions?: boolean;
  }>(raw);
  if (!parsed) return null;

  const lines: string[] = [];
  if (parsed.noCardiacHistory)
    lines.push('No significant cardiac history reported.');
  else if (parsed.cardiacNotes?.trim())
    lines.push(`Cardiac: ${parsed.cardiacNotes.trim()}`);

  if (parsed.noNonCardiacHistory)
    lines.push('No significant non-cardiac history reported.');
  else if (parsed.nonCardiacNotes?.trim()) {
    lines.push(`Non-cardiac: ${parsed.nonCardiacNotes.trim()}`);
  }

  if (parsed.noKnownAllergies)
    lines.push('No known allergies documented at visit.');
  if (parsed.noChronicConditions)
    lines.push('No chronic conditions flagged at visit.');

  return lines.length > 0 ? lines.join('\n') : null;
}

export function formatProcedureDetailsSummary(
  raw: string | null | undefined,
): string | null {
  const parsed = safeJsonParse<{
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
  }>(raw);
  if (!parsed) return null;

  const lines: string[] = [];
  if (parsed.procedureType?.trim())
    lines.push(`Procedure: ${parsed.procedureType.trim()}`);
  if (parsed.surgicalSpecialty?.trim()) {
    lines.push(`Specialty: ${parsed.surgicalSpecialty.trim()}`);
  }
  if (parsed.surgeryDate?.trim()) {
    lines.push(
      `Scheduled: ${parsed.surgeryDate.trim()}${parsed.startTime ? ` at ${parsed.startTime}` : ''}`,
    );
  }
  if (parsed.operatingRoom?.trim())
    lines.push(`OR: ${parsed.operatingRoom.trim()}`);
  if (parsed.anesthesiaType?.trim())
    lines.push(`Anesthesia: ${parsed.anesthesiaType.trim()}`);
  if (parsed.asaClassification?.trim())
    lines.push(`ASA: ${parsed.asaClassification.trim()}`);
  if (parsed.estimatedDurationMin) {
    lines.push(`Estimated duration: ${parsed.estimatedDurationMin} min`);
  }
  if (parsed.priority?.trim())
    lines.push(`Priority: ${parsed.priority.trim()}`);
  if (parsed.clinicalNotes?.trim())
    lines.push(`Notes: ${parsed.clinicalNotes.trim()}`);

  return lines.length > 0 ? lines.join('\n') : null;
}

export function parseHomeMeasurements(
  raw: string | null | undefined,
): ConsultationReportHomeMeasurement[] {
  const parsed =
    safeJsonParse<
      Array<{ metric?: string; frequency?: string; notes?: string }>
    >(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => ({
      metric: entry.metric?.trim() ?? 'Monitoring',
      frequency: entry.frequency?.trim() ?? '',
      notes: entry.notes?.trim() || null,
    }))
    .filter((entry) => entry.metric || entry.frequency || entry.notes);
}

export async function loadConsultationTestOrders(
  db: Database,
  patientId: string,
  appointmentId: string | null,
): Promise<ConsultationReportTestOrder[]> {
  if (!appointmentId) return [];

  const orders = await db
    .select({
      id: labOrder.id,
      priority: labOrder.priority,
      status: labOrder.status,
      notes: labOrder.notes,
    })
    .from(labOrder)
    .where(
      and(
        eq(labOrder.patientId, patientId),
        eq(labOrder.appointmentId, appointmentId),
      ),
    )
    .orderBy(desc(labOrder.createdAt));

  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.id);
  const items = await db
    .select({
      labOrderId: labOrderItem.labOrderId,
      testName: labOrderItem.testName,
    })
    .from(labOrderItem)
    .where(inArray(labOrderItem.labOrderId, orderIds));

  const testsByOrder = new Map<string, string[]>();
  for (const item of items) {
    const list = testsByOrder.get(item.labOrderId) ?? [];
    list.push(item.testName);
    testsByOrder.set(item.labOrderId, list);
  }

  return orders.map((order) => ({
    id: order.id,
    tests: testsByOrder.get(order.id) ?? [],
    priority: order.priority,
    status: order.status,
    notes: order.notes,
  }));
}

export async function loadConsultationAiStudies(
  db: Database,
  consultationId: string,
): Promise<ConsultationReportAiStudy[]> {
  const studies: ConsultationReportAiStudy[] = [];

  const [ctRows, xrayRows, ecgRows, echoRows, cineRows, ecgClsRows, labPanels] =
    await Promise.all([
      db.query.consultationCtAnalysis.findMany({
        where: eq(consultationCtAnalysis.consultationId, consultationId),
        orderBy: desc(consultationCtAnalysis.createdAt),
      }),
      db.query.consultationXrayAnalysis.findMany({
        where: eq(consultationXrayAnalysis.consultationId, consultationId),
        orderBy: desc(consultationXrayAnalysis.createdAt),
      }),
      db.query.consultationEcgAnalysis.findMany({
        where: eq(consultationEcgAnalysis.consultationId, consultationId),
        orderBy: desc(consultationEcgAnalysis.createdAt),
      }),
      db.query.consultationEchoAnalysis.findMany({
        where: eq(consultationEchoAnalysis.consultationId, consultationId),
        orderBy: desc(consultationEchoAnalysis.createdAt),
      }),
      db.query.consultationCineMriAnalysis.findMany({
        where: eq(consultationCineMriAnalysis.consultationId, consultationId),
        orderBy: desc(consultationCineMriAnalysis.createdAt),
      }),
      db.query.consultationEcgClsAnalysis.findMany({
        where: eq(consultationEcgClsAnalysis.consultationId, consultationId),
        orderBy: desc(consultationEcgClsAnalysis.createdAt),
      }),
      db.query.labReportPanel.findMany({
        where: eq(labReportPanel.consultationId, consultationId),
        orderBy: desc(labReportPanel.createdAt),
      }),
    ]);

  for (const row of ctRows) {
    const analysis = safeJsonParse<{
      volumeMl?: number;
      voxelCount?: number;
    }>(row.analysisJson);
    studies.push({
      id: `ct:${row.id}`,
      modality: 'ct',
      title: 'CT analysis',
      fileName: row.fileName,
      summary: analysis
        ? `Calcium volume ${analysis.volumeMl ?? '—'} ml · ${analysis.voxelCount ?? '—'} voxels`
        : 'CT analysis completed',
      details: null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of xrayRows) {
    const analysis = safeJsonParse<{
      interpretation?: string[];
      riskLevel?: string;
      totalDetections?: number;
    }>(row.analysisJson);
    studies.push({
      id: `xray:${row.id}`,
      modality: 'xray',
      title: 'Chest X-ray AI',
      fileName: row.fileName,
      summary:
        pickText(
          analysis?.interpretation?.join('; '),
          row.riskLevel ? `Risk level: ${row.riskLevel}` : null,
        ) ?? 'X-ray analysis completed',
      details:
        analysis?.totalDetections != null
          ? `${analysis.totalDetections} detection(s)`
          : null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of ecgRows) {
    studies.push({
      id: `ecg:${row.id}`,
      modality: 'ecg',
      title: 'ECG analysis',
      fileName: row.fileName ?? row.recordName,
      summary:
        summarizeEcgAiReport(row.aiReportJson) ??
        'ECG waveform analysis completed',
      details: null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of echoRows) {
    const analysis = safeJsonParse<{ ef?: number; label?: string }>(
      row.analysisJson,
    );
    studies.push({
      id: `echo:${row.id}`,
      modality: 'echo',
      title: 'Echocardiogram AI',
      fileName: row.fileName,
      summary:
        pickText(
          row.aiReport,
          analysis?.label,
          analysis?.ef != null ? `EF ${analysis.ef}%` : null,
        ) ?? 'Echo analysis completed',
      details:
        analysis?.ef != null ? `Ejection fraction: ${analysis.ef}%` : null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of cineRows) {
    const analysis = safeJsonParse<{
      clinicalFeatures?: Record<string, number>;
    }>(row.analysisJson);
    const featureText = analysis?.clinicalFeatures
      ? Object.entries(analysis.clinicalFeatures)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : null;
    studies.push({
      id: `cine_mri:${row.id}`,
      modality: 'cine_mri',
      title: 'Cine MRI analysis',
      fileName: null,
      summary:
        pickText(
          row.diagnosisClass ? `Diagnosis class: ${row.diagnosisClass}` : null,
          featureText,
        ) ?? 'Cine MRI analysis completed',
      details: featureText,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of ecgClsRows) {
    studies.push({
      id: `ecg_classification:${row.id}`,
      modality: 'ecg_classification',
      title: 'ECG classification',
      fileName: row.fileName,
      summary:
        summarizeClassification(row.classificationJson) ??
        'ECG classification completed',
      details: `Input: ${row.inputSource}`,
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of labPanels) {
    studies.push({
      id: `lab_panel:${row.id}`,
      modality: 'lab_panel',
      title: row.panelTitle ?? 'Uploaded lab report',
      fileName: row.panelTitle,
      summary:
        pickText(row.summary, 'Lab report processed with AI') ??
        'Lab report processed',
      details: row.orderedBy ? `Ordered by: ${row.orderedBy}` : null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  return studies.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
