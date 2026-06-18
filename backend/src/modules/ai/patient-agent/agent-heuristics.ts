import type {
  AgentDialect,
  AgentEntity,
  AgentIntent,
  AgentIntentId,
  QueryUnderstandingResult,
} from './agent.types';

const SYMPTOM_SPECIALTY: Array<{ pattern: RegExp; specialty: string; terms: string[] }> =
  [
    {
      pattern: /قلب|صدر|ضغط|خفقان|chest|heart|cardio/i,
      specialty: 'Cardiology',
      terms: ['cardiology', 'قلب', 'cardiologist', 'دكتور قلب', 'chest pain'],
    },
    {
      pattern: /سكر|سكري|diabet|glucose/i,
      specialty: 'Endocrinology',
      terms: ['diabetes', 'endocrinology', 'سكر', 'blood sugar'],
    },
  ];

const INTENT_KEYWORDS: Array<{ id: AgentIntentId; patterns: RegExp[]; confidence: number }> =
  [
    {
      id: 'book_appointment',
      patterns: [/احجز|حجز|book|schedule|موعد جديد|عايز موعد|محتاج دكتور/i],
      confidence: 0.88,
    },
    {
      id: 'cancel_appointment',
      patterns: [/الغ|cancel|امسح الموعد|شيل الموعد/i],
      confidence: 0.86,
    },
    {
      id: 'cancel_all_appointments',
      patterns: [/الغي كل|امسح كل|cancel all/i],
      confidence: 0.9,
    },
    {
      id: 'reschedule_appointment',
      patterns: [/أجل|اجل|أعد|اعد|جدول|reschedule|غير الموعد|غير ميعاد/i],
      confidence: 0.85,
    },
    {
      id: 'list_appointments',
      patterns: [/مواعيدي|ميعاد|appointment|حجزي|عندي ايه|الساعه كام|مع مين/i],
      confidence: 0.84,
    },
    {
      id: 'change_visit_type',
      patterns: [/اونلاين|أونلاين|virtual|clinic|عيادة|زيارة/i],
      confidence: 0.7,
    },
    {
      id: 'health_question',
      patterns: [/وجع|ألم|الم|symptom|دوا|دواء|علاج|health/i],
      confidence: 0.75,
    },
  ];

export function detectDialect(text: string): AgentDialect {
  if (/[a-zA-Z]{4,}/.test(text) && /[\u0600-\u06FF]/.test(text)) return 'mixed';
  if (/[a-zA-Z]{3,}/.test(text)) return 'english';
  if (/وش|ابي|ابغى|زين/.test(text)) return 'gulf';
  if (/شو|هلق|كتير/.test(text)) return 'levantine';
  if (/عايز|ازاي|إزاي|مفيش|كدا|احجزلي|الغي|بكره|النهارده/.test(text)) return 'egyptian';
  if (/[\u0600-\u06FF]/.test(text)) return 'msa';
  return 'unknown';
}

export function extractHeuristicEntities(
  text: string,
  todayStr: string,
): AgentEntity[] {
  const entities: AgentEntity[] = [];

  const codeMatch = text.match(/\bICV-\d{4}\b/i);
  if (codeMatch) {
    entities.push({
      type: 'confirmation_code',
      raw: codeMatch[0],
      normalized: codeMatch[0].toUpperCase(),
      confidence: 0.98,
    });
  }

  if (/بكره|بكرة|tomorrow/i.test(text)) {
    entities.push({
      type: 'date',
      raw: 'بكره',
      normalized: addDays(todayStr, 1),
      confidence: 0.9,
    });
  } else if (/النهارده|النهاردة|today/i.test(text)) {
    entities.push({
      type: 'date',
      raw: 'النهارده',
      normalized: todayStr,
      confidence: 0.9,
    });
  } else if (/بعد بكره|after tomorrow/i.test(text)) {
    entities.push({
      type: 'date',
      raw: 'بعد بكره',
      normalized: addDays(todayStr, 2),
      confidence: 0.85,
    });
  }

  const doctorMatch = text.match(
    /(?:د\.?|دكتور|دكتورة|dr\.?)\s*([\u0600-\u06FFa-zA-Z]+)/i,
  );
  if (doctorMatch?.[1]) {
    entities.push({
      type: 'doctor_name',
      raw: doctorMatch[0],
      normalized: doctorMatch[1].trim(),
      confidence: 0.8,
    });
  }

  for (const rule of SYMPTOM_SPECIALTY) {
    if (rule.pattern.test(text)) {
      entities.push({
        type: 'symptom',
        raw: text.slice(0, 40),
        normalized: rule.specialty,
        confidence: 0.75,
      });
      entities.push({
        type: 'specialty',
        raw: rule.specialty,
        normalized: rule.specialty,
        confidence: 0.8,
      });
      break;
    }
  }

  if (/اونلاين|أونلاين|virtual|video/i.test(text)) {
    entities.push({
      type: 'visit_type',
      raw: 'virtual',
      normalized: 'virtual',
      confidence: 0.85,
    });
  } else if (/عيادة|in clinic|clinic/i.test(text)) {
    entities.push({
      type: 'visit_type',
      raw: 'clinic',
      normalized: 'clinic',
      confidence: 0.85,
    });
  }

  return entities;
}

