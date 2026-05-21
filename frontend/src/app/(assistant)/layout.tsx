"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Lora } from "next/font/google"
import { usePathname, useSearchParams } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  MessageCircleIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  CreditCardIcon,
  HistoryIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PillIcon,
  PlayCircleIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StethoscopeIcon,
  User2Icon,
  UsersIcon,
} from "lucide-react"

import { useRequireRole } from "@/hooks/use-require-role"
import { cn } from "@/lib/utils"
import { QUEUE_ROUTES, queueNavModeFromPathname } from "./assistant-queue/queueNavMode"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const assistantSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

/** Title-case when the stored name is ALL CAPS; otherwise leave as-is. */
function formatDisplayLabel(raw: string | null | undefined, fallback: string): string {
  const t = (raw ?? "").trim()
  if (!t) return fallback
  if (t === t.toUpperCase() && /[A-Z]/.test(t)) {
    return t
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0) + w.slice(1).toLowerCase() : w))
      .join(" ")
  }
  return t
}

export default function AssistantLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout, user, mounted } = useRequireRole("assistant")

  return (
    <div
      className={`${assistantSerif.className} min-h-screen bg-sidebar text-foreground dark:bg-sidebar`}
    >
      <SidebarProvider defaultOpen>
        <AssistantLayoutContent pathname={pathname} logout={logout} user={user} mounted={mounted}>{children}</AssistantLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function AssistantLayoutContent({
  pathname,
  logout,
  user,
  mounted,
  children,
}: {
  pathname: string
  logout: () => void
  user: AuthUser | null
  mounted: boolean
  children: ReactNode
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const searchParams = useSearchParams()
  const [isQueueOpen, setIsQueueOpen] = useState(() => pathname.startsWith("/assistant-queue"))
  const [isProceduresOpen, setIsProceduresOpen] = useState(() => pathname.startsWith("/assistant-procedures"))
  const viewParam = searchParams.get("view")
  const queueNavMode = queueNavModeFromPathname(pathname)

  const navItems = [
    {
      href: "/assistant-dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/assistant-dashboard",
    },
    {
      href: "/assistant-inbox",
      label: "Inbox",
      icon: InboxIcon,
      isActive: pathname === "/assistant-inbox",
    },
    {
      href: "/assistant-chats",
      label: "Chats",
      icon: MessageCircleIcon,
      isActive: pathname === "/assistant-chats",
    },
    {
      href: "/assistant-patients",
      label: "Patients",
      icon: ClipboardListIcon,
      isActive: pathname === "/assistant-patients",
    },
    {
      href: "/assistant-appointments",
      label: "Appointments",
      icon: CalendarClockIcon,
      isActive: pathname === "/assistant-appointments",
    },
    {
      href: "/assistant-queue",
      label: "Queue",
      icon: UsersIcon,
      isActive: pathname.startsWith("/assistant-queue"),
    },
    {
      href: "/assistant-doctors",
      label: "Doctor Directory",
      icon: StethoscopeIcon,
      isActive: pathname.startsWith("/assistant-doctors"),
    },
    {
      href: "/assistant-doctor-schedule",
      label: "Doctor Schedule",
      icon: CalendarDaysIcon,
      isActive: pathname.startsWith("/assistant-doctor-schedule"),
    },
    {
      href: "/assistant-procedures",
      label: "Procedures",
      icon: ClipboardPlusIcon,
      isActive: pathname.startsWith("/assistant-procedures"),
    },
    {
      href: "/assistant-medications",
      label: "Medications",
      icon: PillIcon,
      isActive: pathname.startsWith("/assistant-medications"),
    },
  ] as const

  const accountNavItems = [
    {
      href: "/assistant-account",
      label: "Account",
      icon: User2Icon,
      isActive:
        (pathname === "/assistant-account" ||
          pathname === "/assistant/assistant-account") &&
        !pathname.includes("/settings"),
    },
    {
      href: "/assistant-account/settings",
      label: "Settings",
      icon: Settings2Icon,
      isActive:
        pathname.includes("/assistant-account/settings") ||
        pathname.includes("/assistant/assistant-account/settings") ||
        pathname.includes("/assistant-account/security") ||
        pathname.includes("/assistant/assistant-account/security") ||
        pathname.includes("/assistant-account/notifications") ||
        pathname.includes("/assistant/assistant-account/notifications") ||
        pathname.includes("/assistant-account/preferences") ||
        pathname.includes("/assistant/assistant-account/preferences"),
    },
  ] as const

  return (
    <>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarHeader className="group-data-[collapsible=icon]:p-1 pb-4 pt-4 px-4">
          <div
            className="flex items-center gap-3"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm border border-[#E8E6E0]">
              <Image
                src="/images/logo/logo.png"
                alt="ICARE-CVD Logo"
                width={44}
                height={44}
                className="size-11 object-cover"
                priority
              />
            </div>

            {isCollapsed ? null : (
              <div className="flex flex-col gap-0.5 leading-tight">
                <div className="text-[17px] font-bold text-[#6B7870]">ICARE-CVD</div>
                <div className="font-sans text-[13px] font-medium text-muted-foreground">Assistant Portal</div>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="p-2 pb-0">
            <SidebarMenu>
              {navItems.slice(0, 1).map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={
                        <Link href={item.href} aria-label={item.label}>
                          <Icon className="size-4" />
                          {isCollapsed ? null : <span>{item.label}</span>}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="p-2 py-0">
            <SidebarMenu>
              {navItems.slice(1).map((item) => {
                const Icon = item.icon

                if (item.label === "Queue") {
                  return (
                    <SidebarMenuItem key={`${item.href}-${item.label}`}>
                      <SidebarMenuButton
                        isActive={false}
                        render={
                          <button
                            type="button"
                            aria-label={item.label}
                            onClick={() => !isCollapsed && setIsQueueOpen((prev) => !prev)}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            {isCollapsed ? null : (
                              <>
                                <span>{item.label}</span>
                                <ChevronDownIcon
                                  className={cn(
                                    "ml-auto size-4 transition-transform duration-200",
                                    isQueueOpen && "rotate-180"
                                  )}
                                />
                              </>
                            )}
                          </button>
                        }
                      />
                      {isQueueOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={queueNavMode === "operations"}
                              render={
                                <Link href={QUEUE_ROUTES.operations}>
                                  <PlayCircleIcon className="size-3.5" />
                                  Live Desk
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={queueNavMode === "schedule"}
                              render={
                                <Link href={QUEUE_ROUTES.schedule}>
                                  <CalendarDaysIcon className="size-3.5" />
                                  Expected Today
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={queueNavMode === "history"}
                              render={
                                <Link href={QUEUE_ROUTES.history}>
                                  <HistoryIcon className="size-3.5" />
                                  Past Visits
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={queueNavMode === "doctors"}
                              render={
                                <Link href={QUEUE_ROUTES.doctors}>
                                  <StethoscopeIcon className="size-3.5" />
                                  Doctors
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                }

                if (item.label === "Procedures") {
                  return (
                    <SidebarMenuItem key={`${item.href}-${item.label}`}>
                      <SidebarMenuButton
                        isActive={false}
                        render={
                          <button
                            type="button"
                            aria-label={item.label}
                            onClick={() => !isCollapsed && setIsProceduresOpen((prev) => !prev)}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            {isCollapsed ? null : (
                              <>
                                <span>{item.label}</span>
                                <ChevronDownIcon
                                  className={cn(
                                    "ml-auto size-4 transition-transform duration-200",
                                    isProceduresOpen && "rotate-180"
                                  )}
                                />
                              </>
                            )}
                          </button>
                        }
                      />
                      {isProceduresOpen && !isCollapsed && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={pathname.startsWith("/assistant-procedures") && (!viewParam || viewParam === "operations")}
                              render={
                                <Link href="/assistant-procedures?view=operations">
                                  <StethoscopeIcon className="size-3.5" />
                                  Doctor Operations
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={pathname.startsWith("/assistant-procedures") && viewParam === "current"}
                              render={
                                <Link href="/assistant-procedures?view=current">
                                  <CalendarDaysIcon className="size-3.5" />
                                  Current Schedule
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={pathname.startsWith("/assistant-procedures") && viewParam === "history"}
                              render={
                                <Link href="/assistant-procedures?view=history">
                                  <HistoryIcon className="size-3.5" />
                                  History Records
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={
                        <Link href={item.href} aria-label={item.label}>
                          <Icon className="size-4" />
                          {isCollapsed ? null : (
                            <>
                              <span>{item.label}</span>
                              {item.label === "Inbox" ? (
                                <span className="ml-auto rounded-full bg-[#6D5DD3] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  3
                                </span>
                              ) : null}
                            </>
                          )}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="p-2 pt-0">
            <SidebarMenu>
              {accountNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={
                        <Link href={item.href} aria-label={item.label}>
                          <Icon className="size-4" />
                          {isCollapsed ? null : <span>{item.label}</span>}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />

        <SidebarFooter className="group-data-[collapsible=icon]:p-1 border-t border-[#E8E6E0]/60 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    render={
                      <button 
                        type="button" 
                        aria-label="Assistant profile"
                        className="flex w-full items-center gap-3 p-1 transition-all hover:bg-[#F9F8F5] rounded-[20px] group relative"
                      >
                        <div className="relative shrink-0">
                          <div className="size-11 rounded-[16px] bg-white p-0.5 shadow-sm border border-[#E8E6E0]/60 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                             <img 
                               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(formatDisplayLabel(user.name, "Assistant")) : "Assistant"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                               alt="Avatar" 
                               className="size-full object-cover rounded-[14px]"
                             />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-[#22C55E] border-2 border-white shadow-sm z-10" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
                            <span className="truncate font-sans text-[15px] font-bold text-[#1A1F1E]">
                              {mounted && user ? formatDisplayLabel(user.name, "Assistant") : "Assistant"}
                            </span>
                            <div className="flex items-center gap-1.5">
                               <span className="size-1 rounded-full bg-[#1A5345]/30" />
                               <span className="truncate font-sans text-[11px] font-medium text-muted-foreground">
                                 Clinical assistant
                               </span>
                            </div>
                          </div>
                        )}
                        {!isCollapsed && (
                           <ChevronDownIcon className="ml-auto size-4 text-muted-foreground/30 group-hover:text-[#1A5345] group-hover:translate-y-0.5 transition-all" />
                        )}
                      </button>
                    }
                  />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  side="right"
                  sideOffset={8}
                  className="w-[248px] rounded-xl border-[#E8E6E0]/60 bg-white p-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2.5 border-b border-[#E8E6E0]/40 bg-[#F9F8F5]/80 px-3 py-2 backdrop-blur-md">
                    <div className="size-9 shrink-0 overflow-hidden rounded-xl border border-[#E8E6E0]/60 bg-white p-px shadow-sm">
                       <img 
                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(formatDisplayLabel(user.name, "Assistant")) : "Assistant"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                         alt="Avatar" 
                         className="size-full object-cover rounded-[10px]"
                       />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <span className="truncate font-sans text-[14px] font-bold leading-tight text-[#1A1F1E]">
                        {mounted && user ? formatDisplayLabel(user.name, "Assistant") : "Assistant"}
                      </span>
                      <p className="mt-0.5 truncate font-sans text-[10px] font-medium leading-snug text-muted-foreground">
                        Clinical assistant
                        <span className="text-muted-foreground/50" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                        <span className="text-muted-foreground/80">{mounted && user ? user.email : "assistant@icare.com"}</span>
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-[#E8E6E0]/60 m-0" />

                  <DropdownMenuItem className="flex items-center gap-3 p-4 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                    <SparklesIcon className="size-5" />
                    <span>Upgrade to Pro</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#E8E6E0]/60 m-0" />

                  <div className="flex flex-col py-1">
                    <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <Link href="/assistant-account">
                        <User2Icon className="size-5" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <CreditCardIcon className="size-5" />
                      <span>Billing</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <Link href="/assistant-account/notifications">
                        <BellIcon className="size-5" />
                        <span>Notifications</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-[#E8E6E0]/60 m-0" />

                  <DropdownMenuItem
                    className="flex items-center gap-3 p-4 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-b-xl rounded-t-none"
                    onSelect={(e) => {
                      e.preventDefault()
                      logout()
                    }}
                  >
                    <LogOutIcon className="size-5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-sidebar">
        <div className="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border/40 bg-sidebar px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-[#1A5345] hover:bg-[#E8F0EE]" />
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A5345]">
                <LayoutDashboardIcon className="size-4 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="font-sans text-[13px] font-bold text-[#102F27]">Assistant Dashboard</div>
                <div className="font-sans text-[10px] text-[#6B7870]">Manage procedures & patient tasks</div>
              </div>
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}
