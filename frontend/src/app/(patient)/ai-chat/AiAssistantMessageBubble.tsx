import * as React from "react"
import Link from "next/link"
import { CalendarDaysIcon, DownloadIcon, MessageCircleIcon, ActivityIcon, AlertTriangleIcon } from "lucide-react"

import type { AiChatAction, AiChatMessage } from "./ai-chat.types"

const ACTION_ICONS = {
  download: DownloadIcon,
  calendar: CalendarDaysIcon,
  message: MessageCircleIcon,
  activity: ActivityIcon,
  alert: AlertTriangleIcon,
} as const

type AiAssistantMessageBubbleProps = {
  message: AiChatMessage
}

function renderRichText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|!!.*?!!|\+\+.*?\+\+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-[#1A1F1E]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('!!') && part.endsWith('!!')) {
      return <span key={index} className="font-bold text-red-700">{part.slice(2, -2)}</span>;
    }
    if (part.startsWith('++') && part.endsWith('++')) {
      return <span key={index} className="font-bold text-emerald-500">{part.slice(2, -2)}</span>;
    }
    return <span key={index}>{part}</span>;
  });
}

function AiMessageAction({ action }: { action: AiChatAction }) {
  const Icon = ACTION_ICONS[action.icon as keyof typeof ACTION_ICONS] || MessageCircleIcon
  const className =
    "inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1A5345] transition-colors hover:text-[#0F3D32]"

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
        <span>{action.label}</span>
      </Link>
    )
  }

  return (
    <button type="button" className={className}>
      <Icon className="size-3.5 shrink-0" strokeWidth={2.25} />
      <span>{action.label}</span>
    </button>
  )
}

export function isRichAssistantMessage(message: AiChatMessage): boolean {
  return (
    message.role === "assistant" &&
    Boolean(message.greeting || (message.actions && message.actions.length > 0) || message.text.match(/(\*\*.*?\*\*|!!.*?!!|\+\+.*?\+\+)/))
  )
}

export function AiAssistantMessageBubble({ message }: AiAssistantMessageBubbleProps) {
  const hasActions = message.actions && message.actions.length > 0

  return (
    <div className="overflow-hidden rounded-2xl rounded-tl-xs border border-[#E8E6E0]/70 bg-[#FAFAF8] shadow-xs">
      <div className="px-4 py-3.5 text-[14px] leading-relaxed text-[#1A1F1E]">
        {message.greeting ? (
          <p className="mb-2 font-bold text-[#1A5345]">{message.greeting}</p>
        ) : null}
        <p className="whitespace-pre-wrap">{renderRichText(message.text)}</p>
      </div>

      {hasActions ? (
        <>
          <div className="border-t border-[#E8E6E0]/70" aria-hidden />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 bg-white/50">
            {message.actions!.map((action) => (
              <AiMessageAction key={action.id} action={action} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
