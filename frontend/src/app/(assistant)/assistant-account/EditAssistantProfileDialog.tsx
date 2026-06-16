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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { assistantProfileEditSchema } from "./assistantAccount.schema"
import type { AssistantProfileEditValues } from "./assistantAccount.schema"
import { useAssistantAccountTranslations } from "./account-i18n"

const DEPARTMENT_OPTIONS = [
  "Cardiology",
  "Internal Medicine",
  "Endocrinology",
  "Nephrology",
  "General Practice",
] as const

const DEPARTMENT_LABEL_KEYS: Record<(typeof DEPARTMENT_OPTIONS)[number], string> = {
  Cardiology: "Cardiology",
  "Internal Medicine": "InternalMedicine",
  Endocrinology: "Endocrinology",
  Nephrology: "Nephrology",
  "General Practice": "GeneralPractice",
}

const AVATAR_OPTIONS = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

const inputClassName =
  "h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"

type EditAssistantProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: AssistantProfileEditValues
  onSubmit: (values: AssistantProfileEditValues) => Promise<void>
  isPending: boolean
}

type FieldErrors = Partial<Record<keyof AssistantProfileEditValues, string>>

export function EditAssistantProfileDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isPending,
}: EditAssistantProfileDialogProps) {
  const { t } = useAssistantAccountTranslations()
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      const avatarUrl =
        initialValues.avatarUrl && AVATAR_OPTIONS.includes(initialValues.avatarUrl)
          ? initialValues.avatarUrl
          : undefined
      setForm({ ...initialValues, avatarUrl })
      setErrors({})
    }
  }, [open, initialValues])

  const setField = <K extends keyof AssistantProfileEditValues>(
    key: K,
    value: AssistantProfileEditValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = assistantProfileEditSchema.safeParse(form)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrors({
        fullName: flat.fullName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        department: flat.department?.[0],
        experienceYears: flat.experienceYears?.[0],
        avatarUrl: flat.avatarUrl?.[0],
      })
      return
    }
    await onSubmit(parsed.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] p-0 shadow-[0_20px_60px_-12px_rgba(26,83,69,0.18)] sm:max-w-[560px]">
        <DialogHeader className="border-b border-[#E8E6E0]/60 bg-white px-6 py-4 text-start">
          <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
            {t("editDialog.title")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="space-y-6 px-6 py-5">
            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                {t("editDialog.avatarSection")}
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
                        ? "border-[#1A5345] ring-2 ring-[#1A5345]/20 ring-offset-2"
                        : "border-transparent bg-slate-50 hover:bg-slate-100",
                    )}
                  >
                    <img src={avatar} alt={t("editDialog.avatarOption")} className="size-full rounded-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {form.avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setField("avatarUrl", undefined)}
                    className="h-8 px-2 text-[12px] font-semibold text-[#6B7870] hover:text-[#1A1F1E]"
                  >
                    {t("editDialog.removePhoto")}
                  </Button>
                ) : (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t("editDialog.noPhoto")}
                  </p>
                )}
              </div>
              {errors.avatarUrl ? (
                <p className="mt-1 text-[11px] text-red-600">{errors.avatarUrl}</p>
              ) : null}
            </div>

            <Separator className="bg-[#E8E6E0]/60" />

            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                {t("editDialog.basicInfo")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-full-name" className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("editDialog.fullName")}
                  </FieldLabel>
                  <Input
                    id="edit-full-name"
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    placeholder={t("editDialog.fullNamePlaceholder")}
                    autoComplete="name"
                    className={inputClassName}
                  />
                  {errors.fullName ? (
                    <p className="text-[11px] text-red-600">{errors.fullName}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-email" className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("editDialog.email")}
                  </FieldLabel>
                  <Input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder={t("editDialog.emailPlaceholder")}
                    autoComplete="email"
                    className={inputClassName}
                  />
                  {errors.email ? (
                    <p className="text-[11px] text-red-600">{errors.email}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-phone" className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("editDialog.phone")}
                  </FieldLabel>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder={t("editDialog.phonePlaceholder")}
                    autoComplete="tel"
                    className={inputClassName}
                  />
                  {errors.phone ? (
                    <p className="text-[11px] text-red-600">{errors.phone}</p>
                  ) : null}
                </Field>
              </div>
            </div>

            <Separator className="bg-[#E8E6E0]/60" />

            <div>
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
                {t("editDialog.professionalDetails")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("editDialog.department")}
                  </FieldLabel>
                  <Select value={form.department} onValueChange={(v) => setField("department", v)}>
                    <SelectTrigger className="h-9 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[13px] font-medium text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0">
                      <SelectValue placeholder={t("editDialog.selectDepartment")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem
                          key={dept}
                          value={dept}
                          className="cursor-pointer text-[12px] font-bold text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]"
                        >
                          {t(`editDialog.departments.${DEPARTMENT_LABEL_KEYS[dept]}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department ? (
                    <p className="text-[11px] text-red-600">{errors.department}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-experience" className="text-[12px] font-bold text-[#1A1F1E]">
                    {t("editDialog.experienceYears")}
                  </FieldLabel>
                  <Input
                    id="edit-experience"
                    type="number"
                    min={0}
                    max={50}
                    value={form.experienceYears}
                    onChange={(e) => setField("experienceYears", Number(e.target.value))}
                    placeholder={t("editDialog.experiencePlaceholder")}
                    className={inputClassName}
                  />
                  {errors.experienceYears ? (
                    <p className="text-[11px] text-red-600">{errors.experienceYears}</p>
                  ) : null}
                </Field>
              </div>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                {t("editDialog.immutableFields")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#E8E6E0]/60 bg-[#FAFAF8] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-8 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]"
            >
              {t("editDialog.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            >
              {isPending ? <Loader2Icon className="size-3.5 animate-spin" aria-hidden /> : null}
              {isPending ? t("editDialog.saving") : t("editDialog.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
