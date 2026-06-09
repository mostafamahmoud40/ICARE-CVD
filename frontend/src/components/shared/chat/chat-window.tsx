"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { 
  PhoneIcon, 
  VideoIcon, 
  SearchIcon, 
  PinIcon, 
  MoreVerticalIcon, 
  PlusIcon,
  SmileIcon,
  MicIcon,
  SendIcon,
  MessageCircleIcon,
  FileIcon,
  DownloadIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatContact, ChatMessage } from "./chat.types"

interface ChatWindowProps {
  activeContact: ChatContact | undefined
  messages: ChatMessage[]
  onSendMessage: (text: string) => void | Promise<void>
  onToggleInfo?: () => void
}

// Custom mock messages mapped by mock contact ID to match the screenshot
const INITIAL_MOCK_CONVERSATIONS: Record<string, ChatMessage[]> = {
  "mock-anthony": [
    {
      id: "mock-m1",
      contactId: "mock-anthony",
      text: "[IMAGES]", 
      time: "8:55 PM",
      isSender: false,
      status: "read",
    },
    {
      id: "mock-m2",
      contactId: "mock-anthony",
      text: "Sed ut perspiciatis unde omnis iste natus error accusantium doloremque laudantium",
      time: "8:55 PM",
      isSender: true,
      status: "read",
    },
    {
      id: "mock-m3",
      contactId: "mock-anthony",
      text: "[FILE]admin_v1.0.zip|25mb",
      time: "8:55 PM",
      isSender: true,
      status: "read",
    },
    {
      id: "mock-m4",
      contactId: "mock-anthony",
      text: "You wait for notice. Consectetuorem ipsum dolor sit? OK?",
      time: "8:55 PM",
      isSender: false,
      status: "read",
    },
    {
      id: "mock-m5",
      contactId: "mock-anthony",
      text: "Sed ut perspiciatis unde omnis iste natus error accusantium doloremque laudantium",
      time: "8:55 PM",
      isSender: true,
      status: "read",
    },
  ],
}

