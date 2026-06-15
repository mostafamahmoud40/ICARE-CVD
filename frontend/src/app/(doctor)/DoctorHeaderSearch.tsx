"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
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
    label: "Doctor dashboard",
    hint: "Overview & patient insights",
    href: "/doctor-dashboard",
    icon: LayoutDashboardIcon,
    keywords: ["home", "overview", "dashboard"],
  },
  {
    id: "patients",
    label: "Patients",
    hint: "Patient directory & records",
    href: "/doctor-patients",
    icon: HeartPulseIcon,
    keywords: ["patient", "records", "directory"],
  },
  {
    id: "queue",
    label: "Queue",
    hint: "Today's patient queue",
    href: "/doctor-queue",
    icon: UsersIcon,
    keywords: ["queue", "waiting", "today"],
  },
  {
    id: "appointments",
    label: "Appointments",
    hint: "Manage scheduled visits",
    href: "/doctor-appointments",
    icon: CalendarDaysIcon,
    keywords: ["appointment", "booking", "schedule"],
  },
  {
    id: "schedule",
    label: "Schedule",
    hint: "Weekly availability & hours",
    href: "/doctor-schedule",
    icon: CalendarClockIcon,
    keywords: ["schedule", "hours", "availability"],
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

export function DoctorHeaderSearch() {
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
      <div className="hidden min-w-0 flex-1 max-w-md md:block">
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
              className="rounded-none bg-white"
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
                className="h-full border-0 py-0 text-[15px] placeholder:text-[#9CA3AF]"
              />
              <CommandList className="max-h-[min(50vh,360px)] p-2">
                <CommandEmpty className="py-10 text-[13px] text-[#6B7870]">
                  No results found. Try another keyword.
                </CommandEmpty>
                <CommandGroup heading="Quick navigation" className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[#9CA3AF]">
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
                href="/doctor-patients"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-[#1A5345] hover:underline"
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
