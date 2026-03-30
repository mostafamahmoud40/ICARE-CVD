"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
} from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type RegisterResult = { ok: true } | { ok: false; message: string };

type SubmitRegisterOptions = {
  onSuccess?: () => void;
};

export type RegisterUploadedDocument = {
  id: string;
  name: string;
  category: string;
  mimeType: string;
  sizeInBytes: number;
};

export type RegisterCredentials = {
  firstName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  nationalId: string;
  medicalRecordNumber: string;
  referringPhysician: string;
  dateOfVisit: string;
  gender: string;
  bloodType: string;
  address: string;
  heightCm: string;
  weightKg: string;
  maritalStatus: string;
  occupation: string;
  smokingStatus: string;
  alcoholConsumption: string;
  caffeineIntake: string;
  exerciseFrequency: string;
  exerciseDuration: string;
  exerciseType: string;
  recreationalDrugUse: string;
  physicalActivityLevel: string;
  dietaryHabits: string[];
  stressLevel: string;
  diagnosedConditions: string[];
  currentSymptoms: string[];
  currentMedications: string;
  allergies: string;
  previousProcedures: string;
  familyCardiacHistory: string;
  cardiacHospitalization: string;
  additionalMedicalNotes: string;
  documentCategory: string;
  uploadedDocuments: RegisterUploadedDocument[];
  documentNotes: string;
};

export type RegisterField = keyof RegisterCredentials;

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterCredentials, string>
>;

function createInitialRegisterCredentials(): RegisterCredentials {
  return {
    firstName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    nationalId: "",
    medicalRecordNumber: "",
    referringPhysician: "",
    dateOfVisit: "",
    gender: "",
    bloodType: "",
    address: "",
    heightCm: "",
    weightKg: "",
    maritalStatus: "",
    occupation: "",
    smokingStatus: "",
    alcoholConsumption: "",
    caffeineIntake: "",
    exerciseFrequency: "",
    exerciseDuration: "",
    exerciseType: "",
    recreationalDrugUse: "",
    physicalActivityLevel: "",
    dietaryHabits: [],
    stressLevel: "",
    diagnosedConditions: [],
    currentSymptoms: [],
    currentMedications: "",
    allergies: "",
    previousProcedures: "",
    familyCardiacHistory: "",
    cardiacHospitalization: "",
    additionalMedicalNotes: "",
    documentCategory: "lab-report",
    uploadedDocuments: [],
    documentNotes: "",
  };
}

type RegisterStore = {
  credentials: RegisterCredentials;
  resetCredentials: () => void;
  setField: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

const useRegisterStore = create<RegisterStore>()(
  persist(
    (set) => ({
      credentials: createInitialRegisterCredentials(),
      resetCredentials: () =>
        set({
          credentials: createInitialRegisterCredentials(),
        }),
      setField: (field, value) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [field]: value,
          },
        })),
    }),
    {
      name: "auth-register-flow",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const nextState = persistedState as Partial<RegisterStore> | undefined;

        return {
          ...currentState,
          ...nextState,
          credentials: {
            ...currentState.credentials,
            ...nextState?.credentials,
          },
        };
      },
    },
  ),
);

const disableValidation = true;

function useRegisterController() {
  const credentials = useRegisterStore((state) => state.credentials);
  const setStoreField = useRegisterStore((state) => state.setField);
  const resetCredentials = useRegisterStore((state) => state.resetCredentials);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const setField = useCallback(
    <K extends keyof RegisterCredentials>(
      field: K,
      value: RegisterCredentials[K],
    ) => {
      setStoreField(field, value);
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
      setFormError(null);
    },
    [setStoreField],
  );

  const validateStep = useCallback(
    (fields: readonly RegisterField[]) => {
      if (disableValidation) {
        setFieldErrors((previous) => {
          const clearedErrors: RegisterFieldErrors = { ...previous };

          for (const field of fields) {
            delete clearedErrors[field];
          }

          return clearedErrors;
        });
        setFormError(null);

        return true;
      }

      const nextErrors = validateRegisterStep(credentials, fields);

      setFieldErrors((previous) => {
        const clearedErrors: RegisterFieldErrors = { ...previous };

        for (const field of fields) {
          delete clearedErrors[field];
        }

        return { ...clearedErrors, ...nextErrors };
      });
      setFormError(null);

      return !hasRegisterFieldErrors(nextErrors);
    },
    [credentials],
  );

  const submit = useCallback(
    async ({ onSuccess }: SubmitRegisterOptions = {}) => {
      if (disableValidation) {
        setFieldErrors({});
      } else {
        const nextErrors = validateRegisterCredentials(credentials);
        setFieldErrors(nextErrors);

        if (hasRegisterFieldErrors(nextErrors)) {
          return false;
        }
      }

      setIsPending(true);
      setFormError(null);

      try {
        const result = await registerAccount(credentials);

        if (result.ok) {
          resetCredentials();
          setFieldErrors({});
          setFormError(null);
          onSuccess?.();
          return true;
        }

        setFormError(result.message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [credentials, resetCredentials],
  );

  return {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    validateStep,
    submit,
  };
}

type RegisterContextValue = ReturnType<typeof useRegisterController>;

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function RegisterProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const value = useRegisterController();

  return createElement(RegisterContext.Provider, { value }, children);
}

export function useRegister() {
  const context = useContext(RegisterContext);

  if (!context) {
    throw new Error("useRegister must be used within RegisterProvider");
  }

  return context;
}

async function registerAccount(
  credentials: RegisterCredentials,
): Promise<RegisterResult> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toRegisterPayload(credentials)),
    });

    if (!response.ok) {
      let message = "Registration failed";

      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) {
          message = body.message;
        }
      } catch {
        // Ignore malformed error bodies and use the fallback message.
      }

      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the server" };
  }
}

