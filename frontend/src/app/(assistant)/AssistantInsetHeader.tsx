"use client"

import { usePathname } from "next/navigation"
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PillIcon,
  Settings2Icon,
  StethoscopeIcon,
  User2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type RouteEntry = { prefix: string; title: string; subtitle: string; icon: LucideIcon }

const ROUTES: RouteEntry[] = [
  { prefix: "/assistant-account/settings", title: "Settings", subtitle: "Security, notifications, and workspace preferences", icon: Settings2Icon },
  { prefix: "/assistant-account/activity", title: "Activity log", subtitle: "Full history of your assistant actions", icon: MessageSquareTextIcon },
  { prefix: "/assistant-account", title: "Account", subtitle: "Profile, schedule, and activity", icon: User2Icon },
  { prefix: "/assistant-doctor-schedule", title: "Doctor schedule", subtitle: "Weekly hours, daily sessions, and pause controls", icon: CalendarDaysIcon },
  { prefix: "/assistant-doctors", title: "Doctor Directory", subtitle: "Staff availability and queue loads", icon: StethoscopeIcon },
  { prefix: "/assistant-dashboard", title: "Assistant Dashboard", subtitle: "Overview of tasks and clinic activity", icon: LayoutDashboardIcon },
  { prefix: "/assistant-inbox", title: "Inbox", subtitle: "Tasks and messages needing attention", icon: InboxIcon },
  { prefix: "/assistant-chats", title: "Chats", subtitle: "Conversations with patients and staff", icon: MessageCircleIcon },
  { prefix: "/assistant-patients", title: "Patients", subtitle: "Records, visits, and care plans", icon: ClipboardListIcon },
  { prefix: "/assistant-appointments", title: "Appointments", subtitle: "Schedule and booking management", icon: CalendarClockIcon },
  { prefix: "/assistant-queue/doctors", title: "Doctors", subtitle: "Check-in, breaks, and queue start times", icon: StethoscopeIcon },
  { prefix: "/assistant-queue/history", title: "Past Visits", subtitle: "Completed, no-show, and cancelled visits", icon: UsersIcon },
  { prefix: "/assistant-queue/schedule", title: "Expected Today", subtitle: "Scheduled arrivals not yet in clinic", icon: UsersIcon },
  { prefix: "/assistant-queue/live-desk", title: "Live Desk", subtitle: "Active queue and consultation pipeline", icon: UsersIcon },
  { prefix: "/assistant-queue", title: "Patient Queue", subtitle: "Live desk, expected today, and history", icon: UsersIcon },
  { prefix: "/assistant-procedures", title: "Procedures", subtitle: "Orders, requirements, and follow-up", icon: ClipboardPlusIcon },
  { prefix: "/assistant-medications", title: "Medications", subtitle: "Reminders, flags, and escalations", icon: PillIcon },
]

const DEFAULT_ENTRY: RouteEntry = {
  prefix: "",
  title: "Assistant Portal",
  subtitle: "Manage procedures and patient tasks",
  icon: LayoutDashboardIcon,
}

function resolveRoute(pathname: string): RouteEntry {
  const normalized = pathname.replace(
    /^\/assistant\/assistant-account/,
    "/assistant-account",
  )
  const sorted = [...ROUTES].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const entry of sorted) {
    if (normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`)) {
      return entry
    }
  }
  return DEFAULT_ENTRY
}

export function AssistantInsetHeader() {
  const pathname = usePathname()
  const { title, subtitle, icon: Icon } = resolveRoute(pathname)

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E8E6E0]/80 bg-gradient-to-r from-[#FAFAF8] via-white to-[#F9F8F5] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0 text-[#1A5345] hover:bg-[#E8F0EE]" />
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="size-[20px] text-[#1A5345] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="truncate font-sans text-[13px] font-bold tracking-tight text-[#102F27] sm:text-[14px]">{title}</div>
            <div className="truncate font-sans text-[10px] text-[#6B7870] sm:text-[11px]">{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
