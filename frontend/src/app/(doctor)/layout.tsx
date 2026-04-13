"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageCircleIcon,
  PillIcon,
  SparklesIcon,
  StethoscopeIcon,
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

const doctorSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function DoctorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout, user, mounted } = useRequireRole("doctor")

  return (
    <div
      className={`${doctorSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <SidebarProvider defaultOpen>
        <DoctorLayoutContent pathname={pathname} logout={logout} user={user} mounted={mounted}>{children}</DoctorLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function DoctorLayoutContent({
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
      href: "/doctor-dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname === "/doctor-dashboard",
    },
    {
      href: "/doctor-schedule",
      label: "Schedule",
      icon: CalendarClockIcon,
      isActive: pathname === "/doctor-schedule",
    },
    {
      href: "/doctor-dashboard",
      label: "Appointments",
      icon: CalendarDaysIcon,
      isActive: false,
    },
    {
      href: "/doctor-dashboard",
      label: "Patients",
      icon: HeartPulseIcon,
      isActive: false,
    },
    {
      href: "/doctor-dashboard",
      label: "Prescriptions",
      icon: PillIcon,
      isActive: false,
    },
    {
      href: "/doctor-chat",
      label: "Messages",
      icon: MessageCircleIcon,
      isActive: pathname.startsWith("/doctor-chat"),
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
              <StethoscopeIcon className="size-4" />
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">Doctor Portal</div>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.slice(0, 2).map((item) => {
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
            <SidebarGroupLabel>Care</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.slice(2).map((item) => {
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
                      <button type="button" aria-label="Doctor profile">
                        <div
                          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25"
                          aria-hidden="true"
                        >
                          <User2Icon className="size-4" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {mounted && user ? user.name : "Doctor"}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              Doctor
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
                      <div className="truncate text-sm font-medium">{mounted && user ? user.name : "Doctor"}</div>
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
              {pathname === "/doctor-schedule" ? "Schedule" : "Doctor Dashboard"}
            </div>
            <div className="text-sm text-muted-foreground">
              {pathname === "/doctor-schedule"
                ? "Weekly availability & clinic hours"
                : "Overview & patient insights"}
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}