export function classifyHeuristicIntents(text: string): AgentIntent[] {
  const found: AgentIntent[] = [];
  for (const rule of INTENT_KEYWORDS) {
    if (rule.patterns.some((p) => p.test(text))) {
      found.push({ id: rule.id, confidence: rule.confidence });
    }
  }
  if (found.length === 0) {
    found.push({ id: 'general_help', confidence: 0.55 });
  }
  return found.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

export function expandHeuristicTerms(
  text: string,
  entities: AgentEntity[],
): string[] {
  const terms = new Set<string>();
  const chunks = text
    .toLowerCase()
    .split(/[\s,.;:!?،]+/)
    .filter((w) => w.length > 1);
  for (const w of chunks) terms.add(w);

  for (const entity of entities) {
    terms.add(entity.normalized.toLowerCase());
    if (entity.type === 'symptom' || entity.type === 'specialty') {
      const rule = SYMPTOM_SPECIALTY.find((r) => r.specialty === entity.normalized);
      rule?.terms.forEach((t) => terms.add(t.toLowerCase()));
    }
  }

  if (/قلب|صدر/.test(text)) {
    ['cardiology', 'cardiologist', 'قلب', 'chest', 'heart'].forEach((t) =>
      terms.add(t),
    );
  }

  return [...terms].slice(0, 24);
}

export function buildHeuristicUnderstanding(
  message: string,
  todayStr: string,
): QueryUnderstandingResult {
  const dialect = detectDialect(message);
  const entities = extractHeuristicEntities(message, todayStr);
  const intents = classifyHeuristicIntents(message);
  const expandedTerms = expandHeuristicTerms(message, entities);
  const top = intents[0];
  const needsClarification =
    top !== undefined &&
    top.confidence < 0.65 &&
    top.id !== 'list_appointments';

  return {
    normalizedQuery: message.trim(),
    dialect,
    entities,
    intents,
    expandedTerms,
    subQuestions: [],
    reformulatedQuery: message.trim(),
    needsClarification,
    clarificationQuestion: needsClarification
      ? 'ممكن توضّح أكتر — عايز تحجز، تلغي، ولا تعرف مواعيدك؟'
      : undefined,
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function mergeUnderstanding(
  llm: Partial<QueryUnderstandingResult> | null,
  fallback: QueryUnderstandingResult,
): QueryUnderstandingResult {
  if (!llm) return fallback;

  return {
    normalizedQuery: llm.normalizedQuery?.trim() || fallback.normalizedQuery,
    dialect: (llm.dialect as AgentDialect) || fallback.dialect,
    entities:
      llm.entities && llm.entities.length > 0 ? llm.entities : fallback.entities,
    intents:
      llm.intents && llm.intents.length > 0 ? llm.intents : fallback.intents,
    expandedTerms:
      llm.expandedTerms && llm.expandedTerms.length > 0
        ? llm.expandedTerms
        : fallback.expandedTerms,
    subQuestions: llm.subQuestions ?? fallback.subQuestions,
    reformulatedQuery:
      llm.reformulatedQuery?.trim() || fallback.reformulatedQuery,
    needsClarification:
      llm.needsClarification ?? fallback.needsClarification,
    clarificationQuestion:
      llm.clarificationQuestion ?? fallback.clarificationQuestion,
  };
}

export function parseUnderstandingJson(raw: string): Partial<QueryUnderstandingResult> | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as Partial<QueryUnderstandingResult>;
  } catch {
    return null;
  }
}
