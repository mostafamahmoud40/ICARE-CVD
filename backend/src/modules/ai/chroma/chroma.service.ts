import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { EmbeddingService } from '../embedding/embedding.service';
import { ExternalEmbeddingFunction } from './external-embedding-function';

export const CHROMA_COLLECTION_CLINIC = 'icare_clinic_context';
export const CHROMA_COLLECTION_APPOINTMENTS = 'icare_appointments';

@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private client!: ChromaClient;
  private _ready = false;
  private readonly embeddingFunction = new ExternalEmbeddingFunction();

  constructor(private readonly embeddingService: EmbeddingService) {}

  async onModuleInit() {
    const url = process.env.CHROMA_URL?.trim() || 'http://localhost:8001';
    this.client = new ChromaClient({ path: url });
    try {
      await this.client.heartbeat();
      this._ready = true;
      this.logger.log(`ChromaDB connected at ${url}`);
    } catch (err) {
      this.logger.warn(
        `ChromaDB not reachable at ${url} — vector search disabled. ${String(err)}`,
      );
    }
  }

  get isReady() {
    return this._ready;
  }

  /** Vector search needs Chroma + an embedding provider (BGE-M3 TEI or Cohere). */
  get isSearchEnabled() {
    return this._ready && this.embeddingService.isEnabled();
  }

  async getOrCreateCollection(name: string): Promise<Collection> {
    const dim = this.embeddingService.getDimension();
    try {
      const col = await this.client.getCollection({
        name,
        embeddingFunction: this.embeddingFunction,
      });
      const storedDim = Number(col.metadata?.embedding_dim);
      if (dim && storedDim && storedDim !== dim) {
        this.logger.warn(
          `Chroma collection "${name}" is ${storedDim}d but provider is ${dim}d — recreating`,
        );
        return this.recreateCollection(name);
      }
      return col;
    } catch {
      return this.createCollection(name);
    }
  }

  private createCollection(name: string): Promise<Collection> {
    const dim = this.embeddingService.getDimension();
    return this.client.createCollection({
      name,
      metadata: {
        'hnsw:space': 'cosine',
        ...(dim ? { embedding_dim: String(dim) } : {}),
      },
      embeddingFunction: this.embeddingFunction,
    });
  }

  private async recreateCollection(name: string): Promise<Collection> {
    try {
      await this.client.deleteCollection({ name });
    } catch {
      // collection may not exist
    }
    return this.createCollection(name);
  }

  private isDimensionMismatchError(err: unknown): boolean {
    const msg = String(err);
    return /expecting embedding with dimension/i.test(msg);
  }

  async upsertDocuments(
    collectionName: string,
    docs: Array<{
      id: string;
      document: string;
      embedding: number[];
      metadata?: Record<string, string | number | boolean>;
    }>,
  ): Promise<void> {
    if (!this._ready || docs.length === 0) return;

    let col = await this.getOrCreateCollection(collectionName);
    try {
      await col.upsert({
        ids: docs.map((d) => d.id),
        documents: docs.map((d) => d.document),
        embeddings: docs.map((d) => d.embedding),
        metadatas: docs.map((d) => d.metadata ?? {}),
      });
    } catch (err) {
      if (!this.isDimensionMismatchError(err)) throw err;
      const dim = this.embeddingService.getDimension();
      this.logger.warn(
        `Recreating Chroma collection "${collectionName}" for ${dim ?? 'new'}d embeddings`,
      );
      col = await this.recreateCollection(collectionName);
      await col.upsert({
        ids: docs.map((d) => d.id),
        documents: docs.map((d) => d.document),
        embeddings: docs.map((d) => d.embedding),
        metadatas: docs.map((d) => d.metadata ?? {}),
      });
    }
  }

  async deleteDocuments(
    collectionName: string,
    ids: string[],
  ): Promise<void> {
    if (!this._ready || ids.length === 0) return;
    try {
      const col = await this.getOrCreateCollection(collectionName);
      await col.delete({ ids });
    } catch {
      // ignore if docs don't exist
    }
  }

  async queryDocuments(
    collectionName: string,
    queryEmbedding: number[],
    nResults = 8,
    where?: Record<string, unknown>,
  ): Promise<Array<{ id: string; document: string; metadata: Record<string, unknown>; distance: number }>> {
    if (!this._ready) return [];
    try {
      const col = await this.getOrCreateCollection(collectionName);
      const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults,
        ...(where ? { where: where as Parameters<typeof col.query>[0]['where'] } : {}),
      });

      const ids = results.ids[0] ?? [];
      const documents = results.documents[0] ?? [];
      const metadatas = results.metadatas[0] ?? [];
      const distances = results.distances?.[0] ?? [];

      return ids.map((id, i) => ({
        id,
        document: documents[i] ?? '',
        metadata: (metadatas[i] ?? {}) as Record<string, unknown>,
        distance: distances[i] ?? 1,
      }));
    } catch (err) {
      this.logger.warn(`ChromaDB query failed: ${String(err)}`);
      return [];
    }
  }

  async getDocumentById(
    collectionName: string,
    id: string,
  ): Promise<string | null> {
    if (!this._ready) return null;
    try {
      const col = await this.getOrCreateCollection(collectionName);
      const result = await col.get({ ids: [id] });
      return result.documents?.[0] ?? null;
    } catch {
      return null;
    }
  }

  // ─── Embedding helper (optional; disabled in Groq-only setup) ─────────────

  async embed(text: string): Promise<number[] | null> {
    return this.embeddingService.embed(text);
  }
}
