"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import { useLocale } from "next-intl"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  GlobeIcon,
  Loader2Icon,
  MapPinIcon,
  MessageCircleIcon,
  StethoscopeIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AssistantProfileAvatar } from "@/app/(assistant)/AssistantProfileAvatar"
import { assistantDoctorChatHref } from "@/components/shared/chat/use-chat-deep-link"
import { useAssistantPageTranslations } from "../../use-assistant-i18n"
import { useAssistantDoctorClinicProfile } from "../useAssistantDoctors"
import type { AssistantDoctorScheduleDay, DoctorStatus, LoadLevel } from "../assistantDoctors.types"

const LOAD_CONFIG: Record<LoadLevel, { labelKey: string; style: string }> = {
  optimal: { labelKey: "profile.loadOptimal", style: "text-emerald-600" },
  moderate: { labelKey: "profile.loadModerate", style: "text-amber-600" },
  high: { labelKey: "profile.loadHigh", style: "text-red-600" },
  inactive: { labelKey: "profile.loadInactive", style: "text-[#6B7870]" },
}

function resolveLoadLevel(
  patientsWaiting: number,
  status: DoctorStatus,
  hasShiftToday: boolean,
): LoadLevel {
  if (status === "away" || !hasShiftToday) return "inactive"
  if (patientsWaiting >= 5) return "high"
  if (patientsWaiting >= 3) return "moderate"
  return "optimal"
}

function computeScheduleOverview(
  days: AssistantDoctorScheduleDay[],
  locale: string,
) {
  const enabledDays = days.filter((day) => day.enabled)
  const totalSlots = enabledDays.reduce(
    (sum, day) => sum + (day.availableSlotCount ?? day.availableSlotTimes?.length ?? 0),
    0,
  )

  const nextDay = enabledDays.find((day) => (day.availableSlotTimes?.length ?? 0) > 0)
  const nextSlotTime = nextDay?.availableSlotTimes?.[0] ?? null

  return {
    workingDaysCount: enabledDays.length,
    totalSlots,
    nextDay,
    nextSlotTime,
    nextDate: nextDay?.nextOccurrenceDate ?? null,
    nextDayLabel: nextDay
      ? localizedWeekdayLabel(nextDay.weekday, locale, nextDay.label)
      : null,
  }
}

const STATUS_CONFIG: Record<DoctorStatus, { dot: string; text: string }> = {
  available: { dot: "bg-emerald-500", text: "text-emerald-700" },
  "in-consultation": { dot: "bg-amber-500", text: "text-amber-700" },
  away: { dot: "bg-gray-400", text: "text-gray-600" },
}

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function localizedWeekdayLabel(weekday: string, locale: string, fallback: string) {
  const idx = WEEKDAY_INDEX[weekday.toLowerCase()]
  if (idx === undefined) return fallback
  const date = new Date(2024, 0, 7 + idx)
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)
}

function formatNextOccurrence(date: string, locale: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(parsed)
}

function formatPeriods(
  periods: Array<{ startTime: string; endTime: string }>,
  noHoursLabel: string,
): string {
  if (!periods.length) return noHoursLabel
  return periods.map((period) => `${period.startTime}–${period.endTime}`).join(", ")
}

type AssistantDoctorClinicProfilePageProps = {
  doctorId: string
}

