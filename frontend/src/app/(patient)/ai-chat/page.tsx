"use client"

import { PatientAiChat } from "./PatientAiChat"
import { usePatientAiChat } from "./usePatientAiChat"

const SCROLLBAR_STYLE = `
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
`

export default function PatientAiChatPage() {
  const { messages, activeContactId, sendMessage, isAssistantTyping } = usePatientAiChat()

  return (
    <>
      <PatientAiChat
        messages={messages}
        activeContactId={activeContactId}
        onSendMessage={sendMessage}
        isAssistantTyping={isAssistantTyping}
      />
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_STYLE }} />
    </>
  )
}
