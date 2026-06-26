import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import type { IEmbeddingService } from '../../../shared/ports/embedding.port';
import { formatUnknown } from '../../../shared/format-unknown';

export type EmbeddingProvider = 'bge-m3' | 'cohere' | 'none';

const BGE_M3_DIM = 1024;
const COHERE_DIM = 384;

/**
 * Text embeddings for ChromaDB vector search (and optional pgvector columns).
 *
 * - Chat / analysis: Groq only.
 * - Chroma search: BGE-M3 via local TEI service (recommended) or Cohere API.
 */
@Injectable()
export class EmbeddingService implements OnModuleInit, IEmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private loggedDisabled = false;
  private provider: EmbeddingProvider = 'none';

  private readonly cohereModel =
    process.env.COHERE_EMBEDDING_MODEL?.trim() ||
    'embed-multilingual-light-v3.0';

  private readonly cohereApiUrl = 'https://api.cohere.com/v2/embed';

  onModuleInit() {
    this.provider = this.resolveProvider();

    if (this.provider === 'bge-m3') {
      this.logger.log(
        `Embeddings enabled — BGE-M3 at ${this.bgeM3Url()} (${BGE_M3_DIM}d, Chroma vector search)`,
      );
      return;
    }

    if (this.provider === 'cohere') {
      this.logger.log(
        `Embeddings enabled — Cohere ${this.cohereModel} (${COHERE_DIM}d)`,
      );
      return;
    }

    this.logger.log(
      'Embeddings disabled — set BGE_M3_URL (recommended) or COHERE_API_KEY for Chroma vector search.',
    );
  }

  isEnabled(): boolean {
    return this.provider !== 'none';
  }

  getProvider(): EmbeddingProvider {
    return this.provider;
  }

  /** Dimension of vectors produced by the active provider (null when disabled). */
  getDimension(): number | null {
    if (this.provider === 'bge-m3') return BGE_M3_DIM;
    if (this.provider === 'cohere') return COHERE_DIM;
    return null;
  }

  /** Generate an embedding vector. Returns null when disabled or on failure. */
  async embed(text: string): Promise<number[] | null> {
    const results = await this.embedBatch([text]);
    return results[0] ?? null;
  }

  async embedBatch(texts: string[]): Promise<Array<number[] | null>> {
    if (!this.isEnabled() || texts.length === 0) {
      this.logDisabledOnce();
      return texts.map(() => null);
    }

    if (this.provider === 'bge-m3') {
      return this.embedBatchBgeM3(texts);
    }

    return this.embedBatchCohere(texts);
  }

  private resolveProvider(): EmbeddingProvider {
    const explicit = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();

    if (explicit === 'none' || explicit === 'disabled' || explicit === 'off') {
      return 'none';
    }

    if (explicit === 'cohere') {
      return process.env.COHERE_API_KEY?.trim() ? 'cohere' : 'none';
    }

    if (explicit === 'bge-m3' || explicit === 'bge_m3') {
      return this.bgeM3Url() ? 'bge-m3' : 'none';
    }

    if (this.bgeM3Url()) return 'bge-m3';
    if (process.env.COHERE_API_KEY?.trim()) return 'cohere';
    return 'none';
  }

  private bgeM3Url(): string {
    return (
      process.env.BGE_M3_URL?.trim() ||
      process.env.EMBEDDING_URL?.trim() ||
      ''
    ).replace(/\/$/, '');
  }

  private async embedBatchBgeM3(
    texts: string[],
  ): Promise<Array<number[] | null>> {
    const base = this.bgeM3Url();
    if (!base) return texts.map(() => null);

    try {
      const response = await fetch(`${base}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs:
            texts.length === 1
              ? texts[0].slice(0, 8192)
              : texts.map((t) => t.slice(0, 8192)),
        }),
        signal: AbortSignal.timeout(180_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `BGE-M3 embed HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
        return texts.map(() => null);
      }

      const data = (await response.json()) as number[][];
      if (!Array.isArray(data) || data.length === 0) {
        this.logger.warn('BGE-M3 embed returned empty response');
        return texts.map(() => null);
      }

      return texts.map((_, i) => {
        const vec = data[i];
        if (!Array.isArray(vec) || vec.length === 0) return null;
        if (vec.length !== BGE_M3_DIM) {
          this.logger.warn(
            `BGE-M3 unexpected dimension: got ${vec.length}, expected ${BGE_M3_DIM}`,
          );
        }
        return vec;
      });
    } catch (err) {
      const cause = (err as { cause?: unknown })?.cause;
      this.logger.warn(
        `BGE-M3 embed failed: ${String(err)}${cause ? ` → cause: ${formatUnknown(cause)}` : ''}`,
      );
      return texts.map(() => null);
    }
  }

  private async embedBatchCohere(
    texts: string[],
  ): Promise<Array<number[] | null>> {
    const apiKey = process.env.COHERE_API_KEY?.trim();
    if (!apiKey) return texts.map(() => null);

    try {
      const response = await fetch(this.cohereApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: texts.map((t) => t.slice(0, 4096)),
          model: this.cohereModel,
          input_type: 'clustering',
          embedding_types: ['float'],
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `Cohere embed HTTP ${response.status}: ${body.slice(0, 200)}`,
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
        `Cohere embed failed: ${String(err)}${cause ? ` → cause: ${formatUnknown(cause)}` : ''}`,
      );
      return texts.map(() => null);
    }
  }

  private logDisabledOnce() {
    if (this.loggedDisabled) return;
    this.loggedDisabled = true;
  }
}
