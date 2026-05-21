"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  DownloadIcon,
  FileTextIcon,
  FilterIcon,
  InboxIcon,
  MailOpenIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PrinterIcon,
  RefreshCwIcon,
  ReplyIcon,
  SearchIcon,
  SquareIcon,
  StarIcon,
  StethoscopeIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

import type {
  InboxData,
  InboxFilters,
  InboxMessage,
  MessageType,
} from "./inbox.types"

interface InboxProps {
  data: InboxData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  filters: InboxFilters
  onFiltersChange: (filters: InboxFilters) => void
  selectedMessageId: string | null
  onSelectMessage: (id: string | null) => void
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  isMarkingAsRead: boolean
  isArchiving: boolean
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatDateTimeFull(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function messageTypeIcon(type: MessageType) {
  switch (type) {
    case "task":
      return <FileTextIcon className="size-4" />
    case "appointment":
      return <CalendarIcon className="size-4" />
    case "doctor":
      return <StethoscopeIcon className="size-4" />
    case "patient":
      return <UserIcon className="size-4" />
    case "system":
      return <BellIcon className="size-4" />
    default:
      return <MailOpenIcon className="size-4" />
  }
}

function messageTypeStyles(type: MessageType) {
  switch (type) {
    case "task":
      return "bg-blue-50 text-blue-600"
    case "appointment":
      return "bg-violet-50 text-violet-600"
    case "doctor":
      return "bg-emerald-50 text-emerald-600"
    case "patient":
      return "bg-amber-50 text-amber-600"
    case "system":
      return "bg-gray-50 text-gray-600"
    default:
      return "bg-gray-50 text-gray-600"
  }
}

function MessageListItem({
  message,
  isSelected,
  onClick,
}: {
  message: InboxMessage
  isSelected: boolean
  onClick: () => void
}) {
  const TypeIcon = messageTypeIcon(message.type)
  const isUnread = message.status === "unread"

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[12px] p-3.5 text-left transition-colors duration-200 ease-out hover:bg-slate-100/80 outline-none focus:outline-none focus-visible:ring-0",
        isSelected ? "bg-slate-100/80" : "bg-transparent"
      )}
    >
      <div className="relative shrink-0">
        {message.sender.name.toLowerCase().includes("system") || message.sender.name.toLowerCase().includes("records") ? (
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              messageTypeStyles(message.type)
            )}
          >
            {TypeIcon}
          </div>
        ) : (
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.name.replace(/\s+/g, "")}`}
            alt={message.sender.name}
            className="size-11 rounded-full bg-slate-100 object-cover"
          />
        )}
        {isUnread && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span className="truncate text-[15px] font-bold text-[#1A1F1E]">
          {message.sender.name}
        </span>
        <div className="truncate text-[14px]">
          <span className={cn(isUnread ? "font-bold text-[#1A1F1E]" : "font-medium text-[#1A1F1E]")}>
            {message.subject}
          </span>
          <span className="text-muted-foreground">
            {" "}— {message.preview}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end justify-start h-full pt-0.5 pl-2">
        <span className="text-[12px] font-medium text-muted-foreground">
          {formatDateTime(message.createdAt)}
        </span>
      </div>
    </button>
  )
}

function MessageDetail({
  message,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  isArchiving,
}: {
  message: InboxMessage
  onMarkAsRead: () => void
  onMarkAsUnread: () => void
  onArchive: () => void
  onUnarchive: () => void
  isArchiving: boolean
}) {
  const TypeIcon = messageTypeIcon(message.type)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Area */}
      <div className="border-b border-[#E8E6E0]/60 bg-white px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-bold text-[#1A1F1E]">
            Subject : {message.subject}
          </h2>
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground shrink-0 mt-1">
            <CalendarIcon className="size-3.5" />
            {formatDateTimeFull(message.createdAt)}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5",
                messageTypeStyles(message.type)
              )}
            >
              {TypeIcon}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-[#1A1F1E]">{message.sender.name}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                From : <span className="font-medium text-[#6B7870]">{message.sender.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" title="Star" className="size-9 rounded-md border-[#E8E6E0]/80 bg-slate-50/50 text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E] shadow-sm">
              <StarIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" title="Archive" className="size-9 rounded-md border-[#E8E6E0]/80 bg-slate-50/50 text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E] shadow-sm" onClick={onArchive} disabled={isArchiving}>
              <ArchiveIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" title="Delete" className="size-9 rounded-md border-[#E8E6E0]/80 bg-slate-50/50 text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E] shadow-sm">
              <Trash2Icon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" title="Reply" className="size-9 rounded-md border-[#E8E6E0]/80 bg-slate-50/50 text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E] shadow-sm">
              <CornerUpLeftIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-[#1A1F1E]">
          {message.body || message.preview}
        </p>

        {/* Attachments section based on design */}
        <div className="mt-10 pt-8 border-t border-[#E8E6E0]/60">
          <h3 className="text-[16px] font-bold text-[#1A1F1E] mb-4">Attachments</h3>
          <div className="flex flex-wrap gap-4">
            
            {/* Action Card as Attachment */}
            {message.actionUrl && (
              <div className="w-[220px] overflow-hidden rounded-lg border border-[#E8E6E0]/80 bg-white shadow-sm">
                <div className="h-[120px] bg-[#F9F8F5] p-3 flex items-center justify-center border-b border-[#E8E6E0]/50">
                  <div className="w-full h-full bg-white rounded-md border border-[#E8E6E0] flex items-center justify-center shadow-sm">
                    <FileTextIcon className="size-8 text-[#1A5345]/60" />
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-[13px] font-bold text-[#1A1F1E] truncate">{message.actionLabel || "Document.pdf"}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">1.2MB</div>
                  </div>
                  <Link href={message.actionUrl}>
                    <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E]">
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Dummy Image Attachment */}
            <div className="w-[220px] overflow-hidden rounded-lg border border-[#E8E6E0]/80 bg-white shadow-sm">
              <div className="h-[120px] bg-slate-50 p-2 flex items-center justify-center border-b border-[#E8E6E0]/50">
                <div className="w-full h-full bg-[#1A5345] rounded-md shadow-sm opacity-90 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0F3D32] to-[#1A5345]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/60 text-[11px] font-bold tracking-widest">IMAGE</span>
                  </div>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[13px] font-bold text-[#1A1F1E] truncate">Mobile_design.jpg</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">3.2MB</div>
                </div>
                <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-slate-100 hover:text-[#1A1F1E]">
                  <DownloadIcon className="size-3.5" />
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex items-center justify-end gap-3">
          <Button className="h-9 rounded-md bg-[#1A1F1E] px-5 text-[13px] font-bold text-white hover:bg-black shadow-sm">
            <CornerUpLeftIcon className="mr-2 size-4" />
            Reply
          </Button>
          <Button className="h-9 rounded-md bg-[#1677FF] px-5 text-[13px] font-bold text-white hover:bg-[#0F5ED6] shadow-sm">
            Forward
            <CornerUpRightIcon className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ type }: { type: "no-selection" | "no-messages" | "error" }) {
  const configs = {
    "no-selection": {
      icon: MessageCircleIcon,
      title: "Select a message",
      description: "Choose a message from the list to view its details",
    },
    "no-messages": {
      icon: InboxIcon,
      title: "No messages",
      description: "Your inbox is empty. New messages will appear here.",
    },
    error: {
      icon: AlertCircleIcon,
      title: "Something went wrong",
      description: "Unable to load messages. Please try again later.",
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center mb-8">
        {/* Soft decorative glow */}
        <div className="absolute size-32 rounded-full bg-[#1A5345]/[0.03] blur-2xl"></div>
        <div className="absolute size-24 rounded-full bg-[#1A5345]/[0.05] blur-xl"></div>
        {/* Main Icon container */}
        <div className="relative flex size-20 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6E0]/80 ring-[10px] ring-white/60">
          <Icon className="size-8 text-[#1A5345]/80" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-[20px] font-bold text-[#1A1F1E] tracking-tight">{config.title}</h3>
      <p className="mt-3 text-[15px] font-medium text-muted-foreground max-w-[280px] mx-auto leading-relaxed">{config.description}</p>
    </div>
  )
}

export function Inbox({
  data,
  isLoading,
  isError,
  filters,
  onFiltersChange,
  selectedMessageId,
  onSelectMessage,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  isMarkingAsRead,
  isArchiving,
}: InboxProps) {
  const messages = data?.messages || []
  const selectedMessage = messages.find((m) => m.id === selectedMessageId)
  const showMobileDetail = Boolean(selectedMessage)

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#F9F8F5]">
      <div className="flex items-center justify-between bg-transparent px-8 py-8 z-20 relative">
        <div>
          <h1 className="text-[32px] font-bold text-[#1A1F1E] tracking-tight font-serif">Inbox</h1>
          <p className="text-[14px] font-medium text-muted-foreground mt-1.5">All your campaign updates, messages and alerts in one place.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        
        <div className={cn("flex flex-col min-h-0 w-full md:w-[350px] lg:w-[400px] shrink-0 border-r border-[#E8E6E0]/70 bg-[#F9F8F5]/80 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10", showMobileDetail && "hidden md:flex")}>
          <div className="border-b border-[#E8E6E0]/60 px-5 pt-5 pb-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={filters.searchQuery || ""}
                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="h-10 rounded-xl border-[#E5EEEA]/60 bg-[#F9F8F5]/80 pl-9 text-[13px] shadow-sm transition-all duration-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/20 focus-visible:border-[#1A5345]/40"
              />
            </div>
            <div className="mt-4 flex items-center justify-between px-1 border-b border-[#E8E6E0]/60 pb-3">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-slate-100/80 hover:text-[#1A1F1E]">
                  <SquareIcon className="size-4" strokeWidth={2} />
                  <ChevronDownIcon className="size-3 -ml-1" strokeWidth={2} />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-slate-100/80 hover:text-[#1A1F1E]">
                  <RefreshCwIcon className="size-4" strokeWidth={2} />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-slate-100/80 hover:text-[#1A1F1E]" onClick={() => onFiltersChange({})}>
                  <FilterIcon className="size-4" strokeWidth={2} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-muted-foreground">3 of 125</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:bg-slate-100/80 hover:text-[#1A1F1E]">
                    <ChevronDownIcon className="size-4 rotate-90" strokeWidth={2} />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-muted-foreground hover:bg-slate-100/80 hover:text-[#1A1F1E]">
                    <ChevronDownIcon className="size-4 -rotate-90" strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <EmptyState type="error" />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-4">
                <EmptyState type="no-messages" />
              </div>
            ) : (
              <div className="flex flex-col pb-4 pt-2 gap-1">
              {messages.map((message) => (
                <MessageListItem
                  key={message.id}
                  message={message}
                  isSelected={selectedMessageId === message.id}
                  onClick={() => onSelectMessage(message.id)}
                />
              ))}
              </div>
            )}
          </div>
        </div>

        <div className={cn("flex flex-col min-h-0 flex-1 bg-white z-0 relative", showMobileDetail ? "flex" : "hidden md:flex")}>
          {selectedMessage ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-[#E8E6E0]/60 bg-white p-4 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectMessage(null)}
                  className="h-10 rounded-xl px-4 text-[14px] font-bold text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                >
                  <ArrowLeftIcon className="mr-2 size-5" />
                  Back to inbox
                </Button>
              </div>
              <MessageDetail
                message={selectedMessage}
                onMarkAsRead={() => onMarkAsRead(selectedMessage.id)}
                onMarkAsUnread={() => onMarkAsUnread(selectedMessage.id)}
                onArchive={() => onArchive(selectedMessage.id)}
                onUnarchive={() => onUnarchive(selectedMessage.id)}
                isArchiving={isArchiving || isMarkingAsRead}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 bg-[#F9F8F5]/30">
              <EmptyState type="no-selection" />
            </div>
          )}
        </div>

      </div>
      
      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.4); }
      `}} />
    </div>
  )
}
