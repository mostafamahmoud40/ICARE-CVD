"use client"

import { useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CreditCardIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleIcon,
  PillIcon,
  PencilLineIcon,
  ScissorsIcon,
  SparklesIcon,
  User2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { DoctorHeaderSearch } from "./DoctorHeaderSearch"
import { DoctorNotificationsDropdown } from "./doctor-notifications/DoctorNotificationsDropdown"
import { fetchDoctorAccount } from "./doctor-account/doctorAccount.api"
import { EditDoctorDisplayNameDialog } from "./doctor-account/EditDoctorDisplayNameDialog"
import { useDoctorDisplayNameEdit } from "./doctor-account/useDoctorDisplayNameEdit"
import {
  getDoctorHeaderProfileSnapshot,
  subscribeDoctorHeaderProfile,
} from "./doctorHeaderProfile.cache"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type RouteEntry = { match: (pathname: string) => boolean; routeId: string; icon: LucideIcon }

const ROUTES: RouteEntry[] = [
  {
    match: (p) => p === "/doctor-schedule",
    routeId: "schedule",
    icon: CalendarClockIcon,
  },
  {
    match: (p) => p.startsWith("/doctor-queue") && p.includes("/consultation"),
    routeId: "consultation",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => p === "/doctor-queue",
    routeId: "queue",
    icon: UsersIcon,
  },
  {
    match: (p) => p === "/doctor-appointments",
    routeId: "appointments",
    icon: CalendarDaysIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/consultations\/[^/]+$/.test(p),
    routeId: "consultationReport",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/vitals$/.test(p),
    routeId: "vitals",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/medications$/.test(p),
    routeId: "medications",
    icon: PillIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/diagnoses\/[^/]+$/.test(p),
    routeId: "diagnosisDetails",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/diagnoses$/.test(p),
    routeId: "diagnoses",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/lab-results$/.test(p),
    routeId: "labResults",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/documents$/.test(p),
    routeId: "documents",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+\/consultations$/.test(p),
    routeId: "consultationHistory",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-patients\/[^/]+$/.test(p),
    routeId: "patientProfile",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => p === "/doctor-patients",
    routeId: "patients",
    icon: HeartPulseIcon,
  },
  {
    match: (p) => /^\/doctor-prescriptions\/[^/]+$/.test(p),
    routeId: "patientPrescriptions",
    icon: PillIcon,
  },
  {
    match: (p) => p.startsWith("/doctor-prescriptions"),
    routeId: "prescriptions",
    icon: PillIcon,
  },
  {
    match: (p) => /^\/doctor-procedures\/[^/]+\/report$/.test(p),
    routeId: "procedureReport",
    icon: ScissorsIcon,
  },
  {
    match: (p) => /^\/doctor-procedures\/[^/]+$/.test(p),
    routeId: "procedureDetail",
    icon: ScissorsIcon,
  },
  {
    match: (p) => p === "/doctor-procedures/calendar",
    routeId: "proceduresCalendar",
    icon: CalendarDaysIcon,
  },
  {
    match: (p) => p === "/doctor-procedures/pending",
    routeId: "proceduresPending",
    icon: ScissorsIcon,
  },
  {
    match: (p) => p === "/doctor-procedures/completed",
    routeId: "proceduresCompleted",
    icon: ScissorsIcon,
  },
  {
    match: (p) => p === "/doctor-procedures",
    routeId: "procedures",
    icon: ScissorsIcon,
  },
  {
    match: (p) => p.startsWith("/doctor-assistants"),
    routeId: "assistants",
    icon: User2Icon,
  },
  {
    match: (p) => p.startsWith("/doctor-chat"),
    routeId: "messages",
    icon: MessageCircleIcon,
  },
  {
    match: (p) => p === "/doctor-account/notifications",
    routeId: "accountNotifications",
    icon: BellIcon,
  },
  {
    match: (p) => p === "/doctor-account",
    routeId: "account",
    icon: User2Icon,
  },
  {
    match: (p) => p === "/doctor-dashboard",
    routeId: "dashboard",
    icon: LayoutDashboardIcon,
  },
]

const DEFAULT_ENTRY: RouteEntry = {
  match: () => true,
  routeId: "default",
  icon: LayoutDashboardIcon,
}

function resolveRoute(pathname: string): RouteEntry {
  return ROUTES.find((entry) => entry.match(pathname)) ?? DEFAULT_ENTRY
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
  const [imageFailed, setImageFailed] = useState(false)
  const hasAvatar = Boolean(avatarUrl?.trim()) && !imageFailed
  const boxClass = size === "sm" ? "size-10" : "size-11"

  return (
    <div className={cn("relative shrink-0", boxClass)}>
      <div className="relative size-full overflow-hidden rounded-full bg-[#F4F3EF]">
        {hasAvatar ? (
          <Image
            src={avatarUrl!}
            alt={name}
            fill
            unoptimized
            sizes="44px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[#B0BAB4]">
            <User2Icon className={size === "sm" ? "size-5" : "size-5"} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      {showOnlineDot ? (
        <span
          className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#22C55E]"
          aria-hidden
        />
      ) : null}
    </div>
  )
}

type DoctorInsetHeaderProps = {
  user: AuthUser | null
  logout: () => void
}

export function DoctorInsetHeader({ user, logout }: DoctorInsetHeaderProps) {
  const pathname = usePathname()
  const tHeader = useTranslations("doctor.header")
  const tAccount = useTranslations("common.accountMenu")
  const tRole = useTranslations("common.roles")
  const { routeId, icon: Icon } = resolveRoute(pathname)

  const cachedProfile = useSyncExternalStore(
    subscribeDoctorHeaderProfile,
    getDoctorHeaderProfileSnapshot,
    () => null,
  )

  const accountQuery = useQuery({
    queryKey: ["doctor", "account"],
    queryFn: fetchDoctorAccount,
    staleTime: 5 * 60 * 1000,
  })

  const profile = accountQuery.data?.profile ?? cachedProfile
  const displayName = profile?.fullName ?? user?.name ?? "Doctor"
  const displayEmail = profile?.email ?? user?.email ?? ""
  const avatarUrl = profile?.avatarUrl ?? null
  const nameEdit = useDoctorDisplayNameEdit(displayName)

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

      <DoctorHeaderSearch />

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <LanguageSwitcher />

        <DoctorNotificationsDropdown />

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
                <span className="block truncate font-sans text-[12px] text-[#9CA3AF]">{tRole("doctor")}</span>
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

            <DropdownMenuItem
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]",
              )}
            >
              <SparklesIcon className="size-4" />
              {tAccount("upgradePro")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="m-0 bg-[#E8E6E0]/60" />

            <DropdownMenuItem
              className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]"
              onSelect={(event) => {
                event.preventDefault()
                nameEdit.setOpen(true)
              }}
            >
              <PencilLineIcon className="size-4" />
              Edit display name
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/doctor-account" className="flex items-center gap-3">
                <User2Icon className="size-4" />
                {tAccount("account")}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <CreditCardIcon className="size-4" />
              {tAccount("billing")}
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer rounded-none px-4 py-3 text-[14px] font-medium text-[#6B7870] focus:bg-[#F9F8F5] focus:text-[#1A1F1E]">
              <Link href="/doctor-account/notifications" className="flex items-center gap-3">
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

      <EditDoctorDisplayNameDialog
        open={nameEdit.open}
        onOpenChange={nameEdit.setOpen}
        initialName={displayName}
        onSubmit={nameEdit.saveName}
        isPending={nameEdit.isSaving}
      />
    </header>
  )
}
