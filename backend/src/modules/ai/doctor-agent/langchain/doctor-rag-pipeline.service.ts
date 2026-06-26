import { Injectable } from '@nestjs/common';

import { todayClinicDateStr } from '../../../../common/clinic-time.util';
import { DoctorIndexerService } from '../doctor-indexer.service';
import { DoctorRetrievalStage } from '../doctor-retrieval.stage';
import type {
  DoctorIntentId,
  DoctorPipelineInput,
  DoctorPipelineResult,
  DoctorPipelineStage,
  DoctorQueryUnderstanding,
} from '../doctor.types';
import { DoctorToolsService } from './doctor-tools.service';
import { runDoctorUnderstanding } from './doctor-understanding.chain';

@Injectable()
export class DoctorRagPipelineService {
  constructor(
    private readonly indexer: DoctorIndexerService,
    private readonly retrieval: DoctorRetrievalStage,
    private readonly doctorTools: DoctorToolsService,
  ) {}

  async run(
    apiKey: string,
    input: DoctorPipelineInput,
  ): Promise<DoctorPipelineResult> {
    const trace: DoctorPipelineStage[] = [];

    // ── Stage 0: Understanding ─────────────────────────────────────────────
    const understanding = await runDoctorUnderstanding(apiKey, {
      message: input.message,
      history: input.history,
      todayStr: input.todayStr,
    });

    trace.push({
      stage: 0,
      key: 'understanding',
      label: 'Query Understanding',
      summary: `${understanding.dialect} · intents: ${understanding.intents.map((i) => `${i.id}(${Math.round(i.confidence * 100)}%)`).join(', ')}`,
    });

    trace.push({
      stage: 1,
      key: 'entities',
      label: 'Entity Extraction',
      summary:
        understanding.entities.length > 0
          ? understanding.entities
              .map((e) => `${e.type}:${e.normalized}`)
              .join(', ')
          : 'no entities extracted',
    });

    // ── Stage 2: Ensure Chroma index is fresh ─────────────────────────────
    const indexEnabled = this.indexer.isEnabled;
    await this.indexer.ensureIndexed(input.doctorId);

    trace.push({
      stage: 2,
      key: 'indexing',
      label: 'Chroma Patient Index',
      summary: indexEnabled
        ? 'index refreshed (TTL 30 min)'
        : 'Chroma / embeddings not configured — skipped',
    });

    // ── Stage 3: Retrieval ─────────────────────────────────────────────────
    const retrievalHits = await this.retrieval.run({
      understanding,
      doctorId: input.doctorId,
    });

    trace.push({
      stage: 3,
      key: 'retrieval',
      label: 'Multi-Source Retrieval',
      summary: `${retrievalHits.length} hits (keyword ${retrievalHits.filter((h) => h.source === 'keyword').length} + vector ${retrievalHits.filter((h) => h.source === 'chroma_vector').length})`,
    });

    // ── Stage 4: Intent-based pre-fetch ────────────────────────────────────
    const [preFetchedContext, preFetchSummary] = await this.intentPreFetch(
      understanding,
      input.doctorId,
    );

    trace.push({
      stage: 4,
      key: 'prefetch',
      label: 'Intent-Based Pre-Fetch',
      summary: preFetchSummary,
    });

    // ── Stage 5: Compact roster ────────────────────────────────────────────
    const roster = await this.doctorTools.listPatients(input.doctorId);

    trace.push({
      stage: 5,
      key: 'roster',
      label: 'Patient Roster',
      summary: roster.split('\n')[0],
    });

    // ── Stage 6: Intent prompt addon ───────────────────────────────────────
    const intentPromptAddon = this.buildIntentAddon(
      understanding,
      preFetchedContext,
    );

    trace.push({
      stage: 6,
      key: 'prompt',
      label: 'Prompt Assembly',
      summary: `Top intent: ${understanding.intents[0]?.id ?? 'general_help'} · pre-fetched: ${preFetchedContext ? 'yes' : 'none'}`,
    });

    return {
      understanding,
      retrievalHits,
      preFetchedContext,
      pipelineTrace: trace,
      intentPromptAddon,
      roster,
    };
  }

  // ─── Intent-based pre-fetch ───────────────────────────────────────────────

