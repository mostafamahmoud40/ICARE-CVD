"use client"

import { useEffect, useRef, useState } from "react"
import {
  CameraIcon,
  DropletIcon,
  FolderOpenIcon,
  HeartIcon,
  PlusIcon,
  SaveIcon,
  UserIcon,
  UserRoundIcon,
} from "lucide-react"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import { cn } from "@/lib/utils"

import type { useAddPatient } from "./useAddPatient"
import { validatePatientAvatarFile } from "./addPatient.upload"
import { PATIENT_EXERCISE_FREQUENCY_OPTIONS } from "@/lib/patient-exercise-frequency"
import { PATIENT_AVATAR_OPTIONS } from "@/app/(doctor)/doctor-patients/patientProfile.constants"
import { Button } from "@/components/ui/button"
import { AddPatientDocumentsSection } from "./AddPatientDocumentsSection"
import { AddPatientDraftsDialog } from "./AddPatientDraftsDialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AddPatientViewModel = ReturnType<typeof useAddPatient>

type AddPatientProps = AddPatientViewModel & {
  onSuccess?: () => void
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null
  return <p className="text-xs text-[#E15C5C]">{message}</p>
}

function SectionHeader({
  icon: Icon,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  accent?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex size-8 items-center justify-center rounded-full"
        style={{
          background: accent === "orange" ? "#E8904218" : "#1A534518",
        }}
      >
        <Icon
          className="size-4"
          style={{ color: accent === "orange" ? "#E89042" : "#1A5345" }}
        />
      </div>
      <h3
        className="text-sm font-bold tracking-tight"
        style={{ color: "#1A5345" }}
      >
        {label}
      </h3>
    </div>
  )
}

function PersonalInfoSection({ vm }: { vm: AddPatientViewModel }) {
  const {
    values,
    fieldErrors,
    updateField,
    pendingAvatarFile,
    setAvatarFile,
    setAvatarPreset,
    clearAvatar,
  } = vm
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingAvatarFile) {
      setAvatarPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pendingAvatarFile)
    setAvatarPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingAvatarFile])

  const displayAvatarSrc = avatarPreviewUrl || values.avatarUrl || null

  const handleAvatarFileChange = (fileList: FileList | null) => {
    const file = fileList?.item(0)
    if (!file) return
    try {
      validatePatientAvatarFile(file)
      setAvatarFile(file)
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

  return (
    <div className="space-y-5">
      <SectionHeader icon={UserIcon} label="Personal Information" />

      <div className="flex flex-col gap-4 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-4 sm:flex-row sm:items-start sm:p-5">
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
          >
            <CameraIcon className="mr-1.5 size-3.5" aria-hidden />
            Upload photo
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <FieldLabel className="text-[12px] font-bold text-[#374151]">Profile photo</FieldLabel>
          <p className="text-[12px] text-muted-foreground">
            Choose a preset avatar or upload a photo (JPEG, PNG, WebP, or GIF, max 5 MB).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearAvatar}
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
            {PATIENT_AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => setAvatarPreset(avatar)}
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="fullName" style={{ color: "#374151" }}>
            Full name
          </FieldLabel>
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Ahmed Mohamed"
            autoComplete="name"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.fullName} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email" style={{ color: "#374151" }}>
            Email
          </FieldLabel>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="patient@example.com"
            autoComplete="email"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.email} />
        </Field>

        <Field>
          <FieldLabel htmlFor="phoneNumber" style={{ color: "#374151" }}>
            Phone number
          </FieldLabel>
          <Input
            id="phoneNumber"
            value={values.phoneNumber}
            onChange={(e) => updateField("phoneNumber", e.target.value)}
            placeholder="+20 100 000 0000"
            autoComplete="tel"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.phoneNumber} />
        </Field>

        <Field>
          <FieldLabel htmlFor="dateOfBirth" style={{ color: "#374151" }}>
            Date of birth
          </FieldLabel>
          <Input
            id="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.dateOfBirth} />
        </Field>

        <Field>
          <FieldLabel htmlFor="gender" style={{ color: "#374151" }}>
            Gender
          </FieldLabel>
          <Select
            value={values.gender}
            onValueChange={(v) => updateField("gender", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.gender} />
        </Field>

        <Field>
          <FieldLabel htmlFor="nationalId" style={{ color: "#374151" }}>
            National ID
          </FieldLabel>
          <Input
            id="nationalId"
            value={values.nationalId}
            onChange={(e) => updateField("nationalId", e.target.value)}
            placeholder="National identification number"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.nationalId} />
        </Field>

        <Field>
          <FieldLabel htmlFor="maritalStatus" style={{ color: "#374151" }}>
            Marital status
          </FieldLabel>
          <Select
            value={values.maritalStatus}
            onValueChange={(v) => updateField("maritalStatus", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.maritalStatus} />
        </Field>

        <Field>
          <FieldLabel htmlFor="occupation" style={{ color: "#374151" }}>
            Occupation
          </FieldLabel>
          <Input
            id="occupation"
            value={values.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
            placeholder="e.g. Civil Engineer"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.occupation} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="address" style={{ color: "#374151" }}>
          Address
        </FieldLabel>
        <Input
          id="address"
          value={values.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="Street, city, governorate"
          className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
        />
      </Field>
    </div>
  )
}