export function ChatWindow({ activeContact, messages, onSendMessage, onToggleInfo }: ChatWindowProps) {
  const [mockConversations, setMockConversations] = useState<Record<string, ChatMessage[]>>(INITIAL_MOCK_CONVERSATIONS)
  const [inputText, setInputText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Get current messages list (real or mock)
  const isMock = activeContact?.id.startsWith("mock-") ?? false
  const activeMessages = isMock && activeContact
    ? mockConversations[activeContact.id] || []
    : messages

  // Scroll to bottom when messages list changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages])

  if (!activeContact) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF8] text-muted-foreground border border-[#E8E6E0]/60 rounded-2xl">
        <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5EEEA]">
          <MessageCircleIcon className="size-10 text-[#1A5345]/40" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1F1E]/70">Your Messages</h3>
        <p className="max-w-[260px] text-center text-[13px] mt-2 text-muted-foreground">
          Select a conversation from the sidebar to start chatting.
        </p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text) return

    if (isMock) {
      // Append to mock state locally
      const newMsg: ChatMessage = {
        id: `mock-user-${Date.now()}`,
        contactId: activeContact.id,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSender: true,
        status: "sent",
      }
      setMockConversations((prev) => ({
        ...prev,
        [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
      }))
    } else {
      // Send real message
      onSendMessage(text)
    }
    setInputText("")
  }

  const initials = activeContact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <div className="flex flex-1 flex-col bg-[#F9F8F5] relative overflow-hidden border border-[#E8E6E0]/60 rounded-2xl shadow-sm">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1A5345 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#E8E6E0]/60 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-14 border border-slate-100 shadow-2xs relative bg-white">
              {activeContact.avatar ? (
                <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
              ) : (
                <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            {activeContact.online && (
              <span className="absolute bottom-0.5 right-0 size-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[17px] font-bold text-[#1A1F1E]">{activeContact.name}</h3>
            {activeContact.online && (
              <p className="text-[13px] font-medium text-emerald-600">Online</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#4F6D64]">
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <Volume2Icon className="size-5" />
          </button>
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <SearchIcon className="size-5" />
          </button>
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <VideoIcon className="size-5" />
          </button>
          <button type="button" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer">
            <PinIcon className="size-5" />
          </button>
          <div className="mx-1 h-6 w-px bg-transparent" />
          <button
            type="button"
            onClick={onToggleInfo}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-slate-100 hover:text-[#1A1F1E] cursor-pointer"
          >
            <MoreVerticalIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-0 flex-1 overflow-y-auto px-6 pt-4 pb-32 custom-scrollbar space-y-4">
        {activeMessages.map((msg) => {
          const isSender = msg.isSender
          const senderName = isSender ? "John Smith" : activeContact.name
          const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName.replace(" ", "")}`

          // Parse special mock text formats
          const isImages = msg.text === "[IMAGES]"
          const isFile = msg.text.startsWith("[FILE]")

          return (
            <div key={msg.id} className={`flex w-full mb-6 gap-3 ${isSender ? "justify-end" : "justify-start"}`}>
              {/* Avatar Left (Incoming) */}
              {!isSender && (
                <div className="relative size-8 shrink-0 pt-1">
                  <Image
                    src={avatarUrl}
                    alt={senderName}
                    width={32}
                    height={32}
                    unoptimized
                    className="size-8 rounded-full bg-slate-200 object-cover shadow-sm ring-1 ring-black/5"
                  />
                </div>
              )}

              {/* Message Column */}
              <div className={`flex flex-col min-w-0 max-w-[75%] ${isSender ? "items-end" : "items-start"}`}>
                {/* Header */}
                <div className={`flex items-center justify-between w-full mb-1.5 gap-4 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[12px] font-medium text-[#1A1F1E]">{senderName}</span>
                  <div className={`flex items-center gap-2 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{msg.time || "8:55 PM"}</span>
                  </div>
                </div>

                {/* Content rendering */}
                {isImages ? (
                  <div className="flex gap-1.5 max-w-[320px]">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={`img-${i}`}
                        className="group relative h-[140px] w-[150px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer border border-[#E8E6E0]"
                      >
                        <div className="size-full bg-gradient-to-br from-slate-300/40 via-slate-200/40 to-slate-400/40 flex items-center justify-center text-muted-foreground/50 backdrop-blur-sm">
                          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isFile ? (
                  (() => {
                    const clean = msg.text.replace("[FILE]", "")
                    const [fileName, fileSize] = clean.split("|")
                    return (
                      <div className="group flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-white px-4 py-3 max-w-[280px] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#1A5345]/20 cursor-pointer">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F3] group-hover:bg-[#1A5345]/10">
                          <FileIcon className="size-5 text-[#6B7870] group-hover:text-[#1A5345]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{fileSize}</p>
                        </div>
                        <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer">
                          <DownloadIcon className="size-4" />
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  <div
                    className={`max-w-[480px] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm transition-all duration-200 ${
                      // Colored red text for the specific mock message
                      msg.id === "mock-m5" ? "text-red-500 font-medium bg-[#EEF2F6]" : ""
                    } ${
                      !isSender && msg.id !== "mock-m5" ? "bg-white border border-[#E8E6E0]/80 rounded-2xl rounded-tl-xs text-[#1A1F1E]" : ""
                    } ${
                      isSender && msg.id !== "mock-m5" ? "bg-[#EEF2F6] rounded-2xl rounded-tr-xs text-[#1A1F1E]" : ""
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>

              {/* Avatar Right (Outgoing) */}
              {isSender && (
                <div className="relative size-8 shrink-0 pt-1">
                  <Image
                    src={avatarUrl}
                    alt={senderName}
                    width={32}
                    height={32}
                    unoptimized
                    className="size-8 rounded-full bg-slate-200 object-cover shadow-sm ring-1 ring-black/5"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-16 bg-gradient-to-t from-[#F9F8F5] via-[#F9F8F5]/95 to-transparent pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto mx-auto max-w-4xl flex items-center gap-2 rounded-full border border-[#E5EEEA]/80 bg-white px-2 py-1.5 shadow-[0_8px_30px_rgba(26,83,69,0.06)] transition-all duration-300 focus-within:border-[#1A5345]/40 focus-within:ring-4 focus-within:ring-[#1A5345]/10 hover:border-[#1A5345]/30"
        >
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1A5345]/10 text-[#1A5345] transition-all duration-200 hover:bg-[#1A5345] hover:text-white cursor-pointer"
          >
            <PlusIcon className="size-5" />
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write your message..."
            className="flex-1 bg-transparent py-2.5 px-3 text-[15px] outline-none placeholder:text-muted-foreground/60 font-medium text-[#1A1F1E]"
          />

          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer"
            >
              <SmileIcon className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-[#6B7870] transition-colors hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer"
            >
              <MicIcon className="size-5" />
            </button>
            <button
              type="submit"
              className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <SendIcon className="size-[18px] ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface Volume2IconProps extends React.SVGProps<SVGSVGElement> {}
function Volume2Icon(props: Volume2IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
