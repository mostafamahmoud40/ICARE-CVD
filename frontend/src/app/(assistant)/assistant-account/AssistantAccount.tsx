"use client"

import Image from "next/image"
import { useState, type ComponentType } from "react"
import type {
  AssistantProfile,
  AssistantWorkStats,
  ActivityEntry,
  SecurityInfo,
  AssistantPreferences,
  WeeklyStat,
  ShiftEntry,
} from "./assistantAccount.types"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  AccountStatCell,
  accountStatCellClassName,
  AccountCardHeaderIcon,
  accountPageCardClassName,
  accountSectionDescClassName,
  accountSectionTitleClassName,
  accountShiftStatusStyles,
  accountWeeklyMetrics,
  assistantAccountScrollbarCss,
} from "./assistantAccount.shared"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  Building2Icon,
  BriefcaseIcon,
  MailIcon,
  PhoneIcon,
  UsersIcon,
  CalendarClockIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  LockIcon,
  ShieldCheckIcon,
  BellIcon,
  BarChart3Icon,
  FileTextIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  ClockIcon,
  GlobeIcon,
  LogInIcon,
  MonitorSmartphoneIcon,
  MessageCircleIcon,
  HistoryIcon,
  PencilLineIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { EditAssistantProfileDialog } from "./EditAssistantProfileDialog"
import { useAssistantAccountProfile } from "./useAssistantAccountProfile"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDateTimeShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function assistantAvatarSrc(profile: AssistantProfile) {
  if (profile.avatarUrl) return profile.avatarUrl
  return `https://i.pravatar.cc/400?u=${encodeURIComponent(profile.id)}`
}

/* ────────────────────────────────────────────
   Existing cards (Profile, Professional, Stats, Actions)
   ──────────────────────────────────────────── */

function ProfileQuickStat({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  iconColor: string
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3.5 shrink-0", iconColor)} aria-hidden />
        <span className="text-[10px] font-medium text-[#6B7870]">{label}</span>
      </div>
      <p className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">{value}</p>
    </div>
  )
}

