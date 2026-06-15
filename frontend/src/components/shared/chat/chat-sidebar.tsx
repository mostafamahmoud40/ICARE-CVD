"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SearchIcon, PlusIcon, Loader2Icon, PhoneIcon, UsersIcon, ImageIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchDirectory, createOrGetConversation } from "./chat-api"
import { resolveChatAvatarUrl } from "./chat-avatar"
import { MISSED_VIDEO_CALL_LABEL, MISSED_VOICE_CALL_LABEL, OUTGOING_VIDEO_CALL_LABEL, OUTGOING_VOICE_CALL_LABEL, INCOMING_VIDEO_RING_LABEL, INCOMING_VOICE_RING_LABEL, OUTGOING_RING_LABEL } from "./chat-call"
import {
  CHAT_LAST_MESSAGE_DOCUMENT,
  CHAT_LAST_MESSAGE_PHOTO,
  isDocumentLastMessagePreview,
  isPhotoLastMessagePreview,
} from "./chat-message-preview"
import type { ChatContact } from "./chat.types"
import { getAuthUser } from "@/lib/auth-tokens"

interface ChatSidebarProps {
  contacts: ChatContact[]
  activeContactId: string
  onSelectContact: (id: string) => void
  onStartNewChat?: (conversationId: string) => void
}

type FilterTab = "chat" | "call" | "contacts"

