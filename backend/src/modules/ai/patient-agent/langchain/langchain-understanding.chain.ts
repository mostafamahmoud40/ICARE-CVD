import { ChatGroq } from '@langchain/groq';
import { RunnableLambda } from '@langchain/core/runnables';
import { z } from 'zod';

import {
  buildHeuristicUnderstanding,
  mergeUnderstanding,
} from '../agent-heuristics';
import type { QueryUnderstandingResult } from '../agent.types';

const understandingSchema = z.object({
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
      type: z.string(),
      raw: z.string(),
      normalized: z.string(),
      confidence: z.number(),
    }),
  ),
  intents: z.array(
    z.object({
      id: z.enum([
        'list_appointments',
        'book_appointment',
        'cancel_appointment',
        'cancel_all_appointments',
        'reschedule_appointment',
        'change_visit_type',
        'health_question',
        'general_help',
        'clarification_needed',
      ]),
      confidence: z.number(),
    }),
  ),
  expandedTerms: z.array(z.string()),
  subQuestions: z.array(z.string()),
  reformulatedQuery: z.string(),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

export type UnderstandingChainInput = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  todayStr: string;
};

export async function runLangChainUnderstanding(
  apiKey: string,
  input: UnderstandingChainInput,
): Promise<QueryUnderstandingResult> {
  const fallback = buildHeuristicUnderstanding(input.message, input.todayStr);

  const modelName =
    process.env.GROQ_ANALYSIS_MODEL?.trim() || 'qwen/qwen3-32b';

  try {
    const llm = new ChatGroq({
      apiKey,
      model: modelName,
      temperature: 0.2,
      maxTokens: 900,
    }).withStructuredOutput(understandingSchema);

    const historySnippet = input.history
      .slice(-3)
      .map((h) => `${h.role}: ${h.content}`)
      .join('\n');

    const result = await llm.invoke([
      {
        role: 'system',
        content: `ICARE Care Agent query understanding. Today (Cairo): ${input.todayStr}.
Multi-label intents, entities, expanded terms. Map بكره→tomorrow date.`,
      },
      {
        role: 'user',
        content: `History:\n${historySnippet || '(none)'}\n\nUser:\n${input.message}`,
      },
    ]);

    return mergeUnderstanding(
      result as Partial<QueryUnderstandingResult>,
      fallback,
    );
  } catch {
    return fallback;
  }
}

export const langChainUnderstandingRunnable = new RunnableLambda({
  func: async (input: UnderstandingChainInput & { apiKey: string }) =>
    runLangChainUnderstanding(input.apiKey, input),
});
