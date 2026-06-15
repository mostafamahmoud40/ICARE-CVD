"use client"

import Image from "next/image"
import { useMemo, useState, type ComponentType } from "react"
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
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  accountStatCellClassName,
  AccountSectionHeading,
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
  ArrowRightIcon,
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
  BarChart3Icon,
  FileTextIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
  GlobeIcon,
  LogInIcon,
  MonitorSmartphoneIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PencilLineIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { EditAssistantProfileDialog } from "./EditAssistantProfileDialog"
import { ShiftDayDetailDialog } from "./ShiftDayDetailDialog"
import type { AssistantProfileEditValues } from "./assistantAccount.schema"
import { profileToEditValues } from "./assistantAccount.schema"
import { AssistantProfileAvatar } from "../AssistantProfileAvatar"
import { ActivityTimeline } from "./ActivityTimeline"
import { ActivityDetailDialog } from "./ActivityDetailDialog"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
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

function formatStatCount(value: number) {
  return value > 0 ? String(value) : "—"
}

function WorkStatsBanner({ workStats }: { workStats: AssistantWorkStats }) {
  const tiles = [
    {
      label: "Patients today",
      value: workStats.patientsHandledToday,
      icon: UsersIcon,
      iconColor: "text-[#1A5345]",
    },
    {
      label: "Appointments",
      value: workStats.appointmentsScheduled,
      icon: CalendarClockIcon,
      iconColor: "text-[#2D6B5C]",
    },
    {
      label: "Tasks done",
      value: workStats.tasksCompleted,
      icon: CheckCircleIcon,
      iconColor: "text-[#5A7A70]",
    },
    {
      label: "Queue managed",
      value: workStats.queueManaged,
      icon: ClipboardListIcon,
      iconColor: "text-[#C26D2A]",
    },
  ] as const

  return (
    <div className="mt-4 grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, iconColor }) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E6E0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#6B7870] sm:text-[12px]">
              {label}
            </span>
            <p
              className={cn(
                "mt-0.5 text-[20px] font-bold leading-none tabular-nums",
                value > 0 ? "text-[#1A1F1E]" : "text-muted-foreground",
              )}
            >
              {formatStatCount(value)}
            </p>
          </div>
          <Icon className={cn("size-5 shrink-0", iconColor)} strokeWidth={2} aria-hidden />
        </div>
      ))}
    </div>
  )
}

