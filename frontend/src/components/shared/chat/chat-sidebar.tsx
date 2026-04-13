import { SearchIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import type { ChatContact } from "./chat.types"

interface ChatSidebarProps {
  contacts: ChatContact[]
  activeContactId: string
  onSelectContact: (id: string) => void
}

export function ChatSidebar({ contacts, activeContactId, onSelectContact }: ChatSidebarProps) {
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden border-black/5 bg-background shadow-xs dark:border-white/10 lg:w-[350px] shrink-0">
      <div className="p-4 border-b">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Messages</h2>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-muted/60 ${
              activeContactId === contact.id ? "bg-primary/5 hover:bg-primary/10 shadow-sm" : ""
            }`}
          >
            <div className="relative shrink-0">
              <Avatar className="size-12 border border-black/5 dark:border-white/10 shadow-xs relative">
                {contact.avatar ? (
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              {contact.online && (
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className={`truncate font-medium text-sm ${activeContactId === contact.id ? 'text-primary' : ''}`}>
                  {contact.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{contact.time}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className="truncate text-xs text-muted-foreground">{contact.lastMessage}</p>
                {contact.unread > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                    {contact.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
