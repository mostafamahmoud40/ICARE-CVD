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
      href: "/doctor-prescriptions",
      label: "Prescriptions",
      icon: PillIcon,
      isActive: pathname === "/doctor-prescriptions",
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
                               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(user.name) : "Doctor"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                               alt="Avatar" 
                               className="size-full object-cover rounded-[14px]"
                             />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-[#22C55E] border-2 border-white shadow-sm z-10" />
                        </div>

                        {isCollapsed ? null : (
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
                            <span className="truncate font-sans text-[15px] font-bold text-[#1A1F1E]">
                              {mounted && user ? user.name : "Doctor"}
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
                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mounted && user ? encodeURIComponent(user.name) : "Doctor"}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                         alt="Avatar" 
                         className="size-full object-cover rounded-[10px]"
                       />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <span className="truncate font-sans text-[14px] font-bold leading-tight text-[#1A1F1E]">
                        {mounted && user ? user.name : "Doctor"}
                      </span>
                      <p className="mt-0.5 truncate font-sans text-[10px] font-medium leading-snug text-muted-foreground">
                        Doctor
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

      <SidebarInset>
        <div className="flex h-16 items-center gap-3 border-b border-black/5 px-4 dark:border-white/10">
          <SidebarTrigger />
          <div className="flex flex-col">
            <div className="text-base font-semibold">
              {mounted && (pathname === "/doctor-schedule"
                ? "Schedule"
                : pathname.startsWith("/doctor-queue") && pathname.includes("/consultation")
                  ? "Consultation"
                  : pathname === "/doctor-queue"
                    ? "Queue"
                    : pathname === "/doctor-appointments"
                      ? "Appointments"
                      : pathname.match(/^\/doctor-patients\/[^/]+\/consultations\/[^/]+$/)
                        ? "Consultation Report"
                        : pathname.match(/^\/doctor-patients\/[^/]+\/(vitals|medications|diagnoses|lab-results|documents|consultations)$/)
                          ? pathname.includes("/vitals") ? "Vitals & Readings"
                          : pathname.includes("/medications") ? "Medications"
                          : pathname.includes("/diagnoses") ? "Diagnoses & Conditions"
                          : pathname.includes("/lab-results") ? "Lab Results"
                          : pathname.includes("/documents") ? "Documents & Files"
                          : pathname.includes("/consultations") ? "Consultation History"
                          : "Patient"
                      : pathname.match(/^\/doctor-patients\/[^/]+$/)
                        ? "Patient Profile"
                        : pathname === "/doctor-patients"
                          ? "Patients"
                          : pathname === "/doctor-prescriptions"
                            ? "Prescriptions"
                            : "Doctor Dashboard") || "Doctor Dashboard"}
            </div>
            <div className="text-sm text-muted-foreground">
              {mounted && (pathname === "/doctor-schedule"
                ? "Weekly availability & clinic hours"
                : pathname.startsWith("/doctor-queue") && pathname.includes("/consultation")
                  ? "Active patient consultation"
                  : pathname === "/doctor-queue"
                    ? "Today's patient queue"
                    : pathname === "/doctor-appointments"
                      ? "Manage your patient appointments"
                      : pathname.match(/^\/doctor-patients\/[^/]+\/consultations\/[^/]+$/)
                        ? "Full consultation report"
                        : pathname.match(/^\/doctor-patients\/[^/]+\/(vitals|medications|diagnoses|lab-results|documents|consultations)$/)
                        ? "Patient record details"
                        : pathname.match(/^\/doctor-patients\/[^/]+$/)
                          ? "Patient profile & quick links"
                          : pathname === "/doctor-patients"
                            ? "Patient directory & quick links"
                            : pathname === "/doctor-prescriptions"
                              ? "Manage patient prescriptions"
                              : "Overview & patient insights") || "Overview & patient insights"}
            </div>
          </div>
        </div>

        {children}
      </SidebarInset>
    </>
  )
}