function ProfileHeaderCard({
  profile,
  workStats,
  onEdit,
}: {
  profile: AssistantProfile
  workStats: AssistantWorkStats
  onEdit: () => void
}) {
  const avatarSrc = assistantAvatarSrc(profile)

  return (
    <Card className={accountPageCardClassName}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div className="relative size-28 overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm sm:size-32">
              <Image
                src={avatarSrc}
                alt={profile.fullName}
                fill
                unoptimized
                sizes="(max-width: 640px) 112px, 128px"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm">
              <CheckCircleIcon className="size-3.5 text-white" aria-hidden />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-serif text-[20px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[22px]">
                  {profile.fullName}
                </h2>
                <p className="text-[12px] font-medium text-muted-foreground sm:text-[13px]">Care Assistant</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-lg border border-[#E8E6E0]/60 bg-white px-2 py-0.5 text-[10px] font-bold text-[#1A5345]"
                  >
                    <Building2Icon className="size-3" aria-hidden />
                    {profile.department}
                  </Badge>
                  <span className="text-[11px] font-medium text-[#6B7870]">
                    {profile.experienceYears} yrs · Since {formatDate(profile.joinedAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="h-9 gap-2 rounded-xl border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
                >
                  <PencilLineIcon className="size-3.5" aria-hidden />
                  Edit profile
                </Button>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground sm:text-[11px]">
                  ID: CVD-{profile.id.split("-").pop() ?? profile.id}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 sm:text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ProfileQuickStat
                label="Patients today"
                value={workStats.patientsHandledToday}
                icon={UsersIcon}
                iconColor="text-[#1A5345]"
              />
              <ProfileQuickStat
                label="Appointments"
                value={workStats.appointmentsScheduled}
                icon={CalendarClockIcon}
                iconColor="text-[#1A5345]"
              />
              <ProfileQuickStat
                label="Tasks done"
                value={workStats.tasksCompleted}
                icon={CheckCircleIcon}
                iconColor="text-emerald-600"
              />
              <ProfileQuickStat
                label="Queue managed"
                value={workStats.queueManaged}
                icon={ClipboardListIcon}
                iconColor="text-amber-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl border border-[#E8E6E0]/70 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">
                <MailIcon className="size-3.5 shrink-0 text-[#1A5345]/70" />
                <span className="truncate">{profile.email}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E6E0]/70 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#1A1F1E] sm:text-[12px]">
                <PhoneIcon className="size-3.5 shrink-0 text-[#1A5345]/70" />
                {profile.phone}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfessionalInfoCard({ profile }: { profile: AssistantProfile }) {
  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="border-b border-[#E8E6E0]/40 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={BriefcaseIcon} />
          <div>
            <CardTitle className={accountSectionTitleClassName}>Professional Information</CardTitle>
            <CardDescription className={accountSectionDescClassName}>
              Your work details and department info
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <InfoRow icon={Building2Icon} label="Department" value={profile.department} />
        <InfoRow icon={UsersIcon} label="Experience" value={`${profile.experienceYears} years`} />
        <InfoRow icon={CalendarDaysIcon} label="Joined" value={formatDate(profile.joinedAt)} />
      </CardContent>
    </Card>
  )
}


/* ────────────────────────────────────────────
   1. Activity Log
   ──────────────────────────────────────────── */

function activityTypeConfig(type: ActivityEntry["type"]) {
  switch (type) {
    case "patient":
      return { icon: UsersIcon, iconColor: "text-[#1A5345]" }
    case "appointment":
      return { icon: CalendarClockIcon, iconColor: "text-[#1A5345]" }
    case "queue":
      return { icon: ClipboardListIcon, iconColor: "text-amber-600" }
    case "document":
      return { icon: FileTextIcon, iconColor: "text-emerald-600" }
  }
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return {
    date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date),
    time: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date),
  }
}

function ActivityLogCard({ activities }: { activities: ActivityEntry[] }) {
  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="border-b border-[#E8E6E0]/40 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={HistoryIcon} />
          <div>
            <CardTitle className={accountSectionTitleClassName}>Activity History</CardTitle>
            <CardDescription className={accountSectionDescClassName}>
              {activities.length} records
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-5 sm:p-6">
        <div className="absolute left-1/2 top-5 bottom-5 w-px -translate-x-1/2 bg-[#E8E6E0] sm:top-6 sm:bottom-6" />

        <div className="relative space-y-4 sm:space-y-6">
          {activities.slice(0, 6).map((entry, i) => {
            const cfg = activityTypeConfig(entry.type)
            const Icon = cfg.icon
            const { date, time } = formatDateTime(entry.timestamp)
            const isLeft = i % 2 === 0

            return (
              <div
                key={entry.id}
                className={cn(
                  "relative flex items-center gap-3 sm:gap-4",
                  isLeft ? "flex-row" : "flex-row-reverse",
                )}
              >
                {/* Card side */}
                <div className={cn("flex-1", isLeft ? "text-right" : "text-left")}>
                  <div
                    className={cn(
                      "inline-flex max-w-full flex-col gap-1.5 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md sm:p-3.5",
                      isLeft ? "rounded-tr-md" : "rounded-tl-md",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-4 shrink-0", cfg.iconColor)} aria-hidden />
                      <span className="text-[13px] font-semibold text-[#1A1F1E]">{entry.action}</span>
                    </div>

                    <p className="text-[11px] font-medium leading-relaxed text-[#6B7870]">{entry.description}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <Badge
                        variant="secondary"
                        className="gap-1 border border-[#E8E6E0]/60 bg-white px-2 py-0 text-[9px] font-medium text-[#1A5345] shadow-none"
                      >
                        <CalendarDaysIcon className="size-3" aria-hidden />
                        {date}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="gap-1 border border-[#E8E6E0]/60 bg-white px-2 py-0 text-[9px] font-medium text-[#6B7870] shadow-none"
                      >
                        <ClockIcon className="size-3" aria-hidden />
                        {time}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Center node */}
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#1A5345] shadow-sm sm:size-11",
                    )}
                  >
                    <span className="text-[10px] font-bold text-white sm:text-[11px]">{i + 1}</span>
                  </div>
                </div>

                {/* Empty space for opposite side */}
                <div className="flex-1" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────
   4. Security Settings
   ──────────────────────────────────────────── */

export function AssistantSecuritySettingsCard({ security }: { security: SecurityInfo }) {
  const twoFactorOn = security.twoFactorEnabled

  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="space-y-1 border-b border-[#E8E6E0]/40 bg-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={ShieldCheckIcon} />
          <div>
            <CardTitle className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[22px]">Sign-in Protection</CardTitle>
            <CardDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Strengthen your account security and monitor access
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6 sm:p-8">
        <div className="group relative flex flex-col gap-5 rounded-2xl border border-[#E8E6E0]/70 bg-[#FBFDFC]/50 p-5 transition-colors hover:border-[#1A5345]/20 hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-sm">
              <ShieldCheckIcon className="size-6 text-[#1A5345]" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[15px] font-bold text-[#1A1F1E]">Two-factor authentication</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    twoFactorOn
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  {twoFactorOn ? "Active" : "Highly Recommended"}
                </Badge>
              </div>
              <p className="text-[13px] leading-relaxed text-[#6B7870]">
                {twoFactorOn
                  ? "Your account is protected by an additional verification layer."
                  : "Add an extra layer of security to prevent unauthorized access to clinical data."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-2 self-stretch rounded-xl border-[#1A5345]/20 bg-white px-5 text-[13px] font-bold text-[#1A5345] transition-all hover:bg-[#1A5345] hover:text-white sm:self-center"
          >
            {twoFactorOn ? "Modify Settings" : "Secure Account"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8E6E0] to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7870]">System Logs</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E8E6E0] to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SecurityStatRow
              icon={LockIcon}
              label="Security Protocol"
              value={formatDate(security.lastPasswordChange)}
            />
            <SecurityStatRow
              icon={LogInIcon}
              label="Last Access"
              value={formatDateTimeShort(security.lastLogin)}
            />
            <SecurityStatRow
              icon={MonitorSmartphoneIcon}
              label="Active Sessions"
              value={`${security.activeSessions} ${security.activeSessions === 1 ? "device" : "devices"}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
          <Button
            variant="outline"
            className="h-12 flex-1 gap-2.5 rounded-xl border-[#E8E6E0] bg-white text-[14px] font-bold text-[#102F27] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-[#F8FAFA]"
          >
            <LockIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            Refresh Credentials
          </Button>
          <Button
            variant="outline"
            className="h-12 flex-1 gap-2.5 rounded-xl border-red-100 bg-white text-[14px] font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 hover:border-red-200"
          >
            <EyeIcon className="size-4 shrink-0" aria-hidden />
            Terminate All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityStatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
        <Icon className="size-4 text-[#1A5345]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[#6B7870]">{label}</p>
        <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   5. Notifications & Preferences (standalone routes; see sidebar)
   ──────────────────────────────────────────── */

function PreferenceSwitch({
  id,
  checked,
  onCheckedChange,
}: {
  id: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A5345]/20",
        checked 
          ? "bg-[#1A5345] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" 
          : "bg-[#E2E8F0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 size-5 rounded-full bg-white shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? "left-[22px] scale-110" : "left-1",
        )}
      />
    </button>
  )
}

export function AssistantNotificationsSettingsCard({
  preferences,
}: {
  preferences: AssistantPreferences
}) {
  const [emergencyAlerts, setEmergencyAlerts] = useState(preferences.emergencyAlerts)
  const [appointmentReminders, setAppointmentReminders] = useState(
    preferences.appointmentReminders,
  )
  const [checklistUpdates, setChecklistUpdates] = useState(preferences.checklistUpdates)
  const [doctorMessages, setDoctorMessages] = useState(preferences.doctorMessages)

  const rows = [
    {
      id: "assistant-notif-emergency",
      title: "Emergency Alerts",
      description: "Critical bypass for immediate medical interventions.",
      iconWrap: "bg-red-50 ring-red-100",
      Icon: AlertTriangleIcon,
      iconClass: "text-red-600",
      checked: emergencyAlerts,
      setChecked: setEmergencyAlerts,
    },
    {
      id: "assistant-notif-appointment",
      title: "Appointment Reminders",
      description: "Schedule synchronization and patient arrivals.",
      iconWrap: "bg-blue-50 ring-blue-100",
      Icon: CalendarDaysIcon,
      iconClass: "text-blue-600",
      checked: appointmentReminders,
      setChecked: setAppointmentReminders,
    },
    {
      id: "assistant-notif-checklist",
      title: "Checklist Updates",
      description: "Real-time task completion and directive alerts.",
      iconWrap: "bg-emerald-50 ring-emerald-100",
      Icon: ClipboardListIcon,
      iconClass: "text-emerald-600",
      checked: checklistUpdates,
      setChecked: setChecklistUpdates,
    },
    {
      id: "assistant-notif-doctor",
      title: "Physician Directives",
      description: "Direct communications from attending specialists.",
      iconWrap: "bg-orange-50 ring-orange-100",
      Icon: MessageCircleIcon,
      iconClass: "text-orange-600",
      checked: doctorMessages,
      setChecked: setDoctorMessages,
    },
  ] as const

  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="space-y-1 border-b border-[#E8E6E0]/40 bg-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={BellIcon} iconClassName="text-amber-600" />
          <div>
            <CardTitle className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[22px]">Notification Channels</CardTitle>
            <CardDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Configure high-priority clinical alert delivery systems
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="divide-y divide-[#E8E6E0]/40">
          {rows.map((row) => {
            const Icon = row.Icon
            return (
              <div 
                key={row.id} 
                className="group relative flex items-center gap-4 rounded-xl px-2 py-5 transition-colors hover:bg-[#F9F8F5] sm:px-4 sm:py-6"
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all duration-500 group-hover:scale-110",
                    row.iconWrap,
                  )}
                >
                  <Icon className={cn("size-5", row.iconClass)} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[15px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">{row.title}</p>
                  <p className="text-[13px] leading-relaxed text-[#6B7870]">
                    {row.description}
                  </p>
                </div>
                <PreferenceSwitch
                  id={row.id}
                  checked={row.checked}
                  onCheckedChange={row.setChecked}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function AssistantDisplayPreferencesCard({
  preferences,
}: {
  preferences: AssistantPreferences
}) {
  const ThemeIcon =
    preferences.theme === "dark"
      ? MoonIcon
      : preferences.theme === "light"
        ? SunIcon
        : LaptopIcon

  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="space-y-1 border-b border-[#E8E6E0]/40 bg-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={SlidersHorizontalIcon} />
          <div>
            <CardTitle className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[22px]">Display Preferences</CardTitle>
            <CardDescription className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
              Personalize your workspace aesthetic and localization
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 sm:p-8">
        <div className="group flex items-center justify-between rounded-2xl border border-[#E8E6E0]/70 bg-[#FBFDFC]/50 p-4 transition-colors hover:border-[#1A5345]/20 hover:bg-white sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
              <ThemeIcon className="size-5 text-[#1A5345]" aria-hidden />
            </div>
            <div className="space-y-0.5">
              <span className="text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">Interface Theme</span>
              <p className="text-[11px] font-medium text-[#6B7870]">Adapts to your environment</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-lg border border-[#E8E6E0]/80 bg-white px-3 py-1 text-[11px] font-bold capitalize text-[#1A5345]">
            {preferences.theme}
          </Badge>
        </div>

        <div className="group flex items-center justify-between rounded-2xl border border-[#E8E6E0]/70 bg-[#FBFDFC]/50 p-4 transition-colors hover:border-[#1A5345]/20 hover:bg-white sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-[#E8E6E0]/60 bg-white shadow-sm">
              <GlobeIcon className="size-5 text-[#1A5345]" aria-hidden />
            </div>
            <div className="space-y-0.5">
              <span className="text-[14px] font-bold text-[#1A1F1E] sm:text-[15px]">Regional Language</span>
              <p className="text-[11px] font-medium text-[#6B7870]">Clinical terminology localization</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-lg border border-[#E8E6E0]/80 bg-white px-3 py-1 text-[11px] font-bold text-[#1A5345]">
            English (US)
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────
   6. Weekly / Monthly Stats
   ──────────────────────────────────────────── */

function WeeklyStatsCard({ stats }: { stats: WeeklyStat[] }) {
  const totals = {
    patients: stats.reduce((a, s) => a + s.patients, 0),
    appointments: stats.reduce((a, s) => a + s.appointments, 0),
    tasks: stats.reduce((a, s) => a + s.tasks, 0),
  }

  const summaryTiles = [
    { key: "patients" as const, value: totals.patients, Icon: UsersIcon },
    { key: "appointments" as const, value: totals.appointments, Icon: CalendarClockIcon },
    { key: "tasks" as const, value: totals.tasks, Icon: CheckCircleIcon },
  ]

  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="border-b border-[#E8E6E0]/40 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={BarChart3Icon} />
          <div>
            <CardTitle className={accountSectionTitleClassName}>Weekly Performance</CardTitle>
            <CardDescription className={accountSectionDescClassName}>Last 6 working days overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryTiles.map(({ key, value, Icon }) => {
            const metric = accountWeeklyMetrics[key]
            return (
              <AccountStatCell
                key={key}
                icon={Icon}
                iconColor={metric.textClass}
                value={value}
                label={metric.label.toLowerCase()}
              />
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-muted-foreground">Daily breakdown</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {(Object.keys(accountWeeklyMetrics) as Array<keyof typeof accountWeeklyMetrics>).map((key) => {
                const metric = accountWeeklyMetrics[key]
                return (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <span className={cn("size-2 shrink-0 rounded-full", metric.dotClass)} aria-hidden />
                    <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{metric.label}</span>
                  </span>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            {stats.map((day) => {
              const total = day.patients + day.appointments + day.tasks
              const segments = [
                { key: "patients" as const, count: day.patients },
                { key: "appointments" as const, count: day.appointments },
                { key: "tasks" as const, count: day.tasks },
              ].filter((s) => s.count > 0)

              return (
                <div key={day.day} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-[11px] font-bold text-[#1A1F1E] sm:w-10 sm:text-[12px]">
                      {day.day}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex h-2.5 overflow-hidden rounded-full bg-[#E8E6E0]/50 sm:h-3"
                        role="img"
                        aria-label={`${day.day}: ${day.patients} patients, ${day.appointments} appointments, ${day.tasks} tasks`}
                      >
                        {segments.map((seg) => {
                          const metric = accountWeeklyMetrics[seg.key]
                          const width = total ? (seg.count / total) * 100 : 0
                          return (
                            <div
                              key={seg.key}
                              className={cn("h-full transition-all", metric.barClass)}
                              style={{ width: `${width}%` }}
                            />
                          )
                        })}
                      </div>
                    </div>
                    <span className="inline-flex min-w-[2rem] shrink-0 items-center justify-center rounded-lg border border-[#E8E6E0]/70 bg-[#F9F8F5] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#1A1F1E] sm:min-w-[2.25rem] sm:text-[12px]">
                      {total}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 sm:pl-[2.75rem]">
                    {segments.map((seg) => {
                      const metric = accountWeeklyMetrics[seg.key]
                      return (
                        <span
                          key={seg.key}
                          className={cn("inline-flex items-center gap-1 text-[10px] font-bold tabular-nums sm:text-[11px]", metric.textClass)}
                        >
                          <span className={cn("size-1.5 rounded-full", metric.dotClass)} aria-hidden />
                          {seg.count} {metric.label.toLowerCase()}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const SHIFT_FALLBACK_BY_INDEX: { dayName: string; dayBadge: string }[] = [
  { dayName: "Sunday", dayBadge: "Su" },
  { dayName: "Monday", dayBadge: "Mo" },
  { dayName: "Tuesday", dayBadge: "Tu" },
  { dayName: "Wednesday", dayBadge: "We" },
  { dayName: "Thursday", dayBadge: "Th" },
  { dayName: "Friday", dayBadge: "Fr" },
  { dayName: "Saturday", dayBadge: "Sa" },
]

/** Any Arabic-script code points — reject so UI stays English-only */
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function normalizeShiftEntry(raw: ShiftEntry, index: number): ShiftEntry {
  const fb = SHIFT_FALLBACK_BY_INDEX[index] ?? SHIFT_FALLBACK_BY_INDEX[0]!

  const dayNameRaw = raw.dayName?.trim()
  const dayName =
    dayNameRaw && !ARABIC_SCRIPT.test(dayNameRaw) ? dayNameRaw : fb.dayName

  const badgeRaw = raw.dayBadge?.trim()
  const dayBadge =
    badgeRaw && !ARABIC_SCRIPT.test(badgeRaw)
      ? badgeRaw.length > 3
        ? badgeRaw.slice(0, 3)
        : badgeRaw
      : fb.dayBadge

  const tr = raw.timeRange
  const timeRange =
    typeof tr === "string" && tr.trim().length > 0 && !ARABIC_SCRIPT.test(tr)
      ? tr.trim()
      : null

  return {
    id: raw.id ? String(raw.id) : `shift-row-${index}`,
    dayName,
    dayBadge,
    timeRange,
    status: raw.status,
    note:
      raw.note &&
      String(raw.note).trim().length > 0 &&
      !ARABIC_SCRIPT.test(String(raw.note))
        ? raw.note
        : undefined,
  }
}

function shiftDetailPrimary(shift: ShiftEntry): string {
  if (shift.timeRange && shift.timeRange.length > 0) return shift.timeRange
  if (shift.status === "holiday") return "Day off"
  return "Hours not set"
}

/* ────────────────────────────────────────────
   8. Shift Schedule
   ──────────────────────────────────────────── */

function shiftStatusIcon(status: ShiftEntry["status"]) {
  switch (status) {
    case "active":
      return CheckCircleIcon
    case "half-day":
      return SunIcon
    case "holiday":
      return MoonIcon
  }
}

function isShiftToday(dayName: string) {
  const todayName = SHIFT_FALLBACK_BY_INDEX[new Date().getDay()]?.dayName
  return Boolean(todayName && dayName === todayName)
}

const SHIFT_STATUS_ICON_COLOR: Record<ShiftEntry["status"], string> = {
  active: "text-[#1A5345]",
  "half-day": "text-amber-600",
  holiday: "text-muted-foreground",
}

function ShiftScheduleRow({ shift }: { shift: ShiftEntry }) {
  const style = accountShiftStatusStyles[shift.status]
  const StatusIcon = shiftStatusIcon(shift.status)
  const detailPrimary = shiftDetailPrimary(shift)
  const today = isShiftToday(shift.dayName)

  return (
    <div className={cn(accountStatCellClassName, "items-start")}>
      <StatusIcon className={cn("size-5 shrink-0", SHIFT_STATUS_ICON_COLOR[shift.status])} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">{shift.dayBadge}</span>
          <span className="text-[13px] font-semibold text-[#1A1F1E]">{shift.dayName}</span>
          {today && (
            <span className="rounded-md bg-[#1A5345] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Today
            </span>
          )}
          <Badge
            variant="default"
            className={cn("ml-auto shrink-0 gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold", style.badgeClass)}
          >
            {style.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-[#6B7870]">{detailPrimary}</p>
        {shift.note ? (
          <p className="mt-0.5 truncate text-[11px] font-medium text-[#6B7870]">{shift.note}</p>
        ) : null}
      </div>
    </div>
  )
}

function ShiftScheduleCard({ shifts }: { shifts: ShiftEntry[] }) {
  const rows = shifts.map(normalizeShiftEntry)
  const counts = {
    active: rows.filter((r) => r.status === "active").length,
    halfDay: rows.filter((r) => r.status === "half-day").length,
    off: rows.filter((r) => r.status === "holiday").length,
  }

  return (
    <Card className={accountPageCardClassName}>
      <CardHeader className="border-b border-[#E8E6E0]/40 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <AccountCardHeaderIcon icon={CalendarDaysIcon} />
          <div>
            <CardTitle className={accountSectionTitleClassName}>Work schedule</CardTitle>
            <CardDescription className={accountSectionDescClassName}>
              Your weekly shifts & availability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AccountStatCell
            icon={CheckCircleIcon}
            iconColor="text-[#1A5345]"
            value={counts.active}
            label="active days"
          />
          <AccountStatCell icon={SunIcon} iconColor="text-amber-600" value={counts.halfDay} label="half days" />
          <AccountStatCell icon={MoonIcon} iconColor="text-muted-foreground" value={counts.off} label="days off" />
        </div>

        <div className="space-y-2">
          {rows.map((shift) => (
            <ShiftScheduleRow key={shift.id} shift={shift} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────
   Shared helpers
   ──────────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
        <Icon className="size-4 text-[#1A5345]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{label}</p>
        <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────── */

export function AssistantAccount({
  initialProfile,
  workStats,
  activities,
  weeklyStats,
  shifts,
}: {
  initialProfile: AssistantProfile
  workStats: AssistantWorkStats
  activities: ActivityEntry[]
  weeklyStats: WeeklyStat[]
  shifts: ShiftEntry[]
}) {
  const { profile, editOpen, setEditOpen, saveProfile, isSaving, editDefaults } =
    useAssistantAccountProfile(initialProfile)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <EditAssistantProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editDefaults}
        onSubmit={saveProfile}
        isPending={isSaving}
      />
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Account</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="min-w-0 space-y-0.5">
            <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
              My account
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
              Profile, weekly schedule, performance, and recent activity.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 account-custom-scrollbar">
        <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <ProfileHeaderCard profile={profile} workStats={workStats} onEdit={() => setEditOpen(true)} />
            <ProfessionalInfoCard profile={profile} />
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <ShiftScheduleCard shifts={shifts} />
            <WeeklyStatsCard stats={weeklyStats} />
          </div>

          <ActivityLogCard activities={activities} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
