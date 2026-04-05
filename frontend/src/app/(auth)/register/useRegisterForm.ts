"use client";

import { useMemo, useState } from "react";
import type { z } from "zod";
import { useForm, useWatch } from "react-hook-form";

import { MEDICAL_HPI_EXTENDED_DEFAULTS } from "./medicalHpiDefaults";
import { REGISTER_VALIDATION_ENABLED, registerSchema } from "./register.schema";
import type {
  RegisterDocumentsValues,
  RegisterMedicalValues,
  RegisterProfileValues,
  RegisterStep,
  RegisterValues,
} from "./register.types";
import { useRegister } from "./useRegister";

type StepKey = "account" | "profile" | "medical" | "documents" | "review";

type StepValuesMap = {
  account: RegisterValues;
  profile: RegisterProfileValues;
  medical: RegisterMedicalValues;
  documents: RegisterDocumentsValues;
  review: Record<string, never>;
};

type StepConfig<K extends StepKey> = {
  step: number;
  key: K;
  initialValues: StepValuesMap[K];
  schema?: z.ZodTypeAny;
};

const STEP_CONFIGS: Array<StepConfig<StepKey>> = [
  {
    step: 1,
    key: "account",
    initialValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
    schema: registerSchema,
  },
  {
    step: 2,
    key: "profile",
    initialValues: {
      dateOfBirth: "",
      nationalId: "",
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
      dietaryHabits: "",
      highSaltDiet: false,
      highFatDiet: false,
      stressLevel: "",
    },
  },
  {
    step: 3,
    key: "medical",
    initialValues: {
      chiefComplaint: "",
      otherComplaint: "",
      ...MEDICAL_HPI_EXTENDED_DEFAULTS,
      chestPainOnsetDate: "",
      chestPainOnsetType: "",
      chestPainProvoking: [],
      chestPainQuality: [],
      chestPainRadiation: "",
      chestPainSeverity: "",
      chestPainTimingPattern: "",
      chestPainTimingDuration: "",
      chestPainRelieving: [],
      chestPainAssociated: [],
      dyspneaOnsetProgression: "",
      dyspneaNYHA: "",
      dyspneaOrthopnea: "",
      dyspneaOrthopneaPillows: "",
      dyspneaPND: "",
      dyspneaWheezing: "",
      dyspneaCough: "",
      dyspneaProductiveColor: "",
      dyspneaProductiveAmount: "",
      dyspneaHemoptysis: "",
      dyspneaRelationTo: [],
      noCardiacHistory: false,
      noNonCardiacHistory: false,
      pastHypertension: "",
      pastMI: "",
      pastHeartFailure: "",
      pastStroke: "",
      pastCKD: "",
      pastLungDisease: "",
      riskDiabetes: "",
      riskDyslipidemia: "",
      riskObesity: "",
      riskSedentary: "",
      drugCompliance: "",
      drugSideEffects: "",
      allergyDrug: "",
      allergyFood: "",
      allergyOther: "",
      notes: "",
      postProcedure: false,
      abnormalTest: false,
      medications: [],
      hasFamilyHistory: false,
      familyHistory: [],
      socialRecreationalDrugs: "",
      socialDietSalt: "",
      socialDietFat: "",
      pastInterventions: {
        selected: [],
        details: {},
      },
    },
  },
  {
    step: 4,
    key: "documents",
    initialValues: {
      documentCategory: "",
      notes: "",
      files: [],
    },
  },
  {
    step: 5,
    key: "review",
    initialValues: {},
  },
];

const FIRST_STEP = STEP_CONFIGS[0]?.step ?? 1;
const LAST_STEP = STEP_CONFIGS.at(-1)?.step ?? 1;

function getConfigByStep(step: number) {
  return STEP_CONFIGS.find((c) => c.step === step) ?? STEP_CONFIGS[0]!;
}

function buildInitialAllValues(): StepValuesMap {
  const result = {} as StepValuesMap;
  for (const cfg of STEP_CONFIGS) {
    (result as Record<string, unknown>)[cfg.key] = cfg.initialValues;
  }
  return result;
}

