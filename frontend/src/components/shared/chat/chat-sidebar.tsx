"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SearchIcon, PlusIcon, Loader2Icon, PhoneIcon, UsersIcon } from "lucide-react"
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
import type { ChatContact } from "./chat.types"
import { getAuthUser } from "@/lib/auth-tokens"

interface ChatSidebarProps {
  contacts: ChatContact[]
  activeContactId: string
  onSelectContact: (id: string) => void
  onStartNewChat?: (conversationId: string) => void
}

type FilterTab = "chat" | "call" | "contacts"

const MOCK_SIDEBAR_CONTACTS: ChatContact[] = [
  {
    id: "mock-anthony",
    name: "Anthony Lewis",
    role: "Doctor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnthonyLewis",
    lastMessage: "is typing...",
    time: "02:40 PM",
    unread: 0,
    online: true,
  },
  {
    id: "mock-elliot",
    name: "Elliot Murray",
    role: "Assistant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ElliotMurray",
    lastMessage: "Document",
    time: "06:12 AM",
    unread: 0,
    online: true,
  },
  {
    id: "mock-stephan",
    name: "Stephan Peralt",
    role: "Doctor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=StephanPeralt",
    lastMessage: "Missed Video Call",
    time: "03:15 AM",
    unread: 0,
    online: false,
  },
  {
    id: "mock-rebecca",
    name: "Rebecca Smith",
    role: "Patient",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=RebeccaSmith",
    lastMessage: "Hi How are you 🔥",
    time: "Sunday",
    unread: 25,
    online: true,
  },
  {
    id: "mock-harvey",
    name: "Harvey Smith",
    role: "Doctor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=HarveySmith",
    lastMessage: "Haha oh man 🔥",
    time: "03:15 AM",
    unread: 12,
    online: true,
  },
  {
    id: "mock-lori",
    name: "Lori Broaddus",
    role: "Assistant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LoriBroaddus",
    lastMessage: "Do you know which...",
    time: "02:40 PM",
    unread: 0,
    online: true,
  },
  {
    id: "mock-brian",
    name: "Brian Villalobos",
    role: "Patient",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BrianVillalobos",
    lastMessage: "Do you know which...",
    time: "06:12 AM",
    unread: 0,
    online: true,
  },
]

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

  // Blend backend contacts and mock contacts together
  const allContactsMap = new Map<string, ChatContact>()
  
  // 1. Add mock contacts
  MOCK_SIDEBAR_CONTACTS.forEach((c) => allContactsMap.set(c.id, c))
  // 2. Add real backend contacts (overwrite or append)
  contacts.forEach((c) => allContactsMap.set(c.id, c))
  
  const allContactsList = Array.from(allContactsMap.values())

  // Filter contacts by search query
  const filteredContacts = allContactsList.filter((c) =>
    c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(filterSearch.toLowerCase()))
  )

  // Split into Favorites (top 5) and Direct Messages (rest)
  const favorites = filteredContacts.slice(0, 5)
  const directMessages = filteredContacts.slice(5)

  const filteredDirectory = (directoryQuery.data ?? []).filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createConversationMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const isDoctor = currentUser?.role === "doctor"
      return createOrGetConversation(
        isDoctor ? { patientId: profileId } : { doctorId: profileId }
      )
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      onStartNewChat?.(String(data.id))
      setIsDialogOpen(false)
      setSearchQuery("")
    },
  })

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
                  {currentUser?.role === "doctor" ? "Start Chat with Patient" : "Start Chat with Doctor"}
                </DialogTitle>
              </DialogHeader>

              <div className="relative mt-2 mb-3">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={currentUser?.role === "doctor" ? "Search patients..." : "Search doctors..."}
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
                    const isPending =
                      createConversationMutation.isPending &&
                      createConversationMutation.variables === u.profileId
                    return (
                      <button
                        key={u.profileId}
                        disabled={createConversationMutation.isPending}
                        onClick={() => createConversationMutation.mutate(u.profileId)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 border border-[#E8E6E0]/40 bg-white hover:shadow-md disabled:opacity-60 cursor-pointer shadow-2xs"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-10 border border-slate-100 shadow-2xs relative bg-white">
                            <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-bold text-sm">
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold text-[14px] text-[#1A1F1E]">{u.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground capitalize mt-0.5">{u.role}</p>
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
        {/* Favourites Section */}
        <SectionHeader title="Favourite" onAdd={() => setIsDialogOpen(true)} />
        <div className="flex flex-col pb-4">
          {favorites.map((contact) => (
            <ContactRowItem
              key={contact.id}
              contact={contact}
              isActive={activeContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))}
        </div>

        {/* Direct Messages Section */}
        <SectionHeader title="Direct Messages" onAdd={() => setIsDialogOpen(true)} />
        <div className="flex flex-col pb-6">
          {directMessages.map((contact) => (
            <ContactRowItem
              key={contact.id}
              contact={contact}
              isActive={activeContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))}
        </div>
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

function SectionHeader({
  title,
  onAdd,
}: {
  title: string
  onAdd: () => void
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[12px] font-semibold text-[#6B7870]">{title}</span>
      <button
        type="button"
        onClick={onAdd}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-[#1A5345]/10 hover:text-[#1A5345] cursor-pointer"
        aria-label={`Add to ${title}`}
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
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
  const isTyping = contact.lastMessage === "is typing..."
  const isDocument = contact.lastMessage === "Document"
  const isMissedCall = contact.lastMessage === "Missed Video Call"

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
  } else if (isDocument) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-muted-foreground">
        <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Document
      </span>
    )
  } else if (isMissedCall) {
    statusContent = (
      <span className="flex items-center gap-1.5 truncate text-[14px] text-[#E8345E]">
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect x="2" y="6" width="12" height="12" rx="2" />
          <line x1="2" y1="6" x2="14" y2="18" />
        </svg>
        Missed Video Call
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
          {contact.avatar ? (
            <AvatarImage src={contact.avatar} alt={contact.name} />
          ) : (
            <AvatarFallback className="bg-[#1A5345]/10 text-[#1A5345] font-semibold text-sm">
              {initials}
            </AvatarFallback>
          )}
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
