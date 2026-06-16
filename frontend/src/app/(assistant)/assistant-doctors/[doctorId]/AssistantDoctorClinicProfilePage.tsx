"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import { useLocale } from "next-intl"
import {
  ArrowLeftIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  GlobeIcon,
  Loader2Icon,
  MapPinIcon,
  StethoscopeIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AssistantProfileAvatar } from "@/app/(assistant)/AssistantProfileAvatar"
import { useAssistantPageTranslations } from "../../use-assistant-i18n"
import { useAssistantDoctorClinicProfile } from "../useAssistantDoctors"
import type { DoctorStatus } from "../assistantDoctors.types"

const STATUS_CLASS: Record<DoctorStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  "in-consultation": "bg-amber-50 text-amber-700",
  away: "bg-[#F3F4F6] text-[#6B7870]",
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

  const statusCfg = profile
    ? { label: statusLabels[profile.status], className: STATUS_CLASS[profile.status] }
    : null

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
        <div className="w-full space-y-6 lg:space-y-8">
          <Link
            href="/assistant-doctors"
            className="inline-flex w-fit items-center gap-2 text-[13px] font-bold text-[#1A5345] hover:text-[#133F34]"
          >
            <ArrowLeftIcon className="size-4" />
            {t("profile.backToDirectory")}
          </Link>
          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white px-6 py-16 text-center">
            <p className="text-[14px] font-medium text-[#1A1F1E]">{t("profile.loadErrorTitle")}</p>
            <p className="mt-1 text-[12px] text-[#6B7870]">{t("profile.loadErrorHint")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F9F8F5] p-4 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="w-full space-y-6 lg:space-y-8">
        <Link
          href="/assistant-doctors"
          className="inline-flex w-fit items-center gap-2 text-[13px] font-bold text-[#1A5345] transition-colors hover:text-[#133F34]"
        >
          <ArrowLeftIcon className="size-4" />
          {t("profile.backToDirectory")}
        </Link>

        <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <AssistantProfileAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                className="size-16 shrink-0 rounded-full border border-[#E8E6E0]"
                sizes="64px"
                initialsClassName="text-[16px]"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-[24px] font-bold leading-tight text-[#1A1F1E] sm:text-[26px]">
                    {profile.name}
                  </h1>
                  {statusCfg ? (
                    <Badge
                      variant="secondary"
                      className={cn("rounded-lg px-2.5 py-0.5 text-[11px] font-bold", statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                  ) : null}
                </div>
                {(() => {
                  const specialty = profile.specialty.trim()
                  const title = profile.title?.trim() ?? ""
                  const titleDiffers =
                    title.length > 0 && title.toLowerCase() !== specialty.toLowerCase()

                  if (titleDiffers) {
                    return (
                      <>
                        <p className="mt-1 text-[14px] font-medium text-[#6B7870]">{title}</p>
                        <p className="mt-0.5 text-[13px] font-bold text-[#1A5345]">{specialty}</p>
                      </>
                    )
                  }

                  return (
                    <p className="mt-1 text-[14px] font-medium text-[#6B7870]">{specialty}</p>
                  )
                })()}
              </div>
            </div>
            <Button
              asChild
              className="h-10 shrink-0 rounded-xl bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#133F34]"
            >
              <Link href={`/assistant-doctor-schedule?doctorId=${profile.id}`}>
                {t("profile.openSchedule")}
              </Link>
            </Button>
          </div>
        </div>

        <p className="rounded-xl border border-[#E8E6E0]/70 bg-white px-4 py-3 text-[11px] leading-relaxed text-[#6B7870] shadow-sm">
          {t("profile.privacyNotice")}
        </p>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
                {t("profile.todayAtClinic")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <InfoTile
                  icon={<UsersIcon className="size-4 text-[#1A5345]" />}
                  label={t("waiting")}
                  value={String(profile.patientsWaiting)}
                />
                <InfoTile
                  icon={<StethoscopeIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.inConsultation")}
                  value={String(profile.patientsInConsultation)}
                />
                <InfoTile
                  icon={<ClockIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.todayHours")}
                  value={
                    profile.todayShiftStart && profile.todayShiftEnd
                      ? `${profile.todayShiftStart} – ${profile.todayShiftEnd}`
                      : t("profile.notScheduledToday")
                  }
                />
                <InfoTile
                  icon={<MapPinIcon className="size-4 text-[#1A5345]" />}
                  label={t("profile.roomLocation")}
                  value={profile.room || profile.clinicLocation || t("profile.notAssigned")}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
                {t("profile.clinicDetails")}
              </h2>
              <div className="mt-4 space-y-2.5 rounded-xl border border-[#E8E6E0]/70 bg-[#F9F8F5]/40 p-4">
                {profile.clinicName ? (
                  <DetailRow
                    icon={<Building2Icon className="size-4 shrink-0 text-[#1A5345]" />}
                    label={t("profile.clinic")}
                    value={profile.clinicName}
                  />
                ) : null}
                {profile.clinicLocation ? (
                  <DetailRow
                    icon={<MapPinIcon className="size-4 shrink-0 text-[#1A5345]" />}
                    label={t("profile.clinicAddress")}
                    value={profile.clinicLocation}
                  />
                ) : null}
                <DetailRow
                  icon={
                    profile.acceptedVisitModes === "virtual" ? (
                      <VideoIcon className="size-4 shrink-0 text-[#1A5345]" />
                    ) : (
                      <Building2Icon className="size-4 shrink-0 text-[#1A5345]" />
                    )
                  }
                  label={t("profile.visitModes")}
                  value={visitModeLabels[profile.acceptedVisitModes]}
                />
                {profile.languages.length > 0 ? (
                  <DetailRow
                    icon={<GlobeIcon className="size-4 shrink-0 text-[#1A5345]" />}
                    label={t("profile.languages")}
                    value={profile.languages.join(", ")}
                  />
                ) : null}
                {profile.experienceYears > 0 ? (
                  <DetailRow
                    icon={<StethoscopeIcon className="size-4 shrink-0 text-[#1A5345]" />}
                    label={t("profile.experience")}
                    value={t("profile.experienceYears", { years: profile.experienceYears })}
                  />
                ) : null}
              </div>
              {profile.about ? (
                <p className="mt-4 rounded-xl border border-[#E8E6E0]/70 bg-[#F9F8F5]/40 p-4 text-[13px] leading-relaxed text-[#1A1F1E]/85">
                  {profile.about}
                </p>
              ) : null}
            </section>
          </div>

          <section className="rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
                {t("profile.weeklySchedule")}
              </h2>
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("profile.minSlots", { minutes: profile.schedule.slotDurationMinutes })}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {profile.schedule.days.map((day) => {
                const slotTimes = day.availableSlotTimes ?? []
                const slotCount = day.availableSlotCount ?? slotTimes.length
                const dayLabel = localizedWeekdayLabel(day.weekday, locale, day.label)

                return (
                  <div
                    key={day.weekday}
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      day.enabled
                        ? "border-[#E8E6E0]/70 bg-[#F9F8F5]/40"
                        : "border-transparent bg-[#F3F4F6]/70 opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#1A1F1E]">{dayLabel}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {day.enabled
                            ? formatPeriods(day.periods, t("profile.noHoursSet"))
                            : t("profile.dayOff")}
                        </p>
                      </div>
                      {day.enabled ? (
                        <CalendarDaysIcon className="size-4 shrink-0 text-[#1A5345]/70" aria-hidden />
                      ) : null}
                    </div>

                    {day.enabled ? (
                      <div className="mt-2.5 space-y-2">
                        <p
                          className={cn(
                            "text-[11px] font-bold",
                            slotCount > 0 ? "text-[#1A5345]" : "text-[#6B7870]",
                          )}
                        >
                          {formatSlotCount(slotCount)}
                          {day.nextOccurrenceDate ? (
                            <span className="font-medium text-muted-foreground">
                              {" "}
                              {t("profile.nextOccurrence", {
                                date: formatNextOccurrence(day.nextOccurrenceDate, locale),
                              })}
                            </span>
                          ) : null}
                        </p>
                        {slotTimes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {slotTimes.map((time) => (
                              <span
                                key={`${day.weekday}-${time}`}
                                className="inline-flex items-center rounded-md border border-[#E5EEEA] bg-white px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#1A5345]"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {t("profile.noOpenSlots")}
                          </p>
                        )}
                      </div>
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

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/70 bg-white p-3">
      <div className="flex items-center gap-2 text-[#6B7870]">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-[14px] font-bold text-[#1A1F1E]">{value}</p>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">{label}</p>
        <p className="mt-0.5 text-[13px] font-medium text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}
