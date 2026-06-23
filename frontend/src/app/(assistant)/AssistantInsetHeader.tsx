"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  CreditCardIcon,
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

type RouteEntry = { prefix: string; routeId: string; icon: LucideIcon }

const ROUTES: RouteEntry[] = [
  {
    prefix: "/assistant-account/notifications",
    routeId: "accountNotifications",
    icon: BellIcon,
  },
  {
    prefix: "/assistant-account/settings",
    routeId: "accountSettings",
    icon: Settings2Icon,
  },
  {
    prefix: "/assistant-account/activity",
    routeId: "accountActivity",
    icon: MessageSquareTextIcon,
  },
  {
    prefix: "/assistant-account",
    routeId: "account",
    icon: User2Icon,
  },
  {
    prefix: "/assistant-doctor-schedule",
    routeId: "doctorSchedule",
    icon: CalendarDaysIcon,
  },
  {
    prefix: "/assistant-doctors",
    routeId: "doctorDirectory",
    icon: StethoscopeIcon,
  },
  {
    prefix: "/assistant-dashboard",
    routeId: "dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    prefix: "/assistant-chats",
    routeId: "chats",
    icon: MessageCircleIcon,
  },
  {
    prefix: "/assistant-patients",
    routeId: "patients",
    icon: ClipboardListIcon,
  },
  {
    prefix: "/assistant-appointments",
    routeId: "appointments",
    icon: CalendarClockIcon,
  },
  {
    prefix: "/assistant-queue/doctors",
    routeId: "queueDoctors",
    icon: StethoscopeIcon,
  },
  {
    prefix: "/assistant-queue/history",
    routeId: "queueHistory",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue/schedule",
    routeId: "queueSchedule",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue/live-desk",
    routeId: "queueLiveDesk",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-queue",
    routeId: "queue",
    icon: UsersIcon,
  },
  {
    prefix: "/assistant-procedures",
    routeId: "procedures",
    icon: ClipboardPlusIcon,
  },
  {
    prefix: "/assistant-medications",
    routeId: "medications",
    icon: PillIcon,
  },
]

const DEFAULT_ENTRY: RouteEntry = {
  prefix: "",
  routeId: "default",
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
  compact?: boolean
}

export function AssistantInsetHeader({ user, logout, compact = false }: AssistantInsetHeaderProps) {
  const pathname = usePathname()
  const tHeader = useTranslations("assistant.header")
  const tAccount = useTranslations("common.accountMenu")
  const tRole = useTranslations("common.roles")
  const { routeId, icon: Icon } = resolveRoute(pathname)
  const { displayName, displayEmail, avatarUrl } = useAssistantHeaderProfile(user)

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#E8E6E0]/80 bg-white px-4 py-3 sm:gap-4 sm:px-6",
        compact ? "min-h-14" : "min-h-[4.5rem]",
      )}
    >
      {!compact ? (
        <div className="flex min-w-0 items-start gap-3">
          <Icon className="mt-0.5 size-6 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
              {tHeader(`${routeId}.title`)}
            </h1>
            <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground sm:text-[13px]">
              {tHeader(`${routeId}.subtitle`)}
            </p>
          </div>
        </div>
      ) : null}

      <div className={cn("min-w-0", compact && "flex-1")}>
        <AssistantHeaderSearch />
      </div>

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
              <div className="min-w-0 text-start">
                <div className="flex items-center gap-1">
                  <span className="max-w-[120px] truncate font-sans text-[14px] font-medium text-[#374151] sm:max-w-[160px]">
                    {displayName}
                  </span>
                  <ChevronDownIcon className="size-3.5 shrink-0 text-[#9CA3AF]" aria-hidden />
                </div>
                <span className="block truncate font-sans text-[12px] text-[#9CA3AF]">{tRole("assistant")}</span>
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
              {tAccount("upgradePro")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/assistant-account" className="flex items-center gap-3">
                <User2Icon className="size-4" />
                {tAccount("account")}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <CreditCardIcon className="size-4" />
              {tAccount("billing")}
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/assistant-account/notifications" className="flex items-center gap-3">
                <BellIcon className="size-4" />
                {tAccount("notifications")}
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
              {tAccount("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