export function validateRegisterCredentials(
  credentials: RegisterCredentials,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const normalizedFullName = credentials.firstName.trim();
  const normalizedEmail = credentials.email.trim();
  const normalizedPhoneNumber = credentials.phoneNumber.trim();
  const normalizedHeight = credentials.heightCm.trim();
  const normalizedWeight = credentials.weightKg.trim();
  const phoneDigits = normalizedPhoneNumber.replace(/\D/g, "");
  const dateOfBirth = credentials.dateOfBirth
    ? new Date(credentials.dateOfBirth)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!normalizedFullName) {
    errors.firstName = "Full name is required";
  } else if (normalizedFullName.length < 2) {
    errors.firstName = "Enter at least 2 characters";
  }

  if (!normalizedEmail) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Enter a valid email";
  }

  if (!normalizedPhoneNumber) {
    errors.phoneNumber = "Phone number is required";
  } else if (
    !/^\+?[0-9()\s-]+$/.test(normalizedPhoneNumber) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    errors.phoneNumber = "Enter a valid phone number";
  }

  if (!credentials.password) {
    errors.password = "Password is required";
  } else if (credentials.password.length < 8) {
    errors.password = "Use at least 8 characters";
  }

  if (!credentials.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (credentials.confirmPassword !== credentials.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!credentials.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  } else if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) {
    errors.dateOfBirth = "Enter a valid date of birth";
  } else if (dateOfBirth > today) {
    errors.dateOfBirth = "Date of birth cannot be in the future";
  }

  if (!credentials.gender) {
    errors.gender = "Gender is required";
  }

  if (!normalizedHeight) {
    errors.heightCm = "Height is required";
  } else if (
    Number.isNaN(Number(normalizedHeight)) ||
    Number(normalizedHeight) <= 0
  ) {
    errors.heightCm = "Enter a valid height";
  }

  if (!normalizedWeight) {
    errors.weightKg = "Weight is required";
  } else if (
    Number.isNaN(Number(normalizedWeight)) ||
    Number(normalizedWeight) <= 0
  ) {
    errors.weightKg = "Enter a valid weight";
  }

  if (!credentials.smokingStatus) {
    errors.smokingStatus = "Select your smoking status";
  }

  if (!credentials.exerciseFrequency) {
    errors.exerciseFrequency = "Select your exercise frequency";
  }

  if (!credentials.exerciseDuration) {
    errors.exerciseDuration = "Select your exercise duration";
  }

  if (!credentials.exerciseType) {
    errors.exerciseType = "Select your exercise type";
  }

  return errors;
}

export function hasRegisterFieldErrors(errors: RegisterFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateRegisterStep(
  credentials: RegisterCredentials,
  fields: readonly RegisterField[],
): RegisterFieldErrors {
  const errors = validateRegisterCredentials(credentials);
  const stepErrors: RegisterFieldErrors = {};

  for (const field of fields) {
    const error = errors[field];
    if (error) {
      stepErrors[field] = error;
    }
  }

  return stepErrors;
}

function toRegisterPayload(credentials: RegisterCredentials): {
  firstName: string;
  email: string;
  phoneNumber: string;
  password: string;
} {
  return {
    firstName: credentials.firstName.trim(),
    email: credentials.email.trim(),
    phoneNumber: credentials.phoneNumber.trim(),
    password: credentials.password,
  };
}
