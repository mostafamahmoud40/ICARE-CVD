import Image from "next/image"
import { MoreHorizontalIcon, FileIcon, DownloadIcon } from "lucide-react"
import type { MessageContentType } from "./assistantChats.types"

interface MessageBubbleProps {
  senderName: string
  time: string
  isOutgoing: boolean
  contentType: MessageContentType
  text?: string
  images?: string[]
  fileName?: string
  fileSize?: string
}

export function MessageBubble({
  senderName,
  time,
  isOutgoing,
  contentType,
  text,
  images,
  fileName,
  fileSize,
}: MessageBubbleProps) {
  // Use a deterministic placeholder image based on the sender's name
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName.replace(" ", "")}`

  return (
    <div className={`flex w-full mb-6 gap-3 ${isOutgoing ? "justify-end" : "justify-start"}`}>
      
      {/* Avatar Left (Incoming) */}
      {!isOutgoing && (
        <div className="relative size-8 shrink-0 pt-1">
          <Image
            src={avatarUrl}
            alt={senderName}
            width={32}
            height={32}
            unoptimized
            className="size-8 rounded-full bg-slate-200 object-cover shadow-sm ring-1 ring-black/5"
          />
        </div>
      )}

      {/* Message Column */}
      <div className={`flex flex-col min-w-0 max-w-[75%] ${isOutgoing ? "items-end" : "items-start"}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between w-full mb-1.5 gap-4 ${isOutgoing ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[12px] font-medium text-[#1A1F1E]">{senderName}</span>
          <div className={`flex items-center gap-2 ${isOutgoing ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{time}</span>
            <MoreHorizontalIcon className="size-4 text-muted-foreground/50 cursor-pointer hover:text-[#1A1F1E] transition-colors" />
          </div>
        </div>

        {/* Content */}
        <MessageContent
          contentType={contentType}
          text={text}
          images={images}
          fileName={fileName}
          fileSize={fileSize}
          isOutgoing={isOutgoing}
        />
      </div>

      {/* Avatar Right (Outgoing) */}
      {isOutgoing && (
        <div className="relative size-8 shrink-0 pt-1">
          <Image
            src={avatarUrl}
            alt={senderName}
            width={32}
            height={32}
            unoptimized
            className="size-8 rounded-full bg-slate-200 object-cover shadow-sm ring-1 ring-black/5"
          />
        </div>
      )}

    </div>
  )
}

/* ── SRP: renders content based on type ──────────────────────── */
function MessageContent({
  contentType,
  text,
  images,
  fileName,
  fileSize,
  isOutgoing,
}: {
  contentType: MessageContentType
  text?: string
  images?: string[]
  fileName?: string
  fileSize?: string
  isOutgoing: boolean
}) {
  switch (contentType) {
    case "text":
      return (
        <div
          className={`max-w-[480px] px-4 py-2.5 text-[14px] leading-relaxed text-[#1A1F1E] bg-[#EEF2F6] shadow-sm transition-all duration-200 hover:shadow-md ${
            isOutgoing
              ? "rounded-2xl rounded-tr-sm"
              : "rounded-2xl rounded-tl-sm"
          }`}
        >
          {text}
        </div>
      )

    case "image":
      return (
        <div className="flex gap-1.5 max-w-[320px]">
          {(images ?? []).map((_, i) => (
            <div
              key={`img-${i}`}
              className="group relative h-[140px] w-[150px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
            >
              <div className="size-full bg-gradient-to-br from-slate-300/50 via-slate-200/50 to-slate-400/50 flex items-center justify-center text-muted-foreground/50 backdrop-blur-sm transition-colors duration-300 group-hover:bg-black/10 group-hover:text-white/90">
                <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )

    case "file":
      return (
        <div className="group flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-[#FAFAF8] px-4 py-3 max-w-[280px] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#1A5345]/20 cursor-pointer">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F3] transition-colors duration-300 group-hover:bg-[#1A5345]/10">
            <FileIcon className="size-5 text-[#6B7870] transition-colors duration-300 group-hover:text-[#1A5345]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{fileName}</p>
            <p className="text-[11px] text-muted-foreground">{fileSize}</p>
          </div>
          <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-[#1A5345]/10 hover:text-[#1A5345]">
            <DownloadIcon className="size-4" />
          </button>
        </div>
      )

    case "link":
      return (
        <p className="max-w-[480px] text-[14px] leading-relaxed text-[#E8345E] underline decoration-[#E8345E]/30 cursor-pointer hover:decoration-[#E8345E]">
          {text}
        </p>
      )

    default:
      return null
  }
}
