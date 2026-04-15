"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  BotMessageSquareIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleIcon,
  PillIcon,
  SparklesIcon,
  User2Icon,
} from "lucide-react"

import { useRequireRole } from "@/hooks/use-require-role"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

const patientSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function PatientLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout, user, mounted } = useRequireRole("patient")

  return (
    <div
      className={`${patientSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <SidebarProvider defaultOpen>
        <PatientLayoutContent pathname={pathname} logout={logout} user={user} mounted={mounted}>{children}</PatientLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function PatientLayoutContent({
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

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/appointments",
      label: "Appointments",
      icon: CalendarDaysIcon,
      isActive: pathname === "/appointments",
    },
    {
      href: "/dashboard",
      label: "Vitals",
      icon: HeartPulseIcon,
      isActive: false,
    },
    {
      href: "/medications",
      label: "Medications",
      icon: PillIcon,
      isActive: pathname === "/medications",
    },
    {
      href: "/ai-chat",
      label: "AI assistant",
      icon: BotMessageSquareIcon,
      isActive: pathname.startsWith("/ai-chat"),
    },
    {
      href: "/chat",
      label: "Chats",
      icon: MessageCircleIcon,
      isActive: pathname.startsWith("/chat"),
    },
  ] as const

  return (
    <>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarHeader className="group-data-[collapsible=icon]:p-1">
          <div
            className="flex items-center gap-2 px-1"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25">
              <HeartPulseIcon className="size-4" />
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">Patient Portal</div>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.slice(0, 1).map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.href} aria-label={item.label}>
                          <Icon className="size-4" />
                          {isCollapsed ? null : <span>{item.label}</span>}
                        </Link>
                      }
                      isActive={item.isActive}
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Care</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.href} aria-label={item.label}>
                          <Icon className="size-4" />
                          {isCollapsed ? null : <span>{item.label}</span>}
                        </Link>
                      }
                      isActive={item.isActive}
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />

        <SidebarFooter className="group-data-[collapsible=icon]:p-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    isActive={false}
                    render={
                      <button type="button" aria-label="Patient profile">
                        <div
                          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25"
                          aria-hidden="true"
                        >
                          <User2Icon className="size-4" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{mounted && user ? user.name : "Patient"}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              Patient
                            </div>
                          </div>
                        )}
                      </button>
                    }
                  />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" side="right" className="w-56">
                  <div className="flex items-start gap-3 px-2 py-2">
                    <div
                      className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25"
                      aria-hidden="true"
                    >
                      <User2Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{mounted && user ? user.name : "Patient"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {mounted && user ? user.email : ""}
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <SparklesIcon className="size-4" />
                    <span>Upgrade to Pro</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <User2Icon className="size-4" />
                    <span>Account</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <CreditCardIcon className="size-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <BellIcon className="size-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      logout()
                    }}
                  >
                    <LogOutIcon className="size-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex h-16 items-center gap-3 border-b border-black/5 px-4 dark:border-white/10">
          <SidebarTrigger />
          <div className="flex flex-col">
            <div className="text-base font-semibold">
              {pathname === "/medications"
                ? "Medications"
                : pathname === "/appointments"
                  ? "Appointments"
                  : pathname === "/ai-chat"
                    ? "AI assistant"
                    : pathname === "/chat"
                      ? "Chats"
                      : "Patient Dashboard"}
            </div>
            <div className="text-sm text-muted-foreground">
              {pathname === "/medications"
                ? "Manage your prescriptions & doses"
                : pathname === "/appointments"
                  ? "View and manage your appointments"
                  : pathname === "/ai-chat"
                    ? "Ask questions — demo replies only"
                    : pathname === "/chat"
                      ? "Messages & conversations"
                      : "Overview & care summary"}
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}

