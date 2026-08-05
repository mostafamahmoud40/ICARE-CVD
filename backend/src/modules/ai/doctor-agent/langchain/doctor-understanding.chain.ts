import { ChatGroq } from '@langchain/groq';
import { z } from 'zod';

import type { DoctorQueryUnderstanding } from '../doctor.types';

// ─── Zod schema (mirrors DoctorQueryUnderstanding) ───────────────────────────

const doctorUnderstandingSchema = z.object({
  normalizedQuery: z.string(),
  dialect: z.enum([
    'egyptian',
    'gulf',
    'levantine',
    'msa',
    'english',
    'mixed',
    'unknown',
  ]),
  entities: z.array(
    z.object({
      type: z.enum([
        'patient_identifier',
        'condition',
        'medication_name',
        'test_name',
        'time_period',
        'risk_level',
        'specialty',
      ]),
      raw: z.string(),
      normalized: z.string(),
      confidence: z.number(),
    }),
  ),
  intents: z.array(
    z.object({
      id: z.enum([
        'lookup_patient',
        'panel_overview',
        'clinical_question',
        'medication_review',
        'lab_review',
        'vitals_review',
        'risk_assessment',
        'follow_up_needed',
        'comparison',
        'ai_analysis_review',
        'procedure_check',
        'diagnosis_query',
        'general_help',
      ]),
      confidence: z.number(),
    }),
  ),
  expandedTerms: z.array(z.string()),
  subQuestions: z.array(z.string()),
  reformulatedQuery: z.string(),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
  targetPatientIdentifiers: z.array(z.string()),
});

// ─── Heuristic fallback ───────────────────────────────────────────────────────

export function buildDoctorHeuristicUnderstanding(
  message: string,
): DoctorQueryUnderstanding {
  const lower = message.toLowerCase();

  type HeuristicRule = {
    keywords: string[];
    intent: DoctorQueryUnderstanding['intents'][0]['id'];
  };

  const rules: HeuristicRule[] = [
    {
      keywords: ['أدويه', 'أدوية', 'دواء', 'عقار', 'medication', 'drug', 'med'],
      intent: 'medication_review',
    },
    {
      keywords: [
        'تحليل',
        'تحاليل',
        'معمل',
        'مختبر',
        'lab',
        'result',
        'نتيجه',
        'نتيجة',
      ],
      intent: 'lab_review',
    },
    {
      keywords: [
        'قياسات',
        'ضغط',
        'وزن',
        'نبض',
        'نبضات',
        'حرارة',
        'vitals',
        'bp',
        'spo2',
      ],
      intent: 'vitals_review',
    },
    {
      keywords: [
        'اكو',
        'إيكو',
        'echo',
        'ecg',
        'ekg',
        'رسم',
        'صدر',
        'xray',
        'x-ray',
        'mri',
        'سينيما',
        'cine',
      ],
      intent: 'ai_analysis_review',
    },
    {
      keywords: [
        'خطورة',
        'خطر',
        'ريسك',
        'risk',
        'high risk',
        'حالة حرجة',
        'خطير',
      ],
      intent: 'risk_assessment',
    },
    {
      keywords: [
        'متابعه',
        'متابعة',
        'follow up',
        'follow-up',
        'يحتاج',
        'يحتاجون',
      ],
      intent: 'follow_up_needed',
    },
    {
      keywords: [
        'مقارنه',
        'مقارنة',
        'compare',
        'comparison',
        'بين مريضين',
        'between',
      ],
      intent: 'comparison',
    },
    {
      keywords: ['إجراء', 'عملية', 'procedure', 'operation', 'جراحة', 'قسطرة'],
      intent: 'procedure_check',
    },
    {
      keywords: [
        'تشخيص',
        'diagnosis',
        'icd',
        'مرض',
        'مرض',
        'حاله',
        'condition',
      ],
      intent: 'diagnosis_query',
    },
    {
      keywords: [
        'مرضاي',
        'قائمه',
        'قائمة',
        'كل المرضى',
        'all patients',
        'panel',
        'لوحه',
        'لوحة',
      ],
      intent: 'panel_overview',
    },
  ];

  const detected = rules
    .filter((r) => r.keywords.some((k) => lower.includes(k)))
    .map((r) => ({ id: r.intent, confidence: 0.7 }));

  const intents =
    detected.length > 0
      ? detected
      : [{ id: 'lookup_patient' as const, confidence: 0.5 }];

  // Extract patient identifiers (P-xxx pattern)
  const pNumMatches = message.match(/\bP-\d{3,6}\b/gi) ?? [];
  const targetPatientIdentifiers = pNumMatches.map((match: string) =>
    match.toUpperCase(),
  );

  return {
    normalizedQuery: message,
    dialect: /[أ-ي]/.test(message) ? 'egyptian' : 'english',
    entities: targetPatientIdentifiers.map((id) => ({
      type: 'patient_identifier' as const,
      raw: id,
      normalized: id,
      confidence: 0.9,
    })),
    intents,
    expandedTerms: lower.split(/[\s،,;.!?]+/).filter((t) => t.length > 2),
    subQuestions: [],
    reformulatedQuery: message,
    needsClarification: false,
    targetPatientIdentifiers,
  };
}

