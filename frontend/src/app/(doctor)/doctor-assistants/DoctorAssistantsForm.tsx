"use client"

import { useRef } from "react"
import { CameraIcon, Loader2Icon, UserRoundIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { validatePatientAvatarFile } from "@/lib/uploads/avatar-validation"

import type {
  DoctorAssistantFieldErrors,
  DoctorAssistantFormValues,
} from "./doctorAssistants.types"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const AVATAR_OPTIONS = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

type DoctorAssistantsFormProps = {
  values: DoctorAssistantFormValues
  fieldErrors: DoctorAssistantFieldErrors
  isSubmitting: boolean
  editingMemberId: number | null
  pendingAvatarFile: File | null
  avatarPreviewUrl: string | null
  onAvatarFileSelect: (file: File | null) => void
  onAvatarPresetSelect: (url: string) => void
  onClearAvatar: () => void
  updateField: <T extends keyof DoctorAssistantFormValues>(
    field: T,
    value: DoctorAssistantFormValues[T],
  ) => void
  submit: () => void
  onCancel: () => void
}

export function DoctorAssistantsForm({
  values,
  fieldErrors,
  isSubmitting,
  editingMemberId,
  pendingAvatarFile,
  avatarPreviewUrl,
  onAvatarFileSelect,
  onAvatarPresetSelect,
  onClearAvatar,
  updateField,
  submit,
  onCancel,
}: DoctorAssistantsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayAvatarSrc = avatarPreviewUrl || values.avatarUrl || null

  const handleAvatarFileChange = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      validatePatientAvatarFile(file)
      onAvatarFileSelect(file)
    } catch (err) {
      onAvatarFileSelect(null)
      toast.error("Invalid profile photo", {
        description: err instanceof Error ? err.message : "Please try another image.",
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="space-y-6 px-6 py-5">
        <div>
          <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
            Avatar profile
          </h3>
          <p className="mb-3 text-[12px] text-muted-foreground">
            Choose a preset avatar or upload a photo (JPEG, PNG, WebP, or GIF, max 5 MB).
          </p>

          <div className="flex flex-col gap-4 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
              <div className="relative size-20 overflow-hidden rounded-full border-2 border-[#E8E6E0] bg-white shadow-sm">
                {displayAvatarSrc ? (
                  <img src={displayAvatarSrc} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-slate-50">
                    <UserRoundIcon className="size-9 text-slate-300" aria-hidden />
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
                disabled={isSubmitting}
              >
                <CameraIcon className="mr-1.5 size-3.5" aria-hidden />
                Upload photo
              </Button>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onClearAvatar}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full border-2 bg-slate-50 transition-colors",
                    !displayAvatarSrc
                      ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                      : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                  )}
                  aria-label="No profile photo"
                >
                  <UserRoundIcon className="size-5 text-slate-400" />
                </button>
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => onAvatarPresetSelect(avatar)}
                    className={cn(
                      "size-12 overflow-hidden rounded-full border-2 transition-colors",
                      values.avatarUrl === avatar && !pendingAvatarFile
                        ? "border-[#1A5345] ring-2 ring-[#1A5345]/20"
                        : "border-[#E8E6E0] hover:border-[#1A5345]/40",
                    )}
                  >
                    <img src={avatar} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              {fieldErrors.avatarUrl ? (
                <p className="text-[11px] text-red-600">{fieldErrors.avatarUrl}</p>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="bg-[#E8E6E0]/60" />

        <div>
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
            Basic information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="assistant-fullName" className="text-[12px] font-bold text-[#1A1F1E]">
                Full name
              </FieldLabel>
              <Input
                id="assistant-fullName"
                value={values.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Nour Hassan"
                autoComplete="name"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.fullName ? (
                <p className="text-[11px] text-red-600">{fieldErrors.fullName}</p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="assistant-email" className="text-[12px] font-bold text-[#1A1F1E]">
                Email
              </FieldLabel>
              <Input
                id="assistant-email"
                type="email"
                value={values.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="assistant@icare-cvd.com"
                autoComplete="email"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.email ? (
                <p className="text-[11px] text-red-600">{fieldErrors.email}</p>
              ) : null}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="assistant-phoneNumber" className="text-[12px] font-bold text-[#1A1F1E]">
                Phone number
              </FieldLabel>
              <Input
                id="assistant-phoneNumber"
                value={values.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                placeholder="+20 100 000 0000"
                autoComplete="tel"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.phoneNumber ? (
                <p className="text-[11px] text-red-600">{fieldErrors.phoneNumber}</p>
              ) : null}
            </Field>
          </div>
        </div>

        <Separator className="bg-[#E8E6E0]/60" />

        <div>
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
            Department &amp; experience
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="assistant-department" className="text-[12px] font-bold text-[#1A1F1E]">
                Department
              </FieldLabel>
              <Input
                id="assistant-department"
                value={values.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="Cardiology clinic"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.department ? (
                <p className="text-[11px] text-red-600">{fieldErrors.department}</p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="assistant-experienceYears" className="text-[12px] font-bold text-[#1A1F1E]">
                Years of experience
              </FieldLabel>
              <Input
                id="assistant-experienceYears"
                type="number"
                min={0}
                max={60}
                value={values.experienceYears}
                onChange={(e) =>
                  updateField(
                    "experienceYears",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="0"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.experienceYears ? (
                <p className="text-[11px] text-red-600">{fieldErrors.experienceYears}</p>
              ) : null}
            </Field>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#E8E6E0]/60 bg-[#FAFAF8] px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 rounded-lg border-0 bg-transparent px-4 text-[12px] font-bold text-[#6B7870] shadow-none hover:bg-[#F4F3ED] hover:text-[#1A1F1E]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 gap-2 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : editingMemberId ? (
            "Save changes"
          ) : (
            "Add assistant"
          )}
        </Button>
      </div>
    </form>
  )
}
