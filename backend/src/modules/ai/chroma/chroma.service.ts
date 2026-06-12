import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';

export const CHROMA_COLLECTION_CLINIC = 'icare_clinic_context';
export const CHROMA_COLLECTION_APPOINTMENTS = 'icare_appointments';

@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private client!: ChromaClient;
  private _ready = false;

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

  async getOrCreateCollection(name: string): Promise<Collection> {
    return this.client.getOrCreateCollection({
      name,
      metadata: { 'hnsw:space': 'cosine' },
    });
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
    if (!this._ready) return;
    const col = await this.getOrCreateCollection(collectionName);
    await col.upsert({
      ids: docs.map((d) => d.id),
      documents: docs.map((d) => d.document),
      embeddings: docs.map((d) => d.embedding),
      metadatas: docs.map((d) => d.metadata ?? {}),
    });
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
  ): Promise<Array<{ id: string; document: string; metadata: Record<string, unknown>; distance: number }>> {
    if (!this._ready) return [];
    try {
      const col = await this.getOrCreateCollection(collectionName);
      const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults,
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

  // ─── Ollama embedding helper ───────────────────────────────────────────────

  async embed(text: string): Promise<number[] | null> {
    const model = process.env.OLLAMA_EMBEDDING_MODEL?.trim();
    if (!model) return null;

    const baseUrl =
      process.env.OLLAMA_BASE_URL?.trim() ||
      process.env.OLLAMA_BASE_URL_DOCKER?.trim() ||
      'http://127.0.0.1:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: text.slice(0, 6000) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.debug(`Ollama embed HTTP ${response.status} at ${baseUrl}`);
        return null;
      }
      const data = (await response.json()) as {
        embedding?: number[];
        embeddings?: number[][];
      };
      return (
        data.embeddings?.[0] ??
        (Array.isArray(data.embedding) ? data.embedding : null)
      );
    } catch (err) {
      this.logger.debug(`Ollama embed failed at ${baseUrl}: ${String(err)}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
