"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileText, HeartPulse, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  RegisterCredentials,
  RegisterField,
  RegisterFieldErrors,
  RegisterUploadedDocument,
} from "./useRegister";
import {
  getRegisterStepIndex,
  getNextRegisterStep,
  getPreviousRegisterStep,
  getRegisterStepPath,
  registerStepOrder,
  registerStepContent,
  type RegisterStepId,
  registerStepFields,
} from "./register-steps";
import { useRegister } from "./useRegister";

const cardClassName =
  "w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
const inputClassName =
  "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20";
const labelClassName = "text-sm font-medium text-zinc-800 dark:text-zinc-200";
const helperClassName = "text-sm text-zinc-600 dark:text-zinc-400";
const errorClassName = "text-sm text-red-600 dark:text-red-400";

type TextFieldProps = {
  field: RegisterField;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: "date" | "email" | "password" | "tel" | "text";
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "decimal" | "email" | "numeric" | "tel";
  className?: string;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

type SelectFieldProps = {
  field: RegisterField;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

type ChoiceFieldProps = {
  field: RegisterField;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  hint?: string;
  columnsClassName?: string;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

type CheckboxFieldProps = {
  field: RegisterArrayField;
  label: string;
  options: { label: string; value: string }[];
  values: string[];
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

type TextareaFieldProps = {
  field: RegisterField;
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

type RegisterArrayField = {
  [K in RegisterField]: RegisterCredentials[K] extends string[] ? K : never;
}[RegisterField];

const genderOptions = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Other", value: "other" },
];

const bloodTypeOptions = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

const maritalStatusOptions = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
];

const smokingOptions = [
  { label: "Never", value: "never" },
  { label: "Former smoker", value: "former" },
  { label: "Occasionally", value: "occasionally" },
  { label: "Regularly", value: "regularly" },
];

const alcoholOptions = [
  { label: "Never", value: "never" },
  { label: "Rarely", value: "rarely" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Often", value: "often" },
];

const caffeineOptions = [
  { label: "None", value: "none" },
  { label: "1", value: "1" },
  { label: "2–3", value: "2-3" },
  { label: "4–5", value: "4-5" },
  { label: "6+", value: "6+" },
];

const exerciseFrequencyOptions = [
  { label: "1–2 times", value: "1-2" },
  { label: "3–4 times", value: "3-4" },
  { label: "5+ times", value: "5+" },
];

const exerciseDurationOptions = [
  { label: "Less than 30", value: "lt-30" },
  { label: "30–60", value: "30-60" },
  { label: "More than 60", value: "gt-60" },
];

const exerciseTypeOptions = [
  { label: "Walking", value: "walking" },
  { label: "Gym", value: "gym" },
  { label: "Swimming", value: "swimming" },
  { label: "Other", value: "other" },
];

const recreationalDrugOptions = [
  { label: "Never", value: "never" },
  { label: "Past use", value: "past" },
  { label: "Occasionally", value: "occasionally" },
  { label: "Regularly", value: "regularly" },
];

const physicalActivityOptions = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Very active", value: "very-active" },
];

const stressLevelOptions = [
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
  { label: "Very high", value: "very-high" },
];

const dietaryHabitOptions = [
  { label: "High salt diet", value: "high-salt" },
  { label: "High fat diet", value: "high-fat" },
  { label: "High sugar intake", value: "high-sugar" },
  { label: "Low fruit and vegetables", value: "low-produce" },
];

const diagnosedConditionOptions = [
  { label: "Hypertension", value: "hypertension" },
  { label: "Diabetes", value: "diabetes" },
  { label: "High cholesterol", value: "high-cholesterol" },
  { label: "Arrhythmia", value: "arrhythmia" },
  { label: "Coronary artery disease", value: "cad" },
  { label: "Heart failure", value: "heart-failure" },
];

const currentSymptomOptions = [
  { label: "Chest pain", value: "chest-pain" },
  { label: "Shortness of breath", value: "shortness-of-breath" },
  { label: "Palpitations", value: "palpitations" },
  { label: "Dizziness", value: "dizziness" },
  { label: "Fainting", value: "fainting" },
  { label: "Leg swelling", value: "leg-swelling" },
];

const familyCardiacHistoryOptions = [
  { label: "None", value: "none" },
  { label: "Parent", value: "parent" },
  { label: "Sibling", value: "sibling" },
  { label: "Multiple relatives", value: "multiple-relatives" },
];

const cardiacHospitalizationOptions = [
  { label: "Never", value: "never" },
  { label: "Once", value: "once" },
  { label: "More than once", value: "multiple" },
  { label: "Currently in follow-up", value: "follow-up" },
];

const documentCategoryOptions = [
  { label: "Lab Report", value: "lab-report" },
  { label: "Imaging", value: "imaging" },
  { label: "ECG File", value: "ecg" },
  { label: "Prescription", value: "prescription" },
  { label: "Additional File", value: "additional" },
];

type ChoiceOption = {
  label: string;
  value: string;
};

type RegisterFormViewProps = {
  step: RegisterStepId;
  credentials: RegisterCredentials;
  fieldErrors: RegisterFieldErrors;
  formError: string | null;
  isPending: boolean;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
  onBack?: () => void;
  onSubmit: () => void;
};

export type RegisterFormProps = {
  step: RegisterStepId;
};

function FieldLabel({
  children,
  htmlFor,
  required,
}: Readonly<{
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}>) {
  return (
    <label htmlFor={htmlFor} className={labelClassName}>
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );
}

function TextField({
  field,
  label,
  value,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  className,
  onFieldChange,
}: TextFieldProps) {
  const inputId = `register-${field}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <input
        id={inputId}
        name={field}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onFieldChange(field, event.target.value)}
        className={inputClassName}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} role="alert" className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  field,
  label,
  value,
  options,
  error,
  required,
  placeholder = "Select an option",
  className,
  onFieldChange,
}: SelectFieldProps) {
  const inputId = `register-${field}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <select
        id={inputId}
        name={field}
        value={value}
        onChange={(event) => onFieldChange(field, event.target.value)}
        className={inputClassName}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChoiceField({
  field,
  label,
  value,
  options,
  error,
  required,
  hint,
  columnsClassName = "sm:grid-cols-2 xl:grid-cols-4",
  onFieldChange,
}: ChoiceFieldProps) {
  const errorId = `register-${field}-error`;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className={labelClassName}>
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </p>
        {hint ? <p className={helperClassName}>{hint}</p> : null}
      </div>

      <div className={cn("grid gap-3", columnsClassName)}>
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onFieldChange(field, option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500",
              )}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckboxField({
  field,
  label,
  options,
  values,
  onFieldChange,
}: CheckboxFieldProps) {
  return (
    <div className="space-y-3">
      <p className={labelClassName}>{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isChecked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  const nextValues = isChecked
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value];

                  onFieldChange(field, nextValues as RegisterCredentials[typeof field]);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TextareaField({
  field,
  label,
  value,
  error,
  placeholder,
  rows = 4,
  className,
  onFieldChange,
}: TextareaFieldProps) {
  const inputId = `register-${field}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <textarea
        id={inputId}
        name={field}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onFieldChange(field, event.target.value)}
        className={cn(inputClassName, "min-h-28 resize-y py-3")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} role="alert" className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatDocumentCategory(category: string): string {
  return (
    documentCategoryOptions.find((option) => option.value === category)?.label ??
    "Document"
  );
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes >= 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (sizeInBytes >= 1024) {
    return `${Math.round(sizeInBytes / 1024)} KB`;
  }

  return `${sizeInBytes} B`;
}

function createUploadedDocuments(
  files: FileList,
  category: string,
): RegisterUploadedDocument[] {
  return Array.from(files).map((file, index) => ({
    id: `${Date.now()}-${index}-${file.name}`,
    name: file.name,
    category,
    mimeType: file.type,
    sizeInBytes: file.size,
  }));
}

function getOptionLabel(options: ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getOptionLabels(options: ChoiceOption[], values: string[]): string {
  if (!values.length) return "None added";

  return values.map((value) => getOptionLabel(options, value)).join(", ");
}

function renderSummaryValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "Not provided";
  const normalized = String(value).trim();
  return normalized ? normalized : "Not provided";
}

function renderStepOneFields(
  credentials: RegisterCredentials,
  fieldErrors: RegisterFieldErrors,
  onFieldChange: RegisterFormViewProps["onFieldChange"],
) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        field="firstName"
        label="Full name"
        value={credentials.firstName}
        error={fieldErrors.firstName}
        required
        autoComplete="name"
        placeholder="Enter your full name"
        className="md:col-span-2"
        onFieldChange={onFieldChange}
      />
      <TextField
        field="email"
        label="Email"
        value={credentials.email}
        error={fieldErrors.email}
        required
        type="email"
        autoComplete="email"
        placeholder="Enter your email"
        onFieldChange={onFieldChange}
      />
      <TextField
        field="phoneNumber"
        label="Phone number"
        value={credentials.phoneNumber}
        error={fieldErrors.phoneNumber}
        required
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="Enter your phone number"
        onFieldChange={onFieldChange}
      />
      <TextField
        field="password"
        label="Password"
        value={credentials.password}
        error={fieldErrors.password}
        required
        type="password"
        autoComplete="new-password"
        placeholder="Create a password"
        onFieldChange={onFieldChange}
      />
      <TextField
        field="confirmPassword"
        label="Confirm password"
        value={credentials.confirmPassword}
        error={fieldErrors.confirmPassword}
        required
        type="password"
        autoComplete="new-password"
        placeholder="Confirm your password"
        onFieldChange={onFieldChange}
      />
    </div>
  );
}

function renderStepTwoFields(
  credentials: RegisterCredentials,
  fieldErrors: RegisterFieldErrors,
  onFieldChange: RegisterFormViewProps["onFieldChange"],
) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            field="dateOfBirth"
            label="Date of birth"
            value={credentials.dateOfBirth}
            error={fieldErrors.dateOfBirth}
            required
            type="date"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="nationalId"
            label="National ID"
            value={credentials.nationalId}
            error={fieldErrors.nationalId}
            placeholder="Enter your national ID"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="medicalRecordNumber"
            label="Medical record number"
            value={credentials.medicalRecordNumber}
            error={fieldErrors.medicalRecordNumber}
            placeholder="MRN (if available)"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="referringPhysician"
            label="Referring physician"
            value={credentials.referringPhysician}
            error={fieldErrors.referringPhysician}
            placeholder="Dr. Name"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="dateOfVisit"
            label="Date of visit"
            value={credentials.dateOfVisit}
            error={fieldErrors.dateOfVisit}
            type="date"
            onFieldChange={onFieldChange}
          />
          <SelectField
            field="gender"
            label="Gender"
            value={credentials.gender}
            error={fieldErrors.gender}
            required
            options={genderOptions}
            placeholder="Select gender"
            onFieldChange={onFieldChange}
          />
          <SelectField
            field="bloodType"
            label="Blood type"
            value={credentials.bloodType}
            error={fieldErrors.bloodType}
            options={bloodTypeOptions}
            placeholder="Select blood type"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="address"
            label="Address"
            value={credentials.address}
            error={fieldErrors.address}
            placeholder="Enter your full address"
            className="md:col-span-2"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="heightCm"
            label="Height (cm)"
            value={credentials.heightCm}
            error={fieldErrors.heightCm}
            required
            inputMode="numeric"
            placeholder="175"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="weightKg"
            label="Weight (kg)"
            value={credentials.weightKg}
            error={fieldErrors.weightKg}
            required
            inputMode="numeric"
            placeholder="70"
            onFieldChange={onFieldChange}
          />
          <SelectField
            field="maritalStatus"
            label="Marital status"
            value={credentials.maritalStatus}
            error={fieldErrors.maritalStatus}
            options={maritalStatusOptions}
            placeholder="Select marital status"
            onFieldChange={onFieldChange}
          />
          <TextField
            field="occupation"
            label="Occupation"
            value={credentials.occupation}
            error={fieldErrors.occupation}
            placeholder="Your occupation"
            onFieldChange={onFieldChange}
          />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Social History
          </h2>
          <p className={helperClassName}>
            Tell us about habits that may affect your cardiovascular care.
          </p>
        </div>

        <ChoiceField
          field="smokingStatus"
          label="Do you smoke?"
          value={credentials.smokingStatus}
          error={fieldErrors.smokingStatus}
          required
          options={smokingOptions}
          onFieldChange={onFieldChange}
        />

        <ChoiceField
          field="alcoholConsumption"
          label="Alcohol consumption?"
          value={credentials.alcoholConsumption}
          error={fieldErrors.alcoholConsumption}
          options={alcoholOptions}
          onFieldChange={onFieldChange}
        />

        <ChoiceField
          field="caffeineIntake"
          label="Caffeine intake (cups/day)"
          value={credentials.caffeineIntake}
          error={fieldErrors.caffeineIntake}
          options={caffeineOptions}
          columnsClassName="sm:grid-cols-2 xl:grid-cols-5"
          onFieldChange={onFieldChange}
        />

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Exercise Details<span className="ml-1 text-red-500">*</span>
            </h3>
            <p className={helperClassName}>
              Share how often you exercise, how long, and what type of activity
              you usually do.
            </p>
          </div>

          <ChoiceField
            field="exerciseFrequency"
            label="Frequency"
            hint="How many times per week?"
            value={credentials.exerciseFrequency}
            error={fieldErrors.exerciseFrequency}
            required
            options={exerciseFrequencyOptions}
            columnsClassName="md:grid-cols-3"
            onFieldChange={onFieldChange}
          />

          <ChoiceField
            field="exerciseDuration"
            label="Duration"
            hint="How many minutes per session?"
            value={credentials.exerciseDuration}
            error={fieldErrors.exerciseDuration}
            required
            options={exerciseDurationOptions}
            columnsClassName="md:grid-cols-3"
            onFieldChange={onFieldChange}
          />

          <ChoiceField
            field="exerciseType"
            label="Type"
            hint="What type of exercise?"
            value={credentials.exerciseType}
            error={fieldErrors.exerciseType}
            required
            options={exerciseTypeOptions}
            onFieldChange={onFieldChange}
          />
        </div>

        <ChoiceField
          field="recreationalDrugUse"
          label="Recreational drug use?"
          value={credentials.recreationalDrugUse}
          error={fieldErrors.recreationalDrugUse}
          options={recreationalDrugOptions}
          onFieldChange={onFieldChange}
        />

        <ChoiceField
          field="physicalActivityLevel"
          label="Physical activity level"
          value={credentials.physicalActivityLevel}
          error={fieldErrors.physicalActivityLevel}
          options={physicalActivityOptions}
          onFieldChange={onFieldChange}
        />

        <CheckboxField
          field="dietaryHabits"
          label="Dietary habits"
          options={dietaryHabitOptions}
          values={credentials.dietaryHabits}
          onFieldChange={onFieldChange}
        />

        <ChoiceField
          field="stressLevel"
          label="Stress level"
          value={credentials.stressLevel}
          error={fieldErrors.stressLevel}
          options={stressLevelOptions}
          onFieldChange={onFieldChange}
        />
      </section>
    </div>
  );
}

function renderStepThreeFields(
  credentials: RegisterCredentials,
  fieldErrors: RegisterFieldErrors,
  onFieldChange: RegisterFormViewProps["onFieldChange"],
) {
  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Medical Background
          </h2>
          <p className={helperClassName}>
            Share your diagnoses, symptoms, and medical history so we can better
            understand your cardiovascular background.
          </p>
        </div>

        <CheckboxField
          field="diagnosedConditions"
          label="Diagnosed conditions"
          options={diagnosedConditionOptions}
          values={credentials.diagnosedConditions}
          onFieldChange={onFieldChange}
        />

        <CheckboxField
          field="currentSymptoms"
          label="Current symptoms"
          options={currentSymptomOptions}
          values={credentials.currentSymptoms}
          onFieldChange={onFieldChange}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <ChoiceField
            field="familyCardiacHistory"
            label="Family cardiac history"
            value={credentials.familyCardiacHistory}
            error={fieldErrors.familyCardiacHistory}
            options={familyCardiacHistoryOptions}
            onFieldChange={onFieldChange}
          />

          <ChoiceField
            field="cardiacHospitalization"
            label="Cardiac hospitalization"
            value={credentials.cardiacHospitalization}
            error={fieldErrors.cardiacHospitalization}
            options={cardiacHospitalizationOptions}
            onFieldChange={onFieldChange}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <TextareaField
            field="currentMedications"
            label="Current medications"
            value={credentials.currentMedications}
            error={fieldErrors.currentMedications}
            placeholder="List any current medications you take"
            onFieldChange={onFieldChange}
          />

          <TextareaField
            field="allergies"
            label="Allergies"
            value={credentials.allergies}
            error={fieldErrors.allergies}
            placeholder="List drug, food, or other allergies"
            onFieldChange={onFieldChange}
          />

          <TextareaField
            field="previousProcedures"
            label="Previous surgeries or procedures"
            value={credentials.previousProcedures}
            error={fieldErrors.previousProcedures}
            placeholder="Describe any surgeries, stents, or other procedures"
            onFieldChange={onFieldChange}
          />

          <TextareaField
            field="additionalMedicalNotes"
            label="Additional medical notes"
            value={credentials.additionalMedicalNotes}
            error={fieldErrors.additionalMedicalNotes}
            placeholder="Anything else you'd like us to know"
            onFieldChange={onFieldChange}
          />
        </div>
      </section>
    </div>
  );
}

function renderStepFourFields(
  credentials: RegisterCredentials,
  fieldErrors: RegisterFieldErrors,
  onFieldChange: RegisterFormViewProps["onFieldChange"],
) {
  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            field="documentCategory"
            label="Document category"
            value={credentials.documentCategory}
            error={fieldErrors.documentCategory}
            options={documentCategoryOptions}
            onFieldChange={onFieldChange}
          />

          <div className="space-y-2">
            <FieldLabel htmlFor="register-upload-files">Upload files</FieldLabel>
            <input
              id="register-upload-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom,image/*,application/pdf"
              className={cn(
                inputClassName,
                "file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-950",
              )}
              onChange={(event) => {
                const files = event.target.files;
                if (!files?.length) return;

                const nextFiles = createUploadedDocuments(
                  files,
                  credentials.documentCategory,
                );

                onFieldChange("uploadedDocuments", [
                  ...credentials.uploadedDocuments,
                  ...nextFiles,
                ]);
                event.target.value = "";
              }}
            />
            <p className={helperClassName}>
              Accepted: PDF, JPG, PNG, DICOM. You can upload multiple files and
              repeat for different categories.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Uploaded Files
          </h2>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {credentials.uploadedDocuments.length} file(s)
          </span>
        </div>

        <div className="space-y-3">
          {credentials.uploadedDocuments.length ? (
            credentials.uploadedDocuments.map((file) => (
              <div
                key={file.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {file.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDocumentCategory(file.category)} •{" "}
                      {formatFileSize(file.sizeInBytes)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onFieldChange(
                      "uploadedDocuments",
                      credentials.uploadedDocuments.filter(
                        (uploadedFile) => uploadedFile.id !== file.id,
                      ),
                    )
                  }
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              No files uploaded yet.
            </div>
          )}
        </div>
      </section>

      <TextareaField
        field="documentNotes"
        label="Additional Notes (Optional)"
        value={credentials.documentNotes}
        error={fieldErrors.documentNotes}
        placeholder="Add any extra information for your doctor (symptoms timeline, concerns, previous results, etc.)"
        rows={5}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="space-y-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="text-sm text-zinc-950 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function renderStepFiveFields(credentials: RegisterCredentials) {
  return (
    <div className="space-y-8">
      <SummaryBlock title="Account Details">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryItem
            label="Full name"
            value={renderSummaryValue(credentials.firstName)}
          />
          <SummaryItem
            label="Email"
            value={renderSummaryValue(credentials.email)}
          />
          <SummaryItem
            label="Phone number"
            value={renderSummaryValue(credentials.phoneNumber)}
          />
          <SummaryItem label="Password" value="Hidden for security" />
        </div>
      </SummaryBlock>

      <SummaryBlock title="Health Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryItem
            label="Date of birth"
            value={renderSummaryValue(credentials.dateOfBirth)}
          />
          <SummaryItem
            label="National ID"
            value={renderSummaryValue(credentials.nationalId)}
          />
          <SummaryItem
            label="Medical record number"
            value={renderSummaryValue(credentials.medicalRecordNumber)}
          />
          <SummaryItem
            label="Referring physician"
            value={renderSummaryValue(credentials.referringPhysician)}
          />
          <SummaryItem
            label="Date of visit"
            value={renderSummaryValue(credentials.dateOfVisit)}
          />
          <SummaryItem
            label="Gender"
            value={renderSummaryValue(
              credentials.gender
                ? getOptionLabel(genderOptions, credentials.gender)
                : "",
            )}
          />
          <SummaryItem
            label="Blood type"
            value={renderSummaryValue(
              credentials.bloodType
                ? getOptionLabel(bloodTypeOptions, credentials.bloodType)
                : "",
            )}
          />
          <SummaryItem
            label="Address"
            value={renderSummaryValue(credentials.address)}
          />
          <SummaryItem
            label="Height"
            value={renderSummaryValue(
              credentials.heightCm ? `${credentials.heightCm} cm` : "",
            )}
          />
          <SummaryItem
            label="Weight"
            value={renderSummaryValue(
              credentials.weightKg ? `${credentials.weightKg} kg` : "",
            )}
          />
          <SummaryItem
            label="Marital status"
            value={renderSummaryValue(
              credentials.maritalStatus
                ? getOptionLabel(maritalStatusOptions, credentials.maritalStatus)
                : "",
            )}
          />
          <SummaryItem
            label="Occupation"
            value={renderSummaryValue(credentials.occupation)}
          />
          <SummaryItem
            label="Smoking"
            value={renderSummaryValue(
              credentials.smokingStatus
                ? getOptionLabel(smokingOptions, credentials.smokingStatus)
                : "",
            )}
          />
          <SummaryItem
            label="Alcohol"
            value={renderSummaryValue(
              credentials.alcoholConsumption
                ? getOptionLabel(alcoholOptions, credentials.alcoholConsumption)
                : "",
            )}
          />
          <SummaryItem
            label="Caffeine intake"
            value={renderSummaryValue(
              credentials.caffeineIntake
                ? getOptionLabel(caffeineOptions, credentials.caffeineIntake)
                : "",
            )}
          />
          <SummaryItem
            label="Physical activity"
            value={renderSummaryValue(
              credentials.physicalActivityLevel
                ? getOptionLabel(
                    physicalActivityOptions,
                    credentials.physicalActivityLevel,
                  )
                : "",
            )}
          />
          <SummaryItem
            label="Stress level"
            value={renderSummaryValue(
              credentials.stressLevel
                ? getOptionLabel(stressLevelOptions, credentials.stressLevel)
                : "",
            )}
          />
          <SummaryItem
            label="Dietary habits"
            value={getOptionLabels(
              dietaryHabitOptions,
              credentials.dietaryHabits,
            )}
          />
        </div>
      </SummaryBlock>

      <SummaryBlock title="Medical Background">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryItem
            label="Diagnosed conditions"
            value={getOptionLabels(
              diagnosedConditionOptions,
              credentials.diagnosedConditions,
            )}
          />
          <SummaryItem
            label="Current symptoms"
            value={getOptionLabels(
              currentSymptomOptions,
              credentials.currentSymptoms,
            )}
          />
          <SummaryItem
            label="Family cardiac history"
            value={renderSummaryValue(
              credentials.familyCardiacHistory
                ? getOptionLabel(
                    familyCardiacHistoryOptions,
                    credentials.familyCardiacHistory,
                  )
                : "",
            )}
          />
          <SummaryItem
            label="Cardiac hospitalization"
            value={renderSummaryValue(
              credentials.cardiacHospitalization
                ? getOptionLabel(
                    cardiacHospitalizationOptions,
                    credentials.cardiacHospitalization,
                  )
                : "",
            )}
          />
          <SummaryItem
            label="Current medications"
            value={renderSummaryValue(credentials.currentMedications)}
          />
          <SummaryItem
            label="Allergies"
            value={renderSummaryValue(credentials.allergies)}
          />
          <SummaryItem
            label="Previous procedures"
            value={renderSummaryValue(credentials.previousProcedures)}
          />
          <SummaryItem
            label="Additional notes"
            value={renderSummaryValue(credentials.additionalMedicalNotes)}
          />
        </div>
      </SummaryBlock>

      <SummaryBlock title="Documents">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryItem
              label="Current category"
              value={renderSummaryValue(
                getOptionLabel(
                  documentCategoryOptions,
                  credentials.documentCategory,
                ),
              )}
            />
            <SummaryItem
              label="Uploaded files"
              value={`${credentials.uploadedDocuments.length} file(s)`}
            />
          </div>

          <div className="space-y-3">
            {credentials.uploadedDocuments.length ? (
              credentials.uploadedDocuments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {file.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDocumentCategory(file.category)} •{" "}
                      {formatFileSize(file.sizeInBytes)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                No files uploaded yet.
              </div>
            )}
          </div>

          <SummaryItem
            label="Document notes"
            value={renderSummaryValue(credentials.documentNotes)}
          />
        </div>
      </SummaryBlock>
    </div>
  );
}

function RegisterFormView({
  step,
  credentials,
  fieldErrors,
  formError,
  isPending,
  onFieldChange,
  onBack,
  onSubmit,
}: RegisterFormViewProps) {
  const stepContent = registerStepContent[step];
  const stepIndex = getRegisterStepIndex(step);
  const isFinalStep = step === registerStepOrder[registerStepOrder.length - 1];
  const StepIcon = step === "step4" ? Upload : step === "step5" ? Check : HeartPulse;

  useEffect(() => {
    if (!isFinalStep || !formError) return;

    toast.error("Registration failed", {
      id: "register-status",
      description: formError,
    });
  }, [formError, isFinalStep]);

  return (
    <main
      className={cn(
        cardClassName,
        step === "step1" ? "max-w-2xl space-y-6" : "max-w-5xl space-y-8",
      )}
    >
      <div className="space-y-4">
        {step !== "step1" ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <StepIcon className="h-8 w-8" />
          </div>
        ) : null}

        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Step {stepIndex + 1} of {registerStepOrder.length}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {stepContent.title}
          </h1>
          <p className={helperClassName}>{stepContent.description}</p>
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${registerStepOrder.length}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {registerStepOrder.map((registerStep, index) => (
            <span
              key={registerStep}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= stepIndex
                  ? "bg-zinc-950 dark:bg-zinc-50"
                  : "bg-zinc-200 dark:bg-zinc-800",
              )}
            />
          ))}
        </div>
      </div>

      <form
        className={step === "step1" ? "space-y-6" : "space-y-8"}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {step === "step1"
          ? renderStepOneFields(credentials, fieldErrors, onFieldChange)
          : step === "step2"
            ? renderStepTwoFields(credentials, fieldErrors, onFieldChange)
            : step === "step3"
              ? renderStepThreeFields(
                  credentials,
                  fieldErrors,
                  onFieldChange,
                )
              : step === "step4"
                ? renderStepFourFields(
                    credentials,
                    fieldErrors,
                    onFieldChange,
                  )
                : renderStepFiveFields(credentials)}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              size="lg"
              onClick={onBack}
            >
              Back
            </Button>
          ) : null}

          <Button
            type="submit"
            className={onBack ? "h-10 flex-1" : "h-10 w-full"}
            size="lg"
            disabled={isPending}
          >
            {isFinalStep && isPending
              ? "Creating account..."
              : stepContent.actionLabel}
          </Button>
        </div>
      </form>

      <div className="space-y-2 text-center text-sm text-zinc-500">
        <p>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            Sign in
          </Link>
        </p>
        <p>
          <Link
            href="/"
            className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export function RegisterForm({ step }: RegisterFormProps) {
  const router = useRouter();
  const {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    validateStep,
    submit,
  } = useRegister();
  const nextStep = getNextRegisterStep(step);
  const previousStep = getPreviousRegisterStep(step);

  async function handleSubmit() {
    if (nextStep) {
      if (validateStep(registerStepFields[step])) {
        router.push(getRegisterStepPath(nextStep));
      }
      return;
    }

    await submit({
      onSuccess: () => {
        toast.success("Account created!", {
          id: "register-status",
          description: "Your account has been created successfully.",
        });
        router.push("/auth/login");
      },
    });
  }

  return (
    <RegisterFormView
      step={step}
      credentials={credentials}
      fieldErrors={fieldErrors}
      formError={formError}
      isPending={isPending}
      onFieldChange={setField}
      onBack={
        previousStep
          ? () => router.push(getRegisterStepPath(previousStep))
          : undefined
      }
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