// ─── LLM-based understanding ──────────────────────────────────────────────────

export type DoctorUnderstandingInput = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  todayStr: string;
};

export async function runDoctorUnderstanding(
  apiKey: string,
  input: DoctorUnderstandingInput,
): Promise<DoctorQueryUnderstanding> {
  const fallback = buildDoctorHeuristicUnderstanding(input.message);

  const modelName = process.env.GROQ_ANALYSIS_MODEL?.trim() || 'qwen/qwen3-32b';

  try {
    const llm = new ChatGroq({
      apiKey,
      model: modelName,
      temperature: 0.15,
      maxTokens: 900,
    }).withStructuredOutput(doctorUnderstandingSchema);

    const historySnippet = input.history
      .slice(-3)
      .map((h) => `${h.role}: ${h.content}`)
      .join('\n');

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are a clinical query analyser for ICARE Doctor AI assistant. Today (Cairo): ${input.todayStr}.

Analyse the doctor's message and return structured JSON.

Intent guidelines:
- lookup_patient: asking about a specific named/numbered patient
- panel_overview: asking about all patients / filtering / summarising the panel
- clinical_question: general medical/clinical question not specific to one patient
- medication_review: medications, drugs, prescriptions, compliance, adherence
- lab_review: lab tests, lab results, blood tests, HbA1c, cholesterol, etc.
- vitals_review: BP, HR, SpO2, weight, temperature, glucose readings
- risk_assessment: risk stratification, who is high-risk, alerts
- follow_up_needed: who needs follow-up, missed appointments, pending plans
- comparison: comparing two or more patients
- ai_analysis_review: Echo, ECG, EKG, X-ray, Cine-MRI, cardiac imaging
- procedure_check: procedure orders, surgeries, catheterisation, status
- diagnosis_query: ICD codes, specific diagnosis, chronic diseases

Entity guidelines:
- patient_identifier: any patient name, patient number (P-001), or UUID
- condition: medical condition, disease, diagnosis
- medication_name: drug name (Arabic or English)
- test_name: lab test name
- time_period: last month, last 3 visits, etc.
- risk_level: high/medium/low risk

targetPatientIdentifiers: list all patient names and numbers mentioned.`,
      },
      {
        role: 'user',
        content: `History:\n${historySnippet || '(none)'}\n\nDoctor's message:\n${input.message}`,
      },
    ]);

    const parsed = result as Partial<DoctorQueryUnderstanding>;

    return {
      normalizedQuery: parsed.normalizedQuery || fallback.normalizedQuery,
      dialect: parsed.dialect || fallback.dialect,
      entities: parsed.entities?.length ? parsed.entities : fallback.entities,
      intents: parsed.intents?.length ? parsed.intents : fallback.intents,
      expandedTerms: parsed.expandedTerms?.length
        ? parsed.expandedTerms
        : fallback.expandedTerms,
      subQuestions: parsed.subQuestions || fallback.subQuestions,
      reformulatedQuery: parsed.reformulatedQuery || fallback.reformulatedQuery,
      needsClarification: parsed.needsClarification ?? false,
      clarificationQuestion: parsed.clarificationQuestion,
      targetPatientIdentifiers: parsed.targetPatientIdentifiers?.length
        ? parsed.targetPatientIdentifiers
        : fallback.targetPatientIdentifiers,
    };
  } catch {
    return fallback;
  }
}
