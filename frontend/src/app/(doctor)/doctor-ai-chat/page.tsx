"use client"

import { DoctorAiChat } from "./DoctorAiChat"
import { useDoctorAiChat } from "./useDoctorAiChat"

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

export default function DoctorAiChatPage() {
  const { messages, sendMessage, isAssistantTyping } = useDoctorAiChat()

  return (
    <>
      <DoctorAiChat
        messages={messages}
        onSendMessage={sendMessage}
        isAssistantTyping={isAssistantTyping}
      />
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_STYLE }} />
    </>
  )
}
