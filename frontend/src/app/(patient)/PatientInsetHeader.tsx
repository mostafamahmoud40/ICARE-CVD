"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  BotMessageSquareIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CreditCardIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOutIcon,
  MessageCircleIcon,
  PillIcon,
  SparklesIcon,
  User2Icon,
  type LucideIcon,
} from "lucide-react"

import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { PortalUserAvatar } from "@/components/shared/portal-user-avatar"
import { PatientHeaderSearch } from "./PatientHeaderSearch"
import { PatientNotificationsDropdown } from "./patient-notifications/PatientNotificationsDropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type RouteEntry = { match: (pathname: string) => boolean; routeId: string; icon: LucideIcon }

const ROUTES: RouteEntry[] = [
  { match: (p) => p === "/dashboard", routeId: "dashboard", icon: LayoutDashboardIcon },
  { match: (p) => p === "/appointments", routeId: "appointments", icon: CalendarDaysIcon },
  { match: (p) => p.startsWith("/doctor-directory"), routeId: "doctorDirectory", icon: User2Icon },
  { match: (p) => p === "/queue", routeId: "queue", icon: ListOrderedIcon },
  { match: (p) => p.startsWith("/consultations"), routeId: "consultations", icon: FileTextIcon },
  { match: (p) => p === "/lab-orders", routeId: "labOrders", icon: FlaskConicalIcon },
  { match: (p) => p.startsWith("/vitals"), routeId: "vitals", icon: HeartPulseIcon },
  { match: (p) => p === "/medications", routeId: "medications", icon: PillIcon },
  { match: (p) => p.startsWith("/ai-chat"), routeId: "aiChat", icon: BotMessageSquareIcon },
  { match: (p) => p.startsWith("/chat"), routeId: "chat", icon: MessageCircleIcon },
  { match: (p) => p.startsWith("/account/notifications"), routeId: "notifications", icon: BellIcon },
  { match: (p) => p.startsWith("/account"), routeId: "account", icon: User2Icon },
]

const DEFAULT_ENTRY: RouteEntry = {
  match: () => true,
  routeId: "dashboard",
  icon: LayoutDashboardIcon,
}

function resolveRoute(pathname: string): RouteEntry {
  return ROUTES.find((entry) => entry.match(pathname)) ?? DEFAULT_ENTRY
}

type PatientInsetHeaderProps = {
  user: AuthUser | null
  logout: () => void
}

export function PatientInsetHeader({ user, logout }: PatientInsetHeaderProps) {
  const pathname = usePathname()
  const tHeader = useTranslations("patient.header")
  const tAccount = useTranslations("common.accountMenu")
  const tRole = useTranslations("common.roles")
  const { routeId, icon: Icon } = resolveRoute(pathname)

  const displayName = user?.name ?? "Patient"
  const displayEmail = user?.email ?? ""
  const avatarUrl = user?.avatarUrl ?? null

  return (
    <header className="sticky top-0 z-20 flex min-h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-[#E8E6E0]/80 bg-white px-4 py-3 sm:gap-4 sm:px-6">
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

      <PatientHeaderSearch />

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <LanguageSwitcher />

        <PatientNotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-[#FAFAF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/10"
            >
              <PortalUserAvatar
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
                <span className="block truncate font-sans text-[12px] text-[#9CA3AF]">{tRole("patient")}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[240px] rounded-xl border-[#E8E6E0]/60 bg-white p-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-2.5 border-b border-[#E8E6E0]/40 px-3 py-2.5">
              <PortalUserAvatar name={displayName} avatarUrl={avatarUrl} showOnlineDot />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[14px] font-medium text-[#374151]">{displayName}</p>
                <p className="mt-0.5 truncate font-sans text-[12px] text-[#9CA3AF]">{displayEmail}</p>
              </div>
            </div>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]"
            >
              <SparklesIcon className="size-4" />
              {tAccount("upgradePro")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/account" className="flex items-center gap-3">
                <User2Icon className="size-4" />
                {tAccount("account")}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <CreditCardIcon className="size-4" />
              {tAccount("billing")}
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/account/notifications" className="flex items-center gap-3">
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
