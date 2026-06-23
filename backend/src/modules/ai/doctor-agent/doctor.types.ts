// ─── Dialect ─────────────────────────────────────────────────────────────────

export type DoctorDialect =
  | 'egyptian'
  | 'gulf'
  | 'levantine'
  | 'msa'
  | 'english'
  | 'mixed'
  | 'unknown';

// ─── Entities ─────────────────────────────────────────────────────────────────

export type DoctorEntityType =
  | 'patient_identifier' // name, patient number, or UUID
  | 'condition'
  | 'medication_name'
  | 'test_name'
  | 'time_period'
  | 'risk_level'
  | 'specialty';

export type DoctorEntity = {
  type: DoctorEntityType;
  raw: string;
  normalized: string;
  confidence: number;
};

// ─── Intents ──────────────────────────────────────────────────────────────────

export type DoctorIntentId =
  | 'lookup_patient'     // info about a specific patient
  | 'panel_overview'     // overview of all / filtered patients
  | 'clinical_question'  // general clinical / medical question
  | 'medication_review'  // medication-specific query
  | 'lab_review'         // lab results
  | 'vitals_review'      // vital signs
  | 'risk_assessment'    // high-risk patients, alerts
  | 'follow_up_needed'   // who needs follow-up
  | 'comparison'         // compare multiple patients
  | 'ai_analysis_review' // Echo / ECG / X-ray / Cine-MRI
  | 'procedure_check'    // procedure orders / status
  | 'diagnosis_query'    // diagnosis-specific
  | 'general_help';

export type DoctorIntent = {
  id: DoctorIntentId;
  confidence: number;
};

// ─── Understanding result ─────────────────────────────────────────────────────

export type DoctorQueryUnderstanding = {
  normalizedQuery: string;
  dialect: DoctorDialect;
  entities: DoctorEntity[];
  intents: DoctorIntent[];
  expandedTerms: string[];
  subQuestions: string[];
  reformulatedQuery: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
  /** Extracted patient names / numbers / UUIDs — shortcut for pre-fetch logic. */
  targetPatientIdentifiers: string[];
};

// ─── Pipeline stages ──────────────────────────────────────────────────────────

export type DoctorPipelineStage = {
  stage: number;
  key: string;
  label: string;
  summary: string;
};

// ─── Retrieval ────────────────────────────────────────────────────────────────

export type DoctorRetrievalHit = {
  id: string;
  source: 'chroma_vector' | 'keyword';
  citation: string;
  content: string;
  score: number;
  metadata: Record<string, string>;
};

// ─── Pipeline result ──────────────────────────────────────────────────────────

export type DoctorPipelineInput = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  todayStr: string;
  doctorId: string;      // UUID from doctor table
  doctorUserId: number;  // integer user ID
};

export type DoctorPipelineResult = {
  understanding: DoctorQueryUnderstanding;
  retrievalHits: DoctorRetrievalHit[];
  preFetchedContext: string;  // intent-based pre-fetched tool data
  pipelineTrace: DoctorPipelineStage[];
  intentPromptAddon: string;  // injected into agent system prompt
  roster: string;             // compact patient list
};
