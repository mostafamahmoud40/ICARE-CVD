"use client"

import { useState } from "react"
import { ChatListPanel } from "./ChatListPanel"
import { ConversationPanel } from "./ConversationPanel"
import { ContactInfoPanel } from "./ContactInfoPanel"
import {
  MOCK_FAVOURITES,
  MOCK_DIRECT_MESSAGES,
  MOCK_MESSAGES,
  MOCK_CONTACT_DETAILS,
} from "./assistantChats.mock"

export default function AssistantChatsPage() {
  const [activeContactId, setActiveContactId] = useState<string | null>("1")
  const [showInfoPanel, setShowInfoPanel] = useState(true)

  /* ── Derive display values from the selected contact ──────── */
  const allContacts = [...MOCK_FAVOURITES, ...MOCK_DIRECT_MESSAGES]
  const activeContact = allContacts.find((c) => c.id === activeContactId)

  const handleSendMessage = (text: string) => {
    // TODO: wire to real API via useChat() hook
    console.log("Send:", text)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#F9F8F5]">
      {/* Left: Contact List */}
      <ChatListPanel
        favourites={MOCK_FAVOURITES}
        directMessages={MOCK_DIRECT_MESSAGES}
        activeContactId={activeContactId}
        onSelectContact={setActiveContactId}
      />

      {/* Center: Conversation */}
      <ConversationPanel
        contactName={activeContact?.name ?? null}
        contactAvatar={activeContact?.avatarColor ?? null}
        isOnline={activeContact?.isOnline ?? false}
        messages={MOCK_MESSAGES}
        onSendMessage={handleSendMessage}
        onToggleInfo={() => setShowInfoPanel((prev) => !prev)}
      />

      {/* Right: Contact Info (toggleable) */}
      {showInfoPanel && <ContactInfoPanel details={MOCK_CONTACT_DETAILS} />}

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.4); }
      `}} />
    </div>
  )
}
