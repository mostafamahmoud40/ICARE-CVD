"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import type { AuthUser } from "@/lib/auth-tokens"
import {
  ActivityIcon,
  BadgePlusIcon,
  BellIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  CreditCardIcon,
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

const adminSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout, user, mounted } = useRequireRole("admin")

  return (
    <div
      className={`${adminSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <SidebarProvider defaultOpen>
        <AdminLayoutContent pathname={pathname} logout={logout} user={user} mounted={mounted}>{children}</AdminLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function AdminLayoutContent({
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

          <SidebarGroup>
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
                        aria-label="Admin profile"
                        className="flex w-full items-center gap-3 p-1 transition-all hover:bg-[#F9F8F5] rounded-[20px] group relative"
                      >
                        <div className="relative shrink-0">
                          <div className="size-11 rounded-[16px] bg-white p-0.5 shadow-sm border border-[#E8E6E0]/60 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                             <img 
                               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(user.name) : "Admin"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                               alt="Avatar" 
                               className="size-full object-cover rounded-[14px]"
                             />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-[#22C55E] border-2 border-white shadow-sm z-10" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
                            <span className="truncate font-sans text-[15px] font-bold text-[#1A1F1E]">
                              {mounted && user ? user.name : "Admin"}
                            </span>
                            <div className="flex items-center gap-1.5">
                               <span className="size-1 rounded-full bg-[#1A5345]/30" />
                               <span className="truncate font-sans text-[11px] font-medium text-muted-foreground">
                                 Platform admin
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
                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(user.name) : "Admin"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                         alt="Avatar" 
                         className="size-full object-cover rounded-[10px]"
                       />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <span className="truncate font-sans text-[14px] font-bold leading-tight text-[#1A1F1E]">
                        {mounted && user ? user.name : "Admin"}
                      </span>
                      <p className="mt-0.5 truncate font-sans text-[10px] font-medium leading-snug text-muted-foreground">
                        Platform admin
                        <span className="text-muted-foreground/50" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                        <span className="text-muted-foreground/80">{mounted && user ? user.email : ""}</span>
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
                      <Link href="/admin-account">
                        <User2Icon className="size-5" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <CreditCardIcon className="size-5" />
                      <span>Billing</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <Link href="/admin-account/notifications">
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
