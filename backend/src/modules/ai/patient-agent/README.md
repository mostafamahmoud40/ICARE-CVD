# ICARE Patient Agent

**Patient Care Agent** — autonomous clinic coordinator for logged-in patients.

Entry point: `POST /ai/chat` → `PatientAiChatService` → this folder.

## What it does

| Capability | How |
|------------|-----|
| List upcoming appointments | Live PostgreSQL + RAG context |
| Book / cancel / reschedule / change visit type | LangChain `tool()` → DB |
| Arabic colloquial queries (Egyptian, etc.) | Understanding chain + heuristics |
| Semantic clinic search | Chroma + BGE-M3 vectors (optional GPU) |

## Folder layout

```
patient-agent/
├── README.md                 ← you are here
├── agent.types.ts            ← pipeline types (intents, entities, hits)
├── agent-heuristics.ts       ← Arabic NER / intent fallback
├── agent-retrieval.stage.ts  ← keyword (Postgres) + vector (Chroma)
├── agent-context.stage.ts    ← dedup, rank, citations
├── agent-prompt.stage.ts     ← intent-specific prompt addons
└── langchain/
    ├── langchain-care-agent.service.ts      ← createAgent + ChatGroq
    ├── langchain-rag-pipeline.service.ts    ← 6-stage RAG pipeline
    ├── langchain-understanding.chain.ts     ← structured query understanding
    ├── patient-appointment-tools.service.ts ← tool execution (DB)
    └── patient-appointment.langchain-tools.ts ← LangChain tool definitions
```

## Pipeline (6 stages)

1. **Understanding** — LangChain + Groq (dialect, entities)
2. **Intent** — multi-label classification
3. **Expansion** — synonyms / sub-questions
4. **Retrieval** — Postgres keyword + Chroma vector
5. **Context** — assemble ranked blocks + live snapshot
6. **Generation** — LangChain ReAct agent with clinic tools

## Stack

- **LLM:** Groq (`ChatGroq`) — chat + analysis
- **Agent:** LangChain `createAgent` + `tool()`
- **Vectors:** BGE-M3 (TEI on GPU) → ChromaDB
- **Data:** PostgreSQL (authoritative for booking)

## Legacy (unused)

`agent-pipeline.service.ts` and `agent-understanding.stage.ts` are superseded by `langchain/` — safe to remove in a cleanup PR.
