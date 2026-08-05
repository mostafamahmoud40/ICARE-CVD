import { Injectable, Logger } from '@nestjs/common';

/**
 * Text embedding service via Cohere Inference API.
 *
 * Model: embed-multilingual-light-v3.0
 *   - 384-dim vectors (same as paraphrase-multilingual-MiniLM-L12-v2)
 *   - Supports 100+ languages including Arabic
 *   - Free tier: 1000 API calls/month
 *   - Docs: https://docs.cohere.com/reference/embed
 *
 * Required env var:  COHERE_API_KEY  (get at https://dashboard.cohere.com/api-keys)
 * Optional env var:  COHERE_EMBEDDING_MODEL  (default: embed-multilingual-light-v3.0)
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  private readonly model =
    process.env.COHERE_EMBEDDING_MODEL?.trim() ||
    'embed-multilingual-light-v3.0';

  private readonly apiUrl = 'https://api.cohere.com/v2/embed';

  /** Generate a 384-dim embedding vector. Returns null on failure. */
  async embed(text: string): Promise<number[] | null> {
    const apiKey = process.env.COHERE_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('COHERE_API_KEY not set — embedding disabled');
      return null;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [text.slice(0, 4096)],
          model: this.model,
          input_type: 'clustering',
          embedding_types: ['float'],
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `Cohere embed HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        embeddings?: { float?: number[][] };
      };
      return data.embeddings?.float?.[0] ?? null;
    } catch (err) {
      const cause = (err as { cause?: unknown })?.cause;
      this.logger.warn(
        `Cohere embed failed: ${String(err)}${cause ? ` → cause: ${String(cause)}` : ''}`,
      );
      return null;
    }
  }

  /** Batch-embed multiple texts (Cohere supports up to 96 per request). */
  async embedBatch(texts: string[]): Promise<Array<number[] | null>> {
    const apiKey = process.env.COHERE_API_KEY?.trim();
    if (!apiKey || texts.length === 0) {
      return texts.map(() => null);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: texts.map((t) => t.slice(0, 4096)),
          model: this.model,
          input_type: 'clustering',
          embedding_types: ['float'],
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `Cohere batch embed HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
        return texts.map(() => null);
      }

      const data = (await response.json()) as {
        embeddings?: { float?: number[][] };
      };
      const embeddings = data.embeddings?.float ?? [];
      return texts.map((_, i) => embeddings[i] ?? null);
    } catch (err) {
      const cause = (err as { cause?: unknown })?.cause;
      this.logger.warn(
        `Cohere batch embed failed: ${String(err)}${cause ? ` → cause: ${String(cause)}` : ''}`,
      );
      return texts.map(() => null);
    }
  }
}
