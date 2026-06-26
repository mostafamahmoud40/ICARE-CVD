import type { ChromaClient } from 'chromadb';

type EmbeddingFunctionSpace = 'cosine' | 'l2' | 'ip';

/**
 * Placeholder embedding function for ChromaDB collections where we always
 * supply embeddings externally. Prevents the client from trying
 * to load @chroma-core/default-embed.
 */
export class ExternalEmbeddingFunction {
  readonly name = 'external-provider';

  defaultSpace(): EmbeddingFunctionSpace {
    return 'cosine';
  }

  supportedSpaces(): EmbeddingFunctionSpace[] {
    return ['cosine'];
  }

  getConfig(): Record<string, unknown> {
    return {};
  }

  static buildFromConfig(
    _config: Record<string, unknown>,
    _client?: ChromaClient,
  ): ExternalEmbeddingFunction {
    return new ExternalEmbeddingFunction();
  }

  generate(_texts: string[]): Promise<number[][]> {
    return Promise.reject(
      new Error(
        'ExternalEmbeddingFunction: pass embeddings directly on upsert/query',
      ),
    );
  }
}
