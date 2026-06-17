"use client"

import { useMemo, useState } from "react"
import { useChat } from "@/components/shared/chat/use-chat"
import { useChatDeepLink } from "@/components/shared/chat/use-chat-deep-link"
import { ChatSidebar } from "@/components/shared/chat/chat-sidebar"
import { ChatWindow } from "@/components/shared/chat/chat-window"
import { ContactInfoPanel } from "@/components/shared/chat/contact-info-panel"
import { resolveChatContact } from "@/components/shared/chat/chat-contact"

export default function AssistantChatsPage() {
  const {
    contacts,
    activeContactId,
    setActiveContactId,
    messages,
    sendMessage,
    startNewChat,
    notifyTyping,
    recordMissedCall,
    callPreviewByContactId,
    currentUserAvatar,
    uploadChatAttachment,
    isUploadingAttachment,
    deleteMessage,
  } = useChat()

  useChatDeepLink(startNewChat)

  const [showInfoPanel, setShowInfoPanel] = useState(true)

  const activeContact = useMemo(
    () => resolveChatContact(activeContactId, contacts, callPreviewByContactId),
    [activeContactId, contacts, callPreviewByContactId],
  )

  return (
    <div className="flex h-full min-h-0 flex-1 w-full overflow-hidden bg-[#F9F8F5]">
      <ChatSidebar
        contacts={contacts}
        activeContactId={activeContactId}
        onSelectContact={setActiveContactId}
        onStartNewChat={startNewChat}
      />

      <ChatWindow
        activeContact={activeContact}
        messages={messages}
        currentUserAvatar={currentUserAvatar}
        onSendMessage={sendMessage}
        onUploadAttachment={uploadChatAttachment}
        isUploadingAttachment={isUploadingAttachment}
        onDeleteMessage={deleteMessage}
        onTypingChange={notifyTyping}
        onToggleInfo={() => setShowInfoPanel((prev) => !prev)}
        onInitiateCall={recordMissedCall}
      />

      {showInfoPanel && activeContact ? (
        <ContactInfoPanel
          contact={activeContact}
          messages={messages}
          onClose={() => setShowInfoPanel(false)}
          onInitiateCall={recordMissedCall}
        />
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
    </div>
  )
}
