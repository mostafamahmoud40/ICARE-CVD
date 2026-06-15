"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { Lora } from "next/font/google"
import { usePathname } from "next/navigation"
import { useCallback } from "react"
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
import { DoctorInsetHeader } from "./DoctorInsetHeader"
import { clearDoctorHeaderProfileCache } from "./doctorHeaderProfile.cache"

const doctorSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function DoctorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const { logout: baseLogout, user } = useRequireRole("doctor")

  const logout = useCallback(() => {
    clearDoctorHeaderProfileCache()
    baseLogout()
  }, [baseLogout])

  return (
    <div
      className={`${doctorSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <SidebarProvider defaultOpen>
        <DoctorLayoutContent pathname={pathname} logout={logout} user={user}>
          {children}
        </DoctorLayoutContent>
      </SidebarProvider>
    </div>
  )
}

function DoctorLayoutContent({
  pathname,
  logout,
  user,
  children,
}: {
  pathname: string
  logout: () => void
  user: AuthUser | null
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
      href: "/doctor-appointments",
      label: "Appointments",
      icon: CalendarDaysIcon,
      isActive: pathname === "/doctor-appointments",
    },
    {
      href: "/doctor-queue",
      label: "Queue",
      icon: UsersIcon,
      isActive: pathname === "/doctor-queue",
    },
    {
      href: "/doctor-patients",
      label: "Patients",
      icon: HeartPulseIcon,
      isActive: pathname.startsWith("/doctor-patients"),
    },
    {
      href: "/doctor-assistants",
      label: "Assistants",
      icon: User2Icon,
      isActive: pathname.startsWith("/doctor-assistants"),
    },
    {
      href: "/doctor-prescriptions",
      label: "Prescriptions",
      icon: PillIcon,
      isActive: pathname.startsWith("/doctor-prescriptions"),
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
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/25">
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
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-sm font-semibold">ICARE-CVD</div>
                <div className="text-xs text-muted-foreground">Doctor Portal</div>
              </div>
            )}

            <SidebarTrigger className="ml-auto shrink-0 text-[#1A5345] hover:bg-[#E8F0EE] group-data-[collapsible=icon]:ml-0" />
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
                        aria-label="Doctor profile"
                        className="flex w-full items-center gap-3 p-1 transition-all hover:bg-[#F9F8F5] rounded-[20px] group relative"
                      >
                        <div className="relative shrink-0">
                          <div className="size-11 rounded-[16px] bg-white p-0.5 shadow-sm border border-[#E8E6E0]/60 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                             <img 
                               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user ? encodeURIComponent(user.name) : "Doctor"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                               alt="Avatar" 
                               className="size-full object-cover rounded-[14px]"
                             />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-[#22C55E] border-2 border-white shadow-sm z-10" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
                            <span className="truncate font-sans text-[15px] font-bold text-[#1A1F1E]">
                              {user ? user.name : "Doctor"}
                            </span>
                            <div className="flex items-center gap-1.5">
                               <span className="size-1 rounded-full bg-[#1A5345]/30" />
                               <span className="truncate font-sans text-[11px] font-medium text-muted-foreground">
                                 Doctor
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
                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user ? encodeURIComponent(user.name) : "Doctor"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                         alt="Avatar" 
                         className="size-full object-cover rounded-[10px]"
                       />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <span className="truncate font-sans text-[14px] font-bold leading-tight text-[#1A1F1E]">
                        {user ? user.name : "Doctor"}
                      </span>
                      <p className="mt-0.5 truncate font-sans text-[10px] font-medium leading-snug text-muted-foreground">
                        Doctor
                        <span className="text-muted-foreground/50" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                        <span className="text-muted-foreground/80">{user ? user.email : ""}</span>
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
                      <Link href="/doctor-account">
                        <User2Icon className="size-5" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <CreditCardIcon className="size-5" />
                      <span>Billing</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6B7870] cursor-pointer focus:bg-slate-50 focus:text-[#1A1F1E] rounded-none">
                      <Link href="/doctor-account/notifications">
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

      <SidebarInset className="bg-[#F9F8F5]">
        {pathname === "/doctor-account" || pathname.startsWith("/doctor-account/") ? (
          children
        ) : (
          <>
            <DoctorInsetHeader user={user} logout={logout} />
            {children}
          </>
        )}
      </SidebarInset>
    </>
  )
}

