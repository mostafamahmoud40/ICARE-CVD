import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

import type { AgentActionRecord } from "./ai-chat.types"

type AgentActionTrailProps = {
  actions: AgentActionRecord[]
}

export function AgentActionTrail({ actions }: AgentActionTrailProps) {
  if (actions.length === 0) return null

  return (
    <div className="mb-3 space-y-1.5 rounded-xl border border-[#E8E6E0]/70 bg-white/80 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Agent actions
      </p>
      <ul className="space-y-1.5">
        {actions.map((action, index) => {
          const ok = action.status === "success"
          const Icon = ok ? CheckCircle2Icon : XCircleIcon
          return (
            <li
              key={`${action.tool}-${index}`}
              className="flex items-start gap-2 text-[12px] leading-snug"
            >
              <Icon
                className={`mt-0.5 size-3.5 shrink-0 ${ok ? "text-emerald-600" : "text-red-600"}`}
                strokeWidth={2.25}
                aria-hidden
              />
              <div className="min-w-0">
                <span className="font-semibold text-[#1A1F1E]">{action.label}</span>
                {action.detail ? (
                  <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                    {action.detail}
                  </span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
