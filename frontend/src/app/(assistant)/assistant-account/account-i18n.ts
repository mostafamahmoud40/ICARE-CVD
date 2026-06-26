import { useMemo } from "react"

import { useAssistantPageTranslations } from "../use-assistant-i18n"
import {
  accountShiftStatusStyles,
  accountWeeklyMetrics,
} from "./assistantAccount.shared"
import type { ShiftEntry } from "./assistantAccount.types"
import type {
  ActivityPeriodFilter,
  ActivityTypeFilter,
} from "./assistantAccount.activity"

const DEPARTMENT_LABEL_KEYS: Record<string, string> = {
  Cardiology: "Cardiology",
  "Internal Medicine": "InternalMedicine",
  Endocrinology: "Endocrinology",
  Nephrology: "Nephrology",
  "General Practice": "GeneralPractice",
}

export function translateDepartmentName(name: string, t: (key: string) => string) {
  const key = DEPARTMENT_LABEL_KEYS[name]
  return key ? t(`editDialog.departments.${key}`) : name
}

export function useAssistantAccountTranslations() {
  return useAssistantPageTranslations("account")
}

const SHIFT_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
type ShiftDayKey = (typeof SHIFT_DAY_KEYS)[number]

const EN_DAY_NAME_TO_KEY: Record<string, ShiftDayKey> = {
  Sunday: "sun",
  Monday: "mon",
  Tuesday: "tue",
  Wednesday: "wed",
  Thursday: "thu",
  Friday: "fri",
  Saturday: "sat",
}

const EN_DAY_BADGE_TO_KEY: Record<string, ShiftDayKey> = {
  Su: "sun",
  Mo: "mon",
  Tu: "tue",
  We: "wed",
  Th: "thu",
  Fr: "fri",
  Sa: "sat",
}

const WEEK_STAT_DAY_TO_KEY: Record<string, ShiftDayKey> = {
  Sat: "sat",
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
}

export function useAccountWeeklyMetrics() {
  const { t } = useAssistantAccountTranslations()

  return useMemo(
    () => ({
      patients: {
        ...accountWeeklyMetrics.patients,
        label: t("weekly.patients"),
        shortLabel: t("weekly.patientsShort"),
      },
      appointments: {
        ...accountWeeklyMetrics.appointments,
        label: t("weekly.appointments"),
        shortLabel: t("weekly.appointmentsShort"),
      },
      tasks: {
        ...accountWeeklyMetrics.tasks,
        label: t("weekly.tasks"),
        shortLabel: t("weekly.tasksShort"),
      },
    }),
    [t],
  )
}

export function useAccountShiftStatusStyles() {
  const { t } = useAssistantAccountTranslations()

  return useMemo(
    () => ({
      active: {
        ...accountShiftStatusStyles.active,
        label: t("shift.active"),
      },
      "half-day": {
        ...accountShiftStatusStyles["half-day"],
        label: t("shift.halfDay"),
      },
      holiday: {
        ...accountShiftStatusStyles.holiday,
        label: t("shift.dayOff"),
      },
    }),
    [t],
  )
}

export function resolveShiftDayKey(raw: ShiftEntry, index: number): ShiftDayKey {
  const fromName = EN_DAY_NAME_TO_KEY[raw.dayName?.trim() ?? ""]
  if (fromName) return fromName

  const fromBadge = EN_DAY_BADGE_TO_KEY[raw.dayBadge?.trim() ?? ""]
  if (fromBadge) return fromBadge

  return SHIFT_DAY_KEYS[index % SHIFT_DAY_KEYS.length] ?? "sun"
}

export function localizeShiftEntry(
  raw: ShiftEntry,
  index: number,
  t: (key: string) => string,
): ShiftEntry {
  const dayKey = resolveShiftDayKey(raw, index)

  const tr = raw.timeRange
  const timeRange = typeof tr === "string" && tr.trim().length > 0 ? tr.trim() : null

  return {
    id: raw.id ? String(raw.id) : `shift-row-${index}`,
    dayName: t(`shift.days.${dayKey}`),
    dayBadge: t(`shift.badges.${dayKey}`),
    timeRange,
    status: raw.status,
    note: raw.note && String(raw.note).trim().length > 0 ? raw.note : undefined,
  }
}

