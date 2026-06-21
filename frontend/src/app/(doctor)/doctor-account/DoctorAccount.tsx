"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AwardIcon,
  Building2Icon,
  CalendarClockIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PencilLineIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  StethoscopeIcon,
  User2Icon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

import type {
  DoctorPracticeStats,
  DoctorProfile,
  DoctorReview,
  DoctorWeeklySnapshot,
} from "./doctorAccount.types"
import {
  doctorAccountScrollbarCss,
  doctorPageCardClassName,
  doctorStatCellClassName,
  formatConsultationFee,
  visitModesLabel,
} from "./doctorAccount.shared"
import { EditDoctorProfileDialog } from "./EditDoctorProfileDialog"
import type { DoctorProfileEditValues } from "./doctorAccount.schema"
import { profileToEditValues } from "./doctorAccount.schema"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function formatStatCount(value: number) {
  return value > 0 ? String(value) : "—"
}

function ProfileAvatar({ profile }: { profile: DoctorProfile }) {
  const [imageFailed, setImageFailed] = useState(false)
  const avatarUrl = profile.avatarUrl?.trim() ?? ""
  const isPresetAvatar = avatarUrl.startsWith("/avatars/")
  const isRemoteAvatar = avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")
  const hasAvatar = Boolean(avatarUrl) && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  return (
    <div className="relative shrink-0">
      <div className="relative size-20 overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm sm:size-24">
        {hasAvatar ? (
          isRemoteAvatar && !isPresetAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={profile.fullName}
              className="size-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Image
              src={avatarUrl}
              alt={profile.fullName}
              fill
              unoptimized
              sizes="96px"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center text-[#9AA8A0]">
            <User2Icon className="size-10 sm:size-11" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500"
        aria-hidden
      />
    </div>
  )
}

function PracticeStatsRow({ stats }: { stats: DoctorPracticeStats }) {
  const tiles = [
    {
      label: "Patients today",
      value: stats.patientsToday,
      icon: UsersIcon,
      iconColor: "text-[#1A5345]",
    },
    {
      label: "Appointments this week",
      value: stats.appointmentsThisWeek,
      icon: CalendarClockIcon,
      iconColor: "text-[#2D6B5C]",
    },
    {
      label: "Completed consultations",
      value: stats.completedConsultations,
      icon: StethoscopeIcon,
      iconColor: "text-[#5A7A70]",
    },
    {
      label: "Average rating",
      value: stats.averageRating,
      icon: StarIcon,
      iconColor: "text-[#C26D2A]",
      isRating: true,
    },
  ] as const

  return (
    <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, iconColor, ...rest }) => (
        <div key={label} className={doctorStatCellClassName}>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#6B7870] sm:text-[12px]">{label}</span>
            <p
              className={cn(
                "mt-0.5 text-[20px] font-bold leading-none tabular-nums",
                value > 0 ? "text-[#1A1F1E]" : "text-muted-foreground",
              )}
            >
              {"isRating" in rest && rest.isRating && value > 0
                ? value.toFixed(1)
                : formatStatCount(value)}
            </p>
          </div>
          <Icon className={cn("size-5 shrink-0", iconColor)} strokeWidth={2} aria-hidden />
        </div>
      ))}
    </div>
  )
}

