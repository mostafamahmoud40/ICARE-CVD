import { SparklesIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChatMessageList } from "@/components/shared/chat/chat-message-list"
import { ChatInput } from "@/components/shared/chat/chat-input"
import type { ChatMessage } from "@/components/shared/chat/chat.types"

interface PatientAiChatProps {
  messages: ChatMessage[]
  activeContactId: string
  onSendMessage: (text: string) => void
  isAssistantTyping: boolean
}

export function PatientAiChat({
  messages,
  activeContactId,
  onSendMessage,
  isAssistantTyping,
}: PatientAiChatProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 bg-muted/30 p-2 md:p-6">
      <Alert className="shrink-0 border-primary/20 bg-primary/5">
        <SparklesIcon className="size-4" />
        <AlertTitle>Demo assistant</AlertTitle>
        <AlertDescription>
          This chat is UI-only with placeholder replies. It is not medical advice and does not connect to a real AI
          backend yet.
        </AlertDescription>
      </Alert>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-black/5 bg-background shadow-sm dark:border-white/10">
        <div className="flex shrink-0 items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <Avatar className="size-10 border shadow-xs">
            <AvatarFallback className="bg-primary/15 text-primary">
              <SparklesIcon className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold leading-tight md:text-lg">Health assistant</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAssistantTyping ? "Typing…" : "Demo · ask general questions"}
            </p>
          </div>
        </div>

        <ChatMessageList messages={messages} activeContactId={activeContactId} />

        <ChatInput onSendMessage={onSendMessage} />
      </Card>
    </div>
  )
}
