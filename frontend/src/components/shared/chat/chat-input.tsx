import { useState } from "react"
import { PaperclipIcon, SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSendMessage: (text: string) => void | Promise<void>
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setNewMessage("")
  }

  return (
    <div className="p-4 bg-white border-t border-[#E8E6E0]/50">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-2xl border border-[#E8E6E0] bg-[#F9F8F5]/40 p-1.5 focus-within:ring-2 focus-within:ring-[#1A5345]/15 focus-within:border-[#1A5345] focus-within:bg-white transition-all shadow-2xs max-w-4xl mx-auto"
      >
        <div className="flex gap-1 pb-1 pl-1">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="size-9 rounded-xl hover:bg-[#EEF5F3]/50 text-[#4F6D64] hover:text-[#1A5345] cursor-pointer"
          >
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
          className="max-h-24 min-h-[38px] w-full resize-none bg-transparent px-2.5 py-2 text-[12px] sm:text-[13px] outline-none placeholder:text-muted-foreground/80 custom-scrollbar"
          rows={1}
        />
        
        <div className="flex pb-1 pr-1">
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            size="icon"
            className="size-9 rounded-xl bg-[#1A5345] hover:bg-[#133F34] text-white shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
          >
            <SendIcon className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