  private async intentPreFetch(
    understanding: DoctorQueryUnderstanding,
    doctorId: string,
  ): Promise<[string, string]> {
    const topIntent = understanding.intents[0]?.id as
      | DoctorIntentId
      | undefined;
    const patientIds = understanding.targetPatientIdentifiers;
    const firstPatient = patientIds[0];

    // Panel-wide intents — don't need a specific patient
    if (
      !firstPatient &&
      (topIntent === 'panel_overview' ||
        topIntent === 'risk_assessment' ||
        topIntent === 'follow_up_needed')
    ) {
      const data = await this.doctorTools.listPatients(doctorId);
      return [data, `panel overview pre-fetched`];
    }

    if (!firstPatient) {
      return ['', 'no patient identifier — agent will call tools on demand'];
    }

    // Patient-specific pre-fetch based on intent
    const sections: string[] = [];
    let summary = `pre-fetching for ${firstPatient}`;

    const fetch = async (
      fn: () => Promise<string>,
      label: string,
    ): Promise<void> => {
      try {
        const data = await fn();
        if (data && !data.includes('not in your panel')) {
          sections.push(data);
          summary += ` · ${label}`;
        }
      } catch {
        // non-critical
      }
    };

    switch (topIntent) {
      case 'lookup_patient':
      case 'clinical_question':
        await Promise.all([
          fetch(
            () => this.doctorTools.getPatientOverview(doctorId, firstPatient),
            'overview',
          ),
          fetch(
            () =>
              this.doctorTools.getPatientConsultations(doctorId, firstPatient),
            'consultations',
          ),
        ]);
        break;

      case 'medication_review':
        await fetch(
          () => this.doctorTools.getPatientMedications(doctorId, firstPatient),
          'medications',
        );
        break;

      case 'lab_review':
        await fetch(
          () => this.doctorTools.getPatientLabResults(doctorId, firstPatient),
          'labs',
        );
        break;

      case 'vitals_review':
        await fetch(
          () => this.doctorTools.getPatientVitals(doctorId, firstPatient),
          'vitals',
        );
        break;

      case 'ai_analysis_review':
        await fetch(
          () => this.doctorTools.getPatientAiAnalyses(doctorId, firstPatient),
          'ai_analyses',
        );
        break;

      case 'diagnosis_query':
        await Promise.all([
          fetch(
            () => this.doctorTools.getPatientDiagnoses(doctorId, firstPatient),
            'diagnoses',
          ),
          fetch(
            () => this.doctorTools.getPatientOverview(doctorId, firstPatient),
            'overview',
          ),
        ]);
        break;

      case 'procedure_check':
        await fetch(
          () => this.doctorTools.getPatientProcedures(doctorId, firstPatient),
          'procedures',
        );
        break;

      case 'comparison':
        // Pre-fetch overview for all mentioned patients (up to 3)
        await Promise.all(
          patientIds
            .slice(0, 3)
            .map((pid) =>
              fetch(
                () => this.doctorTools.getPatientOverview(doctorId, pid),
                `overview(${pid})`,
              ),
            ),
        );
        break;

      default:
        // For general / unclear intent: just fetch overview
        await fetch(
          () => this.doctorTools.getPatientOverview(doctorId, firstPatient),
          'overview',
        );
        break;
    }

    return [sections.join('\n\n---\n\n'), summary];
  }

  // ─── Intent prompt addon ──────────────────────────────────────────────────

  private buildIntentAddon(
    understanding: DoctorQueryUnderstanding,
    preFetchedContext: string,
  ): string {
    const parts: string[] = [];

    const topIntent = understanding.intents[0]?.id;
    const intentGuidance: Partial<Record<DoctorIntentId, string>> = {
      medication_review:
        'Focus on compliance, adherence %, side effects, and any potential interactions visible in the data.',
      lab_review:
        'Highlight abnormal values first. Compare to reference ranges. Note trend if multiple readings exist.',
      vitals_review:
        'Flag any out-of-range readings. Identify trends across sessions.',
      risk_assessment:
        'Identify patients with high risk levels, multiple chronic diagnoses, poor compliance, or abnormal AI analyses.',
      follow_up_needed:
        'Look for incomplete follow-up plans, pending procedures, recent high-risk diagnoses, or missed labs.',
      ai_analysis_review:
        'Clearly state findings as AI-generated. Recommend clinical correlation. Summarise key metrics (EF, rhythm, risk).',
      comparison:
        'Compare the requested patients side by side. Use consistent attributes for fair comparison.',
      panel_overview:
        'Give a structured summary: total patients, risk distribution, notable abnormalities, pending actions.',
    };

    if (topIntent && intentGuidance[topIntent]) {
      parts.push(
        `## Clinical focus for this query\n${intentGuidance[topIntent]}`,
      );
    }

    if (
      understanding.needsClarification &&
      understanding.clarificationQuestion
    ) {
      parts.push(
        `## Clarification needed\nAsk the doctor: "${understanding.clarificationQuestion}"`,
      );
    }

    if (preFetchedContext) {
      parts.push(
        `## Pre-fetched patient data (from pipeline)\n${preFetchedContext}`,
      );
    }

    return parts.join('\n\n');
  }
}

// ─── Standalone helper ─────────────────────────────────────────────────────────

export function buildDoctorPipelineInput(
  doctorId: string,
  doctorUserId: number,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): DoctorPipelineInput {
  return {
    message,
    history,
    todayStr: todayClinicDateStr(),
    doctorId,
    doctorUserId,
  };
}
