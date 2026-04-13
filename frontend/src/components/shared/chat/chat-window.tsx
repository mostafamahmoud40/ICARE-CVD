import { PhoneIcon, VideoIcon, InfoIcon, MoreVerticalIcon, MessageCircleIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { ChatMessageList } from "./chat-message-list"
import { ChatInput } from "./chat-input"
import type { ChatContact, ChatMessage } from "./chat.types"

interface ChatWindowProps {
  activeContact: ChatContact | undefined
  messages: ChatMessage[]
  onSendMessage: (text: string) => void | Promise<void>
}

export function ChatWindow({ activeContact, messages, onSendMessage }: ChatWindowProps) {
  if (!activeContact) {
    return (
      <Card className="flex h-full flex-1 flex-col overflow-hidden border-black/5 bg-background shadow-sm dark:border-white/10 relative">
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-muted/10">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted shadow-inner">
            <MessageCircleIcon className="size-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground/80">Your Messages</h3>
          <p className="max-w-[250px] text-center text-sm mt-2 opacity-80">
            Select a conversation from the sidebar or start a new medical inquiry.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-1 flex-col overflow-hidden border-black/5 bg-background shadow-sm dark:border-white/10 relative">
      <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-4 z-10">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-10 border shadow-xs relative">
              {activeContact.avatar ? (
                <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
              ) : (
                <AvatarFallback>{activeContact.name[0]}</AvatarFallback>
              )}
            </Avatar>
            {activeContact.online && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>
          <div>
            <h3 className="font-semibold leading-none mb-1.5">{activeContact.name}</h3>
            <p className="text-xs text-muted-foreground leading-none flex items-center gap-1.5">
              {activeContact.role}
              {activeContact.online && (
                <>
                  <span className="size-1 rounded-full bg-emerald-500/50" />
                  <span className="text-emerald-500 font-medium">Online</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 hover:text-foreground">
            <PhoneIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 hover:text-foreground">
            <VideoIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 hover:text-foreground">
            <InfoIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 hover:text-foreground">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </div>
      </div>

      <ChatMessageList messages={messages} activeContactId={activeContact.id} />
      
      <ChatInput onSendMessage={onSendMessage} />
    </Card>
  )
}