export function AssistantDoctorClinicProfilePage({
  doctorId,
}: AssistantDoctorClinicProfilePageProps) {
  const locale = useLocale()
  const { t } = useAssistantPageTranslations("doctors")
  const profileQuery = useAssistantDoctorClinicProfile(doctorId)
  const profile = profileQuery.data

  const statusLabels = useMemo(
    () =>
      ({
        available: t("available"),
        "in-consultation": t("inConsult"),
        away: t("away"),
      }) satisfies Record<DoctorStatus, string>,
    [t],
  )

  const visitModeLabels = useMemo(
    () => ({
      clinic: t("profile.visitClinic"),
      virtual: t("profile.visitVirtual"),
      both: t("profile.visitBoth"),
    }),
    [t],
  )

  const formatSlotCount = (count: number) =>
    count === 1 ? t("profile.oneSlotAvailable") : t("profile.slotsAvailable", { count })

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F9F8F5] p-8">
        <Loader2Icon className="size-6 animate-spin text-[#1A5345]" aria-hidden />
      </div>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex min-h-full flex-col bg-[#F9F8F5] p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="w-full space-y-6">
          <BackLink label={t("profile.backToDirectory")} />
          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white px-6 py-16 text-center">
            <p className="text-[14px] font-medium text-[#1A1F1E]">{t("profile.loadErrorTitle")}</p>
            <p className="mt-1 text-[12px] text-[#6B7870]">{t("profile.loadErrorHint")}</p>
          </div>
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[profile.status]
  const specialty = profile.specialty.trim()
  const title = profile.title?.trim() ?? ""
  const titleDiffers = title.length > 0 && title.toLowerCase() !== specialty.toLowerCase()
  const todayHours =
    profile.todayShiftStart && profile.todayShiftEnd
      ? `${profile.todayShiftStart} – ${profile.todayShiftEnd}`
      : t("profile.notScheduledToday")
  const location = profile.room || profile.clinicLocation || t("profile.notAssigned")
  const hasShiftToday = Boolean(profile.todayShiftStart && profile.todayShiftEnd)
  const loadLevel = resolveLoadLevel(profile.patientsWaiting, profile.status, hasShiftToday)
  const loadCfg = LOAD_CONFIG[loadLevel]
  const scheduleOverview = computeScheduleOverview(profile.schedule.days, locale)
  const nextAvailableLabel =
    scheduleOverview.nextDayLabel &&
    scheduleOverview.nextSlotTime &&
    scheduleOverview.nextDate
      ? t("profile.nextAvailableValue", {
          day: scheduleOverview.nextDayLabel,
          date: formatNextOccurrence(scheduleOverview.nextDate, locale),
          time: scheduleOverview.nextSlotTime,
        })
      : t("profile.noSlotsAvailable")

  return (
    <div className="flex min-h-full flex-col bg-[#F9F8F5] p-4 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="w-full space-y-6">
        <BackLink label={t("profile.backToDirectory")} />

        {/* Profile hero */}
        <section className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <AssistantProfileAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                className="size-16 shrink-0 rounded-full border border-[#E8E6E0] sm:size-[72px]"
                sizes="72px"
                initialsClassName="text-[16px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[26px]">
                    {profile.name}
                  </h1>
                  <span className={cn("inline-flex items-center gap-1.5", statusCfg.text)}>
                    <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                    <span className="text-[11px] font-bold">{statusLabels[profile.status]}</span>
                  </span>
                </div>

                {titleDiffers ? (
                  <>
                    <p className="mt-1 text-[13px] font-medium text-[#6B7870]">{title}</p>
                    <p className="mt-0.5 text-[13px] font-bold text-[#1A5345]">{specialty}</p>
                  </>
                ) : (
                  <p className="mt-1 text-[13px] font-medium text-[#6B7870]">{specialty}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[#6B7870]">
                  {profile.clinicName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2Icon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
                      {profile.clinicName}
                    </span>
                  ) : null}
                  {location !== t("profile.notAssigned") ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
                      {location}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
                    {todayHours}
                  </span>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="h-10 shrink-0 rounded-xl bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#133F34]"
            >
              <Link href={`/assistant-doctor-schedule?doctorId=${profile.id}`}>
                {t("profile.openSchedule")}
                <ArrowRightIcon className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>

          <p className="mt-5 border-t border-[#E8E6E0]/60 pt-4 text-[12px] leading-relaxed text-[#6B7870]">
            {t("profile.privacyNotice")}
          </p>
        </section>

        {/* Today snapshot */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCell
            icon={<UsersIcon className="size-5 text-[#1A5345]" />}
            value={String(profile.patientsWaiting)}
            label={t("waiting")}
          />
          <StatCell
            icon={<StethoscopeIcon className="size-5 text-[#d46a4c]" />}
            value={String(profile.patientsInConsultation)}
            label={t("profile.inConsultation")}
          />
          <StatCell
            icon={<ClockIcon className="size-5 text-emerald-600" />}
            value={todayHours}
            label={t("profile.todayHours")}
            compact
          />
          <StatCell
            icon={<MapPinIcon className="size-5 text-[#6B7870]" />}
            value={location}
            label={t("profile.roomLocation")}
            compact
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
          <div className="space-y-6 lg:col-span-2">
            {/* Clinic details */}
            <section className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading icon={<Building2Icon className="size-4 text-[#1A5345]" />}>
                {t("profile.clinicDetails")}
              </SectionHeading>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.clinicName ? (
                  <DetailTile
                    label={t("profile.clinic")}
                    value={profile.clinicName}
                    icon={<Building2Icon className="size-5 text-[#1A5345]" />}
                  />
                ) : null}
                {profile.clinicLocation ? (
                  <DetailTile
                    label={t("profile.clinicAddress")}
                    value={profile.clinicLocation}
                    icon={<MapPinIcon className="size-5 text-[#6B7870]" />}
                    compact
                  />
                ) : null}
                <DetailTile
                  label={t("profile.visitModes")}
                  value={visitModeLabels[profile.acceptedVisitModes]}
                  icon={
                    profile.acceptedVisitModes === "virtual" ? (
                      <VideoIcon className="size-5 text-[#1A5345]" />
                    ) : (
                      <Building2Icon className="size-5 text-[#1A5345]" />
                    )
                  }
                  compact
                />
                {profile.languages.length > 0 ? (
                  <DetailTile
                    label={t("profile.languages")}
                    value={profile.languages.join(", ")}
                    icon={<GlobeIcon className="size-5 text-[#1A5345]" />}
                    compact
                  />
                ) : null}
                {profile.experienceYears > 0 ? (
                  <DetailTile
                    label={t("profile.experience")}
                    value={t("profile.experienceYears", { years: profile.experienceYears })}
                    icon={<StethoscopeIcon className="size-5 text-[#1A5345]" />}
                  />
                ) : null}
              </div>

              {profile.about ? (
                <div className="mt-4 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4">
                  <p className="text-[13px] leading-relaxed text-[#1A1F1E]/85">{profile.about}</p>
                </div>
              ) : null}
            </section>

            {/* Quick actions */}
            <section className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading icon={<ArrowRightIcon className="size-4 text-[#1A5345]" />}>
                {t("profile.quickActions")}
              </SectionHeading>
              <div className="mt-4 flex flex-col gap-2">
                <QuickActionLink
                  href={assistantDoctorChatHref(profile.id)}
                  icon={<MessageCircleIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.messageDoctor")}
                />
                <QuickActionLink
                  href="/assistant-appointments"
                  icon={<CalendarClockIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.bookAppointment")}
                />
                <QuickActionLink
                  href="/assistant-queue/live-desk"
                  icon={<UsersIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.viewQueue")}
                />
              </div>
            </section>

            {/* Schedule overview */}
            <section className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading icon={<CalendarDaysIcon className="size-4 text-[#1A5345]" />}>
                {t("profile.scheduleOverview")}
              </SectionHeading>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailTile
                  label={t("profile.workingDays")}
                  value={t("profile.workingDaysValue", { count: scheduleOverview.workingDaysCount })}
                  icon={<CalendarDaysIcon className="size-5 text-emerald-600" />}
                  compact
                />
                <DetailTile
                  label={t("profile.openSlots")}
                  value={t("profile.openSlotsValue", { count: scheduleOverview.totalSlots })}
                  icon={<CalendarClockIcon className="size-5 text-[#1A5345]" />}
                />
                <DetailTile
                  label={t("profile.slotSettings")}
                  value={t("profile.slotSettingsValue", {
                    duration: profile.schedule.slotDurationMinutes,
                    buffer: profile.schedule.bufferBetweenSlotsMinutes,
                  })}
                  icon={<ClockIcon className="size-5 text-[#6B7870]" />}
                  compact
                />
                <DetailTile
                  label={t("profile.queueLoad")}
                  value={t(loadCfg.labelKey)}
                  icon={<UsersIcon className={cn("size-5", loadCfg.style)} />}
                  valueClassName={loadCfg.style}
                />
                <DetailTile
                  className="sm:col-span-2"
                  label={t("profile.nextAvailable")}
                  value={nextAvailableLabel}
                  icon={<ClockIcon className="size-5 text-[#1A5345]" />}
                  compact
                />
              </div>
            </section>
          </div>

          {/* Weekly schedule */}
          <section className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading icon={<CalendarDaysIcon className="size-4 text-[#1A5345]" />}>
                {t("profile.weeklySchedule")}
              </SectionHeading>
              <span className="text-[11px] font-medium text-[#6B7870]">
                {t("profile.minSlots", { minutes: profile.schedule.slotDurationMinutes })}
              </span>
            </div>

            <div className="mt-4 divide-y divide-[#E8E6E0]/60">
              {profile.schedule.days.map((day) => {
                const slotTimes = day.availableSlotTimes ?? []
                const slotCount = day.availableSlotCount ?? slotTimes.length
                const dayLabel = localizedWeekdayLabel(day.weekday, locale, day.label)

                return (
                  <div
                    key={day.weekday}
                    className={cn(
                      "py-3.5 first:pt-0 last:pb-0",
                      !day.enabled && "opacity-60",
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#1A1F1E]">{dayLabel}</p>
                        <p className="mt-0.5 text-[12px] text-[#6B7870]">
                          {day.enabled
                            ? formatPeriods(day.periods, t("profile.noHoursSet"))
                            : t("profile.dayOff")}
                        </p>
                      </div>

                      {day.enabled ? (
                        <p
                          className={cn(
                            "shrink-0 text-[11px] font-bold sm:text-right",
                            slotCount > 0 ? "text-[#1A5345]" : "text-[#6B7870]",
                          )}
                        >
                          {formatSlotCount(slotCount)}
                          {day.nextOccurrenceDate ? (
                            <span className="font-medium text-[#6B7870]">
                              {" · "}
                              {t("profile.nextOccurrence", {
                                date: formatNextOccurrence(day.nextOccurrenceDate, locale),
                              })}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>

                    {day.enabled && slotTimes.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {slotTimes.map((time) => (
                          <span
                            key={`${day.weekday}-${time}`}
                            className="inline-flex items-center rounded-lg bg-[#EEF5F3] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#1A5345]"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    ) : day.enabled ? (
                      <p className="mt-2 text-[11px] font-medium text-[#6B7870]">
                        {t("profile.noOpenSlots")}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/assistant-doctors"
      className="inline-flex w-fit items-center gap-2 text-[13px] font-bold text-[#1A5345] transition-colors hover:text-[#133F34]"
    >
      <ArrowLeftIcon className="size-4" />
      {label}
    </Link>
  )
}

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#1A1F1E]">
      {icon}
      {children}
    </h2>
  )
}

function StatCell({
  icon,
  value,
  label,
  compact = false,
}: {
  icon: ReactNode
  value: string
  label: string
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex shrink-0 items-center justify-center">{icon}</div>
      <div className="min-w-0">
        <div
          className={cn(
            "font-bold text-[#1A1F1E]",
            compact ? "truncate text-[13px] sm:text-[14px]" : "text-[18px]",
          )}
          title={compact ? value : undefined}
        >
          {value}
        </div>
        <div className="text-[11px] font-medium text-[#6B7870]">{label}</div>
      </div>
    </div>
  )
}

function QuickActionLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-4 py-3 text-[13px] font-bold text-[#1A1F1E] transition-shadow hover:shadow-md"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {icon}
        {label}
      </span>
      <ArrowRightIcon className="size-3.5 shrink-0 text-[#6B7870]" aria-hidden />
    </Link>
  )
}

function DetailTile({
  label,
  value,
  icon,
  valueClassName,
  className,
  compact = false,
}: {
  label: string
  value: string
  icon: ReactNode
  valueClassName?: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-center">{icon}</div>
      <div className="min-w-0">
        <div
          className={cn(
            "font-bold text-[#1A1F1E]",
            compact ? "truncate text-[13px] sm:text-[14px]" : "text-[18px]",
            valueClassName,
          )}
          title={compact ? value : undefined}
        >
          {value}
        </div>
        <div className="text-[11px] font-medium text-[#6B7870]">{label}</div>
      </div>
    </div>
  )
}