export function translateWeekStatDay(dayAbbrev: string, t: (key: string) => string) {
  const key = WEEK_STAT_DAY_TO_KEY[dayAbbrev]
  return key ? t(`shift.badges.${key}`) : dayAbbrev
}

export function isShiftTodayAtIndex(raw: ShiftEntry, index: number) {
  const dayKey = resolveShiftDayKey(raw, index)
  const todayKey = SHIFT_DAY_KEYS[new Date().getDay()] ?? "sun"
  return dayKey === todayKey
}

export function shiftDetailPrimary(
  shift: ShiftEntry,
  t: (key: string) => string,
): string {
  if (shift.timeRange && shift.timeRange.length > 0) return shift.timeRange
  if (shift.status === "holiday") return t("shift.dayOff")
  return t("shift.hoursNotSet")
}

export function formatAccountTimeAgo(iso: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return t("timeAgo.minutes", { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("timeAgo.hours", { count: hours })
  const days = Math.floor(hours / 24)
  return t("timeAgo.days", { count: days })
}

export function formatAccountDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso))
}

export function formatAccountDateTimeShort(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function formatAccountDateTimeLong(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function formatActivityGroupLabel(
  iso: string,
  t: (key: string) => string,
  locale: string,
  now = new Date(),
) {
  const date = new Date(iso)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return t("groupToday")
  if (diffDays === 1) return t("groupYesterday")

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date)
}

export function useActivityPeriodOptions() {
  const { t } = useAssistantAccountTranslations()

  return useMemo(
    () =>
      [
        { key: "week" as const, label: t("activity.periodWeek"), shortLabel: t("activity.periodWeekShort") },
        { key: "month" as const, label: t("activity.periodMonth"), shortLabel: t("activity.periodMonthShort") },
        { key: "year" as const, label: t("activity.periodYear"), shortLabel: t("activity.periodYearShort") },
        { key: "all" as const, label: t("activity.periodAll"), shortLabel: t("activity.periodAllShort") },
      ] satisfies Array<{ key: ActivityPeriodFilter; label: string; shortLabel: string }>,
    [t],
  )
}

export function useActivityTypeOptions() {
  const { t } = useAssistantAccountTranslations()

  return useMemo(
    () =>
      [
        { key: "all" as const, label: t("activity.typeAll") },
        { key: "patient" as const, label: t("activity.typePatients") },
        { key: "appointment" as const, label: t("activity.typeAppointments") },
        { key: "queue" as const, label: t("activity.typeQueue") },
        { key: "document" as const, label: t("activity.typeDocuments") },
      ] satisfies Array<{ key: ActivityTypeFilter; label: string }>,
    [t],
  )
}

export function useActivityTypeMeta() {
  const { t } = useAssistantAccountTranslations()

  return useMemo(
    () => ({
      patient: {
        label: t("activityDetail.types.patient"),
        badgeClass: "border-0 bg-[#1A5345] text-white hover:bg-[#1A5345]",
        iconClass: "text-[#1A5345]",
      },
      appointment: {
        label: t("activityDetail.types.appointment"),
        badgeClass: "border-0 bg-[#2563EB] text-white hover:bg-[#2563EB]",
        iconClass: "text-[#2563EB]",
      },
      queue: {
        label: t("activityDetail.types.queue"),
        badgeClass: "border-0 bg-amber-500 text-white hover:bg-amber-500",
        iconClass: "text-amber-600",
      },
      document: {
        label: t("activityDetail.types.document"),
        badgeClass: "border-0 bg-violet-600 text-white hover:bg-violet-600",
        iconClass: "text-violet-700",
      },
    }),
    [t],
  )
}
