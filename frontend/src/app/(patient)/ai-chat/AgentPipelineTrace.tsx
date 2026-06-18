import { BrainCircuitIcon } from "lucide-react"

import type { PipelineStageRecord } from "./ai-chat.types"

type AgentPipelineTraceProps = {
  stages: PipelineStageRecord[]
}

const STAGE_LABELS_AR: Record<string, string> = {
  understanding: "فهم السؤال",
  intent: "تحديد النية",
  expansion: "توسيع السؤال",
  retrieval: "البحث",
  context: "تجميع السياق",
  generation: "توليد الرد",
}

export function AgentPipelineTrace({ stages }: AgentPipelineTraceProps) {
  if (stages.length === 0) return null

  return (
    <details className="mb-3 rounded-xl border border-[#E8E6E0]/70 bg-white/60 px-3 py-2.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground [&::-webkit-details-marker]:hidden">
        <BrainCircuitIcon className="size-3.5 shrink-0 text-[#1A5345]" strokeWidth={2.25} aria-hidden />
        <span>Agent pipeline</span>
        <span className="font-medium normal-case text-[#1A5345]">({stages.length} stages)</span>
      </summary>
      <ol className="mt-2.5 space-y-2 border-t border-[#E8E6E0]/60 pt-2.5">
        {stages.map((stage) => (
          <li key={stage.key} className="flex gap-2 text-[11px] leading-snug">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#1A5345]/10 text-[9px] font-bold text-[#1A5345]">
              {stage.stage}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#1A1F1E]">
                {STAGE_LABELS_AR[stage.key] ?? stage.label}
              </p>
              <p className="text-muted-foreground">{stage.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
