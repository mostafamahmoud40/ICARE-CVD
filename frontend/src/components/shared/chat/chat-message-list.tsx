"use client"

import { useRef, useEffect } from "react"
import { CheckIcon, CheckCheckIcon } from "lucide-react"
import type { ChatMessage } from "./chat.types"

interface ChatMessageListProps {
  messages: ChatMessage[]
  activeContactId: string
}

export function ChatMessageList({ messages, activeContactId }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-muted/10 custom-scrollbar relative">
      <div className="flex justify-center mb-8">
        <span className="text-[10px] font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground shadow-xs">
          Today
        </span>
      </div>
      
      {messages.map((msg, index) => {
        const isNextSenderSame = 
          messages[index + 1]?.contactId === activeContactId && 
          messages[index + 1]?.isSender === msg.isSender;

        return (
          <div
            key={msg.id}
            className={`flex ${msg.isSender ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
          >
            <div
              className={`group relative max-w-[75%] lg:max-w-[65%] flex flex-col ${
                msg.isSender ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 shadow-sm transition-all ${
                  msg.isSender
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border text-foreground"
                }
                ${
                   msg.isSender
                     ? isNextSenderSame ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                     : isNextSenderSame ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                }`}
              >
                <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
              </div>
              
              <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity">
                {msg.time}
                {msg.isSender && (
                  <span>
                    {msg.status === "read" ? (
                      <CheckCheckIcon className="size-3 text-primary/80" />
                    ) : msg.status === "delivered" ? (
                      <CheckCheckIcon className="size-3" />
                    ) : (
                      <CheckIcon className="size-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
