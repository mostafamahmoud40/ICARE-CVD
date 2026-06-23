import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

import { AppointmentService } from '../../appointment/appointment.service';
import {
  clinicSlotToIso,
  formatClinicDateTime,
} from '../../../common/clinic-time.util';
import { AgentContextStage } from './agent-context.stage';
import { AgentPromptStage } from './agent-prompt.stage';
import { AgentRetrievalStage } from './agent-retrieval.stage';
import { AgentUnderstandingStage } from './agent-understanding.stage';
import type {
  AgentPipelineInput,
  AgentPipelineResult,
  PatientAgentPipelineStage,
} from './agent.types';

@Injectable()
export class AgentPipelineService {
  constructor(
    private readonly understandingStage: AgentUnderstandingStage,
    private readonly retrievalStage: AgentRetrievalStage,
    private readonly contextStage: AgentContextStage,
    private readonly promptStage: AgentPromptStage,
    private readonly appointmentService: AppointmentService,
  ) {}

  async run(
    groq: Groq,
    input: AgentPipelineInput,
  ): Promise<AgentPipelineResult> {
    const trace: PatientAgentPipelineStage[] = [];

    const understanding = await this.understandingStage.run({
      groq,
      message: input.message,
      history: input.history,
      todayStr: input.todayStr,
    });

    trace.push({
      stage: 0,
      key: 'understanding',
      label: 'Query Understanding',
      summary: this.summarizeUnderstanding(understanding),
    });

    trace.push({
      stage: 1,
      key: 'intent',
      label: 'Intent Classification',
      summary:
        understanding.intents
          .map((i) => `${i.id} ${(i.confidence * 100).toFixed(0)}%`)
          .join(' · ') || 'general_help',
    });

    trace.push({
      stage: 2,
      key: 'expansion',
      label: 'Query Expansion',
      summary: `${understanding.expandedTerms.length} terms · ${understanding.subQuestions.length} sub-Q`,
    });

    const retrievalHits = await this.retrievalStage.run({
      understanding,
      userId: input.userId,
      todayStr: input.todayStr,
    });

    trace.push({
      stage: 3,
      key: 'retrieval',
      label: 'Multi-Collection Search',
      summary: `${retrievalHits.length} hits (keyword${retrievalHits.some((h) => h.collection === 'clinic_vector') ? ' + vector' : ''})`,
    });

    const assembled = this.contextStage.run(retrievalHits);

    trace.push({
      stage: 4,
      key: 'context',
      label: 'Context Assembly',
      summary: `${assembled.blocks.length} blocks, deduped & ranked`,
    });

    const [appointments, clinic] = await Promise.all([
      this.buildPatientAppointmentsContext(input.userId),
      this.buildClinicContext(input.todayStr),
    ]);

    const intentPromptAddon = this.promptStage.buildIntentAddon(understanding);

    trace.push({
      stage: 5,
      key: 'generation',
      label: 'Response Generation',
      summary: `Prompt ready · top intent: ${understanding.intents[0]?.id ?? 'general_help'}`,
    });

    return {
      understanding,
      retrievalHits,
      assembled,
      pipelineTrace: trace,
      intentPromptAddon,
      fallbackLiveContext: { appointments, clinic, patientContext: '' },
    };
  }

  private summarizeUnderstanding(u: AgentPipelineResult['understanding']): string {
    const ents = u.entities.map((e) => e.type).join(', ') || 'none';
    return `${u.dialect} · entities: ${ents}`;
  }

  private async buildClinicContext(today: string): Promise<string> {
    let doctors: Awaited<ReturnType<AppointmentService['listDoctors']>> = [];
    try {
      doctors = await this.appointmentService.listDoctors();
    } catch {
      return '=== CLINIC CONTEXT: unavailable ===';
    }

    const lines: string[] = [
      `=== CLINIC SCHEDULE (live, ${today}, next 7 days) ===`,
      'scheduledAt after → — use exactly for booking.',
      '',
    ];

    for (const doc of doctors) {
      lines.push(`${doc.name} | ${doc.title} | id:${doc.id}`);
      try {
        const avail = await this.appointmentService.getDoctorAvailability(
          doc.id,
          today,
          3,
        );
        let daysShown = 0;
        for (const day of avail.days.filter((d) => !d.disabled)) {
          if (daysShown >= 3) break;
          const free = (avail.timeSlotsByDate[day.fullDate] ?? [])
            .filter((s) => s.available)
            .slice(0, 3)
            .map((s) => `${s.time}→${clinicSlotToIso(day.fullDate, s.time)}`);
          if (free.length > 0) {
            lines.push(`  ${day.fullDate}: ${free.join(' | ')}`);
            daysShown++;
          }
        }
      } catch {
        lines.push('  [unavailable]');
      }
      lines.push('');
    }
    lines.push('=== END CLINIC SCHEDULE ===');
    return lines.join('\n');
  }

  private async buildPatientAppointmentsContext(userId: number): Promise<string> {
    try {
      const appts =
        await this.appointmentService.listPatientAppointments(userId);
      const upcoming = appts.filter(
        (a) =>
          a.status !== 'cancelled' &&
          new Date(a.scheduledAt) >= new Date(),
      );
      if (upcoming.length === 0) {
        return '=== MY UPCOMING APPOINTMENTS ===\n(none)\n=== END ===';
      }
      const lines = [
        '=== MY UPCOMING APPOINTMENTS ===',
        'Cairo local time for patient · scheduledAt ISO for tools.',
      ];
      for (const a of upcoming.slice(0, 8)) {
        lines.push(
          `  ${a.confirmationCode} | ${formatClinicDateTime(a.scheduledAt)} Cairo | ${a.scheduledAt} | ${a.clinician} | ${a.visitType}`,
        );
      }
      lines.push('=== END MY APPOINTMENTS ===');
      return lines.join('\n');
    } catch {
      return '';
    }
  }
}
