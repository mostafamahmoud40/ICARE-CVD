"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  SearchIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type SearchEntry = {
  id: string
  label: string
  hint: string
  href: string
  icon: LucideIcon
  keywords: string[]
}

const SEARCH_ENTRIES: SearchEntry[] = [
  {
    id: "dashboard",
    label: "Today's Command Center",
    hint: "Live queue, appointments, and triage",
    href: "/assistant-dashboard",
    icon: LayoutDashboardIcon,
    keywords: ["home", "overview", "dashboard", "command"],
  },
  {
    id: "queue",
    label: "Live desk",
    hint: "Active queue and consultation pipeline",
    href: "/assistant-queue/live-desk",
    icon: UsersIcon,
    keywords: ["queue", "waiting", "live", "desk"],
  },
  {
    id: "patients",
    label: "Patients",
    hint: "Records, visits, and care plans",
    href: "/assistant-patients",
    icon: ClipboardListIcon,
    keywords: ["patient", "records", "chart"],
  },
  {
    id: "appointments",
    label: "Appointments",
    hint: "Schedule and booking management",
    href: "/assistant-appointments",
    icon: CalendarClockIcon,
    keywords: ["appointment", "booking", "schedule"],
  },
  {
    id: "inbox",
    label: "Inbox",
    hint: "Tasks and messages needing attention",
    href: "/assistant-inbox",
    icon: InboxIcon,
    keywords: ["inbox", "tasks", "messages"],
  },
  {
    id: "chats",
    label: "Chats",
    hint: "Conversations with patients and staff",
    href: "/assistant-chats",
    icon: MessageCircleIcon,
    keywords: ["chat", "messages"],
  },
  {
    id: "schedule",
    label: "Doctor schedule",
    hint: "Weekly hours and session blocks",
    href: "/assistant-doctor-schedule",
    icon: CalendarDaysIcon,
    keywords: ["doctor", "schedule", "hours"],
  },
]

function SearchTrigger({
  className,
  onClick,
}: {
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-9 w-full min-w-0 items-center rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5]/80 pl-9 pr-3 text-left text-[13px] text-[#6B7870] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-white focus-visible:border-[#1A5345]/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1A5345]/15",
        className,
      )}
      aria-label="Open search"
    >
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]"
        aria-hidden
      />
      <span className="truncate">Search patients, appointments...</span>
      <kbd className="pointer-events-none ml-auto hidden rounded-md border border-[#E8E6E0]/80 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[#9CA3AF] lg:inline">
        ⌘K
      </kbd>
    </button>
  )
}

export function AssistantHeaderSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <div className="hidden min-w-0 max-w-md flex-1 md:block">
        <SearchTrigger onClick={() => setOpen(true)} />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl text-[#6B7870] hover:bg-[#F9F8F5] hover:text-[#1A5345] md:hidden"
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-[18px]" strokeWidth={2} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className={cn(
              "fixed top-[max(4.5rem,10vh)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white p-0 shadow-[0_24px_80px_-12px_rgba(16,47,39,0.28)] outline-none",
              "duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Search</DialogTitle>
              <DialogDescription>Search patients, appointments, and pages</DialogDescription>
            </DialogHeader>

            <Command
              className="rounded-none bg-white [&_[data-slot=command-input-wrapper]]:border-0"
              filter={(value, search) => {
                const entry = SEARCH_ENTRIES.find((item) => item.id === value)
                if (!entry) return 0
                const haystack = [entry.label, entry.hint, ...entry.keywords].join(" ").toLowerCase()
                return haystack.includes(search.toLowerCase()) ? 1 : 0
              }}
            >
              <CommandInput
                placeholder="Search patients, appointments, pages..."
                wrapperClassName="h-14 border-0 px-4"
                className="border-0 text-[15px]"
              />
              <CommandList className="max-h-[min(60vh,420px)] px-2 pb-3">
                <CommandEmpty className="py-8 text-center text-[13px] text-muted-foreground">
                  No results found.
                </CommandEmpty>
                <CommandGroup heading="Pages">
                  {SEARCH_ENTRIES.map((entry) => {
                    const Icon = entry.icon
                    return (
                      <CommandItem
                        key={entry.id}
                        value={entry.id}
                        onSelect={() => navigate(entry.href)}
                        className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-[#F6FBF9]"
                      >
                        <Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-[#1A1F1E]">{entry.label}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{entry.hint}</p>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>

            <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span>Quick navigation</span>
              <Link
                href="/assistant-patients"
                className="font-medium text-[#1A5345] hover:underline"
                onClick={() => setOpen(false)}
              >
                Browse all patients
              </Link>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
