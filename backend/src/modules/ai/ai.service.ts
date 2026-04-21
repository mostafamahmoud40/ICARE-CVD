import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patient } from '../../database/schema';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';

const REGISTRATION_SUMMARY_EMBEDDING_DIM = 384;

type OllamaGenerateResponse = {
  response?: string;
  thinking?: string;
  done_reason?: string;
};

@Injectable()
export class AiService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

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
      .where(and(eq(patient.userId, userId), isNull(patient.aiRegistrationSummary)))
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

  private async embedRegistrationSummary(text: string): Promise<number[] | null> {
    const model = process.env.OLLAMA_EMBEDDING_MODEL?.trim();
    if (!model) {
      return null;
    }

    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${ollamaBaseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          input: text.slice(0, 8000),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const raw = await response.text();
        console.error('Ollama embed non-200', {
          status: response.status,
          body: raw,
        });
        return null;
      }

      const data = (await response.json()) as {
        embedding?: number[];
        embeddings?: number[][];
      };

      const raw =
        Array.isArray(data.embeddings?.[0]) && data.embeddings[0].length > 0
          ? data.embeddings[0]
          : Array.isArray(data.embedding)
            ? data.embedding
            : null;

      if (!raw || raw.length !== REGISTRATION_SUMMARY_EMBEDDING_DIM) {
        console.error('Ollama embed unexpected dimension', {
          got: raw?.length,
          expected: REGISTRATION_SUMMARY_EMBEDDING_DIM,
          model,
        });
        return null;
      }

      return raw;
    } catch (error) {
      console.error('Ollama embed failed', error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyzeRegistration(input: RegistrationAnalyzeDto) {
    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL?.trim();

    if (!ollamaModel) {
      throw new ServiceUnavailableException('AI unavailable');
    }

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          think: false,
          prompt: [
            '/no_think',
            systemPrompt,
            'Patient registration JSON:',
            JSON.stringify(promptPayload, null, 2),
          ].join('\n\n'),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const rawErrorBody = await response.text();
        console.error('Ollama non-200 response', {
          status: response.status,
          body: rawErrorBody,
        });
        throw new ServiceUnavailableException('AI unavailable');
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      const rawContent = data.response ?? '';
      let cleanedContent = rawContent
        .replace(/<think[\s\S]*?<\/think>/g, '')
        .trim();

      // Strip model reasoning/self-talk before actual clinical content starts
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
        console.error('Ollama returned empty analysis content', {
          doneReason: data.done_reason,
          hasThinking: Boolean(data.thinking),
        });
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