export function ChatSidebar({
  contacts,
  activeContactId,
  onSelectContact,
  onStartNewChat,
}: ChatSidebarProps) {
  const queryClient = useQueryClient()
  const currentUser = getAuthUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("chat")
  const [filterSearch, setFilterSearch] = useState("")

  const directoryQuery = useQuery({
    queryKey: ["chat", "directory"],
    queryFn: fetchDirectory,
    enabled: isDialogOpen,
    staleTime: 60_000,
  })

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(filterSearch.toLowerCase())),
  )

  const filteredDirectory = (directoryQuery.data ?? []).filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      (u.specialty?.toLowerCase().includes(q) ?? false)
    )
  })

  const createConversationMutation = useMutation({
    mutationFn: async (entry: { profileId: string; role: string }) => {
      if (currentUser?.role === "doctor") {
        return createOrGetConversation({ patientId: entry.profileId })
      }
      if (currentUser?.role === "patient") {
        return createOrGetConversation({ doctorId: entry.profileId })
      }
      if (currentUser?.role === "assistant") {
        if (entry.role === "doctor") {
          return createOrGetConversation({ doctorId: entry.profileId })
        }
        return createOrGetConversation({ patientId: entry.profileId })
      }
      throw new Error("Unsupported role for chat")
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      onStartNewChat?.(String(data.id))
      setIsDialogOpen(false)
      setSearchQuery("")
    },
  })

  const newChatDialogTitle =
    currentUser?.role === "doctor"
      ? "Start chat with patient"
      : currentUser?.role === "patient"
        ? "Start chat with doctor"
        : "Start chat with doctor or patient"

  const newChatSearchPlaceholder =
    currentUser?.role === "doctor"
      ? "Search patients..."
      : currentUser?.role === "patient"
        ? "Search doctors..."
        : "Search doctors or patients..."

  return (
    <div className="flex h-full w-full flex-col border-r border-[#E8E6E0]/70 bg-[#F9F8F5]/80 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 lg:w-[330px] shrink-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-[#1A1F1E]">Chats</h2>
            <p className="text-[11px] text-[#6B7870]">Start New Conversation</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSearchQuery("") }}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"
                aria-label="New conversation"
              >
                <PlusIcon className="size-4" />
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-2xl border border-[#E8E6E0]/70 bg-white p-6 shadow-[0_12px_40px_rgba(26,83,69,0.08)]">
              <DialogHeader>
                <DialogTitle className="text-[16px] font-bold text-[#1A1F1E]">
                  {newChatDialogTitle}
                </DialogTitle>
              </DialogHeader>

              <div className="relative mt-2 mb-3">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={newChatSearchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-[#E8E6E0]/80 bg-[#F9F8F5]/80 text-[14px] shadow-2xs transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/20 focus-visible:border-[#1A5345]"
                  autoFocus
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {directoryQuery.isLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2Icon className="size-5 animate-spin mr-2 text-[#1A5345]" />
                    <span className="text-[13px] font-medium">Loading Directory...</span>
                  </div>
                ) : directoryQuery.isError ? (
                  <div className="py-8 text-center text-[13px] text-destructive font-medium">
                    Failed to load. Check server connection.
                  </div>
                ) : filteredDirectory.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-muted-foreground font-medium">
                    {searchQuery ? `No results for "${searchQuery}"` : "No users available."}
                  </div>
                ) : (
                  filteredDirectory.map((u) => {
                    const mutationKey = `${u.role}:${u.profileId}`
                    const isPending =
                      createConversationMutation.isPending &&
                      createConversationMutation.variables?.profileId === u.profileId &&
                      createConversationMutation.variables?.role === u.role
                    return (
                      <button
                        key={mutationKey}
                        disabled={createConversationMutation.isPending}
                        onClick={() =>
                          createConversationMutation.mutate({
                            profileId: u.profileId,
                            role: u.role,
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 border border-[#E8E6E0]/40 bg-white hover:shadow-md disabled:opacity-60 cursor-pointer shadow-2xs"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-10 border border-slate-100 shadow-2xs relative bg-white">
                            <AvatarImage
                              src={resolveChatAvatarUrl(u.avatarUrl)}
                              alt={u.name}
                            />
                            <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-bold text-sm">
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold text-[14px] text-[#1A1F1E]">{u.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {u.role === "doctor" && u.specialty
                              ? u.specialty
                              : u.role === "patient"
                                ? "Patient"
                                : u.role === "assistant"
                                  ? "Clinical assistant"
                                  : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </p>
                        </div>
                        {isPending && <Loader2Icon className="size-4 animate-spin shrink-0 text-muted-foreground" />}
                      </button>
                    )
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages or users"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="h-10 rounded-xl border-[#E5EEEA]/60 bg-[#F9F8F5]/80 pl-9 text-[13px] shadow-sm transition-all duration-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/20 focus-visible:border-[#1A5345]/40"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <FilterTabButton
          icon={null}
          label="Chat"
          isActive={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        />
        <FilterTabButton
          icon={<PhoneIcon className="size-3" />}
          label="Call"
          isActive={activeTab === "call"}
          onClick={() => setActiveTab("call")}
        />
        <FilterTabButton
          icon={<UsersIcon className="size-3" />}
          label="Contacts"
          isActive={activeTab === "contacts"}
          onClick={() => setActiveTab("contacts")}
        />
      </div>

      {/* Contact Lists */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-[14px] font-semibold text-[#1A1F1E]">No conversations yet</p>
            <p className="mt-2 max-w-[220px] text-[12px] text-muted-foreground">
              Start a new chat with the + button to message a doctor or patient.
            </p>
          </div>
        ) : (
          <div className="flex flex-col pb-6">
            {filteredContacts.map((contact) => (
              <ContactRowItem
                key={contact.id}
                contact={contact}
                isActive={activeContactId === contact.id}
                onClick={() => onSelectContact(contact.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterTabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ease-out cursor-pointer ${
        isActive
          ? "bg-[#1A5345] text-white shadow-md scale-[1.02]"
          : "bg-[#F5F5F3]/80 text-muted-foreground hover:bg-[#EEF5F3] hover:text-[#1A5345]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ContactRowItem({
  contact,
  isActive,
  onClick,
}: {
  contact: ChatContact
  isActive: boolean
  onClick: () => void
}) {
  const isTyping = contact.isTyping === true
  const isDocument = isDocumentLastMessagePreview(contact.lastMessage)
  const isPhoto = isPhotoLastMessagePreview(contact.lastMessage)
  const isMissedVideoCall = contact.lastMessage === MISSED_VIDEO_CALL_LABEL
  const isMissedVoiceCall = contact.lastMessage === MISSED_VOICE_CALL_LABEL
  const isOutgoingVideoCall = contact.lastMessage === OUTGOING_VIDEO_CALL_LABEL
  const isOutgoingVoiceCall = contact.lastMessage === OUTGOING_VOICE_CALL_LABEL
  const isIncomingVideoRing = contact.lastMessage === INCOMING_VIDEO_RING_LABEL
  const isIncomingVoiceRing = contact.lastMessage === INCOMING_VOICE_RING_LABEL
  const isOutgoingRing = contact.lastMessage === OUTGOING_RING_LABEL

  let statusContent: React.ReactNode = <span className="truncate">{contact.lastMessage}</span>

  if (isTyping) {
    statusContent = (
      <span className="flex items-center gap-1 truncate text-[14px] text-muted-foreground">
        is typing
        <span className="flex items-center gap-0.5 ml-0.5 mt-1.5">
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" />
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </span>
    )
  } else if (isPhoto) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-muted-foreground">
        <ImageIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        {CHAT_LAST_MESSAGE_PHOTO}
      </span>
    )
  } else if (isDocument) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-muted-foreground">
        <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        {CHAT_LAST_MESSAGE_DOCUMENT}
      </span>
    )
  } else if (isMissedVideoCall) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#E8345E]">
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect x="2" y="6" width="12" height="12" rx="2" />
          <line x1="2" y1="6" x2="14" y2="18" />
        </svg>
        {MISSED_VIDEO_CALL_LABEL}
      </span>
    )
  } else if (isMissedVoiceCall) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#E8345E]">
        <PhoneIcon className="size-4 shrink-0" strokeWidth={2} />
        {MISSED_VOICE_CALL_LABEL}
      </span>
    )
  } else if (isOutgoingVideoCall) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#6B7870]">
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect x="2" y="6" width="12" height="12" rx="2" />
        </svg>
        {OUTGOING_VIDEO_CALL_LABEL}
      </span>
    )
  } else if (isOutgoingVoiceCall) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#6B7870]">
        <PhoneIcon className="size-4 shrink-0" strokeWidth={2} />
        {OUTGOING_VOICE_CALL_LABEL}
      </span>
    )
  } else if (isIncomingVideoRing || isIncomingVoiceRing) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-[#1A5345] animate-pulse">
        {isIncomingVideoRing ? (
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m22 8-6 4 6 4V8Z" />
            <rect x="2" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <PhoneIcon className="size-4 shrink-0" strokeWidth={2} />
        )}
        {contact.lastMessage}
      </span>
    )
  } else if (isOutgoingRing) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#6B7870] animate-pulse">
        <PhoneIcon className="size-4 shrink-0" strokeWidth={2} />
        {OUTGOING_RING_LABEL}
      </span>
    )
  } else {
    statusContent = (
      <span className="truncate text-[14px] text-muted-foreground">
        {contact.lastMessage}
      </span>
    )
  }

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-[12px] p-3.5 text-left transition-colors duration-200 ease-out hover:bg-slate-100/80 cursor-pointer ${
        isActive ? "bg-slate-100/80" : "bg-transparent"
      }`}
    >
      <div className="relative size-11 shrink-0">
        <Avatar className="size-11 border border-slate-100 shadow-2xs relative bg-white">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {contact.online && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span className="truncate text-[15px] font-bold text-[#1A1F1E]">
          {contact.name}
        </span>
        {statusContent}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between h-[42px]">
        <span className="text-[13px] text-muted-foreground font-medium">
          {contact.time}
        </span>
        <div className="flex items-center gap-1.5 mt-1 h-5">
          {contact.unread > 0 && (
            <span className="flex h-5 min-w-[20px] px-1.5 shrink-0 items-center justify-center rounded-full bg-[#E8345E] text-[11px] font-bold text-white">
              {contact.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
