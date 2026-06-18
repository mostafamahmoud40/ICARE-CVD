import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

import {
  buildHeuristicUnderstanding,
  mergeUnderstanding,
  parseUnderstandingJson,
} from './agent-heuristics';
import type { QueryUnderstandingResult } from './agent.types';

@Injectable()
export class AgentUnderstandingStage {
  private readonly logger = new Logger(AgentUnderstandingStage.name);

  async run(params: {
    groq: Groq;
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    todayStr: string;
  }): Promise<QueryUnderstandingResult> {
    const fallback = buildHeuristicUnderstanding(params.message, params.todayStr);

    const model =
      process.env.GROQ_ANALYSIS_MODEL?.trim() || 'qwen/qwen3-32b';

    const historySnippet = params.history
      .slice(-3)
      .map((h) => `${h.role}: ${h.content}`)
      .join('\n');

    try {
      const completion = await params.groq.chat.completions.create({
        model,
        temperature: 0.2,
        max_completion_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are Stage 0-2 of ICARE Care Agent pipeline (Query Understanding + Intent + Expansion).
Today (Cairo): ${params.todayStr}.

Return ONLY valid JSON:
{
  "normalizedQuery": "corrected spelling, same language",
  "dialect": "egyptian|gulf|levantine|msa|english|mixed|unknown",
  "entities": [{"type":"doctor_name|specialty|symptom|date|time|confirmation_code|visit_type|department","raw":"","normalized":"","confidence":0.0}],
  "intents": [{"id":"list_appointments|book_appointment|cancel_appointment|cancel_all_appointments|reschedule_appointment|change_visit_type|health_question|general_help|clarification_needed","confidence":0.0}],
  "expandedTerms": ["synonyms in Arabic and English"],
  "subQuestions": ["anticipated sub-questions"],
  "reformulatedQuery": "clear clinical search query",
  "needsClarification": false,
  "clarificationQuestion": "optional Arabic/English question"
}

Rules:
- Multi-label intents allowed (max 4), confidence 0-1.
- Map symptoms to specialty when possible (قلب/صدر → Cardiology).
- Map colloquial dates: بكره→tomorrow YYYY-MM-DD, النهارده→today.
- confirmation_code pattern ICV-#### if present.`,
          },
          {
            role: 'user',
            content: `History:\n${historySnippet || '(none)'}\n\nUser message:\n${params.message}`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) return fallback;

      const parsed = parseUnderstandingJson(content);
      return mergeUnderstanding(parsed, fallback);
    } catch (error) {
      this.logger.warn(`Understanding stage fallback: ${String(error)}`);
      return fallback;
    }
  }
}
