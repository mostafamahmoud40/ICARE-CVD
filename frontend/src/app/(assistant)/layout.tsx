"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  CreditCardIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SparklesIcon,
  User2Icon,
  UsersIcon,
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

const assistantSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function AssistantLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout, user, mounted } = useRequireRole("assistant")

  return (
    <div
      className={`${assistantSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
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

  const navItems = [
    {
      href: "/assistant-dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/assistant-dashboard",
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
      isActive: pathname === "/assistant-queue",
    },
    {
      href: "/assistant-dashboard",
      label: "Doctor Support",
      icon: HeartHandshakeIcon,
      isActive: false,
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
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/25">
              <Image
                src="/images/logo/logo.png"
                alt="ICARE-CVD Logo"
                width={32}
                height={32}
                className="size-8 object-cover"
                priority
              />
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">Assistant Portal</div>
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

          <SidebarGroup>
            <SidebarGroupLabel>Activities</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.label}>
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

        <SidebarFooter className="group-data-[collapsible=icon]:p-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    isActive={false}
                    render={
                      <button type="button" aria-label="Assistant profile">
                        <div
                          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25"
                          aria-hidden="true"
                        >
                          <User2Icon className="size-4" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{mounted && user ? user.name : "Assistant"}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              Care Assistant
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
                      <div className="truncate text-sm font-medium">{mounted && user ? user.name : "Assistant"}</div>
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
            <div className="text-base font-semibold">Assistant Dashboard</div>
            <div className="text-sm text-muted-foreground">
              Tasks, cases & patient support
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}
