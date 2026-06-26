import * as React from "react"
import { 
  SendIcon, 
  BotIcon,
  BotMessageSquareIcon,
  HelpCircleIcon,
  PaperclipIcon,
  MicIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AiAssistantMessageBubble, isRichAssistantMessage } from "./AiAssistantMessageBubble"
import { PatientAiChatHealthPanel } from "./PatientAiChatHealthPanel"
import type { AiChatDisplayMessage } from "./ai-chat.types"
import type { PatientAiChatHealthContext } from "./patientAiChatContext.types"

interface PatientAiChatProps {
  messages: AiChatDisplayMessage[]
  activeContactId: string
  onSendMessage: (text: string) => void
  isAssistantTyping: boolean
  healthContext: PatientAiChatHealthContext
  isHealthContextLoading: boolean
}

const SUGGESTIONS = [
  {
    title: "My appointments",
    desc: "Ask the agent what you have booked today or this week.",
    query: "ما هي مواعيدي القادمة؟",
    emoji: "📅",
  },
  {
    title: "Book a visit",
    desc: "Let the agent find an open slot and book for you.",
    query: "احجزلي موعد متابعة مع أي دكتور متاح",
    emoji: "🩺",
  },
  {
    title: "Cancel appointment",
    desc: "Cancel your next upcoming visit by confirmation code.",
    query: "الغِ آخر موعد عندي",
    emoji: "✖️",
  },
  {
    title: "Reschedule",
    desc: "Move an existing booking to another day or time.",
    query: "أعد جدولة موعدي ليوم تاني",
    emoji: "🔄",
  },
]

export function PatientAiChat({
  messages,
  onSendMessage,
  isAssistantTyping,
  healthContext,
  isHealthContextLoading,
}: PatientAiChatProps) {
  const [inputText, setInputText] = React.useState("")
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isAssistantTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInputText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-[#F9F8F5]">
      {/* Body: Split into Chat (Left) and Active Health Context Panel (Right) */}
      <div className="flex-1 min-h-0 flex relative">
        {/* Left Side: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-[#E8E6E0]/50 bg-white px-4 py-3 md:px-6 md:py-3.5">
            <BotMessageSquareIcon className="size-[18px] shrink-0 text-[#1A5345]" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-[#1A1F1E]">
                {isAssistantTyping ? (
                  <span className="text-[#1A5345] animate-pulse">Agent is working…</span>
                ) : (
                  "ICARE Care Agent"
                )}
              </h2>
              {!isAssistantTyping ? (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Book · Cancel · Reschedule · Answer
                </p>
              ) : null}
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Agent
            </span>
          </div>

          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto bg-[#F9F8F5] p-4 md:p-6 custom-scrollbar relative">
          
          {/* Welcome Container / Message List */}
          <div className="space-y-4 max-w-3xl mx-auto pb-44">
            {messages.map((msg) => {
              const isAi = msg.role === "assistant"
              const isUser = msg.role === "user"
              const richAssistant = isAi && isRichAssistantMessage(msg)

              return (
                <div
                  key={msg.id}
                  className={`flex ${isAi ? "justify-start" : "justify-end"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                >
                  <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser && "flex-row-reverse"}`}>
                    {isAi && (
                      <Avatar className="size-8 border border-[#E8E6E0]/60 shrink-0 bg-[#EEF5F3] hidden sm:flex">
                        <AvatarFallback className="text-[#1A5345] bg-[#1A5345]/5">
                          <BotIcon className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={richAssistant ? "min-w-0 w-full max-w-[540px]" : undefined}>
                      {richAssistant ? (
                        <AiAssistantMessageBubble message={msg} />
                      ) : (
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-xs text-[14px] leading-relaxed transition-all ${
                            isAi
                              ? "bg-white border border-[#E8E6E0]/70 text-[#1A1F1E] rounded-tl-xs"
                              : "bg-[#1A5345] text-white rounded-tr-xs shadow-md"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[11px] text-muted-foreground/80 ${isUser && "justify-end"}`}>
                        <span>{msg.time || "Today"}</span>
                        {isUser ? (
                          <span className="text-[#1A5345] font-bold">● Sent</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Bouncing Typing Indicator */}
            {isAssistantTyping && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="flex gap-3 max-w-[75%]">
                  <Avatar className="size-8 border border-[#E8E6E0]/60 shrink-0 bg-[#EEF5F3] hidden sm:flex">
                    <AvatarFallback className="text-[#1A5345] bg-[#1A5345]/5">
                      <BotIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-white border border-[#E8E6E0]/70 text-[#1A1F1E] shadow-xs flex items-center gap-1.5 h-[38px] w-[56px] justify-center">
                    <span className="size-1.5 rounded-full bg-[#1A5345] dot-bounce dot-bounce-1" />
                    <span className="size-1.5 rounded-full bg-[#1A5345] dot-bounce dot-bounce-2" />
                    <span className="size-1.5 rounded-full bg-[#1A5345] dot-bounce" />
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Block — shown before the first message */}
            {messages.length === 0 && !isAssistantTyping && (
              <div className="pt-6 border-t border-[#E8E6E0]/45 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <HelpCircleIcon className="size-3.5 text-[#1A5345]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Try the agent</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => onSendMessage(item.query)}
                      className="flex items-start gap-3.5 text-left p-3.5 rounded-xl border border-[#E8E6E0]/60 bg-white shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <span className="text-lg p-2 rounded-lg bg-white border border-[#E8E6E0]/45 shadow-2xs shrink-0">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-[#1A1F1E]">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 leading-normal">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
      </div>

      {/* Floating Input Section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-[#F9F8F5] via-[#F9F8F5]/95 to-transparent px-6 pb-6 pt-16">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto relative mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-[#E8E6E0]/80 bg-white py-2 pl-4 pr-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-colors focus-within:border-[#1A5345]/30"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Attach file"
            className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none hover:bg-transparent hover:text-[#1A5345]"
          >
            <PaperclipIcon className="size-4" strokeWidth={2} />
          </Button>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent to book, cancel, or check your appointments…"
            className="custom-scrollbar min-h-[36px] max-h-24 flex-1 resize-none bg-transparent py-2 font-serif text-[15px] leading-snug text-[#1A1F1E] outline-none placeholder:font-serif placeholder:text-[15px] placeholder:text-[#9CA3AF]"
            rows={1}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Voice input"
            className="size-8 shrink-0 border-0 bg-transparent text-[#6B7870] shadow-none hover:bg-transparent hover:text-[#1A5345]"
          >
            <MicIcon className="size-4" strokeWidth={2} />
          </Button>

          <Button
            type="submit"
            disabled={!inputText.trim() || isAssistantTyping}
            size="icon"
            aria-label="Send message"
            className="size-10 shrink-0 rounded-full border-0 bg-[#1A5345] text-white shadow-none transition-colors hover:bg-[#0F3D32] disabled:opacity-40"
          >
            <SendIcon className="size-4" />
          </Button>
        </form>
      </div>
    </div>

    <PatientAiChatHealthPanel context={healthContext} isLoading={isHealthContextLoading} />
  </div>

      {/* Typing Indicator & Dot Bounce Keyframe CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceDelay {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        .dot-bounce {
          animation: bounceDelay 1.4s infinite ease-in-out both;
        }
        .dot-bounce-1 { animation-delay: -0.32s; }
        .dot-bounce-2 { animation-delay: -0.16s; }
      `}} />
    </div>
  )
}
