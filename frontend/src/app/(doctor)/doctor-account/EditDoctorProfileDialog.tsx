"use client"

import { useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { doctorProfileEditSchema } from "./doctorAccount.schema"
import type { DoctorProfileEditValues } from "./doctorAccount.schema"

const SPECIALTY_OPTIONS = [
  "Cardiology",
  "Internal Medicine",
  "Endocrinology",
  "Nephrology",
  "General Practice",
] as const

const AVATAR_OPTIONS = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

const inputClassName =
  "h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"

type EditDoctorProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: DoctorProfileEditValues
  onSubmit: (values: DoctorProfileEditValues) => Promise<void>
  isPending: boolean
}

type FieldErrors = Partial<Record<keyof DoctorProfileEditValues, string>>

export function EditDoctorProfileDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isPending,
}: EditDoctorProfileDialogProps) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      const avatarUrl =
        initialValues.avatarUrl && AVATAR_OPTIONS.includes(initialValues.avatarUrl)
          ? initialValues.avatarUrl
          : ""
      setForm({ ...initialValues, avatarUrl })
      setErrors({})
    }
  }, [open, initialValues])

  const setField = <K extends keyof DoctorProfileEditValues>(
    key: K,
    value: DoctorProfileEditValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = doctorProfileEditSchema.safeParse(form)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrors({
        fullName: flat.fullName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        specialty: flat.specialty?.[0],
        title: flat.title?.[0],
        experienceYears: flat.experienceYears?.[0],
        clinicName: flat.clinicName?.[0],
        clinicLocation: flat.clinicLocation?.[0],
        about: flat.about?.[0],
        avatarUrl: flat.avatarUrl?.[0],
        clinicConsultationFee: flat.clinicConsultationFee?.[0],
        onlineConsultationFee: flat.onlineConsultationFee?.[0],
      })
      return
    }
    await onSubmit(parsed.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-left">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            Edit profile
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="max-h-[min(70vh,560px)] space-y-6 overflow-y-auto px-6 py-5">
            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                Avatar profile
              </h3>
              <div className="mb-2 flex flex-wrap gap-4">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setField("avatarUrl", avatar)}
                    className={cn(
                      "relative flex size-14 items-center justify-center rounded-full border-2 transition-all hover:scale-105",
                      form.avatarUrl === avatar
                        ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                        : "border-[#E8E6E0]",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt="" className="size-12 rounded-full object-cover" />
                  </button>
                ))}
              </div>
              {errors.avatarUrl ? (
                <p className="text-[12px] text-destructive">{errors.avatarUrl}</p>
              ) : null}
            </div>

            <Separator className="bg-[#E8E6E0]/60" />

            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                Personal details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Full name
                  </FieldLabel>
                  <Input
                    className={inputClassName}
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                  />
                  {errors.fullName ? (
                    <p className="text-[12px] text-destructive">{errors.fullName}</p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Title
                  </FieldLabel>
                  <Input
                    className={inputClassName}
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                  />
                  {errors.title ? (
                    <p className="text-[12px] text-destructive">{errors.title}</p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Email
                  </FieldLabel>
                  <Input
                    type="email"
                    className={inputClassName}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                  {errors.email ? (
                    <p className="text-[12px] text-destructive">{errors.email}</p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Phone
                  </FieldLabel>
                  <Input
                    className={inputClassName}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                  {errors.phone ? (
                    <p className="text-[12px] text-destructive">{errors.phone}</p>
                  ) : null}
                </Field>
              </div>
            </div>

            <Separator className="bg-[#E8E6E0]/60" />

            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                Professional info
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Specialty
                  </FieldLabel>
                  <Input
                    list="doctor-specialty-options"
                    className={inputClassName}
                    value={form.specialty}
                    onChange={(e) => setField("specialty", e.target.value)}
                  />
                  <datalist id="doctor-specialty-options">
                    {SPECIALTY_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  {errors.specialty ? (
                    <p className="text-[12px] text-destructive">{errors.specialty}</p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Years of experience
                  </FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    className={inputClassName}
                    value={form.experienceYears}
                    onChange={(e) => setField("experienceYears", Number(e.target.value))}
                  />
                  {errors.experienceYears ? (
                    <p className="text-[12px] text-destructive">{errors.experienceYears}</p>
                  ) : null}
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Clinic name
                  </FieldLabel>
                  <Input
                    className={inputClassName}
                    value={form.clinicName}
                    onChange={(e) => setField("clinicName", e.target.value)}
                  />
                  {errors.clinicName ? (
                    <p className="text-[12px] text-destructive">{errors.clinicName}</p>
                  ) : null}
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Clinic location
                  </FieldLabel>
                  <Input
                    className={inputClassName}
                    value={form.clinicLocation}
                    onChange={(e) => setField("clinicLocation", e.target.value)}
                  />
                  {errors.clinicLocation ? (
                    <p className="text-[12px] text-destructive">{errors.clinicLocation}</p>
                  ) : null}
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    About
                  </FieldLabel>
                  <Textarea
                    rows={4}
                    className="rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
                    value={form.about}
                    onChange={(e) => setField("about", e.target.value)}
                  />
                  {errors.about ? (
                    <p className="text-[12px] text-destructive">{errors.about}</p>
                  ) : null}
                </Field>
              </div>
            </div>

            <Separator className="bg-[#E8E6E0]/60" />

            <div>
              <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                Consultation fees
              </h3>
              <p className="mb-3 text-[12px] font-medium text-[#6B7870]">
                Set separate fees for in-clinic and online visits (EGP).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    In-clinic consultation
                  </FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6B7870]">
                      EGP
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className={cn(inputClassName, "pl-11")}
                      value={form.clinicConsultationFee}
                      onChange={(e) =>
                        setField("clinicConsultationFee", Number(e.target.value))
                      }
                    />
                  </div>
                  {errors.clinicConsultationFee ? (
                    <p className="text-[12px] text-destructive">{errors.clinicConsultationFee}</p>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel className="text-[12px] font-semibold text-[#1A1F1E]">
                    Online consultation
                  </FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6B7870]">
                      EGP
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className={cn(inputClassName, "pl-11")}
                      value={form.onlineConsultationFee}
                      onChange={(e) =>
                        setField("onlineConsultationFee", Number(e.target.value))
                      }
                    />
                  </div>
                  {errors.onlineConsultationFee ? (
                    <p className="text-[12px] text-destructive">{errors.onlineConsultationFee}</p>
                  ) : null}
                </Field>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#E8E6E0]/60 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-[#1A5345] text-[13px] font-semibold text-white hover:bg-[#164436]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