export function useRegisterForm() {
  const { submit, fieldErrors, isPending, isSuccess, successMessage, serverErrorMessage } = useRegister();
  const [step, setStep] = useState<RegisterStep>(FIRST_STEP);
  const [stepFieldErrors, setStepFieldErrors] = useState<Partial<Record<keyof RegisterValues, string>>>({});
  const [profileFieldErrors, setProfileFieldErrors] = useState<Partial<Record<keyof RegisterProfileValues, string>>>({});
  const [medicalStepErrors, setMedicalStepErrors] = useState<{ chiefComplaint?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<StepValuesMap>({
    defaultValues: buildInitialAllValues(),
    mode: "onSubmit",
  });

  const currentConfig = getConfigByStep(step);
  const accountValues = useWatch({ control: form.control, name: "account" });
  const profileValues = useWatch({ control: form.control, name: "profile" });
  const medicalValues = useWatch({ control: form.control, name: "medical" });
  const documentsValues = useWatch({ control: form.control, name: "documents" });
  const allValues = form.getValues();
  const currentValues = allValues[currentConfig.key];

  const accountFieldErrors = useMemo(
    () => ({ ...fieldErrors, ...stepFieldErrors }),
    [fieldErrors, stepFieldErrors]
  );

  function onFieldChange(field: string, value: unknown) {
    const cfg = getConfigByStep(step);
    if (cfg.key === "review") return;

    form.setValue(`${cfg.key}.${field}` as never, value as never, {
      shouldDirty: true,
      shouldTouch: true,
    });

    if (cfg.key === "medical" && (field === "chiefComplaint" || field === "otherComplaint")) {
      setMedicalStepErrors({});
    }

    if (currentConfig.key === "account") {
      if ((stepFieldErrors as Record<string, string | undefined>)[field]) {
        setStepFieldErrors((prev) => ({ ...prev, [field]: undefined } as typeof prev));
      }
    }
  }

  function onAccountFieldChange<K extends keyof RegisterValues>(field: K, value: RegisterValues[K]) {
    onFieldChange(field, value);
  }

  function onProfileFieldChange<K extends keyof RegisterProfileValues>(
    field: K,
    value: RegisterProfileValues[K]
  ) {
    onFieldChange(field, value);
    setProfileFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function onDocumentsFieldChange<K extends keyof RegisterDocumentsValues>(
    field: K,
    value: RegisterDocumentsValues[K]
  ) {
    onFieldChange(field, value);
  }

  function validateCurrentStep(): boolean {
    const acc = form.getValues("account");
    const prof = form.getValues("profile");
    const med = form.getValues("medical");

    if (currentConfig.key === "account") {
      if (REGISTER_VALIDATION_ENABLED && currentConfig.schema) {
        const result = currentConfig.schema.safeParse(currentValues);
        if (!result.success) {
          const next: Partial<Record<keyof RegisterValues, string>> = {};
          for (const issue of result.error.issues) {
            const key = issue.path[0];
            if (
              key === "fullName" ||
              key === "email" ||
              key === "phoneNumber" ||
              key === "password" ||
              key === "confirmPassword"
            ) {
              next[key] = issue.message;
            }
          }
          setStepFieldErrors(next);
          return false;
        }
        setStepFieldErrors({});
        return true;
      }

      const next: Partial<Record<keyof RegisterValues, string>> = {};
      if (!acc.fullName?.trim()) next.fullName = "Full name is required.";
      if (!acc.email?.trim()) next.email = "Email is required.";
      if (!acc.phoneNumber?.trim()) next.phoneNumber = "Phone number is required.";
      if (!acc.password) next.password = "Password is required.";
      if (!acc.confirmPassword) next.confirmPassword = "Confirm your password.";
      if (acc.password && acc.confirmPassword && acc.password !== acc.confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
      setStepFieldErrors(next);
      return Object.keys(next).length === 0;
    }

    if (currentConfig.key === "profile") {
      const next: Partial<Record<keyof RegisterProfileValues, string>> = {};
      if (!String(prof.dateOfBirth ?? "").trim()) {
        next.dateOfBirth = "Date of birth is required.";
      }
      if (!String(prof.gender ?? "").trim()) {
        next.gender = "Sex is required.";
      }
      setProfileFieldErrors(next);
      return Object.keys(next).length === 0;
    }

    if (currentConfig.key === "medical") {
      const cc = String(med.chiefComplaint ?? "").trim();
      if (!cc) {
        setMedicalStepErrors({ chiefComplaint: "Select a chief complaint." });
        return false;
      }
      if (cc === "other" && !String(med.otherComplaint ?? "").trim()) {
        setMedicalStepErrors({ chiefComplaint: "Describe your complaint." });
        return false;
      }
      setMedicalStepErrors({});
      return true;
    }

    if (!REGISTER_VALIDATION_ENABLED) {
      setStepFieldErrors({});
      return true;
    }

    if (!currentConfig.schema) return true;

    const result = currentConfig.schema.safeParse(currentValues);
    if (!result.success) {
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }
    setStep((prev) => (prev < LAST_STEP ? prev + 1 : prev));
  }

  function goToStep(targetStep: number) {
    if (targetStep >= FIRST_STEP && targetStep <= LAST_STEP) {
      setStep(targetStep as RegisterStep);
    }
  }

  function previousStep() {
    setStep((prev) => (prev > FIRST_STEP ? prev - 1 : prev));
  }

  function submitForm() {
    submit(form.getValues("account"));
  }

  return {
    step,
    accountValues,
    profileValues,
    medicalValues,
    documentsValues,
    accountFieldErrors,
    profileFieldErrors,
    medicalStepErrors,
    showPassword,
    showConfirmPassword,
    isPending,
    isSuccess,
    successMessage,
    serverErrorMessage,
    onAccountFieldChange,
    onProfileFieldChange,
    onDocumentsFieldChange,
    onFieldChange,
    validateCurrentStep,
    currentValues,
    allValues,
    nextStep,
    previousStep,
    goToStep,
    submitForm,
    setShowPassword,
    setShowConfirmPassword,
    form,
  };
}
