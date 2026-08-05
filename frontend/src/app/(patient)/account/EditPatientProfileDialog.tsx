"use client"

import { useEffect, useRef, useState } from "react"
import { CameraIcon, Loader2Icon, UserRoundIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { cn } from "@/lib/utils"
import { PATIENT_MARITAL_STATUSES } from "@/app/(doctor)/doctor-patients/patientProfile.constants"
import { patientProfileEditSchema, type PatientProfileEditValues } from "./patientAccount.schema"
import {
  uploadPatientAccountAvatar,
  validatePatientAvatarFile,
} from "./patientAccount.upload"

const AVATAR_OPTIONS = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

const inputClassName =
  "h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"

type EditPatientProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: PatientProfileEditValues
  onSubmit: (values: PatientProfileEditValues) => Promise<void>
  isPending: boolean
}

type FieldErrors = Partial<Record<keyof PatientProfileEditValues, string>>

export function EditPatientProfileDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isPending,
}: EditPatientProfileDialogProps) {
  const t = useTranslations("patient.account.editDialog")
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setForm({ ...initialValues })
      setErrors({})
      setPendingAvatarFile(null)
    }
  }, [open, initialValues])

  useEffect(() => {
    if (!pendingAvatarFile) {
      setAvatarPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pendingAvatarFile)
    setAvatarPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingAvatarFile])

  const setField = <K extends keyof PatientProfileEditValues>(
    key: K,
    value: PatientProfileEditValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleAvatarFileChange = (fileList: FileList | null) => {
    const file = fileList?.item(0)
    if (!file) return
    try {
      validatePatientAvatarFile(file)
      setPendingAvatarFile(file)
    } catch (err) {
      showIcareErrorToast(
        "Invalid profile photo",
        err instanceof Error ? err.message : "Could not use this image.",
      )
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayAvatarSrc =
    avatarPreviewUrl ||
    (form.avatarUrl && !AVATAR_OPTIONS.includes(form.avatarUrl) ? form.avatarUrl : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = patientProfileEditSchema.safeParse(form)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrors({
        fullName: flat.fullName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        address: flat.address?.[0],
        maritalStatus: flat.maritalStatus?.[0],
        occupation: flat.occupation?.[0],
        avatarUrl: flat.avatarUrl?.[0],
      })
      return
    }

    try {
      let avatarUrl = parsed.data.avatarUrl
      if (pendingAvatarFile) {
        setIsUploading(true)
        avatarUrl = await uploadPatientAccountAvatar(pendingAvatarFile)
      }
      await onSubmit({ ...parsed.data, avatarUrl })
      setPendingAvatarFile(null)
    } catch (err) {
      showIcareErrorToast(
        "Could not save profile photo",
        err instanceof Error ? err.message : "Please try again.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  const busy = isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-start">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
            <div>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                {t("avatarSection")}
              </h3>
              <p className="mb-3 text-[12px] text-muted-foreground">{t("avatarHint")}</p>

              <div className="mb-3 flex items-center gap-3">
                <div className="relative size-16 overflow-hidden rounded-full border-2 border-[#E8E6E0] bg-white shadow-sm">
                  {displayAvatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatarSrc} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-slate-50">
                      <UserRoundIcon className="size-8 text-slate-300" aria-hidden />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => handleAvatarFileChange(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full border-[#E8E6E0] px-3 text-[12px] font-semibold text-[#1A5345] hover:bg-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  <CameraIcon className="mr-1.5 size-3.5" aria-hidden />
                  {t("uploadPhoto")}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {AVATAR_OPTIONS.map((src) => {
                  const selected = form.avatarUrl === src && !pendingAvatarFile
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        setPendingAvatarFile(null)
                        setField("avatarUrl", src)
                      }}
                      className={cn(
                        "overflow-hidden rounded-xl border-2 bg-white p-1 transition-colors",
                        selected ? "border-[#1A5345]" : "border-[#E8E6E0]/80 hover:border-[#1A5345]/40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="size-full rounded-lg object-cover" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("fullName")}</FieldLabel>
                <Input
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  className={inputClassName}
                />
                {errors.fullName ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.fullName}</p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("email")}</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={inputClassName}
                />
                {errors.email ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("phone")}</FieldLabel>
                <Input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className={inputClassName}
                />
                {errors.phone ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("maritalStatus")}</FieldLabel>
                <Select
                  value={form.maritalStatus || "unset"}
                  onValueChange={(value) =>
                    setField("maritalStatus", value === "unset" ? "" : (value as PatientProfileEditValues["maritalStatus"]))
                  }
                >
                  <SelectTrigger className={inputClassName}>
                    <SelectValue placeholder={t("maritalStatusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">{t("notSet")}</SelectItem>
                    {PATIENT_MARITAL_STATUSES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("occupation")}</FieldLabel>
                <Input
                  value={form.occupation}
                  onChange={(e) => setField("occupation", e.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">{t("address")}</FieldLabel>
                <Textarea
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className="min-h-[88px] rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E8E6E0]/60 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="h-9 gap-2 rounded-lg bg-[#1A5345] px-4 text-[13px] font-bold text-white hover:bg-[#133F34]"
              disabled={busy}
            >
              {busy ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
