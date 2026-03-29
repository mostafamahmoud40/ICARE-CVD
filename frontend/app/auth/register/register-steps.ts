import {
  hasRegisterFieldErrors,
  type RegisterCredentials,
  type RegisterField,
  validateRegisterStep,
} from "./services/credentials";

export const registerStepOrder = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
] as const;

export type RegisterStepId = (typeof registerStepOrder)[number];

export const registerStepFields: Record<RegisterStepId, readonly RegisterField[]> =
  {
    step1: [
      "firstName",
      "email",
      "phoneNumber",
      "password",
      "confirmPassword",
    ],
    step2: [
      "dateOfBirth",
      "gender",
      "heightCm",
      "weightKg",
      "smokingStatus",
      "exerciseFrequency",
      "exerciseDuration",
      "exerciseType",
    ],
    step3: [
      "diagnosedConditions",
      "currentSymptoms",
      "currentMedications",
      "allergies",
      "previousProcedures",
      "familyCardiacHistory",
      "cardiacHospitalization",
      "additionalMedicalNotes",
    ],
    step4: ["documentCategory", "uploadedDocuments", "documentNotes"],
    step5: [],
  };

export const registerStepContent: Record<
  RegisterStepId,
  { title: string; description: string; actionLabel: string }
> = {
  step1: {
    title: "Create account",
    description:
      "Enter your full name, email, phone number, and password to get started.",
    actionLabel: "Continue",
  },
  step2: {
    title: "Complete Your Health Profile",
    description: "Help us provide personalized cardiac care and social history.",
    actionLabel: "Continue",
  },
  step3: {
    title: "Medical Background",
    description:
      "Share diagnoses, symptoms, medications, and prior procedures to complete your profile.",
    actionLabel: "Continue",
  },
  step4: {
    title: "Document & Lab Upload",
    description:
      "Add lab reports, imaging, ECG files, prescriptions, or any additional files.",
    actionLabel: "Continue",
  },
  step5: {
    title: "Review & Confirm",
    description:
      "Please confirm your details before creating your account",
    actionLabel: "Create account",
  },
};

export function getRegisterStepIndex(step: RegisterStepId): number {
  return registerStepOrder.indexOf(step);
}

export function getRegisterStepPath(step: RegisterStepId) {
  return `/auth/register/${step}` as const;
}

export function getNextRegisterStep(
  step: RegisterStepId,
): RegisterStepId | null {
  return registerStepOrder[getRegisterStepIndex(step) + 1] ?? null;
}

export function getPreviousRegisterStep(
  step: RegisterStepId,
): RegisterStepId | null {
  return registerStepOrder[getRegisterStepIndex(step) - 1] ?? null;
}

export function findFirstInvalidRegisterStep(
  credentials: RegisterCredentials,
): RegisterStepId | null {
  for (const step of registerStepOrder) {
    if (
      hasRegisterFieldErrors(
        validateRegisterStep(credentials, registerStepFields[step]),
      )
    ) {
      return step;
    }
  }

  return null;
}
