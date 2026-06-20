"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  ArrowRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  HeartPulseIcon,
  MailIcon,
  MapPinIcon,
  PencilLineIcon,
  PhoneIcon,
  ScaleIcon,
  User2Icon,
  UserRoundIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PatientAccountProfile } from "./patientAccount.types"
import { profileToEditValues } from "./patientAccount.schema"
import type { PatientProfileEditValues } from "./patientAccount.schema"
import { EditPatientProfileDialog } from "./EditPatientProfileDialog"
import { PatientAccountMedicationAdherence } from "./PatientAccountMedicationAdherence"
import {
  formatBloodType,
  formatMetric,
  formatPatientDate,
  formatPatientShortId,
} from "./patientAccount.utils"

const riskStyles = {
  low: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
} as const

function ProfileAvatar({ profile }: { profile: PatientAccountProfile }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasAvatar = Boolean(profile.avatarUrl?.trim()) && !imageFailed

  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm sm:size-24">
      {hasAvatar ? (
        <Image
          src={profile.avatarUrl!}
          alt={profile.fullName}
          fill
          unoptimized
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-[#B0BAB4]">
          <UserRoundIcon className="size-10" strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#1A5345]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">{label}</p>
        <p className="mt-0.5 text-[14px] font-medium text-[#1A1F1E]">{value}</p>
      </div>
    </div>
  )
}

type PatientAccountProps = {
  profile: PatientAccountProfile
  onSaveProfile: (values: PatientProfileEditValues) => Promise<void>
  isSaving: boolean
}

export function PatientAccount({ profile, onSaveProfile, isSaving }: PatientAccountProps) {
  const t = useTranslations("patient.account")
  const [editOpen, setEditOpen] = useState(false)
  const editValues = useMemo(() => profileToEditValues(profile), [profile])

  const riskLabel =
    profile.riskLevel === "high"
      ? t("risk.high")
      : profile.riskLevel === "moderate"
        ? t("risk.moderate")
        : t("risk.low")

  const genderLabel =
    profile.gender === "male"
      ? t("values.male")
      : profile.gender === "female"
        ? t("values.female")
        : t("values.other")

  const maritalLabel = profile.maritalStatus
    ? t(`values.${profile.maritalStatus}` as "values.single")
    : t("values.notSet")

  const smokingLabel = !profile.smokingStatus
    ? t("values.notSet")
    : profile.smokingStatus === "never"
      ? t("values.never")
      : profile.smokingStatus.startsWith("former")
        ? t("values.former")
        : profile.smokingStatus.startsWith("current")
          ? t("values.current")
          : profile.smokingStatus

  return (
    <div className="flex w-full flex-1 flex-col space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-[24px] font-bold tracking-tight text-[#1A1F1E] sm:text-[28px]">
                    {profile.fullName}
                  </h1>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      riskStyles[profile.riskLevel],
                    )}
                  >
                    {riskLabel}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-muted-foreground">{profile.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#6B7870]">
                  <span className="rounded-md bg-[#F4F3EF] px-2 py-1 font-mono text-[#1A5345]">
                    ID {formatPatientShortId(profile.id)}
                  </span>
                  <span className="text-[#D1D5DB]">·</span>
                  <span>
                    {t("memberSince")} {formatPatientDate(profile.memberSince)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 gap-2 self-start rounded-xl border-[#E8E6E0] bg-white text-[13px] font-semibold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
              onClick={() => setEditOpen(true)}
            >
              <PencilLineIcon className="size-4" aria-hidden />
              {t("editProfile")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7870]">
            {t("sections.contact")}
          </h2>
          <div className="grid gap-3">
            <InfoRow icon={PhoneIcon} label={t("fields.phone")} value={profile.phone || "—"} />
            <InfoRow icon={MailIcon} label={t("fields.email")} value={profile.email} />
            <InfoRow icon={MapPinIcon} label={t("fields.address")} value={profile.address || "—"} />
          </div>
          <PatientAccountMedicationAdherence />
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7870]">
            {t("sections.personal")}
          </h2>
          <div className="grid gap-3">
            <InfoRow
              icon={CalendarDaysIcon}
              label={t("fields.dateOfBirth")}
              value={`${formatPatientDate(profile.dateOfBirth)} (${profile.age} ${t("years")})`}
            />
            <InfoRow icon={User2Icon} label={t("fields.gender")} value={genderLabel} />
            <InfoRow
              icon={HeartPulseIcon}
              label={t("fields.bloodType")}
              value={formatBloodType(profile.bloodType)}
            />
            <InfoRow
              icon={CreditCardIcon}
              label={t("fields.nationalId")}
              value={profile.nationalId || "—"}
            />
            <InfoRow
              icon={User2Icon}
              label={t("fields.maritalStatus")}
              value={maritalLabel}
            />
            <InfoRow
              icon={User2Icon}
              label={t("fields.occupation")}
              value={profile.occupation || "—"}
            />
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7870]">
          {t("sections.health")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow
            icon={ScaleIcon}
            label={t("fields.height")}
            value={formatMetric(profile.heightCm, "cm")}
          />
          <InfoRow
            icon={ScaleIcon}
            label={t("fields.weight")}
            value={formatMetric(profile.weightKg, "kg")}
          />
          <InfoRow
            icon={HeartPulseIcon}
            label={t("fields.bmi")}
            value={profile.bmi != null ? String(profile.bmi) : "—"}
          />
          <InfoRow
            icon={HeartPulseIcon}
            label={t("fields.smoking")}
            value={smokingLabel}
          />
        </div>
      </section>

      <Card className="rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <BellIcon className="mt-0.5 size-5 shrink-0 text-[#CC5533]" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-[#1A1F1E]">{t("notificationsCard.title")}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t("notificationsCard.description")}
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-9 shrink-0 gap-2 rounded-xl border-[#E8E6E0] bg-white text-[13px] font-semibold text-[#1A5345] hover:bg-[#F9F8F5]"
          >
            <Link href="/account/notifications">
              {t("notificationsCard.action")}
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <EditPatientProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={editValues}
        onSubmit={async (values) => {
          await onSaveProfile(values)
          setEditOpen(false)
        }}
        isPending={isSaving}
      />
    </div>
  )
}
