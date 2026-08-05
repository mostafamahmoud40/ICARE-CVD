"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  BotMessageSquareIcon,
  CalendarDaysIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  MessageCircleIcon,
  PillIcon,
  SearchIcon,
  User2Icon,
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
    label: "Patient dashboard",
    hint: "Overview & care summary",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    keywords: ["home", "overview", "dashboard"],
  },
  {
    id: "appointments",
    label: "Appointments",
    hint: "View and manage your appointments",
    href: "/appointments",
    icon: CalendarDaysIcon,
    keywords: ["appointment", "booking", "visit"],
  },
  {
    id: "doctorDirectory",
    label: "Doctor directory",
    hint: "Find and connect with specialists",
    href: "/doctor-directory",
    icon: User2Icon,
    keywords: ["doctor", "specialist", "directory"],
  },
  {
    id: "queue",
    label: "Clinic queue",
    hint: "Your wait status for today's visit",
    href: "/queue",
    icon: ListOrderedIcon,
    keywords: ["queue", "waiting", "clinic"],
  },
  {
    id: "consultations",
    label: "Consultations",
    hint: "Visit history and clinical notes",
    href: "/consultations",
    icon: FileTextIcon,
    keywords: ["consultation", "visit", "history"],
  },
  {
    id: "labOrders",
    label: "Lab orders",
    hint: "Ordered tests and results",
    href: "/lab-orders",
    icon: FlaskConicalIcon,
    keywords: ["lab", "tests", "results"],
  },
  {
    id: "vitals",
    label: "Vitals & measurements",
    hint: "Track your health metrics",
    href: "/vitals",
    icon: HeartPulseIcon,
    keywords: ["vitals", "blood pressure", "heart rate"],
  },
  {
    id: "medications",
    label: "Medications",
    hint: "Manage prescriptions and doses",
    href: "/medications",
    icon: PillIcon,
    keywords: ["medication", "prescription", "dose"],
  },
  {
    id: "aiChat",
    label: "Care agent",
    hint: "Ask health questions",
    href: "/ai-chat",
    icon: BotMessageSquareIcon,
    keywords: ["ai", "agent", "assistant"],
  },
  {
    id: "chat",
    label: "Chats",
    hint: "Messages and conversations",
    href: "/chat",
    icon: MessageCircleIcon,
    keywords: ["chat", "message", "conversation"],
  },
]

function SearchTrigger({
  className,
  placeholder,
  onClick,
}: {
  className?: string
  placeholder: string
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
      <span className="truncate">{placeholder}</span>
      <kbd className="pointer-events-none ml-auto hidden rounded-md border border-[#E8E6E0]/80 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[#9CA3AF] lg:inline">
        ⌘K
      </kbd>
    </button>
  )
}

export function PatientHeaderSearch() {
  const router = useRouter()
  const tSearch = useTranslations("patient.search")
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
        <SearchTrigger placeholder={tSearch("placeholder")} onClick={() => setOpen(true)} />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl text-[#6B7870] hover:bg-[#F9F8F5] hover:text-[#1A5345] md:hidden"
        aria-label={tSearch("open")}
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
              <DialogTitle>{tSearch("dialogTitle")}</DialogTitle>
              <DialogDescription>{tSearch("dialogDescription")}</DialogDescription>
            </DialogHeader>

            <Command
              className="rounded-none bg-white"
              filter={(value, search) => {
                const entry = SEARCH_ENTRIES.find((item) => item.id === value)
                if (!entry) return 0
                const haystack = [entry.label, entry.hint, ...entry.keywords].join(" ").toLowerCase()
                return haystack.includes(search.toLowerCase()) ? 1 : 0
              }}
            >
              <CommandInput
                placeholder={tSearch("inputPlaceholder")}
                wrapperClassName="h-14 border-0 px-4"
                className="h-full border-0 py-0 text-[15px] placeholder:text-[#9CA3AF]"
              />
              <CommandList className="max-h-[min(50vh,360px)] p-2">
                <CommandEmpty className="py-10 text-[13px] text-[#6B7870]">
                  {tSearch("empty")}
                </CommandEmpty>
                <CommandGroup
                  heading={tSearch("quickNav")}
                  className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[#9CA3AF]"
                >
                  {SEARCH_ENTRIES.map((entry) => {
                    const Icon = entry.icon
                    return (
                      <CommandItem
                        key={entry.id}
                        value={entry.id}
                        onSelect={() => navigate(entry.href)}
                        className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-[#F9F8F5]"
                      >
                        <Icon className="size-4 text-[#1A5345]" strokeWidth={2} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{entry.label}</p>
                          <p className="truncate text-[11px] text-[#6B7870]">{entry.hint}</p>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>

            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-[11px] text-[#9CA3AF]">Press Esc to close</p>
              <Link
                href="/doctor-directory"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-[#1A5345] hover:underline"
              >
                {tSearch("browseDoctors")}
              </Link>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
