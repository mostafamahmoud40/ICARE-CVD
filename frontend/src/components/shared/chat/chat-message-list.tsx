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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-[#F9F8F5]/30 to-white custom-scrollbar relative">
      <div className="flex justify-center mb-6">
        <span className="text-[10px] font-extrabold bg-[#EEF5F3] px-3 py-1 rounded-full text-[#1A5345] uppercase tracking-wider shadow-2xs">
          Conversation Log
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
              className={`group relative max-w-[80%] sm:max-w-[70%] flex flex-col ${
                msg.isSender ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 shadow-2xs transition-all ${
                  msg.isSender
                    ? "bg-gradient-to-br from-[#1A5345] to-[#123E34] text-white"
                    : "bg-white border border-[#E8E6E0]/80 text-[#1A1F1E]"
                }
                ${
                   msg.isSender
                     ? isNextSenderSame ? "rounded-2xl rounded-br-xs" : "rounded-2xl"
                     : isNextSenderSame ? "rounded-2xl rounded-bl-xs" : "rounded-2xl"
                }`}
              >
                <p className="text-[12.5px] sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
              </div>
              
              <div className="mt-1 flex items-center gap-1.5 px-1 text-[9px] text-muted-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {msg.time || "Just now"}
                {msg.isSender && (
                  <span>
                    {msg.status === "read" ? (
                      <CheckCheckIcon className="size-3 text-emerald-600 font-bold" />
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
