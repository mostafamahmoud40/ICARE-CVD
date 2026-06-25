import type { EmbeddingProvider } from '../../modules/ai/embedding/embedding.service';

export const EMBEDDING_SERVICE = Symbol('EMBEDDING_SERVICE');

export interface IEmbeddingService {
  isEnabled(): boolean;
  getProvider(): EmbeddingProvider;
  getDimension(): number | null;
  embed(text: string): Promise<number[] | null>;
  embedBatch(texts: string[]): Promise<Array<number[] | null>>;
}
