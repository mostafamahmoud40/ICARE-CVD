import { useState } from "react"
import { MOCK_CONTACTS, MOCK_MESSAGES } from "./chat-data"
import type { ChatMessage } from "./chat.types"

// This custom hook handles all chat logic, satisfying SRP (only logic) and DIP (abstracts data source from View).
export function useChat() {
  const [activeContactId, setActiveContactId] = useState<string>(MOCK_CONTACTS[0].id)
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)

  const activeContact = MOCK_CONTACTS.find((c) => c.id === activeContactId)

  const activeMessages = messages.filter((m) => m.contactId === activeContactId)

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      contactId: activeContactId,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSender: true,
      status: "sent",
    }
    setMessages((prev) => [...prev, newMsg])
  }

  return {
    contacts: MOCK_CONTACTS,
    activeContact,
    activeContactId,
    setActiveContactId,
    messages: activeMessages,
    sendMessage,
  }
}
