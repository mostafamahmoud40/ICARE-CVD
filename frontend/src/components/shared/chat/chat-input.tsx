import { useState } from "react"
import { MicIcon, PaperclipIcon, SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSendMessage: (text: string) => void | Promise<void>
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSendMessage(newMessage)
    setNewMessage("")
  }

  return (
    <div className="p-4 bg-background border-t">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 rounded-3xl bg-muted/40 p-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all border border-transparent focus-within:border-primary/20 focus-within:bg-background shadow-xs"
      >
        <div className="flex gap-1 pb-1 px-1">
          <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <PaperclipIcon className="size-4" />
          </Button>
        </div>
        
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type your message..."
          className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-3 text-[15px] outline-none placeholder:text-muted-foreground custom-scrollbar"
          rows={1}
        />
        
        <div className="flex gap-1.5 pb-1 pr-1">
          {newMessage.trim() === "" ? (
            <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-all">
              <MicIcon className="size-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="size-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <SendIcon className="size-4 ml-0.5" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
