"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SearchIcon, PlusIcon, Loader2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchDirectory, createOrGetConversation } from "./chat-api"
import type { ChatContact } from "./chat.types"
import { getAuthUser } from "@/lib/auth-tokens"

// ISP: only the props this component actually uses
interface ChatSidebarProps {
  contacts: ChatContact[]
  activeContactId: string
  onSelectContact: (id: string) => void
  onStartNewChat?: (conversationId: string) => void
}

export function ChatSidebar({
  contacts,
  activeContactId,
  onSelectContact,
  onStartNewChat,
}: ChatSidebarProps) {
  const queryClient = useQueryClient()
  const currentUser = getAuthUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch real directory from backend — auto-adapts per role (doctor → patients, patient → doctors)
  const directoryQuery = useQuery({
    queryKey: ["chat", "directory"],
    queryFn: fetchDirectory,
    enabled: isDialogOpen, // only load when dialog opens (lazy)
    staleTime: 60_000,
  })

  // Sort contacts: unread first, then alphabetically
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread
    return 0
  })

  // Filter directory by search query
  const filteredDirectory = (directoryQuery.data ?? []).filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createConversationMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const isDoctor = currentUser?.role === "doctor"
      return createOrGetConversation(
        isDoctor ? { patientId: profileId } : { doctorId: profileId }
      )
    },
    onSuccess: async (data) => {
      // Refresh conversations list immediately
      await queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })
      onStartNewChat?.(String(data.id))
      setIsDialogOpen(false)
      setSearchQuery("")
    },
  })

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden border-black/5 bg-background shadow-xs dark:border-white/10 lg:w-[350px] shrink-0">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Messages</h2>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSearchQuery("") }}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-primary/10 text-primary"
                aria-label="Start new conversation"
              >
                <PlusIcon className="size-5" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {currentUser?.role === "doctor" ? "Start Chat with Patient" : "Start Chat with Doctor"}
                </DialogTitle>
              </DialogHeader>

              <div className="relative mt-2 mb-4">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={currentUser?.role === "doctor" ? "Search patients..." : "Search doctors..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full"
                  autoFocus
                />
              </div>

              <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {directoryQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2Icon className="size-5 animate-spin mr-2" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : directoryQuery.isError ? (
                  <div className="py-8 text-center text-sm text-destructive">
                    Failed to load. Check your connection.
                  </div>
                ) : filteredDirectory.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? `No results for "${searchQuery}"` : "No users available."}
                  </div>
                ) : (
                  filteredDirectory.map((u) => {
                    const isPending =
                      createConversationMutation.isPending &&
                      createConversationMutation.variables === u.profileId
                    return (
                      <button
                        key={u.profileId}
                        disabled={createConversationMutation.isPending}
                        onClick={() => createConversationMutation.mutate(u.profileId)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-muted/60 disabled:opacity-60"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-10 border border-black/5 dark:border-white/10 shadow-xs relative">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground capitalize">{u.role}</p>
                        </div>
                        {isPending && <Loader2Icon className="size-4 animate-spin shrink-0 text-muted-foreground" />}
                      </button>
                    )
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full"
          />
        </div>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {sortedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
            <p className="text-sm text-center">No conversations yet.</p>
            <p className="text-xs mt-1 text-center">Tap <strong>+</strong> to start one.</p>
          </div>
        ) : (
          sortedContacts.map((contact) => (
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
                      {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span
                    className={`truncate font-medium text-sm ${
                      activeContactId === contact.id ? "text-primary" : ""
                    }`}
                  >
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
          ))
        )}
      </div>
    </Card>
  )
}
