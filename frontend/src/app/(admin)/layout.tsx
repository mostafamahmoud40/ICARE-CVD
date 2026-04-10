"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import {
  ActivityIcon,
  BadgePlusIcon,
  BellIcon,
  ClipboardListIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShieldIcon,
  SparklesIcon,
  User2Icon,
  UsersIcon,
} from "lucide-react"

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

const adminSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()

  return (
    <div
      className={`${adminSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <SidebarProvider defaultOpen>
        <AdminLayoutContent pathname={pathname}>{children}</AdminLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function AdminLayoutContent({
  pathname,
  children,
}: {
  pathname: string
  children: ReactNode
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const navItems = [
    {
      href: "/admin/admin-dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      isActive: pathname.startsWith("/admin/admin-dashboard"),
    },
    {
      href: "/admin/admin-dashboard",
      label: "Users",
      icon: UsersIcon,
      isActive: false,
    },
    {
      href: "/admin/admin-dashboard",
      label: "Providers",
      icon: ActivityIcon,
      isActive: false,
    },
    {
      href: "/admin/addstaff",
      label: "Add staff",
      icon: BadgePlusIcon,
      isActive: pathname.startsWith("/admin/addstaff"),
    },
    {
      href: "/admin/admin-dashboard",
      label: "Audit log",
      icon: ClipboardListIcon,
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
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldIcon className="size-4" />
            </div>

            {isCollapsed ? null : (
              <div className="leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">Admin Portal</div>
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

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
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
                      <button type="button" aria-label="Admin profile">
                        <div
                          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <User2Icon className="size-4" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">Admin</div>
                            <div className="truncate text-xs text-muted-foreground">
                              Platform admin
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
                      <div className="truncate text-sm font-medium">Youssef Kamal</div>
                      <div className="truncate text-xs text-muted-foreground">
                        admin@icare-cvd.example
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
            <div className="text-base font-semibold">Admin Dashboard</div>
            <div className="text-sm text-muted-foreground">
              Platform oversight & operations
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}
