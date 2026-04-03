"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDaysIcon,
  BellIcon,
  CreditCardIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PillIcon,
  SparklesIcon,
  User2Icon,
} from "lucide-react"

import {
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
  Sidebar,
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

export function PatientPortalShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider defaultOpen>
      <PatientPortalShellInner pathname={pathname}>{children}</PatientPortalShellInner>
    </SidebarProvider>
  )
}

function PatientPortalShellInner({
  pathname,
  children,
}: {
  pathname: string
  children: React.ReactNode
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
      href: "/dashboard",
      label: "Appointments",
      icon: CalendarDaysIcon,
      isActive: false,
    },
    {
      href: "/dashboard",
      label: "Vitals",
      icon: HeartPulseIcon,
      isActive: false,
    },
    {
      href: "/dashboard",
      label: "Medications",
      icon: PillIcon,
      isActive: false,
    },
  ] as const

  return (
    <>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarHeader className="group-data-[collapsible=icon]:p-1">
          <div
            className="flex items-center gap-2 px-1"
            // Prevent unintended sidebar toggle/interaction when the user clicks the logo area.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HeartPulseIcon className="size-4" />
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">
                  Patient Portal
                </div>
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

          <SidebarGroup className="mt-4">
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
                          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <User2Icon className="size-4" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              Sara Ahmed
                            </div>
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
                      className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <User2Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">Sara Ahmed</div>
                      <div className="truncate text-xs text-muted-foreground">
                        m@example.com
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
                      // Keep it as a placeholder for now.
                      e.preventDefault()
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
            <div className="text-base font-semibold">Patient Dashboard</div>
            <div className="text-sm text-muted-foreground">
              Overview & care summary
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}

