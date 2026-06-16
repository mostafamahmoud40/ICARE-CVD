"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PillIcon,
  Settings2Icon,
  SparklesIcon,
  StethoscopeIcon,
  User2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { LanguageSwitcher } from "@/components/shared/language-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AssistantHeaderSearch } from "./AssistantHeaderSearch"
import { AssistantNotificationsDropdown } from "./assistant-notifications/AssistantNotificationsDropdown"
import { AssistantProfileAvatar } from "./AssistantProfileAvatar"
import { useAssistantHeaderProfile } from "./useAssistantHeaderProfile"

type RouteEntry = { prefix: string; title: string; subtitle: string; icon: LucideIcon }

const ROUTES: RouteEntry[] = [
  {
    prefix: "/assistant-account/notifications",
    title: "Notifications",
    subtitle: "Clinical desk alerts and action items",
    icon: BellIcon,
  },
  {
    prefix: "/assistant-account/settings",
    title: "Settings",
    subtitle: "Security, notifications, and workspace preferences",
    icon: Settings2Icon,
  },
  {
    prefix: "/assistant-account/activity",
    title: "Activity log",
    subtitle: "Full history of your assistant actions",
    icon: MessageSquareTextIcon,
  },
  {
    prefix: "/assistant-account",
    title: "Account",
    subtitle: "Profile, schedule, and activity",
    icon: User2Icon,
  },
  {
    prefix: "/assistant-doctor-schedule",
    title: "Doctor schedule",
    subtitle: "Weekly hours, daily sessions, and pause controls",
    icon: CalendarDaysIcon,
  },
  {
    prefix: "/assistant-doctors",
    title: "Doctor directory",
    subtitle: "Staff availability and queue loads",
    icon: StethoscopeIcon,
  },
  {
    prefix: "/assistant-dashboard",
    title: "Today's Command Center",
    subtitle: "Live reception queue, appointments, and triage",
    icon: LayoutDashboardIcon,
  },
  {
    prefix: "/assistant-inbox",
    title: "Inbox",
    subtitle: "Tasks and messages needing attention",
    icon: InboxIcon,
  },
  {
    prefix: "/assistant-chats",
    title: "Chats",
    subtitle: "Conversations with patients and staff",
    icon: MessageCircleIcon,
  },
  {
    prefix: "/assistant-patients",
    title: "Patients",
    subtitle: "Records, visits, and care plans",
    icon: ClipboardListIcon,
  },
  {
    prefix: "/assistant-appointments",
    title: "Appointments",
    subtitle: "Schedule and booking management",
    icon: CalendarClockIcon,
  },
  {
    prefix: "/assistant-queue/doctors",
    title: "Doctors",
    subtitle: "Check-in, breaks, and queue start times",
    icon: StethoscopeIcon,
  },
  {
    prefix: "/assistant-queue/history",
    title: "Past visits",
    subtitle: "Completed, no-show, and cancelled visits",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue/schedule",
    title: "Expected today",
    subtitle: "Scheduled arrivals not yet in clinic",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue/live-desk",
    title: "Live desk",
    subtitle: "Active queue and consultation pipeline",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue",
    title: "Patient queue",
    subtitle: "Live desk, expected today, and history",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-procedures",
    title: "Procedures",
    subtitle: "Orders, requirements, and follow-up",
    icon: ClipboardPlusIcon,
  },
  {
    prefix: "/assistant-medications",
    title: "Medications",
    subtitle: "Reminders, flags, and escalations",
    icon: PillIcon,
  },
]

const DEFAULT_ENTRY: RouteEntry = {
  prefix: "",
  title: "Assistant portal",
  subtitle: "Clinical desk operations and patient flow",
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

function HeaderAccountAvatar({
  name,
  avatarUrl,
  size = "md",
  showOnlineDot = false,
}: {
  name: string
  avatarUrl: string | null | undefined
  size?: "sm" | "md"
  showOnlineDot?: boolean
}) {
  const boxClass = size === "sm" ? "size-10" : "size-11"

  return (
    <div className={cn("relative shrink-0", boxClass)}>
      <AssistantProfileAvatar
        name={name}
        avatarUrl={avatarUrl}
        className="size-full rounded-full"
        initialsClassName="text-[12px]"
        sizes="44px"
      />
      {showOnlineDot ? (
        <span
          className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#22C55E]"
          aria-hidden
        />
      ) : null}
    </div>
  )
}

type AssistantInsetHeaderProps = {
  user: AuthUser | null
  logout: () => void
}

export function AssistantInsetHeader({ user, logout }: AssistantInsetHeaderProps) {
  const pathname = usePathname()
  const { title, subtitle, icon: Icon } = resolveRoute(pathname)
  const { displayName, displayEmail, avatarUrl } = useAssistantHeaderProfile(user)

  return (
    <header className="sticky top-0 z-20 flex min-h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-[#E8E6E0]/80 bg-white px-4 py-3 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-6 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground sm:text-[13px]">
            {subtitle}
          </p>
        </div>
      </div>

      <AssistantHeaderSearch />

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <LanguageSwitcher />

        <AssistantNotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-[#FAFAF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/10"
            >
              <HeaderAccountAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                size="sm"
                showOnlineDot
              />
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1">
                  <span className="max-w-[120px] truncate font-sans text-[14px] font-medium text-[#374151] sm:max-w-[160px]">
                    {displayName}
                  </span>
                  <ChevronDownIcon className="size-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                </div>
                <span className="block truncate font-sans text-[12px] text-[#9CA3AF]">Assistant</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[240px] rounded-xl border-[#E8E6E0]/60 bg-white p-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-2.5 border-b border-[#E8E6E0]/40 px-3 py-2.5">
              <HeaderAccountAvatar name={displayName} avatarUrl={avatarUrl} showOnlineDot />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[14px] font-medium text-[#374151]">{displayName}</p>
                <p className="mt-0.5 truncate font-sans text-[12px] text-[#9CA3AF]">{displayEmail}</p>
              </div>
            </div>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <SparklesIcon className="size-4" />
              Upgrade to Pro
            </DropdownMenuItem>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/assistant-account" className="flex items-center gap-3">
                <User2Icon className="size-4" />
                Account
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <CreditCardIcon className="size-4" />
              Billing
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/assistant-account/notifications" className="flex items-center gap-3">
                <BellIcon className="size-4" />
                Notifications
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem
              className="cursor-pointer rounded-b-xl rounded-t-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]"
              onSelect={(e) => {
                e.preventDefault()
                logout()
              }}
            >
              <LogOutIcon className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
