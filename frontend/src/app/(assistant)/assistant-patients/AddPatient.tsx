"use client"

import { useEffect, useRef } from "react"
import {
  CalendarIcon,
  DropletIcon,
  HeartIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"

import type { useAddPatient } from "./useAddPatient"
import type { AllergyItem, MedicationItem } from "./addPatient.types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const { values, fieldErrors, updateField } = vm

  return (
    <div className="space-y-5">
      <SectionHeader icon={UserIcon} label="Personal Information" />
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
              <SelectItem value="sedentary">Sedentary</SelectItem>
              <SelectItem value="light">Light (1-2 days/week)</SelectItem>
              <SelectItem value="moderate">Moderate (3-4 days/week)</SelectItem>
              <SelectItem value="active">Active (5+ days/week)</SelectItem>
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

function MedicationCard({
  med,
  onUpdate,
  onRemove,
}: {
  med: MedicationItem
  onUpdate: (field: keyof MedicationItem, value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel style={{ color: "#374151" }}>Medication name</FieldLabel>
          <Input
            value={med.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            placeholder="e.g. Metformin"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Dose</FieldLabel>
          <Input
            value={med.dose}
            onChange={(e) => onUpdate("dose", e.target.value)}
            placeholder="e.g. 500 mg"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Frequency</FieldLabel>
          <Input
            value={med.frequency}
            onChange={(e) => onUpdate("frequency", e.target.value)}
            placeholder="e.g. Twice daily"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Type</FieldLabel>
          <Select value={med.type} onValueChange={(v) => onUpdate("type", v)}>
            <SelectTrigger className="rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="antihypertensives">Antihypertensives</SelectItem>
              <SelectItem value="antiplatelets">Antiplatelets</SelectItem>
              <SelectItem value="anticoagulants">Anticoagulants</SelectItem>
              <SelectItem value="statins">Statins</SelectItem>
              <SelectItem value="antiarrhythmics">Antiarrhythmics</SelectItem>
              <SelectItem value="diuretics">Diuretics</SelectItem>
              <SelectItem value="diabetes_medications">Diabetes medications</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Compliance (optional)</FieldLabel>
          <Select value={med.compliance} onValueChange={(v) => onUpdate("compliance", v)}>
            <SelectTrigger className="rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select compliance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Side effects (optional)</FieldLabel>
          <Input
            value={med.sideEffects}
            onChange={(e) => onUpdate("sideEffects", e.target.value)}
            placeholder="e.g. Nausea"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
          onClick={onRemove}
        >
          <Trash2Icon className="size-4" />
          Remove medication
        </Button>
      </div>
    </div>
  )
}

function AllergyCard({
  allergy,
  onUpdate,
  onRemove,
}: {
  allergy: AllergyItem
  onUpdate: (field: keyof AllergyItem, value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel style={{ color: "#374151" }}>Category</FieldLabel>
          <Select value={allergy.category} onValueChange={(v) => onUpdate("category", v)}>
            <SelectTrigger className="rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drug">Drug</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Allergen</FieldLabel>
          <Input
            value={allergy.allergen}
            onChange={(e) => onUpdate("allergen", e.target.value)}
            placeholder="e.g. Penicillin, Peanuts"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>

        <Field>
          <FieldLabel style={{ color: "#374151" }}>Reaction (optional)</FieldLabel>
          <Input
            value={allergy.reaction}
            onChange={(e) => onUpdate("reaction", e.target.value)}
            placeholder="e.g. Rash, Anaphylaxis"
            className="rounded-xl border-gray-200 bg-white"
          />
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
          onClick={onRemove}
        >
          <Trash2Icon className="size-4" />
          Remove allergy
        </Button>
      </div>
    </div>
  )
}

function MedicalInfoSection({ vm }: { vm: AddPatientViewModel }) {
  const {
    values,
    fieldErrors,
    updateField,
    addMedication,
    updateMedication,
    removeMedication,
    addAllergy,
    updateAllergy,
    removeAllergy,
  } = vm

  return (
    <div className="space-y-5">
      <SectionHeader icon={CalendarIcon} label="Medical Information" />
      <div className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="chiefComplaint" style={{ color: "#374151" }}>
            Chief complaint
          </FieldLabel>
          <Select
            value={values.chiefComplaint}
            onValueChange={(v) => updateField("chiefComplaint", v)}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Select chief complaint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chest-pain">Chest pain</SelectItem>
              <SelectItem value="dyspnea">Dyspnea (Shortness of breath)</SelectItem>
              <SelectItem value="palpitations">Palpitations (Awareness of heart beats)</SelectItem>
              <SelectItem value="syncope">Syncope / presyncope (Loss of consciousness / dizziness)</SelectItem>
              <SelectItem value="leg-swelling">Leg swelling</SelectItem>
              <SelectItem value="fatigue">Fatigue / exercise intolerance</SelectItem>
              <SelectItem value="constitutional-infective">Constitutional / Infective symptoms</SelectItem>
              <SelectItem value="peripheral-vascular">Peripheral vascular symptoms</SelectItem>
              <SelectItem value="hepatic-congestion">Hepatic congestion</SelectItem>
              <SelectItem value="jaundice">Jaundice</SelectItem>
              <SelectItem value="cyanosis">Cyanosis</SelectItem>
              <SelectItem value="systemic-embolization">Systemic embolization</SelectItem>
              <SelectItem value="neurological">Neurological symptoms</SelectItem>
              <SelectItem value="hypertension">Hypertension follow-up</SelectItem>
              <SelectItem value="post-procedure">Post-procedure</SelectItem>
              <SelectItem value="post-discharge">Post discharge follow-up</SelectItem>
              <SelectItem value="murmur">Murmur detected</SelectItem>
              <SelectItem value="abnormal-ecg">Abnormal ECG / Echo / CT</SelectItem>
              <SelectItem value="other">Other (specify)</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.chiefComplaint} />
          
          {values.chiefComplaint === "other" && (
            <Field>
              <FieldLabel htmlFor="otherChiefComplaint" style={{ color: "#374151" }}>
                Please specify
              </FieldLabel>
              <Textarea
                id="otherChiefComplaint"
                value={values.otherChiefComplaint || ""}
                onChange={(e) => updateField("otherChiefComplaint", e.target.value)}
                placeholder="Describe the chief complaint..."
                className="min-h-20 rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
              />
              <FieldError message={fieldErrors.otherChiefComplaint} />
            </Field>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="medicalHistoryNotes" style={{ color: "#374151" }}>
            Medical history
          </FieldLabel>
          <Textarea
            id="medicalHistoryNotes"
            value={values.medicalHistoryNotes}
            onChange={(e) => updateField("medicalHistoryNotes", e.target.value)}
            placeholder="Previous diagnoses, chronic conditions, surgeries..."
            className="min-h-20 rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20"
          />
        </Field>

        {/* Allergies Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel style={{ color: "#374151" }}>Allergies</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-[#1A5345]/40 text-[#1A5345] hover:bg-[#1A5345]/5"
              onClick={addAllergy}
            >
              <PlusIcon className="size-4" />
              Add allergy
            </Button>
          </div>

          {values.allergies.length === 0 ? (
            <p className="text-sm text-gray-500">No allergies recorded. Click &quot;Add allergy&quot; to add.</p>
          ) : (
            <div className="space-y-3">
              {values.allergies.map((allergy) => (
                <AllergyCard
                  key={allergy.id}
                  allergy={allergy}
                  onUpdate={(field, value) => updateAllergy(allergy.id, field, value)}
                  onRemove={() => removeAllergy(allergy.id)}
                />
              ))}
            </div>
          )}
          <FieldError message={fieldErrors.allergies} />
        </div>

        {/* Medications Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel style={{ color: "#374151" }}>Current medications</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-[#1A5345]/40 text-[#1A5345] hover:bg-[#1A5345]/5"
              onClick={addMedication}
            >
              <PlusIcon className="size-4" />
              Add medication
            </Button>
          </div>

          {values.medications.length === 0 ? (
            <p className="text-sm text-gray-500">No medications recorded. Click &quot;Add medication&quot; to add.</p>
          ) : (
            <div className="space-y-3">
              {values.medications.map((med) => (
                <MedicationCard
                  key={med.id}
                  med={med}
                  onUpdate={(field, value) => updateMedication(med.id, field, value)}
                  onRemove={() => removeMedication(med.id)}
                />
              ))}
            </div>
          )}
          <FieldError message={fieldErrors.medications} />
        </div>
      </div>
    </div>
  )
}

export function AddPatient({
  values,
  fieldErrors,
  patients,
  isSubmitting,
  isSuccess,
  submitError,
  updateField,
  addMedication,
  updateMedication,
  removeMedication,
  addAllergy,
  updateAllergy,
  removeAllergy,
  reset,
  submit,
  onSuccess,
}: AddPatientProps) {
  const hadSuccess = useRef(false)
  const lastErrorMessage = useRef<string | null>(null)

  const vm: AddPatientViewModel = {
    values,
    fieldErrors,
    patients,
    isSubmitting,
    isSuccess,
    submitError,
    updateField,
    addMedication,
    updateMedication,
    removeMedication,
    addAllergy,
    updateAllergy,
    removeAllergy,
    reset,
    submit,
  }

  useEffect(() => {
    if (isSuccess && !hadSuccess.current) {
      showIcareSuccessToast(
        "Patient registered",
        "The patient record has been created successfully."
      )
      onSuccess?.()
    }
    hadSuccess.current = isSuccess
  }, [isSuccess, onSuccess])

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
          Enter the patient's personal and medical details to create a new record.
        </p>
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
            <MedicalInfoSection vm={vm} />
          </div>
        </form>
      </div>

      {/* Sticky Footer */}
      <div className="flex-none border-t border-[#E8E6E0]/60 bg-white px-8 py-5 z-20 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <p className="text-[13px] font-medium text-muted-foreground hidden sm:block">
          Fields with labels are validated on submission.
        </p>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
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
            {isSubmitting ? "Registering..." : "Register Patient"}
          </Button>
        </div>
      </div>
    </div>
  )
}