function ProfileHeaderCard({
  profile,
  onEdit,
}: {
  profile: AssistantProfile
  onEdit: () => void
}) {
  const avatarSrc = profile.avatarUrl

  return (
    <Card className={accountPageCardClassName}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <AssistantProfileAvatar
                name={profile.fullName}
                avatarUrl={avatarSrc}
                className="size-16 rounded-xl border border-[#E8E6E0]/60 shadow-sm sm:size-[4.5rem]"
                initialsClassName="text-[18px] sm:text-[20px]"
                sizes="72px"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500"
                aria-hidden
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-[18px] font-bold leading-tight text-[#1A1F1E] sm:text-[20px]">
                  {profile.fullName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <span className="size-1.5 rounded-full bg-white/90" aria-hidden />
                  Online
                </span>
              </div>
              <p className="text-[12px] font-medium text-muted-foreground">Care Assistant · {profile.department}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#6B7870]">
                <span>{profile.experienceYears} yrs experience</span>
                <span aria-hidden>·</span>
                <span>Since {formatDate(profile.joinedAt)}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">ID CVD-{profile.id.split("-").pop() ?? profile.id}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 shrink-0 gap-2 self-start rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345] sm:self-center"
          >
            <PencilLineIcon className="size-3.5" aria-hidden />
            Edit profile
          </Button>
        </div>

        <Separator className="my-4 bg-[#E8E6E0]/60" />

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={MailIcon} label="Email" value={profile.email} />
          <InfoRow icon={PhoneIcon} label="Phone" value={profile.phone} />
          <InfoRow icon={Building2Icon} label="Department" value={profile.department} />
          <InfoRow icon={BriefcaseIcon} label="Experience" value={`${profile.experienceYears} years`} />
        </div>
      </CardContent>
    </Card>
  )
}


/* ────────────────────────────────────────────
   1. Activity Log
   ──────────────────────────────────────────── */

function ActivityLogCard({ activities }: { activities: ActivityEntry[] }) {
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(null)
  const items = activities.slice(0, 4)

  return (
    <section className="flex h-full flex-col space-y-4">
      <ActivityDetailDialog
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
      />
      <AccountSectionHeading icon={MessageSquareTextIcon} title="Recent activity" />
      <Card className={cn(accountPageCardClassName, "flex min-h-0 flex-1 flex-col")}>
        <CardContent className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
          <div className="min-h-0 flex-1">
            <ActivityTimeline
              entries={items}
              emptyMessage="No recent activity."
              onSelect={setSelectedEntry}
            />
          </div>

          {activities.length > 0 ? (
            <div className="mt-4 border-t border-[#E8E6E0]/60 pt-4">
              <Link
                href="/assistant-account/activity"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-bold text-[#1A5345] transition-colors hover:text-[#133F34]"
              >
                View all activity
                <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

/* ────────────────────────────────────────────
   4. Security Settings
   ──────────────────────────────────────────── */

export function AssistantSecuritySettingsCard({ security }: { security: SecurityInfo }) {
  const twoFactorOn = security.twoFactorEnabled

  return (
    <Card className={accountPageCardClassName}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-bold text-[#1A1F1E] sm:text-[14px]">
                  Two-factor authentication
                </p>
                <span
                  className={cn(
                    "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold text-white",
                    twoFactorOn ? "bg-emerald-600" : "bg-amber-500",
                  )}
                >
                  {twoFactorOn ? "Active" : "Highly recommended"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
                {twoFactorOn
                  ? "Your account is protected by an additional verification layer."
                  : "Add an extra layer of security to prevent unauthorized access to clinical data."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F6FBF9]"
          >
            {twoFactorOn ? "Modify settings" : "Secure account"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SecurityStatRow
            icon={LockIcon}
            label="Last password change"
            value={formatDate(security.lastPasswordChange)}
          />
          <SecurityStatRow
            icon={LogInIcon}
            label="Last sign-in"
            value={formatDateTimeShort(security.lastLogin)}
          />
          <SecurityStatRow
            icon={MonitorSmartphoneIcon}
            label="Active sessions"
            value={`${security.activeSessions} ${security.activeSessions === 1 ? "device" : "devices"}`}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-2 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#102F27] shadow-sm hover:bg-[#F9F8F5]"
          >
            <LockIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
            Change password
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-2 rounded-lg border-red-200/80 bg-white text-[12px] font-bold text-red-600 shadow-sm hover:bg-red-50"
          >
            <EyeIcon className="size-3.5 shrink-0" aria-hidden />
            Sign out all devices
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
    <div className={accountStatCellClassName}>
      <Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-[#6B7870] sm:text-[11px]">{label}</p>
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
      title: "Emergency alerts",
      description: "Critical alerts for immediate medical interventions.",
      Icon: AlertTriangleIcon,
      iconClass: "text-red-600",
      checked: emergencyAlerts,
      setChecked: setEmergencyAlerts,
    },
    {
      id: "assistant-notif-appointment",
      title: "Appointment reminders",
      description: "Schedule updates and patient arrivals.",
      Icon: CalendarDaysIcon,
      iconClass: "text-[#1A5345]",
      checked: appointmentReminders,
      setChecked: setAppointmentReminders,
    },
    {
      id: "assistant-notif-checklist",
      title: "Checklist updates",
      description: "Task completion and workflow alerts.",
      Icon: ClipboardListIcon,
      iconClass: "text-emerald-600",
      checked: checklistUpdates,
      setChecked: setChecklistUpdates,
    },
    {
      id: "assistant-notif-doctor",
      title: "Physician messages",
      description: "Direct communications from attending doctors.",
      Icon: MessageCircleIcon,
      iconClass: "text-amber-600",
      checked: doctorMessages,
      setChecked: setDoctorMessages,
    },
  ] as const

  return (
    <Card className={accountPageCardClassName}>
      <CardContent className="divide-y divide-[#E8E6E0]/50 p-0">
        {rows.map((row) => {
          const Icon = row.Icon
          return (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            >
              <Icon className={cn("size-4 shrink-0", row.iconClass)} aria-hidden />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[13px] font-bold text-[#1A1F1E]">{row.title}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
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
      <CardContent className="divide-y divide-[#E8E6E0]/50 p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <ThemeIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-bold text-[#1A1F1E]">Interface theme</p>
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">Light, dark, or system default</p>
            </div>
          </div>
          <span className="inline-flex rounded-lg bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold capitalize text-white">
            {preferences.theme}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <GlobeIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-bold text-[#1A1F1E]">Language</p>
              <p className="text-[11px] text-muted-foreground sm:text-[12px]">Clinical terminology locale</p>
            </div>
          </div>
          <span className="inline-flex rounded-lg bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white">
            English (US)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────────────────────────────────────
   6. Weekly / Monthly Stats
   ──────────────────────────────────────────── */

const weeklyMetricKeys = Object.keys(accountWeeklyMetrics) as Array<
  keyof typeof accountWeeklyMetrics
>

function WeeklyDayStatCard({ day, patients, appointments, tasks }: WeeklyStat) {
  const total = patients + appointments + tasks
  const segments = [
    { key: "patients" as const, count: patients },
    { key: "appointments" as const, count: appointments },
    { key: "tasks" as const, count: tasks },
  ]
  const activeSegments = segments.filter((segment) => segment.count > 0)

  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-[#1A1F1E]">{day}</span>
        <div className="text-right">
          <p
            className={cn(
              "font-serif text-[18px] font-bold leading-none tabular-nums",
              total > 0 ? "text-[#1A1F1E]" : "text-muted-foreground",
            )}
          >
            {formatStatCount(total)}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">total</p>
        </div>
      </div>

      <div
        className="flex h-2 overflow-hidden rounded-full bg-[#E8E6E0]/80"
        role="img"
        aria-label={`${day}: ${patients} patients, ${appointments} appointments, ${tasks} tasks`}
      >
        {activeSegments.map((segment) => {
          const metric = accountWeeklyMetrics[segment.key]
          const width = total ? (segment.count / total) * 100 : 0
          return (
            <div
              key={segment.key}
              className={cn("h-full transition-all", metric.barClass)}
              style={{ width: `${width}%` }}
            />
          )
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {segments.map((segment) => {
          const metric = accountWeeklyMetrics[segment.key]
          const hasValue = segment.count > 0
          return (
            <span
              key={segment.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                hasValue ? metric.pillClass : "bg-[#F4F3EF] text-muted-foreground",
              )}
            >
              {hasValue ? (
                <span className={cn("size-1.5 shrink-0 rounded-full", metric.dotClass)} aria-hidden />
              ) : null}
              {formatStatCount(segment.count)} {metric.shortLabel}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyStatsCard({ stats }: { stats: WeeklyStat[] }) {
  return (
    <section className="space-y-4">
      <AccountSectionHeading icon={BarChart3Icon} title="Weekly performance" />
      <Card className={accountPageCardClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6E0]/50 bg-[#FBFDFC]/60 px-5 py-3.5 sm:px-6">
          <p className="text-[11px] font-bold text-[#6B7870]">Daily breakdown</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {weeklyMetricKeys.map((key) => {
              const metric = accountWeeklyMetrics[key]
              return (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-2 shrink-0 rounded-full", metric.dotClass)} aria-hidden />
                  <span className="text-[10px] font-bold text-[#6B7870] sm:text-[11px]">{metric.label}</span>
                </span>
              )
            })}
          </div>
        </div>

        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((dayStat) => (
              <WeeklyDayStatCard key={dayStat.day} {...dayStat} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
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

function ShiftScheduleRow({
  shift,
  onSelect,
}: {
  shift: ShiftEntry
  onSelect: (shift: ShiftEntry) => void
}) {
  const style = accountShiftStatusStyles[shift.status]
  const StatusIcon = shiftStatusIcon(shift.status)
  const detailPrimary = shiftDetailPrimary(shift)
  const today = isShiftToday(shift.dayName)

  return (
    <button
      type="button"
      onClick={() => onSelect(shift)}
      className={cn(
        accountStatCellClassName,
        style.rowClass,
        "items-start w-full text-left transition-all hover:border-[#1A5345]/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/25",
      )}
    >
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
    </button>
  )
}

function ShiftScheduleCard({ shifts }: { shifts: ShiftEntry[] }) {
  const [selectedShift, setSelectedShift] = useState<ShiftEntry | null>(null)
  const rows = shifts.map(normalizeShiftEntry)

  return (
    <section className="flex h-full flex-col space-y-4">
      <ShiftDayDetailDialog
        shift={selectedShift}
        open={selectedShift !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedShift(null)
        }}
      />
      <AccountSectionHeading icon={CalendarDaysIcon} title="Work schedule" />
      <Card className={cn(accountPageCardClassName, "flex min-h-0 flex-1 flex-col")}>
        <CardContent className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
          <div className="min-h-0 flex-1 space-y-2">
            {rows.map((shift) => (
              <ShiftScheduleRow key={shift.id} shift={shift} onSelect={setSelectedShift} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

/* ────────────────────────────────────────────
   Shared helpers
   ──────────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className={accountStatCellClassName}>
      <Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-[#6B7870] sm:text-[11px]">{label}</p>
        <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────── */

export function AssistantAccount({
  profile,
  workStats,
  activities,
  weeklyStats,
  shifts,
  onSaveProfile,
  isSaving,
}: {
  profile: AssistantProfile
  workStats: AssistantWorkStats
  activities: ActivityEntry[]
  weeklyStats: WeeklyStat[]
  shifts: ShiftEntry[]
  onSaveProfile: (values: AssistantProfileEditValues) => Promise<void>
  isSaving: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const editDefaults = useMemo(() => profileToEditValues(profile), [profile])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <EditAssistantProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editDefaults}
        onSubmit={async (values) => {
          await onSaveProfile(values)
          setEditOpen(false)
        }}
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

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                My account
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Profile, weekly schedule, performance, and recent activity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
              >
                <Link href="/assistant-account/settings">
                  <SlidersHorizontalIcon className="size-3.5" aria-hidden />
                  Settings
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
              >
                <PencilLineIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
                Edit profile
              </Button>
            </div>
          </div>

          <WorkStatsBanner workStats={workStats} />
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 account-custom-scrollbar">
        <div className="custom-scrollbar w-full space-y-4 pb-6 pt-4 sm:space-y-5">
          <ProfileHeaderCard profile={profile} onEdit={() => setEditOpen(true)} />

          <WeeklyStatsCard stats={weeklyStats} />

          <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-2">
            <ShiftScheduleCard shifts={shifts} />
            <ActivityLogCard activities={activities} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: assistantAccountScrollbarCss() }} />
    </div>
  )
}