function WeeklySnapshotTable({ rows }: { rows: DoctorWeeklySnapshot[] }) {
  const maxAppointments = Math.max(...rows.map((r) => r.appointments), 1)

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.day} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3">
          <span className="text-[12px] font-bold text-[#6B7870]">{row.day}</span>
          <div className="h-2 overflow-hidden rounded-full bg-[#F0EFEB]">
            <div
              className="h-full rounded-full bg-[#1A5345] transition-all"
              style={{ width: `${(row.appointments / maxAppointments) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tabular-nums text-[#6B7870]">
            <span className="text-[#1A1F1E]">{row.completed}</span>
            <span>/</span>
            <span>{row.appointments}</span>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-[#6B7870]">Completed / scheduled per day</p>
    </div>
  )
}

function ReviewCard({ review }: { review: DoctorReview }) {
  return (
    <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#1A1F1E]">{review.patientName}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#6B7870]">
            {formatDateShort(review.date)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-[#C26D2A]">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={cn("size-3.5", i < review.rating ? "fill-current" : "opacity-25")}
              aria-hidden
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#4A5550]">{review.comment}</p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/50 bg-[#FAFAF8] px-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">{label}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}

export type DoctorAccountProps = {
  profile: DoctorProfile
  practiceStats: DoctorPracticeStats
  weeklySnapshot: DoctorWeeklySnapshot[]
  reviews: DoctorReview[]
  onSaveProfile: (values: DoctorProfileEditValues) => Promise<void>
  isSaving: boolean
}

export function DoctorAccount({
  profile,
  practiceStats,
  weeklySnapshot,
  reviews,
  onSaveProfile,
  isSaving,
}: DoctorAccountProps) {
  const [editOpen, setEditOpen] = useState(false)

  const editInitialValues = useMemo(() => profileToEditValues(profile), [profile])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: doctorAccountScrollbarCss() }} />

      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8">
          {/* Breadcrumb + actions */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-dashboard" className="text-[#6B7870] hover:text-[#1A5345]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-[#1A5345]">My profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Button
              type="button"
              onClick={() => setEditOpen(true)}
              className="h-9 shrink-0 rounded-lg bg-[#1A5345] px-4 text-[13px] font-semibold text-white hover:bg-[#164436]"
            >
              <PencilLineIcon className="size-4" aria-hidden />
              Edit profile
            </Button>
          </div>

          {/* Profile hero */}
          <Card className={cn(doctorPageCardClassName, "mb-6")}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
                  <ProfileAvatar profile={profile} />

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-serif text-[22px] font-bold leading-tight text-[#1A1F1E] sm:text-[26px]">
                        {profile.fullName}
                      </h1>
                      <Badge className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-600">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-[14px] font-semibold text-[#1A5345]">{profile.title}</p>
                    <p className="text-[13px] font-medium text-[#6B7870]">
                      {profile.specialty} · {profile.experienceYears} years experience
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#C26D2A]">
                        <StarIcon className="size-4 fill-current" aria-hidden />
                        {profile.rating.toFixed(1)}
                      </span>
                      <span className="text-[12px] font-medium text-[#6B7870]">
                        {profile.reviewCount} patient reviews
                      </span>
                      <span className="text-[12px] text-[#6B7870]">·</span>
                      <span className="text-[12px] font-medium text-[#6B7870]">
                        Joined {formatDate(profile.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge
                    variant="outline"
                    className="rounded-lg border-[#E8E6E0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1A5345]"
                  >
                    <ShieldCheckIcon className="mr-1 size-3.5" aria-hidden />
                    {profile.licenseNumber}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-lg border-[#E8E6E0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1A5345]"
                  >
                    {visitModesLabel(profile.acceptedVisitModes)}
                  </Badge>
                </div>
              </div>

              <PracticeStatsRow stats={practiceStats} />
            </CardContent>
          </Card>

          {/* Main grid */}
          <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                      Consultation fees
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                      className="h-8 rounded-lg px-2.5 text-[12px] font-semibold text-[#1A5345] hover:bg-[#E8F0EE]"
                    >
                      <PencilLineIcon className="size-3.5" aria-hidden />
                      Edit fees
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                  <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                    <div className="flex items-start gap-3">
                      <Building2Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">
                          In-clinic visit
                        </p>
                        <p className="mt-1 font-serif text-[22px] font-bold leading-none text-[#1A1F1E]">
                          {formatConsultationFee(profile.clinicConsultationFee)}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-[#6B7870]">
                          Charged for physical appointments at the clinic
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4">
                    <div className="flex items-start gap-3">
                      <VideoIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">
                          Online visit
                        </p>
                        <p className="mt-1 font-serif text-[22px] font-bold leading-none text-[#1A1F1E]">
                          {formatConsultationFee(profile.onlineConsultationFee)}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-[#6B7870]">
                          Charged for video or remote consultations
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-[14px] leading-relaxed text-[#4A5550]">{profile.about}</p>
                </CardContent>
              </Card>

              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                    Contact & clinic
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                  <InfoRow icon={MailIcon} label="Email" value={profile.email} />
                  <InfoRow icon={PhoneIcon} label="Phone" value={profile.phone} />
                  <InfoRow icon={Building2Icon} label="Clinic" value={profile.clinicName} />
                  <InfoRow icon={MapPinIcon} label="Location" value={profile.clinicLocation} />
                </CardContent>
              </Card>

              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                    Recent patient feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5 sm:p-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                    This week at a glance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <WeeklySnapshotTable rows={weeklySnapshot} />
                </CardContent>
              </Card>

              <Card className={doctorPageCardClassName}>
                <CardHeader className="border-b border-[#E8E6E0]/50 px-5 py-4 sm:px-6">
                  <CardTitle className="font-serif text-[16px] font-bold text-[#1A1F1E]">
                    Practice details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <AwardIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">
                        Specialty
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#1A1F1E]">
                        {profile.specialty}
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-[#E8E6E0]/60" />
                  <div className="flex items-start gap-3">
                    <GlobeIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">
                        Languages
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#1A1F1E]">
                        {profile.languages.join(" · ")}
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-[#E8E6E0]/60" />
                  <div className="flex items-start gap-3">
                    {profile.acceptedVisitModes === "virtual" ? (
                      <VideoIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                    ) : (
                      <Building2Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">
                        Visit modes
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#1A1F1E]">
                        {visitModesLabel(profile.acceptedVisitModes)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <EditDoctorProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editInitialValues}
        onSubmit={async (values) => {
          await onSaveProfile(values)
          setEditOpen(false)
        }}
        isPending={isSaving}
      />
    </>
  )
}
