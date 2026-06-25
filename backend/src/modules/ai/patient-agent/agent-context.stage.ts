import { Injectable } from '@nestjs/common';

import type {
  AssembledContext,
  ContextBlock,
  RetrievalHit,
} from './agent.types';

@Injectable()
export class AgentContextStage {
  run(hits: RetrievalHit[]): AssembledContext {
    const deduped = this.deduplicate(hits);
    const ranked = deduped.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const priority = (c: string) =>
        c === 'appointments'
          ? 3
          : c === 'schedule'
            ? 2
            : c === 'doctors'
              ? 1
              : 0;
      return priority(b.collection) - priority(a.collection);
    });

    const blocks: ContextBlock[] = ranked.slice(0, 12).map((hit) => ({
      citation: hit.citation,
      content: hit.content,
      score: hit.score,
      collection: hit.collection,
    }));

    const formatted = this.formatBlocks(blocks);
    return { blocks, formatted };
  }

  private deduplicate(hits: RetrievalHit[]): RetrievalHit[] {
    const seenContent = new Set<string>();
    const seenCitation = new Set<string>();
    const out: RetrievalHit[] = [];

    for (const hit of hits) {
      const contentKey = hit.content.trim().toLowerCase();
      if (seenCitation.has(hit.citation) || seenContent.has(contentKey))
        continue;
      seenCitation.add(hit.citation);
      seenContent.add(contentKey);
      out.push(hit);
    }
    return out;
  }

  private formatBlocks(blocks: ContextBlock[]): string {
    if (blocks.length === 0) {
      return '=== RETRIEVED CONTEXT ===\n(no ranked hits — use live clinic snapshot below)\n=== END ===';
    }

    const byCollection = new Map<string, ContextBlock[]>();
    for (const block of blocks) {
      const list = byCollection.get(block.collection) ?? [];
      list.push(block);
      byCollection.set(block.collection, list);
    }

    const lines: string[] = [
      '=== RETRIEVED CONTEXT (ranked, with citations) ===',
    ];

    const order: Array<ContextBlock['collection']> = [
      'appointments',
      'schedule',
      'doctors',
      'clinic_vector',
    ];

    for (const collection of order) {
      const group = byCollection.get(collection);
      if (!group?.length) continue;
      lines.push(`--- ${collection} ---`);
      for (const block of group) {
        lines.push(
          `[${block.citation}] (score:${block.score.toFixed(2)}) ${block.content}`,
        );
      }
    }

    lines.push('=== END RETRIEVED CONTEXT ===');
    return lines.join('\n');
  }
}
