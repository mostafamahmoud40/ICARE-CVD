import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Groq from 'groq-sdk';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patient } from '../../database/schema';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';
import { EmbeddingService } from './embedding/embedding.service';

const REGISTRATION_SUMMARY_EMBEDDING_DIM = 384; // pgvector column size — BGE-M3 (1024d) is Chroma-only until migrated

@Injectable()
export class AiService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async getRegistrationSummary(userId: number) {
    const row = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
      columns: { aiRegistrationSummary: true },
    });
    return { summary: row?.aiRegistrationSummary ?? null };
  }

  /**
   * Saves the first AI registration summary + embedding for this patient.
   * If a summary already exists, returns it without updating (refresh / new AI text does not overwrite).
   */
  async persistRegistrationSummary(userId: number, analysis: string) {
    const trimmed = analysis.trim();
    if (!trimmed) {
      throw new BadRequestException('analysis is empty');
    }

    const existing = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
      columns: { aiRegistrationSummary: true },
    });
    if (!existing) {
      throw new NotFoundException('Patient not found');
    }
    if (existing.aiRegistrationSummary != null) {
      return { saved: false as const, summary: existing.aiRegistrationSummary };
    }

    const embedding = await this.embedRegistrationSummary(trimmed);

    const [updated] = await this.db
      .update(patient)
      .set({
        aiRegistrationSummary: trimmed,
        aiRegistrationSummaryEmbedding: embedding,
      })
      .where(
        and(eq(patient.userId, userId), isNull(patient.aiRegistrationSummary)),
      )
      .returning({ summary: patient.aiRegistrationSummary });

    if (!updated?.summary) {
      const again = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userId),
        columns: { aiRegistrationSummary: true },
      });
      return {
        saved: false as const,
        summary: again?.aiRegistrationSummary ?? null,
      };
    }

    return { saved: true as const, summary: updated.summary };
  }

  private async embedRegistrationSummary(
    text: string,
  ): Promise<number[] | null> {
    const embedding = await this.embeddingService.embed(text.slice(0, 8000));

    if (!embedding) {
      return null;
    }

    if (embedding.length !== REGISTRATION_SUMMARY_EMBEDDING_DIM) {
      console.error('Registration summary embed unexpected dimension', {
        got: embedding.length,
        expected: REGISTRATION_SUMMARY_EMBEDDING_DIM,
      });
      return null;
    }

    return embedding;
  }

  async analyzeRegistration(input: RegistrationAnalyzeDto) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('AI unavailable');
    }

    const model = process.env.GROQ_ANALYSIS_MODEL?.trim() || 'qwen/qwen3-32b';

    const promptPayload = {
      account: {
        fullName: input.account.fullName,
      },
      profile: input.profile,
      medical: input.medical,
    };

    const systemPrompt = [
      'You are a clinical intake summarization assistant.',
      'Write output in English only.',
      'Generate ONE concise clinical summary note (3-5 short sentences max).',
      'The note must flow as a single paragraph that covers only factual registration details already provided by the patient: demographics, relevant history, lifestyle context, and the chief complaint.',
      'Do NOT suggest symptoms, differential diagnoses, impressions, or likely conditions.',
      'Do NOT include risk impression, risk stratification, or any risk level such as low, medium, or high.',
      'Do NOT recommend next steps, physical examination, ECG, labs, imaging, procedures, referrals, operations, treatment, or management plans.',
      'Do NOT use section headings, bullet points, or numbered lists.',
      'Do NOT repeat the same information twice.',
      'Do NOT include reasoning, hidden thoughts, or meta commentary.',
      'Do NOT write phrases like "we are given" or "steps".',
      'Do NOT mention missing uploaded files or images.',
      'Do NOT fabricate values. If data is missing, omit it gracefully.',
      'This is not a diagnosis.',
    ].join('\n');

    const groq = new Groq({ apiKey });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const completion = await groq.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Patient registration JSON:\n${JSON.stringify(promptPayload, null, 2)}`,
            },
          ],
          temperature: 0.3,
          max_completion_tokens: 1024,
          stream: false,
        },
        { signal: controller.signal },
      );

      let cleanedContent =
        completion.choices[0]?.message?.content?.trim() ?? '';

      cleanedContent = cleanedContent
        .replace(/<think[\s\S]*?<\/think>/gi, '')
        .trim();

      const sentenceStart = cleanedContent.search(
        /^[A-Z][a-z]+.*\b(presents?|reports?|is\s+a|,\s*a)\s/m,
      );
      if (sentenceStart > 0) {
        cleanedContent = cleanedContent.slice(sentenceStart).trim();
      }

      cleanedContent = cleanedContent
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter(
          (line) =>
            !/^Risk Level:/i.test(line) &&
            !/^(Suggested|Next step|Recommended):/i.test(line),
        )
        .join(' ');

      cleanedContent = cleanedContent
        .replace(/\bRisk Level:\s*(Low|Medium|High)\b\.?/gi, '')
        .replace(
          /\b(The suggested next step|Suggested next step|Next step|Recommended next step)\b[^.]*\.?/gi,
          '',
        )
        .replace(/\s{2,}/g, ' ')
        .trim();

      const analysis = cleanedContent;

      if (!analysis) {
        console.error('Groq returned empty registration analysis content');
        throw new ServiceUnavailableException('AI unavailable');
      }

      return {
        analysis,
      };
    } catch (error) {
      console.error('AI registration analysis failed', error);
      throw new ServiceUnavailableException('AI unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}
