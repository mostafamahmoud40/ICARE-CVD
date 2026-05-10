"use client"

import { useState } from "react"
import type {
  AssistantProfile,
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
  AlertTriangleIcon,
  CalendarDaysIcon,
  Building2Icon,
  BriefcaseIcon,
  User2Icon,
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
  ChevronRightIcon,
  TrendingUpIcon,
} from "lucide-react"

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

/* ────────────────────────────────────────────
   Existing cards (Profile, Professional, Stats, Actions)
   ──────────────────────────────────────────── */

function ProfileHeaderCard({ profile }: { profile: AssistantProfile }) {
  return (
    <Card className="border-[#E5EEEA] bg-white">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#0A3D2E] shadow-lg sm:size-16">
              <User2Icon className="size-7 text-white sm:size-8" />
            </div>
            <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#F59E0B] shadow-md">
              <span className="text-[9px] font-bold text-white">✓</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[17px] font-bold text-[#0A3D2E] sm:text-[19px]">{profile.fullName}</h2>
                <p className="text-[11px] text-[#6B7870] sm:text-[12px]">Care Assistant</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium text-[#0A3D2E] sm:text-[11px]">ID: CVD-{Math.floor(Math.random() * 9000) + 1000}</span>
                <span className="flex items-center gap-1 text-[10px] text-[#10B981] sm:text-[11px]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  Online
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7870] sm:text-[12px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F5F4] px-2 py-1">
                <MailIcon className="size-3.5 text-[#0A3D2E]" />
                <span className="text-[#0A3D2E]">{profile.email}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F5F4] px-2 py-1">
                <PhoneIcon className="size-3.5 text-[#0A3D2E]" />
                <span className="text-[#0A3D2E]">{profile.phone}</span>
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
    <Card className="border-[#E5EEEA] bg-[#FAFAF8]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0A3D2E] sm:size-9">
            <BriefcaseIcon className="size-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-[13px] font-semibold text-[#0A3D2E] sm:text-[15px]">Professional Information</CardTitle>
            <CardDescription className="text-[10px] text-[#6B7870] sm:text-[11px]">Your work details and department info</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
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
      return {
        icon: UsersIcon,
        bg: "bg-[#0A3D2E]",
        iconText: "text-white",
        text: "text-[#0A3D2E]",
      }
    case "appointment":
      return {
        icon: CalendarClockIcon,
        bg: "bg-[#1A5345]",
        iconText: "text-white",
        text: "text-[#1A5345]",
      }
    case "queue":
      return {
        icon: ClipboardListIcon,
        bg: "bg-[#F5DEB3]",
        iconText: "text-[#8B6914]",
        text: "text-[#8B6914]",
      }
    case "document":
      return {
        icon: FileTextIcon,
        bg: "bg-[#2D7A66]",
        iconText: "text-white",
        text: "text-[#2D7A66]",
      }
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
    <Card className="border-[#E5EEEA] bg-[#FAFAF8] overflow-hidden">
      <CardHeader className="border-b border-[#E5EEEA] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#0A3D2E] sm:size-9">
              <HistoryIcon className="size-4 text-white sm:size-[18px]" />
            </div>
            <div>
              <CardTitle className="text-[13px] font-semibold text-[#0A3D2E] sm:text-[15px]">
                Activity History
              </CardTitle>
              <CardDescription className="text-[10px] text-[#6B7870] sm:text-[11px]">
                {activities.length} records
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-4 sm:p-6">
        {/* Central tree trunk line */}
        <div className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#0A3D2E] via-[#1A5345] to-[#0A3D2E] sm:top-6 sm:bottom-6" />

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
                      "inline-flex max-w-full flex-col gap-1 rounded-xl border p-3 text-left",
                      "bg-white shadow-sm transition-all hover:shadow-md",
                      "border-[#E5EEEA] hover:border-[#1A5345]/30",
                      isLeft ? "rounded-tr-none" : "rounded-tl-none",
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <div className={cn("flex size-7 items-center justify-center rounded-lg", cfg.bg)}>
                        <Icon className={cn("size-3.5", cfg.iconText)} />
                      </div>
                      <span className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">
                        {entry.action}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] leading-relaxed text-[#6B7870] sm:text-[12px]">
                      {entry.description}
                    </p>

                    {/* Date/Time */}
                    <div className="flex items-center gap-2 pt-1">
                      <Badge
                        variant="secondary"
                        className="border border-[#E5EEEA] bg-[#F9FBFA] px-2 py-0 text-[9px] text-[#1A5345]"
                      >
                        <CalendarDaysIcon className="mr-1 size-3" />
                        {date}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="border border-[#E5EEEA] bg-[#F9FBFA] px-2 py-0 text-[9px] text-[#6B7870]"
                      >
                        <ClockIcon className="mr-1 size-3" />
                        {time}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Center node */}
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-4 shadow-lg sm:size-12",
                      "border-white bg-[#0A3D2E]",
                    )}
                  >
                    <span className="text-[10px] font-bold text-white sm:text-[11px]">
                      {i + 1}
                    </span>
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
  return (
    <Card className="border-[#E5EEEA]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-semibold text-[#102F27] sm:text-[14px]">Security</CardTitle>
        <CardDescription className="text-[10px] text-[#6B7870] sm:text-[11px]">Account protection and login info</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between rounded-lg border border-[#E5EEEA] p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F0EE]">
              <ShieldCheckIcon className="size-4 text-[#1A5345]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#102F27] sm:text-[12px]">Two-Factor Authentication</p>
              <p className="text-[10px] text-[#6B7870] sm:text-[11px]">{security.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 border-[#E5EEEA] text-[10px] text-[#1A5345] hover:bg-[#E8F0EE] sm:text-[11px]">
            {security.twoFactorEnabled ? "Disable" : "Enable"}
          </Button>
        </div>

        <InfoRow icon={LockIcon} label="Last Password Change" value={formatDate(security.lastPasswordChange)} />
        <InfoRow icon={LogInIcon} label="Last Login" value={formatDateTimeShort(security.lastLogin)} />
        <InfoRow icon={MonitorSmartphoneIcon} label="Active Sessions" value={`${security.activeSessions} devices`} />

        <Button variant="outline" className="w-full gap-2 border-[#E5EEEA] text-[11px] text-[#102F27] hover:bg-[#E8F0EE] sm:text-[12px]">
          <LockIcon className="size-3.5" /> Change Password
        </Button>

        <Button variant="outline" className="w-full gap-2 border-red-200 text-[11px] text-red-600 hover:bg-red-50 sm:text-[12px]">
          <EyeIcon className="size-3.5" /> Sign Out All Other Devices
        </Button>
      </CardContent>
    </Card>
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
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/30",
        checked ? "bg-[#1A5345]" : "bg-[#D1D5DB]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform left-0.5",
          checked ? "translate-x-5" : "translate-x-0",
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
      title: "Emergency alerts",
      description: "Immediate alert when an emergency case is flagged.",
      iconWrap: "bg-red-50",
      Icon: AlertTriangleIcon,
      iconClass: "text-red-500",
      checked: emergencyAlerts,
      setChecked: setEmergencyAlerts,
    },
    {
      id: "assistant-notif-appointment",
      title: "Appointment reminders",
      description: "30 minutes before the appointment.",
      iconWrap: "bg-blue-50",
      Icon: CalendarDaysIcon,
      iconClass: "text-blue-600",
      checked: appointmentReminders,
      setChecked: setAppointmentReminders,
    },
    {
      id: "assistant-notif-checklist",
      title: "Checklist updates",
      description: "When a task is completed or delayed.",
      iconWrap: "bg-emerald-50",
      Icon: ClipboardListIcon,
      iconClass: "text-emerald-600",
      checked: checklistUpdates,
      setChecked: setChecklistUpdates,
    },
    {
      id: "assistant-notif-doctor",
      title: "Doctor messages",
      description: "Direct requests and instructions.",
      iconWrap: "bg-orange-50",
      Icon: MessageCircleIcon,
      iconClass: "text-orange-600",
      checked: doctorMessages,
      setChecked: setDoctorMessages,
    },
  ] as const

  return (
    <Card className="border-[#E5EEEA]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F0EE] sm:size-9">
            <BellIcon className="size-4 text-[#1A5345] sm:size-[18px]" />
          </div>
          <CardTitle className="text-[13px] font-semibold text-[#102F27] sm:text-[15px]">
            Notification settings
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-4 pt-0 sm:p-6 sm:pt-0">
        {rows.map((row, i) => {
          const Icon = row.Icon
          return (
            <div key={row.id}>
              <div className="flex items-center gap-3 py-3 sm:gap-4">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10",
                    row.iconWrap,
                  )}
                >
                  <Icon className={cn("size-4 sm:size-[18px]", row.iconClass)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#102F27] sm:text-[12px]">{row.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[#6B7870] sm:text-[11px]">
                    {row.description}
                  </p>
                </div>
                <PreferenceSwitch
                  id={row.id}
                  checked={row.checked}
                  onCheckedChange={row.setChecked}
                />
              </div>
              {i < rows.length - 1 ? <Separator className="bg-[#E5EEEA]" /> : null}
            </div>
          )
        })}
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
    <Card className="border-[#E5EEEA]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] font-semibold text-[#102F27] sm:text-[14px]">Preferences</CardTitle>
        <CardDescription className="text-[10px] text-[#6B7870] sm:text-[11px]">
          Display theme and language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between rounded-lg border border-[#E5EEEA] p-2.5">
          <div className="flex items-center gap-2">
            <ThemeIcon className="size-3.5 text-[#1A5345]" />
            <span className="text-[11px] text-[#102F27] sm:text-[12px]">Display theme</span>
          </div>
          <Badge variant="secondary" className="bg-[#E8F0EE] text-[10px] capitalize text-[#1A5345]">
            {preferences.theme}
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#E5EEEA] p-2.5">
          <div className="flex items-center gap-2">
            <GlobeIcon className="size-3.5 text-[#1A5345]" />
            <span className="text-[11px] text-[#102F27] sm:text-[12px]">Language</span>
          </div>
          <Badge variant="secondary" className="bg-[#E8F0EE] text-[10px] text-[#1A5345]">
            English
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
  const maxPatients = Math.max(...stats.map((s) => s.patients))
  const maxAppointments = Math.max(...stats.map((s) => s.appointments))
  const maxTasks = Math.max(...stats.map((s) => s.tasks))
  const totals = {
    patients: stats.reduce((a, s) => a + s.patients, 0),
    appointments: stats.reduce((a, s) => a + s.appointments, 0),
    tasks: stats.reduce((a, s) => a + s.tasks, 0),
  }

  return (
    <Card className="border-[#E5EEEA] bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0A3D2E] shadow-md sm:size-10">
              <BarChart3Icon className="size-4 text-white sm:size-5" />
            </div>
            <div>
              <CardTitle className="text-[14px] font-bold text-[#0A3D2E] sm:text-[16px]">Weekly Performance</CardTitle>
              <CardDescription className="text-[11px] text-[#6B7870] sm:text-[12px]">Last 6 working days overview</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Patients Stat */}
          <div className="group flex flex-col items-center rounded-xl border border-[#E5EEEA] bg-white p-4 text-center shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8F0EE] shadow-lg sm:size-11">
              <UsersIcon className="size-5 text-[#1A5345] sm:size-6" />
            </div>
            <p className="mt-2 text-[22px] font-bold leading-none text-[#1A5345] sm:text-[26px]">{totals.patients}</p>
            <p className="mt-1 text-[11px] font-medium text-[#6B7870] sm:text-[12px]">Patients</p>
          </div>

          {/* Appointments Stat */}
          <div className="group flex flex-col items-center rounded-xl border border-[#E5EEEA] bg-white p-4 text-center shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF5F3] shadow-lg sm:size-11">
              <CalendarClockIcon className="size-5 text-[#2D7A66] sm:size-6" />
            </div>
            <p className="mt-2 text-[22px] font-bold leading-none text-[#2D7A66] sm:text-[26px]">{totals.appointments}</p>
            <p className="mt-1 text-[11px] font-medium text-[#6B7870] sm:text-[12px]">Appointments</p>
          </div>

          {/* Tasks Stat */}
          <div className="group flex flex-col items-center rounded-xl border border-[#E5EEEA] bg-white p-4 text-center shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#F5DEB3] shadow-lg sm:size-11">
              <CheckCircleIcon className="size-5 text-[#8B6914] sm:size-6" />
            </div>
            <p className="mt-2 text-[22px] font-bold leading-none text-[#8B6914] sm:text-[26px]">{totals.tasks}</p>
            <p className="mt-1 text-[11px] font-medium text-[#6B7870] sm:text-[12px]">Tasks</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {stats.map((day) => {
            const total = day.patients + day.appointments + day.tasks
            const pWidth = total ? (day.patients / total) * 100 : 0
            const aWidth = total ? (day.appointments / total) * 100 : 0
            const tWidth = total ? (day.tasks / total) * 100 : 0

            return (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-[11px] font-semibold text-[#0A3D2E] sm:w-10 sm:text-[12px]">
                  {day.day}
                </span>
                <div className="flex-1">
                  <div className="flex h-6 overflow-hidden rounded-lg bg-[#F3F5F4] sm:h-7">
                    {day.patients > 0 && (
                      <div
                        className="flex items-center justify-center bg-[#1A5345] text-[9px] font-medium text-white sm:text-[10px]"
                        style={{ width: `${pWidth}%` }}
                      >
                        {pWidth > 15 && day.patients}
                      </div>
                    )}
                    {day.appointments > 0 && (
                      <div
                        className="flex items-center justify-center bg-[#2D7A66] text-[9px] font-medium text-white sm:text-[10px]"
                        style={{ width: `${aWidth}%` }}
                      >
                        {aWidth > 15 && day.appointments}
                      </div>
                    )}
                    {day.tasks > 0 && (
                      <div
                        className="flex items-center justify-center bg-[#F5DEB3] text-[9px] font-medium text-[#8B6914] sm:text-[10px]"
                        style={{ width: `${tWidth}%` }}
                      >
                        {tWidth > 15 && day.tasks}
                      </div>
                    )}
                  </div>
                </div>
                <span className="w-6 text-right text-[11px] font-bold text-[#0A3D2E] sm:w-8 sm:text-[12px]">
                  {total}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 rounded-lg bg-[#F9FAF8] py-2">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-[#1A5345]" />
            <span className="text-[10px] font-medium text-[#6B7870] sm:text-[11px]">Patients</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-[#2D7A66]" />
            <span className="text-[10px] font-medium text-[#6B7870] sm:text-[11px]">Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-[#8B6914]" />
            <span className="text-[10px] font-medium text-[#6B7870] sm:text-[11px]">Tasks</span>
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

function shiftStatusMeta(status: ShiftEntry["status"]) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        badgeClass: "bg-[#E8F0EE] text-[#1A5345] border-[#D1E0DA]",
        dotClass: "bg-[#1A5345]",
        icon: CheckCircleIcon,
      }
    case "half-day":
      return {
        label: "Half day",
        badgeClass: "bg-[#EEF5F3] text-[#2D7A66] border-[#C8DDD5]",
        dotClass: "bg-[#4A9B85]",
        icon: SunIcon,
      }
    case "holiday":
      return {
        label: "Day off",
        badgeClass: "bg-[#F3F5F4] text-[#6B7870] border-[#E5EEEA]",
        dotClass: "bg-[#9CA3AF]",
        icon: MoonIcon,
      }
  }
}

function ShiftScheduleCard({ shifts }: { shifts: ShiftEntry[] }) {
  const rows = shifts.map(normalizeShiftEntry)

  return (
    <Card className="border-[#E5EEEA] bg-[#FAFAF8]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#0A3D2E] shadow-sm sm:size-10">
            <CalendarDaysIcon className="size-4 text-white sm:size-5" />
          </div>
          <div>
            <CardTitle className="text-[13px] font-semibold text-[#0A3D2E] sm:text-[15px]">
              Work schedule
            </CardTitle>
            <CardDescription className="text-[10px] text-[#6B7870] sm:text-[11px]">
              Your weekly shifts & availability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="relative">
          {/* Timeline connector line */}
          <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#E5EEEA] via-[#D1E0DA] to-[#E5EEEA] sm:left-[20px]" />

          {rows.map((shift, i) => {
            const meta = shiftStatusMeta(shift.status)
            const detailPrimary = shiftDetailPrimary(shift)
            const StatusIcon = meta.icon
            const isToday = i === new Date().getDay()

            return (
              <div key={shift.id} className={cn("relative flex gap-3 sm:gap-4", i > 0 && "mt-1")}>
                {/* Timeline node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 text-[10px] font-bold uppercase leading-none tracking-tight sm:size-10 sm:text-[11px]",
                      isToday
                        ? "border-[#1A5345] bg-[#1A5345] text-white shadow-md"
                        : "border-[#E5EEEA] bg-white text-[#102F27]",
                      shift.status === "holiday" && !isToday && "border-[#E5EEEA] bg-[#F9FAFB] text-[#9CA3AF]",
                    )}
                  >
                    {shift.dayBadge}
                  </div>
                  {/* Status dot */}
                  <div
                    className={cn(
                      "mt-1.5 size-2 rounded-full",
                      meta.dotClass,
                      shift.status === "holiday" && "opacity-50",
                    )}
                  />
                </div>

                {/* Content card */}
                <div
                  className={cn(
                    "flex-1 rounded-xl border p-3 transition-all sm:p-3.5",
                    isToday
                      ? "border-[#1A5345]/20 bg-gradient-to-r from-[#F6FBF9] to-white shadow-sm"
                      : "border-[#E5EEEA] bg-white hover:border-[#D1E0DA]",
                    shift.status === "holiday" && "bg-[#FAFAFA]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-[12px] font-semibold sm:text-[13px]",
                            isToday ? "text-[#1A5345]" : "text-[#102F27]",
                            shift.status === "holiday" && "text-[#6B7870]",
                          )}
                        >
                          {shift.dayName}
                        </p>
                        {isToday && (
                          <span className="rounded-full bg-[#1A5345] px-2 py-0.5 text-[9px] font-medium text-white">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <ClockIcon
                          className={cn(
                            "size-3.5",
                            shift.status === "holiday" ? "text-[#9CA3AF]" : "text-[#1A5345]",
                          )}
                        />
                        <p
                          className={cn(
                            "text-[11px] font-medium sm:text-[12px]",
                            shift.status === "holiday" ? "text-[#9CA3AF]" : "text-[#102F27]",
                          )}
                        >
                          {detailPrimary}
                        </p>
                      </div>

                      {shift.note && (
                        <p className="mt-1.5 text-[10px] italic leading-snug text-[#6B7870] sm:text-[11px]">
                          {shift.note}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 gap-1 border px-2 py-1 text-[9px] font-medium sm:text-[10px]",
                        meta.badgeClass,
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {meta.label}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
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
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[#0A3D2E]/10"><Icon className="size-4 text-[#0A3D2E]" /></div>
      <div>
        <p className="text-[10px] text-[#6B7870] sm:text-[11px]">{label}</p>
        <p className="text-[12px] font-medium text-[#0A3D2E] sm:text-[13px]">{value}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────── */

export function AssistantAccount({
  profile,
  activities,
  weeklyStats,
  shifts,
}: {
  profile: AssistantProfile
  activities: ActivityEntry[]
  weeklyStats: WeeklyStat[]
  shifts: ShiftEntry[]
}) {
  return (
    <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
      {/* Row 1 */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ProfileHeaderCard profile={profile} />
        <ProfessionalInfoCard profile={profile} />
      </div>

      {/* Row 2 */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ShiftScheduleCard shifts={shifts} />
        <WeeklyStatsCard stats={weeklyStats} />
      </div>

      {/* Row 3 - Full Width Activity History */}
      <ActivityLogCard activities={activities} />
    </div>
  )
}
