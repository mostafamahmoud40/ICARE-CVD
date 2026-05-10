"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { SearchIcon, PlusIcon, PhoneIcon, UsersIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ChatContactItem } from "./ChatContactItem"
import type { ContactItem, FilterTab } from "./assistantChats.types"

interface ChatListPanelProps {
  favourites: ContactItem[]
  directMessages: ContactItem[]
  activeContactId: string | null
  onSelectContact: (id: string) => void
  onNewConversation?: () => void
}

export function ChatListPanel({
  favourites,
  directMessages,
  activeContactId,
  onSelectContact,
  onNewConversation,
}: ChatListPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("chat")
  const [search, setSearch] = useState("")

  const filterContacts = (list: ContactItem[]) =>
    list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )

  const filteredFavourites = filterContacts(favourites)
  const filteredDirect = filterContacts(directMessages)

  return (
    <div className="flex h-full w-[330px] shrink-0 flex-col border-r border-[#E8E6E0]/70 bg-[#F9F8F5]/80 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-[#1A1F1E]">Chats</h2>
            <p className="text-[11px] text-muted-foreground">Start New Conversation</p>
          </div>
          <button
            type="button"
            onClick={onNewConversation}
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1A5345] to-[#0F3D32] text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            aria-label="New conversation"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages or users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <SectionHeader title="Favourite" onAdd={() => {}} />
        <div className="flex flex-col pb-4">
          {filteredFavourites.map((contact) => (
            <ChatContactItem
              key={contact.id}
              name={contact.name}
              lastMessage={contact.lastMessage}
              lastMessageType={contact.lastMessageType}
              time={contact.time}
              unreadCount={contact.unreadCount}
              isOnline={contact.isOnline}
              isPinned={contact.isPinned}
              statusIcon={contact.statusIcon}
              isActive={activeContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))}
        </div>

        {/* Direct Messages Section */}
        <SectionHeader title="Direct Messages" onAdd={() => {}} />
        <div className="flex flex-col pb-6">
          {filteredDirect.map((contact) => (
            <ChatContactItem
              key={contact.id}
              name={contact.name}
              lastMessage={contact.lastMessage}
              lastMessageType={contact.lastMessageType}
              time={contact.time}
              unreadCount={contact.unreadCount}
              isOnline={contact.isOnline}
              isPinned={contact.isPinned}
              statusIcon={contact.statusIcon}
              isActive={activeContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SRP: filter tab button ──────────────────────────────────── */
function FilterTabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 ease-out ${
        isActive
          ? "bg-[#1A5345] text-white shadow-md scale-[1.02]"
          : "bg-[#F5F5F3]/80 text-muted-foreground hover:bg-[#E8F0EE] hover:text-[#1A5345]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── SRP: section header ─────────────────────────────────────── */
function SectionHeader({
  title,
  onAdd,
}: {
  title: string
  onAdd: () => void
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <span className="text-[12px] font-semibold text-[#6B7870]">{title}</span>
      <button
        type="button"
        onClick={onAdd}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-[#1A5345]/10 hover:text-[#1A5345]"
        aria-label={`Add to ${title}`}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
