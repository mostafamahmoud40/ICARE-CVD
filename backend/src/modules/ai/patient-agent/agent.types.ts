export type AgentDialect =
  | 'egyptian'
  | 'gulf'
  | 'levantine'
  | 'msa'
  | 'english'
  | 'mixed'
  | 'unknown';

export type AgentEntityType =
  | 'doctor_name'
  | 'specialty'
  | 'symptom'
  | 'date'
  | 'time'
  | 'confirmation_code'
  | 'visit_type'
  | 'department';

export type AgentEntity = {
  type: AgentEntityType;
  raw: string;
  normalized: string;
  confidence: number;
};

export type AgentIntentId =
  | 'list_appointments'
  | 'book_appointment'
  | 'cancel_appointment'
  | 'cancel_all_appointments'
  | 'reschedule_appointment'
  | 'change_visit_type'
  | 'health_question'
  | 'general_help'
  | 'clarification_needed';

export type AgentIntent = {
  id: AgentIntentId;
  confidence: number;
};

export type QueryUnderstandingResult = {
  normalizedQuery: string;
  dialect: AgentDialect;
  entities: AgentEntity[];
  intents: AgentIntent[];
  expandedTerms: string[];
  subQuestions: string[];
  reformulatedQuery: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
};

export type RetrievalCollection =
  | 'appointments'
  | 'doctors'
  | 'schedule'
  | 'clinic_vector';

export type RetrievalHit = {
  id: string;
  collection: RetrievalCollection;
  citation: string;
  content: string;
  score: number;
  metadata: Record<string, string>;
};

export type ContextBlock = {
  citation: string;
  content: string;
  score: number;
  collection: RetrievalCollection;
};

export type AssembledContext = {
  blocks: ContextBlock[];
  formatted: string;
};

export type PatientAgentPipelineStage = {
  stage: number;
  key: string;
  label: string;
  summary: string;
};

export type AgentPipelineInput = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  todayStr: string;
  patientName: string;
  userId: number;
};

export type AgentPipelineResult = {
  understanding: QueryUnderstandingResult;
  retrievalHits: RetrievalHit[];
  assembled: AssembledContext;
  pipelineTrace: PatientAgentPipelineStage[];
  intentPromptAddon: string;
  fallbackLiveContext: {
    appointments: string;
    clinic: string;
    /** Full medical record for this patient (profile, history, meds, labs, consultations, etc.) */
    patientContext: string;
  };
};
