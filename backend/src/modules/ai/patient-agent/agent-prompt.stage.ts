import { Injectable } from '@nestjs/common';

import type { AgentIntentId, QueryUnderstandingResult } from './agent.types';

const INTENT_PROMPTS: Partial<Record<AgentIntentId, string>> = {
  book_appointment: `## Intent: BOOK
- Proactively suggest the best matching doctor + slot from [schedule#...] citations.
- End with a direct offer: "عايز أحجزلك؟" / "Shall I book this for you?"
- Use book_appointment tool only after patient confirms or gives clear consent.`,
  cancel_appointment: `## Intent: CANCEL ONE
- Identify confirmationCode from [appointments#ICV-####] citations.
- Confirm which appointment before calling cancel_appointment.`,
  cancel_all_appointments: `## Intent: CANCEL ALL
- Step 1: List upcoming appointments and ask ONE confirmation question in plain text. Do NOT call any tool yet.
- Step 2: Call cancel_all_appointments ONLY after the patient explicitly confirms (أيوه / نعم / أكد / yes / cancel all).
- Never write tool names like [cancel_all_appointments] in your message.`,
  reschedule_appointment: `## Intent: RESCHEDULE
- Match confirmationCode from appointments + new slot from schedule citations.
- Use reschedule_appointment with exact scheduledAt after →.`,
  change_visit_type: `## Intent: CHANGE VISIT TYPE
- Use confirmationCode + visitType clinic|virtual from patient request.`,
  list_appointments: `## Intent: LIST APPOINTMENTS
- Answer from [appointments#...] citations — Cairo local time only.
- No tool call unless patient also wants an action.`,
  health_question: `## Intent: HEALTH / SYMPTOM
- Map symptom to specialty (e.g. قلب → Cardiology).
- Suggest relevant doctors from [doctors#...] and available [schedule#...] slots.
- Do not diagnose — recommend booking with the right specialist.`,
  general_help: `## Intent: GENERAL HELP
- Explain what you can do: book, cancel, reschedule, list appointments, care Q&A.`,
  clarification_needed: `## Intent: CLARIFICATION
- Ask one short question in the patient's dialect before acting.`,
};

@Injectable()
export class AgentPromptStage {
  buildIntentAddon(understanding: QueryUnderstandingResult): string {
    const parts: string[] = [
      '## Pipeline analysis (Stages 0–2)',
      `Dialect: ${understanding.dialect}`,
      `Normalized: ${understanding.normalizedQuery}`,
    ];

    if (understanding.entities.length > 0) {
      parts.push(
        'Entities: ' +
          understanding.entities
            .map((e) => `${e.type}=${e.normalized}`)
            .join(', '),
      );
    }

    if (understanding.intents.length > 0) {
      parts.push(
        'Intents: ' +
          understanding.intents
            .map((i) => `${i.id}(${(i.confidence * 100).toFixed(0)}%)`)
            .join(', '),
      );
    }

    if (understanding.expandedTerms.length > 0) {
      parts.push(
        `Expanded terms: ${understanding.expandedTerms.slice(0, 8).join(', ')}`,
      );
    }

    if (understanding.subQuestions.length > 0) {
      parts.push(
        `Anticipated questions: ${understanding.subQuestions.join(' | ')}`,
      );
    }

    for (const intent of understanding.intents.slice(0, 2)) {
      const addon = INTENT_PROMPTS[intent.id];
      if (addon) parts.push(addon);
    }

    if (
      understanding.needsClarification &&
      understanding.clarificationQuestion
    ) {
      parts.push(
        `## Clarification fallback\nIf still ambiguous, ask: "${understanding.clarificationQuestion}"`,
      );
    }

    parts.push(`## Citation rule
- When stating facts, reference source tags like [appointments#ICV-5425] or [schedule#doctorId#date#time] in parentheses.
- Never invent data outside retrieved context + live snapshot.`);

    return parts.join('\n');
  }
}