function PhysicalDetailsSection({ vm }: { vm: AddPatientViewModel }) {
  const { values, fieldErrors, updateField } = vm

  return (
    <div className="space-y-5">
      <SectionHeader icon={DropletIcon} label="Physical Details" accent="orange" />
      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel style={{ color: "#374151" }}>Blood type</FieldLabel>
          <Select
            value={values.bloodType}
            onValueChange={(v) => updateField("bloodType", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select blood type" />
            </SelectTrigger>
            <SelectContent>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                <SelectItem key={bt} value={bt}>
                  {bt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="heightCm" style={{ color: "#374151" }}>
            Height (cm)
          </FieldLabel>
          <Input
            id="heightCm"
            type="number"
            min={50}
            max={250}
            value={values.heightCm}
            onChange={(e) => updateField("heightCm", e.target.value)}
            placeholder="170"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.heightCm} />
        </Field>

        <Field>
          <FieldLabel htmlFor="weightKg" style={{ color: "#374151" }}>
            Weight (kg)
          </FieldLabel>
          <Input
            id="weightKg"
            type="number"
            min={10}
            max={300}
            value={values.weightKg}
            onChange={(e) => updateField("weightKg", e.target.value)}
            placeholder="75"
            className="rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
          <FieldError message={fieldErrors.weightKg} />
        </Field>
      </div>
    </div>
  )
}

function LifestyleSection({ vm }: { vm: AddPatientViewModel }) {
  const { values, updateField } = vm

  return (
    <div className="space-y-5">
      <SectionHeader icon={HeartIcon} label="Lifestyle Factors" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field>
          <FieldLabel style={{ color: "#374151" }}>Smoking status</FieldLabel>
          <Select
            value={values.smokingStatus}
            onValueChange={(v) => updateField("smokingStatus", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never smoked</SelectItem>
              <SelectItem value="former">Former smoker</SelectItem>
              <SelectItem value="current">Current smoker</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Alcohol consumption</FieldLabel>
          <Select
            value={values.alcoholConsumption}
            onValueChange={(v) => updateField("alcoholConsumption", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="occasional">Occasional</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="heavy">Heavy</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Exercise frequency</FieldLabel>
          <Select
            value={values.exerciseFrequency}
            onValueChange={(v) => updateField("exerciseFrequency", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {PATIENT_EXERCISE_FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Stress level</FieldLabel>
          <Select
            value={values.stressLevel}
            onValueChange={(v) => updateField("stressLevel", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}

export function AddPatient({
  values,
  fieldErrors,
  patients,
  isLoadingPatients,
  isSubmitting,
  isSuccess,
  submitError,
  createResult,
  updateField,
  pendingDocuments,
  pendingAvatarFile,
  documentStudyKind,
  setDocumentStudyKind,
  setAvatarFile,
  setAvatarPreset,
  clearAvatar,
  addPendingFiles,
  removePendingDocument,
  addMedication,
  updateMedication,
  removeMedication,
  addAllergy,
  updateAllergy,
  removeAllergy,
  reset,
  saveDraft,
  restoreDraft,
  removeDraft,
  drafts,
  activeDraftId,
  submit,
  onSuccess,
}: AddPatientProps) {
  const hadSuccess = useRef(false)
  const lastErrorMessage = useRef<string | null>(null)
  const [draftsOpen, setDraftsOpen] = useState(false)

  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) ?? null

  const vm: AddPatientViewModel = {
    values,
    fieldErrors,
    patients,
    isLoadingPatients,
    isSubmitting,
    isSuccess,
    submitError,
    createResult,
    updateField,
    pendingDocuments,
    pendingAvatarFile,
    documentStudyKind,
    setDocumentStudyKind,
    setAvatarFile,
    setAvatarPreset,
    clearAvatar,
    addPendingFiles,
    removePendingDocument,
    addMedication,
    updateMedication,
    removeMedication,
    addAllergy,
    updateAllergy,
    removeAllergy,
    reset,
    saveDraft,
    restoreDraft,
    removeDraft,
    drafts,
    activeDraftId,
    submit,
  }

  useEffect(() => {
    if (isSuccess && !hadSuccess.current) {
      if (createResult?.credentialsEmailSent) {
        showIcareSuccessToast(
          "Patient registered",
          "The patient record was created and login credentials were sent by email.",
        )
      } else {
        showIcareSuccessToast(
          "Patient registered",
          "The patient record was created successfully.",
        )
        showIcareErrorToast(
          "Login email not sent",
          createResult?.credentialsEmailError ??
            "Check BREVO_API_KEY and BREVO_FROM_EMAIL in backend/.env, then restart the API.",
        )
      }
      onSuccess?.()
    }
    hadSuccess.current = isSuccess
  }, [isSuccess, createResult, onSuccess])

  useEffect(() => {
    if (submitError && submitError !== lastErrorMessage.current) {
      showIcareErrorToast("Could not register patient", submitError)
    }
    lastErrorMessage.current = submitError
  }, [submitError])

  return (
    <div className="flex h-full flex-col bg-[#F9F8F5]">
      {/* Sticky Header */}
      <div className="flex-none border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/95 px-8 pt-8 pb-5 backdrop-blur-md z-20">
        <h2 className="text-[28px] font-bold tracking-tight text-[#1A1F1E] font-serif pr-8">Register New Patient</h2>
        <p className="mt-1.5 text-[14px] font-medium text-muted-foreground">
          Enter the patient&apos;s personal details and optional documents to create a new record.
        </p>
        {drafts.length > 0 ? (
          <button
            type="button"
            onClick={() => setDraftsOpen(true)}
            className="mt-3 text-[13px] font-semibold text-[#1A5345] hover:underline"
          >
            {drafts.length} saved draft{drafts.length === 1 ? "" : "s"} — open to restore
          </button>
        ) : null}
        {activeDraft ? (
          <p className="mt-2 text-[12px] font-medium text-[#6B7870]">
            Editing draft: <span className="text-[#1A1F1E]">{activeDraft.label}</span>
          </p>
        ) : null}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <form
          id="add-patient-form"
          className="space-y-8 max-w-4xl mx-auto"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E8E6E0]/60 transition-all hover:shadow-md hover:border-[#1A5345]/10">
            <PersonalInfoSection vm={vm} />
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E8E6E0]/60 transition-all hover:shadow-md hover:border-[#1A5345]/10">
            <PhysicalDetailsSection vm={vm} />
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E8E6E0]/60 transition-all hover:shadow-md hover:border-[#1A5345]/10">
            <LifestyleSection vm={vm} />
          </div>

          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E8E6E0]/60 transition-all hover:shadow-md hover:border-[#1A5345]/10">
            <AddPatientDocumentsSection
              pendingDocuments={pendingDocuments}
              studyKind={documentStudyKind}
              onStudyKindChange={setDocumentStudyKind}
              onAddFiles={addPendingFiles}
              onRemove={removePendingDocument}
              isUploading={isSubmitting}
            />
          </div>
        </form>
      </div>

      {/* Sticky Footer */}
      <div className="flex-none border-t border-[#E8E6E0]/60 bg-white px-8 py-5 z-20 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <p className="text-[13px] font-medium text-muted-foreground hidden sm:block">
          Save a draft anytime and restore it later. Files are not stored in drafts.
        </p>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#E8E6E0]/80 h-10 px-5 text-[14px] font-semibold text-[#1A1F1E] hover:bg-slate-50 transition-all shadow-sm"
            onClick={() => setDraftsOpen(true)}
          >
            <FolderOpenIcon className="mr-1.5 size-4" aria-hidden />
            Drafts{drafts.length > 0 ? ` (${drafts.length})` : ""}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#E8E6E0]/80 h-10 px-5 text-[14px] font-semibold text-[#1A5345] hover:bg-[#1A5345]/5 transition-all shadow-sm"
            onClick={() => {
              const result = saveDraft()
              if (!result.ok && result.reason === "empty") {
                showIcareErrorToast("Nothing to save", "Fill in at least one field before saving a draft.")
                return
              }
              showIcareSuccessToast("Draft saved", "You can restore this registration later from Drafts.")
            }}
          >
            <SaveIcon className="mr-1.5 size-4" aria-hidden />
            Save draft
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#E8E6E0]/80 h-10 px-6 text-[14px] font-semibold text-[#1A1F1E] hover:bg-slate-50 transition-all shadow-sm"
            onClick={() => reset()}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            form="add-patient-form"
            disabled={isSubmitting}
            className="h-10 gap-2 rounded-full bg-[#1A5345] px-6 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(26,83,69,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#133F34] hover:shadow-[0_6px_20px_rgba(26,83,69,0.25)] border-0 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <PlusIcon className="size-4" strokeWidth={2.5} />
            {isSubmitting
              ? pendingDocuments.length > 0
                ? "Registering & uploading..."
                : "Registering..."
              : "Register Patient"}
          </Button>
        </div>
      </div>

      <AddPatientDraftsDialog
        open={draftsOpen}
        onOpenChange={setDraftsOpen}
        drafts={drafts}
        activeDraftId={activeDraftId}
        onRestore={(draftId) => {
          const result = restoreDraft(draftId)
          if (!result.ok) {
            showIcareErrorToast("Draft not found", "This draft may have been deleted.")
            return
          }
          setDraftsOpen(false)
          showIcareSuccessToast("Draft restored", "Continue editing and register when ready.")
        }}
        onDelete={(draftId) => {
          removeDraft(draftId)
          showIcareSuccessToast("Draft deleted", "The saved draft was removed.")
        }}
      />
    </div>
  )
}
