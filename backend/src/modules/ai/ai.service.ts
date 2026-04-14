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
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
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
      'Generate a concise registration analysis note from the provided JSON.',
        'Do not include reasoning, hidden thoughts, or meta commentary.',
        'Do not write phrases like "we are given" or "steps".',
      'Output with exactly these sections and headings:',
      '1) Patient Snapshot',
      '2) Key Clinical Signals',
      '3) Lifestyle & Risk Context',
      '4) Clinical Impression (Risk Level: Low/Medium/High + 1 sentence justification)',
      '5) Suggested Next Clinical Step',
      'Do not mention missing uploaded files or images.',
      'Do not fabricate values. If data is missing, state "Not provided".',
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
      const cleanedContent = rawContent
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();
      const headingIndex = cleanedContent.indexOf('1) Patient Snapshot');
      const analysis =
        headingIndex >= 0
          ? cleanedContent.slice(headingIndex).trim()
          : cleanedContent;

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
