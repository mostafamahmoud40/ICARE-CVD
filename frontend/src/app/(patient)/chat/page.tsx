"use client"

import { useChat } from "@/components/shared/chat/use-chat"
import { ChatSidebar } from "@/components/shared/chat/chat-sidebar"
import { ChatWindow } from "@/components/shared/chat/chat-window"

export default function ChatPage() {
  const {
    contacts,
    activeContact,
    activeContactId,
    setActiveContactId,
    messages,
    sendMessage,
  } = useChat()

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/30 p-2 md:p-6 lg:flex-row gap-4">
      <ChatSidebar 
        contacts={contacts} 
        activeContactId={activeContactId} 
        onSelectContact={setActiveContactId} 
      />
      
      <ChatWindow 
        activeContact={activeContact} 
        messages={messages} 
        onSendMessage={sendMessage} 
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}} />
    </div>
  )
}
