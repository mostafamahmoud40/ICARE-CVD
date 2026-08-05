import Image from "next/image"
import { FileTextIcon, VideoOffIcon, CheckCheckIcon, HeartIcon, PinIcon, MoreVerticalIcon } from "lucide-react"
import type { LastMessageType, ContactItem } from "./assistantChats.types"

type ChatContactItemProps = Omit<Omit<ContactItem, "id">, "avatarColor" | "isFavourite"> & {
  isActive: boolean
  onClick: () => void
}

export function ChatContactItem({
  name,
  lastMessage,
  lastMessageType,
  time,
  unreadCount,
  isOnline,
  isPinned,
  statusIcon,
  isActive,
  onClick,
}: ChatContactItemProps) {
  // Use a deterministic placeholder image based on the sender's name
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(" ", "")}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-[12px] p-3.5 text-left transition-colors duration-200 ease-out hover:bg-slate-100/80 ${
        isActive
          ? "bg-slate-100/80"
          : "bg-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="relative size-11 shrink-0">
        <Image
          src={avatarUrl}
          alt={name}
          width={44}
          height={44}
          unoptimized
          className="size-11 rounded-full bg-slate-100 object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>

      {/* Info Middle */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span className="truncate text-[15px] font-bold text-[#1A1F1E]">
          {name}
        </span>
        <LastMessagePreview
          message={lastMessage}
          messageType={lastMessageType}
        />
      </div>

      {/* Right Column */}
      <div className="shrink-0 flex flex-col items-end justify-between h-[42px]">
        <span className="text-[13px] text-muted-foreground font-medium">
          {time}
        </span>
        <div className="flex items-center gap-1.5 mt-1 h-5">
           {isPinned && <PinIcon className="size-3.5 text-muted-foreground" fill="currentColor" />}
           {statusIcon === "double-check" && <CheckCheckIcon className="size-4 text-emerald-500" />}
           {statusIcon === "heart" && <HeartIcon className="size-3.5 text-amber-400" fill="currentColor" />}
           {unreadCount > 0 && (
             <div className="flex items-center gap-1">
               <span className="flex h-5 min-w-[20px] px-1.5 shrink-0 items-center justify-center rounded-full bg-[#E8345E] text-[11px] font-bold text-white">
                 {unreadCount}
               </span>
               <MoreVerticalIcon className="size-4 text-muted-foreground" />
             </div>
           )}
        </div>
      </div>
    </button>
  )
}

/* ── SRP: message type icon + text is its own concern ────────── */
function LastMessagePreview({
  message,
  messageType,
}: {
  message: string
  messageType: LastMessageType
}) {
  if (messageType === "typing") {
    return (
      <span className="flex items-center gap-1 truncate text-[14px] text-muted-foreground">
        is typing
        <span className="flex items-center gap-0.5 ml-0.5 mt-1.5">
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" />
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </span>
    )
  }

  if (messageType === "missed_call") {
    return (
      <p className="flex items-center gap-1.5 truncate text-[14px] text-[#E8345E]">
        <VideoOffIcon className="size-4 shrink-0" />
        <span className="truncate">{message}</span>
      </p>
    )
  }

  if (messageType === "document") {
    return (
      <p className="flex items-center gap-1.5 truncate text-[14px] text-muted-foreground">
        <FileTextIcon className="size-4 shrink-0" />
        <span className="truncate">{message}</span>
      </p>
    )
  }

  // text
  return (
    <p className="truncate text-[14px] text-muted-foreground">
      {message}
    </p>
  )
}
