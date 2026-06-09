"use client"

import { useState } from "react"
import { useChat } from "@/components/shared/chat/use-chat"
import { ChatSidebar } from "@/components/shared/chat/chat-sidebar"
import { ChatWindow } from "@/components/shared/chat/chat-window"
import { ContactInfoPanel } from "@/components/shared/chat/contact-info-panel"

export default function ChatPage() {
  const {
    contacts,
    activeContact,
    activeContactId,
    setActiveContactId,
    messages,
    sendMessage,
    startNewChat,
  } = useChat()

  const [showInfoPanel, setShowInfoPanel] = useState(true)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#F9F8F5] w-full">
      <ChatSidebar 
        contacts={contacts} 
        activeContactId={activeContactId} 
        onSelectContact={setActiveContactId} 
        onStartNewChat={startNewChat}
      />
      
      <ChatWindow 
        activeContact={activeContact} 
        messages={messages} 
        onSendMessage={sendMessage} 
        onToggleInfo={() => setShowInfoPanel((prev) => !prev)}
      />

      {showInfoPanel && activeContact && (
        <ContactInfoPanel 
          contact={activeContact} 
          onClose={() => setShowInfoPanel(false)}
        />
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.4);
        }
      `}} />
    </div>
  )
}
