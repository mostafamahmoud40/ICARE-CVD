"use client"

import { useEffect, useRef } from "react"
import { MailIcon, PencilIcon, Trash2Icon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import type { CreatedStaffMember } from "./addStaff.types"
import type { useAddStaff } from "./useAddStaff"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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

type AddStaffViewModel = ReturnType<typeof useAddStaff>

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate))
}

type RoleBadgeVariant = "doctor" | "assistant"

interface RoleBadgeProps {
  role: RoleBadgeVariant
}

function RoleBadge({ role }: RoleBadgeProps) {
  const variantStyles: Record<RoleBadgeVariant, string> = {
    doctor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    assistant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  }

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${variantStyles[role]}`}>
      {role}
    </span>
  )
}

interface StaffRowProps {
  member: CreatedStaffMember
  onEdit: (member: CreatedStaffMember) => void
  onDelete: (id: number) => void
}

function StaffRow({ member, onEdit, onDelete }: StaffRowProps) {
  const initials = member.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials || "NA"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium">{member.fullName}</span>
              <RoleBadge role={member.role} />
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MailIcon className="size-3.5" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(member)}
            aria-label={`Edit ${member.fullName}`}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(member.id)}
            aria-label={`Delete ${member.fullName}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {member.specialty ? `${member.specialty}` : "General"}
        {member.experienceYears > 0 ? ` · ${member.experienceYears} years exp` : " · New hire"}
        {` · ${formatDateTime(member.createdAt)}`}
      </div>
    </div>
  )
}

export function AddStaff({
  values,
  fieldErrors,
  createdMembers,
  isSubmitting,
  isSuccess,
  submitError,
  editingMemberId,
  updateField,
  submit,
  editMember,
  deleteMember,
}: AddStaffViewModel) {
  const hadSuccess = useRef(false)
  const lastErrorMessage = useRef<string | null>(null)

  useEffect(() => {
    if (isSuccess && !hadSuccess.current) {
      toast.success("Staff member created", {
        description: "The invitation has been generated successfully.",
      })
    }
    hadSuccess.current = isSuccess
  }, [isSuccess])

  useEffect(() => {
    if (submitError && submitError !== lastErrorMessage.current) {
      toast.error("Could not create staff member", {
        description: submitError,
      })
    }
    lastErrorMessage.current = submitError
  }, [submitError])

  const isDoctorRole = values.role === "doctor"

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Doctor or Assistant</CardTitle>
          <CardDescription>
            Create new doctor or assistant accounts. An entry will be added to the system database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            {/* Common Fields - Always Visible */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input
                    id="fullName"
                    value={values.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Dr. Sarah Ahmed"
                    autoComplete="name"
                  />
                  {fieldErrors.fullName ? (
                    <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="name@icare-cvd.com"
                    autoComplete="email"
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
                  <Input
                    id="phoneNumber"
                    value={values.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                    placeholder="+20 100 000 0000"
                    autoComplete="tel"
                  />
                  {fieldErrors.phoneNumber ? (
                    <p className="text-xs text-destructive">{fieldErrors.phoneNumber}</p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={values.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  {fieldErrors.password ? (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  ) : null}
                </Field>
              </div>
            </div>

            <Separator />

            {/* Role Tabs */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Role & Specialization</h3>
              <div className="mb-4 flex gap-2 border-b">
                {(["doctor", "assistant"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => updateField("role", role)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      values.role === role
                        ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                        : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {role === "doctor" ? "Doctor" : "Assistant"}
                  </button>
                ))}
              </div>

              {/* Doctor Fields */}
              {isDoctorRole && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="specialty">Specialty (required)</FieldLabel>
                    <Input
                      id="specialty"
                      value={values.specialty}
                      onChange={(e) => updateField("specialty", e.target.value)}
                      placeholder="Interventional cardiology"
                    />
                    {fieldErrors.specialty ? (
                      <p className="text-xs text-destructive">{fieldErrors.specialty}</p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="experienceYears">Experience (years)</FieldLabel>
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
                      placeholder="5"
                    />
                    {fieldErrors.experienceYears ? (
                      <p className="text-xs text-destructive">{fieldErrors.experienceYears}</p>
                    ) : null}
                  </Field>
                </div>
              )}

              {/* Assistant Fields */}
              {!isDoctorRole && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="specialty">Department (optional)</FieldLabel>
                    <Input
                      id="specialty"
                      value={values.specialty}
                      onChange={(e) => updateField("specialty", e.target.value)}
                      placeholder="e.g., Cardiology Support"
                    />
                    {fieldErrors.specialty ? (
                      <p className="text-xs text-destructive">{fieldErrors.specialty}</p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="experienceYears">Experience (years, optional)</FieldLabel>
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
                    />
                    {fieldErrors.experienceYears ? (
                      <p className="text-xs text-destructive">{fieldErrors.experienceYears}</p>
                    ) : null}
                  </Field>
                </div>
              )}
            </div>

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingMemberId
                    ? "Saving..."
                    : "Creating..."
                  : editingMemberId
                    ? "Save changes"
                    : "Create account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Created</CardTitle>
          <CardDescription>Latest doctor and assistant accounts from this session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {createdMembers.length === 0 ? (
            <Empty className="border-border/60 bg-muted/10 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserIcon className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No staff members yet</EmptyTitle>
                <EmptyDescription>
                  Doctor and assistant accounts will appear here after creation.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            createdMembers.map((member, index) => (
              <div key={member.id}>
                {index !== 0 ? <Separator className="my-3" /> : null}
                <StaffRow member={member} onEdit={editMember} onDelete={deleteMember} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  )
}
