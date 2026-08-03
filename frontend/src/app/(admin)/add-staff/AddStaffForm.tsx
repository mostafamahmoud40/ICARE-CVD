"use client"

import { Loader2Icon } from "lucide-react"

import type {
  AddStaffFieldErrors,
  AddStaffFormValues,
  DoctorAcceptedVisitModes,
} from "./addStaff.types"
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

type AddStaffFormProps = {
  values: AddStaffFormValues
  fieldErrors: AddStaffFieldErrors
  isSubmitting: boolean
  editingMemberId: number | null
  updateField: <T extends keyof AddStaffFormValues>(field: T, value: AddStaffFormValues[T]) => void
  submit: () => void
  onCancel: () => void
}

const VISIT_MODE_OPTIONS: { value: DoctorAcceptedVisitModes; label: string }[] = [
  { value: "clinic", label: "Clinic only" },
  { value: "virtual", label: "Online only" },
  { value: "both", label: "Clinic & online" },
]

export function AddStaffForm({
  values,
  fieldErrors,
  isSubmitting,
  editingMemberId,
  updateField,
  submit,
  onCancel,
}: AddStaffFormProps) {
  const isDoctorRole = values.role === "doctor"

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
              <FieldLabel htmlFor="fullName" className="text-[12px] font-bold text-[#1A1F1E]">
                Full name
              </FieldLabel>
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Dr. Sarah Ahmed"
                autoComplete="name"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.fullName ? (
                <p className="text-[11px] text-red-600">{fieldErrors.fullName}</p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="email" className="text-[12px] font-bold text-[#1A1F1E]">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="name@icare-cvd.com"
                autoComplete="email"
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.email ? (
                <p className="text-[11px] text-red-600">{fieldErrors.email}</p>
              ) : null}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="phoneNumber" className="text-[12px] font-bold text-[#1A1F1E]">
                Phone number
              </FieldLabel>
              <Input
                id="phoneNumber"
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
            Role &amp; specialization
          </h3>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["doctor", "assistant"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateField("role", role)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[12px] font-bold transition-colors",
                    values.role === role
                      ? role === "doctor"
                        ? "bg-[#1A5345] text-white shadow-sm"
                        : "bg-[#CC5533] text-white shadow-sm"
                      : "border border-[#E8E6E0] bg-white text-muted-foreground hover:bg-[#F9F8F5]",
                  )}
                >
                  {role === "doctor" ? "Doctor" : "Assistant"}
                </button>
              ))}
            </div>

            {isDoctorRole ? (
              <div className="flex w-full flex-col gap-1 sm:ml-auto sm:w-auto sm:items-end">
                <Select
                  value={values.acceptedVisitModes}
                  onValueChange={(v) =>
                    updateField("acceptedVisitModes", v as DoctorAcceptedVisitModes)
                  }
                >
                  <SelectTrigger
                    id="acceptedVisitModes"
                    className="h-9 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[220px]"
                  >
                    <SelectValue placeholder="Visit types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                    {VISIT_MODE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="cursor-pointer text-[12px] font-bold text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.acceptedVisitModes ? (
                  <p className="text-[11px] text-red-600">{fieldErrors.acceptedVisitModes}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="specialty" className="text-[12px] font-bold text-[#1A1F1E]">
                {isDoctorRole ? "Specialty (required)" : "Department (optional)"}
              </FieldLabel>
              <Input
                id="specialty"
                value={values.specialty}
                onChange={(e) => updateField("specialty", e.target.value)}
                placeholder={
                  isDoctorRole ? "Interventional cardiology" : "e.g. Cardiology support"
                }
                className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[13px] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20"
              />
              {fieldErrors.specialty ? (
                <p className="text-[11px] text-red-600">{fieldErrors.specialty}</p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="experienceYears" className="text-[12px] font-bold text-[#1A1F1E]">
                Experience (years)
              </FieldLabel>
              <Input
                id="experienceYears"
                type="number"
                min={0}
                max={60}
                value={values.experienceYears}
                onChange={(e) => {
                  const val = e.target.value
                  updateField("experienceYears", val === "" ? "" : parseInt(val, 10))
                }}
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
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="h-8 gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          {isSubmitting ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          {isSubmitting
            ? editingMemberId
              ? "Saving…"
              : "Creating…"
            : editingMemberId
              ? "Save changes"
              : "Create account"}
        </Button>
      </div>
    </form>
  )
}
