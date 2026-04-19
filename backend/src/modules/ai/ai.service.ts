import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';

type OllamaGenerateResponse = {
  response?: string;
  thinking?: string;
  done_reason?: string;
};

@Injectable()
export class AiService {
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
