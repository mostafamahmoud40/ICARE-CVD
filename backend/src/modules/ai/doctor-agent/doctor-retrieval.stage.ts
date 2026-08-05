import { Injectable } from '@nestjs/common';

import { ChromaService } from '../chroma/chroma.service';
import { CHROMA_COLLECTION_DOCTOR_PATIENTS } from './doctor-indexer.service';
import type {
  DoctorQueryUnderstanding,
  DoctorRetrievalHit,
} from './doctor.types';

@Injectable()
export class DoctorRetrievalStage {
  constructor(private readonly chromaService: ChromaService) {}

  async run(params: {
    understanding: DoctorQueryUnderstanding;
    doctorId: string;
  }): Promise<DoctorRetrievalHit[]> {
    const [keywordHits, vectorHits] = await Promise.all([
      Promise.resolve(
        this.keywordSearch(params.understanding, params.doctorId),
      ),
      this.vectorSearch(params.understanding, params.doctorId),
    ]);

    return this.mergeAndRerank(keywordHits, vectorHits);
  }

  // ─── Keyword search ─────────────────────────────────────────────────────────

  private keywordSearch(
    understanding: DoctorQueryUnderstanding,
    _doctorId: string,
  ): DoctorRetrievalHit[] {
    // Keyword hits for doctor retrieval come from the vector store metadata
    // (patient names/numbers extracted from understanding entities).
    // We synthesise lightweight hits so the pipeline trace shows something.
    const hits: DoctorRetrievalHit[] = [];

    for (const entity of understanding.entities) {
      if (entity.type === 'patient_identifier') {
        hits.push({
          id: `kw_patient_${entity.normalized}`,
          source: 'keyword',
          citation: `keyword#patient:${entity.normalized}`,
          content: `Identified patient: ${entity.raw} → ${entity.normalized}`,
          score: entity.confidence,
          metadata: { patientIdentifier: entity.normalized },
        });
      }
    }

    return hits;
  }

  // ─── Vector search ──────────────────────────────────────────────────────────

  private async vectorSearch(
    understanding: DoctorQueryUnderstanding,
    doctorId: string,
  ): Promise<DoctorRetrievalHit[]> {
    if (!this.chromaService.isSearchEnabled) return [];

    const query =
      understanding.reformulatedQuery ||
      understanding.normalizedQuery ||
      understanding.expandedTerms.join(' ');

    const embedding = await this.chromaService.embed(query);
    if (!embedding) return [];

    const docs = await this.chromaService.queryDocuments(
      CHROMA_COLLECTION_DOCTOR_PATIENTS,
      embedding,
      8,
      { doctorId: { $eq: doctorId } },
    );

    return docs.map((d) => ({
      id: d.id,
      source: 'chroma_vector' as const,
      citation: `doctor_patients#${d.id}`,
      content: d.document,
      score: Math.max(0, 1 - (d.distance ?? 1)),
      metadata: Object.fromEntries(
        Object.entries(d.metadata).map(([k, v]) => [k, String(v)]),
      ),
    }));
  }

  // ─── Merge + rerank ──────────────────────────────────────────────────────────

  private mergeAndRerank(
    keywordHits: DoctorRetrievalHit[],
    vectorHits: DoctorRetrievalHit[],
  ): DoctorRetrievalHit[] {
    const byKey = new Map<string, DoctorRetrievalHit>();

    for (const hit of [...keywordHits, ...vectorHits]) {
      const key = `${hit.source}:${hit.id}`;
      const existing = byKey.get(key);
      if (!existing || hit.score > existing.score) {
        byKey.set(key, {
          ...hit,
          score: existing
            ? Math.min(1, existing.score + hit.score * 0.3)
            : hit.score,
        });
      }
    }

    return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, 12);
  }
}
