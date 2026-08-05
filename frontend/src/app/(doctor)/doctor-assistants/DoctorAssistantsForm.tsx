"use client"

import { useState } from "react"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

import type {
  DoctorAssistantFieldErrors,
  DoctorAssistantFormValues,
} from "./doctorAssistants.types"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type DoctorAssistantsFormProps = {
  values: DoctorAssistantFormValues
  fieldErrors: DoctorAssistantFieldErrors
  isSubmitting: boolean
  editingMemberId: number | null
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
  updateField,
  submit,
  onCancel,
}: DoctorAssistantsFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const avatars = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

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
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#6B7870]">
            Avatar Profile
          </h3>
          <div className="mb-6 flex flex-wrap gap-4">
            {avatars.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => updateField("avatarUrl", avatar)}
                className={cn(
                  "relative flex size-14 items-center justify-center rounded-full border-2 transition-all hover:scale-105",
                  values.avatarUrl === avatar
                    ? "border-[#1A5345] ring-2 ring-[#1A5345]/20 ring-offset-2"
                    : "border-transparent bg-slate-50 hover:bg-slate-100",
                )}
              >
                <img src={avatar} alt="Avatar option" className="size-full rounded-full object-cover" />
              </button>
            ))}
          </div>
          {fieldErrors.avatarUrl ? (
            <p className="mt-1 text-[11px] text-red-600">{fieldErrors.avatarUrl}</p>
          ) : null}
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

            <Field>
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

            <Field>
              <FieldLabel htmlFor="assistant-password" className="text-[12px] font-bold text-[#1A1F1E]">
                Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="assistant-password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder={
                    editingMemberId
                      ? "Leave blank to keep current password"
                      : "Min. 8 characters"
                  }
                  autoComplete="new-password"
                  className="h-9 rounded-lg border-[#E8E6E0] bg-white pr-9 text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-3.5" aria-hidden />
                  ) : (
                    <EyeIcon className="size-3.5" aria-hidden />
                  )}
                </Button>
              </div>
              {fieldErrors.password ? (
                <p className="text-[11px] text-red-600">{fieldErrors.password}</p>
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
