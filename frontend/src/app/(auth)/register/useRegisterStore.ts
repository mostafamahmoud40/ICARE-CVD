"use client";

import { create } from "zustand";

import { REGISTER_VALIDATION_ENABLED, registerSchema } from "./register.schema";
import {
  buildRegisterTestingMedicalValues,
  buildRegisterTestingProfileValues,
} from "./registerTestingData";
import type {
  RegisterDocumentsValues,
  RegisterMedicalValues,
  RegisterPayload,
  RegisterProfileValues,
  RegisterResponse,
  RegisterStep,
  RegisterValues,
} from "./register.types";
import { clearAuthTokens, setAuthTokens } from "@/lib/auth-tokens";

import {
  buildInitialAllValues,
  FIRST_STEP,
  getConfigByStep,
  LAST_STEP,
  type StepValuesMap,
} from "./useRegisterSteps";
import {
  validateAccountStep,
  validateMedicalStep,
  validateProfileStep,
} from "./useRegisterValidation";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type RegisterStoreState = {
  /* ── step ──────────────────────────────────────────── */
  step: RegisterStep;

  /* ── form values (mirror StepValuesMap) ────────────── */
  formValues: StepValuesMap;

  /* ── errors ────────────────────────────────────────── */
  accountFieldErrors: Partial<Record<keyof RegisterValues, string>>;
  stepFieldErrors: Partial<Record<keyof RegisterValues, string>>;
  profileFieldErrors: Partial<Record<keyof RegisterProfileValues, string>>;
  medicalStepErrors: { chiefComplaint?: string };

  /* ── UI toggles ────────────────────────────────────── */
  showPassword: boolean;
  showConfirmPassword: boolean;

  /* ── submission ────────────────────────────────────── */
  isPending: boolean;
  /** True after `POST /auth/register` succeeds from step 1 */
  hasRegisteredAccount: boolean;
  /** True after `POST /auth/register/step-2` succeeds from step 2 */
  hasSavedProfileStep: boolean;
  /** True after `POST /auth/register/step-3` succeeds from step 3 */
  hasSavedMedicalStep: boolean;
  /** True after `POST /auth/register/step-4` succeeds from step 4 */
  hasSavedDocumentsStep: boolean;
  isSuccess: boolean;
  successMessage: string;
  serverErrorMessage: string | null;
};

type RegisterStoreActions = {
  /* ── step navigation ──────────────────────────────── */
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (target: number) => void;

  /* ── field change handlers ─────────────────────────── */
  setAccountField: <K extends keyof RegisterValues>(field: K, value: RegisterValues[K]) => void;
  setProfileField: <K extends keyof RegisterProfileValues>(
    field: K,
    value: RegisterProfileValues[K]
  ) => void;
  setMedicalField: (field: string, value: unknown) => void;
  setDocumentsField: <K extends keyof RegisterDocumentsValues>(
    field: K,
    value: RegisterDocumentsValues[K]
  ) => void;

  /* ── UI toggles ────────────────────────────────────── */
  toggleShowPassword: () => void;
  toggleShowConfirmPassword: () => void;

  /* ── validation ────────────────────────────────────── */
  validateCurrentStep: () => boolean;

  /* ── testing helpers ─────────────────────────────── */
  fillTestingData: () => void;

  /* ── submission ────────────────────────────────────── */
  submitForm: () => void;
};

export type RegisterStore = RegisterStoreState & RegisterStoreActions;

function buildInitialRegisterState(): RegisterStoreState {
  return {
    step: FIRST_STEP as RegisterStep,
    formValues: buildInitialAllValues(),
    accountFieldErrors: {},
    stepFieldErrors: {},
    profileFieldErrors: {},
    medicalStepErrors: {},
    showPassword: false,
    showConfirmPassword: false,
    isPending: false,
    hasRegisteredAccount: false,
    hasSavedProfileStep: false,
    hasSavedMedicalStep: false,
    hasSavedDocumentsStep: false,
    isSuccess: false,
    successMessage: "",
    serverErrorMessage: null,
  };
}

/* ────────────────────────────────────────────────────────────
   Selectors (ISP: components pick only what they need)
   ──────────────────────────────────────────────────────────── */

export const selectStep = (s: RegisterStore) => s.step;

export const selectAccountProps = (s: RegisterStore) => ({
  values: s.formValues.account,
  errors: { ...s.accountFieldErrors, ...s.stepFieldErrors },
  isPending: s.isPending,
  showPassword: s.showPassword,
  showConfirmPassword: s.showConfirmPassword,
  onFieldChange: s.setAccountField,
  onTogglePassword: s.toggleShowPassword,
  onToggleConfirmPassword: s.toggleShowConfirmPassword,
});

export const selectProfileProps = (s: RegisterStore) => ({
  profileValues: s.formValues.profile,
  profileFieldErrors: s.profileFieldErrors,
  onFieldChange: s.setProfileField,
  isPending: s.isPending,
});

export const selectMedicalProps = (s: RegisterStore) => ({
  medicalValues: s.formValues.medical,
  medicalStepErrors: s.medicalStepErrors,
  onFieldChange: s.setMedicalField,
  onPrevious: s.previousStep,
  onNext: s.nextStep,
});

export const selectDocumentsProps = (s: RegisterStore) => ({
  documentsValues: s.formValues.documents,
  onFieldChange: s.setDocumentsField,
  isPending: s.isPending,
});

export const selectReviewProps = (s: RegisterStore) => ({
  accountValues: s.formValues.account,
  profileValues: s.formValues.profile,
  medicalValues: s.formValues.medical,
  documentsValues: s.formValues.documents,
  allValues: s.formValues,
});

export const selectNavigationProps = (s: RegisterStore) => ({
  step: s.step,
  isPending: s.isPending,
  onNext: s.nextStep,
  onPrevious: s.previousStep,
  onSubmit: s.submitForm,
});

export const selectFormHeaderProps = (s: RegisterStore) => ({
  step: s.step,
  isSuccess: s.isSuccess,
  successMessage: s.successMessage,
  serverErrorMessage: s.serverErrorMessage,
  goToStep: s.goToStep,
});

/* ────────────────────────────────────────────────────────────
   Store
   ──────────────────────────────────────────────────────────── */

export const useRegisterStore = create<RegisterStore>((set, get) => {
  /* ── internal helpers ────────────────────────────────── */

  function getCurrentConfig() {
    return getConfigByStep(get().step);
  }

  function updateFormValue(stepKey: string, field: string, value: unknown) {
    set((state) => ({
      formValues: {
        ...state.formValues,
        [stepKey]: {
          ...(state.formValues as Record<string, Record<string, unknown>>)[stepKey],
          [field]: value,
        },
      },
    }));
  }

  function resetExpiredRegistrationSession(message?: string) {
    const initialState = buildInitialRegisterState();
    const currentAccountValues = get().formValues.account;

    clearAuthTokens();

    set({
      ...initialState,
      formValues: {
        ...initialState.formValues,
        account: {
          ...currentAccountValues,
          password: "",
          confirmPassword: "",
        },
      },
      serverErrorMessage:
        message ??
        "Your registration session expired. Please create the account again.",
    });
  }

  /* ── API submit (mirrors useRegister logic) ─────────── */

  function applyAccountValidationErrors(values: RegisterValues): boolean {
    if (!REGISTER_VALIDATION_ENABLED) return true;
    const result = registerSchema.safeParse(values);
    if (result.success) return true;
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
    set({ accountFieldErrors: next });
    return false;
  }

  async function postRegister(payload: RegisterPayload): Promise<RegisterResponse> {
    const { apiClient } = await import("@/lib/api-client");
    const res = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return res.data;
  }

  function toOptionalString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  function toOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function buildProfileStepPayload(values: RegisterProfileValues) {
    return {
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      nationalId: toOptionalString(values.nationalId),
      bloodType: toOptionalString(values.bloodType)?.toUpperCase(),
      address: toOptionalString(values.address),
      heightCm: toOptionalNumber(values.heightCm),
      weightKg: toOptionalNumber(values.weightKg),
      maritalStatus: toOptionalString(values.maritalStatus),
      occupation: toOptionalString(values.occupation),
      smokingStatus: toOptionalString(values.smokingStatus),
      alcoholConsumption: toOptionalString(values.alcoholConsumption),
      caffeineIntake: toOptionalNumber(values.caffeineIntake),
      recreationalDrugUse: toOptionalString(values.recreationalDrugUse),
      exerciseFrequency: toOptionalString(values.exerciseFrequency),
      exerciseDuration: toOptionalString(values.exerciseDuration),
      exerciseType: toOptionalString(values.exerciseType),
      physicalActivityLevel: toOptionalString(values.physicalActivityLevel),
      dietaryHabits: toOptionalString(values.dietaryHabits),
      stressLevel: toOptionalString(values.stressLevel),
    };
  }

  async function postRegisterStep2(values: RegisterProfileValues): Promise<void> {
    const { apiClient } = await import("@/lib/api-client");
    await apiClient.post("/auth/register/step-2", buildProfileStepPayload(values));
  }

  function stringOf(input: unknown): string {
    return typeof input === "string" ? input : "";
  }

  function boolOf(input: unknown): boolean {
    return Boolean(input);
  }

  function arrOf<T>(input: unknown): T[] {
    return Array.isArray(input) ? (input as T[]) : [];
  }

  function buildMedicalStepPayload(values: RegisterMedicalValues) {
    const chiefComplaint = stringOf(values.chiefComplaint).trim();
    const chiefComplaintOtherText = stringOf(values.otherComplaint).trim();

    const knownKeys = new Set([
      "chiefComplaint",
      "otherComplaint",
      "noCardiacHistory",
      "noNonCardiacHistory",
      "hasFamilyHistory",
      "familyHistory",
      "medications",
      "drugAllergies",
      "foodAllergies",
      "otherAllergies",
      "riskHypertension",
      "riskDiabetes",
      "riskDyslipidemia",
      "riskObesity",
      "riskSedentary",
    ]);

    const hpiData: Record<string, unknown> = {};
    const inputObj = values as Record<string, unknown>;
    for (const [key, value] of Object.entries(inputObj)) {
      if (!knownKeys.has(key)) hpiData[key] = value;
    }

    const pastCardiacHistory = {
      pastHypertension: values.pastHypertension,
      pastMI: values.pastMI,
      pastHeartFailure: values.pastHeartFailure,
      pastCardiomyopathy: values.pastCardiomyopathy,
      pastValvular: values.pastValvular,
      pastArrhythmias: values.pastArrhythmias,
      pastStroke: values.pastStroke,
      pastEndocarditis: values.pastEndocarditis,
      pastRheumatic: values.pastRheumatic,
      pastPulmonaryHypertension: values.pastPulmonaryHypertension,
      pastInterventions: values.pastInterventions,
    };

    const pastNonCardiacHistory = {
      pastStroke: values.pastStroke,
      pastCKD: values.pastCKD,
      pastLungDisease: values.pastLungDisease,
      pastThyroid: values.pastThyroid,
      pastLiver: values.pastLiver,
      pastAnemia: values.pastAnemia,
      pastAutoimmune: values.pastAutoimmune,
      pastMalignancy: values.pastMalignancy,
      pastSleepApnea: values.pastSleepApnea,
    };

    const cardiovascularRiskFactors = {
      riskHypertension: values.riskHypertension,
      riskDiabetes: values.riskDiabetes,
      riskDyslipidemia: values.riskDyslipidemia,
      riskObesity: values.riskObesity,
      riskSedentary: values.riskSedentary,
    };

    return {
      chiefComplaint,
      chiefComplaintOtherText: chiefComplaintOtherText || undefined,
      hpiData,
      noCardiacHistory: boolOf(values.noCardiacHistory),
      pastCardiacHistory,
      noNonCardiacHistory: boolOf(values.noNonCardiacHistory),
      pastNonCardiacHistory,
      cardiovascularRiskFactors,
      hasFamilyHistory: boolOf(values.hasFamilyHistory),
      familyHistory: arrOf<Record<string, unknown>>(values.familyHistory),
      medications: arrOf<Record<string, unknown>>(values.medications),
      drugAllergies: arrOf<Record<string, unknown>>(values.drugAllergies),
      foodAllergies: arrOf<Record<string, unknown>>(values.foodAllergies),
      otherAllergies: arrOf<Record<string, unknown>>(values.otherAllergies),
    };
  }

  async function postRegisterStep3(values: RegisterMedicalValues): Promise<void> {
    const { apiClient } = await import("@/lib/api-client");
    await apiClient.post("/auth/register/step-3", buildMedicalStepPayload(values));
  }

  async function postRegisterStep4(values: RegisterDocumentsValues): Promise<void> {
    const { apiClient } = await import("@/lib/api-client");
    await apiClient.post("/auth/register/step-4", {
      documentCategory: values.documentCategory,
      notes: values.notes,
      files: values.files,
    });
  }

  /** Step 1 Continue: create user row, then go to step 2 */
  async function registerAccountAndGoToStep2(values: RegisterValues) {
    if (!applyAccountValidationErrors(values)) return;

    set({ accountFieldErrors: {}, isPending: true, serverErrorMessage: null });

    const payload: RegisterPayload = {
      fullName: values.fullName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      password: values.password,
    };

    try {
      const data = await postRegister(payload);
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      set({
        isPending: false,
        hasRegisteredAccount: true,
        step: 2 as RegisterStep,
        serverErrorMessage: null,
      });
    } catch (err: unknown) {
      const { isAxiosError } = await import("axios");
      let message = "Something went wrong. Try again.";
      if (isAxiosError(err)) {
        message =
          (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
      }
      set({ isPending: false, serverErrorMessage: message });
    }
  }

  async function doSubmit(values: RegisterValues) {
    if (!applyAccountValidationErrors(values)) return;

    set({ accountFieldErrors: {}, isPending: true, serverErrorMessage: null });

    const payload: RegisterPayload = {
      fullName: values.fullName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      password: values.password,
    };

    try {
      const data = await postRegister(payload);
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      set({
        isPending: false,
        isSuccess: true,
        hasRegisteredAccount: true,
        successMessage:
          data.message ?? "Your account has been created. You can now sign in.",
      });
    } catch (err: unknown) {
      const { isAxiosError } = await import("axios");
      let message = "Something went wrong. Try again.";
      if (isAxiosError(err)) {
        message =
          (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
      }
      set({ isPending: false, serverErrorMessage: message });
    }
  }

  /** Step 2 Continue: save profile row, then go to step 3 */
  async function saveProfileAndGoToStep3(values: RegisterProfileValues) {
    set({ isPending: true, serverErrorMessage: null });
    try {
      await postRegisterStep2(values);
      set({
        isPending: false,
        hasSavedProfileStep: true,
        step: 3 as RegisterStep,
        serverErrorMessage: null,
      });
    } catch (err: unknown) {
      const { isAxiosError } = await import("axios");
      let message = "Failed to save step 2. Try again.";
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] } | undefined;
        if (err.response?.status === 401) {
          resetExpiredRegistrationSession(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message
          );
          return;
        }
        if (Array.isArray(data?.message)) {
          message = data.message.join(", ");
        } else {
          message = data?.message ?? err.message;
        }
      }
      set({ isPending: false, serverErrorMessage: message });
    }
  }

  /** Step 3 Continue: save medical history, then go to step 4 */
  async function saveMedicalAndGoToStep4(values: RegisterMedicalValues) {
    set({ isPending: true, serverErrorMessage: null });
    try {
      await postRegisterStep3(values);
      set({
        isPending: false,
        hasSavedMedicalStep: true,
        step: 4 as RegisterStep,
        serverErrorMessage: null,
      });
    } catch (err: unknown) {
      const { isAxiosError } = await import("axios");
      let message = "Failed to save step 3. Try again.";
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] } | undefined;
        if (err.response?.status === 401) {
          resetExpiredRegistrationSession(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message
          );
          return;
        }
        if (Array.isArray(data?.message)) {
          message = data.message.join(", ");
        } else {
          message = data?.message ?? err.message;
        }
      }
      set({ isPending: false, serverErrorMessage: message });
    }
  }

  /** Step 4 Continue: save documents, then go to step 5 */
  async function saveDocumentsAndGoToStep5(values: RegisterDocumentsValues) {
    set({ isPending: true, serverErrorMessage: null });
    try {
      await postRegisterStep4(values);
      set({
        isPending: false,
        hasSavedDocumentsStep: true,
        step: 5 as RegisterStep,
        serverErrorMessage: null,
      });
    } catch (err: unknown) {
      const { isAxiosError } = await import("axios");
      let message = "Failed to save step 4. Try again.";
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[] } | undefined;
        if (err.response?.status === 401) {
          resetExpiredRegistrationSession(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message
          );
          return;
        }
        if (Array.isArray(data?.message)) {
          message = data.message.join(", ");
        } else {
          message = data?.message ?? err.message;
        }
      }
      set({ isPending: false, serverErrorMessage: message });
    }
  }

  return {
    /* ── initial state ───────────────────────────────── */
    ...buildInitialRegisterState(),

    /* ── step navigation ─────────────────────────────── */
    nextStep() {
      const {
        step,
        hasRegisteredAccount,
        hasSavedProfileStep,
        hasSavedMedicalStep,
        hasSavedDocumentsStep,
        formValues,
      } = get();

      if (step === 1) {
        if (!get().validateCurrentStep()) return;
        if (hasRegisteredAccount) {
          set((s) => ({
            step: (s.step < LAST_STEP ? s.step + 1 : s.step) as RegisterStep,
          }));
          return;
        }
        void registerAccountAndGoToStep2(formValues.account);
        return;
      }

      if (step === 2) {
        if (!get().validateCurrentStep()) return;
        if (!hasRegisteredAccount) return;
        if (hasSavedProfileStep) {
          set({ step: 3 as RegisterStep });
          return;
        }
        void saveProfileAndGoToStep3(formValues.profile);
        return;
      }

      if (step === 3) {
        if (!get().validateCurrentStep()) return;
        if (!hasRegisteredAccount || !hasSavedProfileStep) return;
        if (hasSavedMedicalStep) {
          set({ step: 4 as RegisterStep });
          return;
        }
        void saveMedicalAndGoToStep4(formValues.medical);
        return;
      }

      if (step === 4) {
        if (!hasRegisteredAccount || !hasSavedProfileStep || !hasSavedMedicalStep) return;
        if (hasSavedDocumentsStep) {
          set({ step: 5 as RegisterStep });
          return;
        }
        void saveDocumentsAndGoToStep5(formValues.documents);
        return;
      }

      if (!get().validateCurrentStep()) return;
      set((s) => ({ step: (s.step < LAST_STEP ? s.step + 1 : s.step) as RegisterStep }));
    },

    previousStep() {
      set((s) => ({ step: (s.step > FIRST_STEP ? s.step - 1 : s.step) as RegisterStep }));
    },

    goToStep(target: number) {
      if (target >= FIRST_STEP && target <= LAST_STEP) {
        set({ step: target as RegisterStep });
      }
    },

    /* ── field changes ───────────────────────────────── */
    setAccountField(field, value) {
      updateFormValue("account", field, value);

      // Clear field-level error on change
      const { stepFieldErrors } = get();
      if ((stepFieldErrors as Record<string, string | undefined>)[field]) {
        set({
          stepFieldErrors: { ...stepFieldErrors, [field]: undefined } as typeof stepFieldErrors,
        });
      }
    },

    setProfileField(field, value) {
      updateFormValue("profile", field, value);
      set((s) => ({
        profileFieldErrors: { ...s.profileFieldErrors, [field]: undefined },
        hasSavedProfileStep: false,
      }));
    },

    setMedicalField(field, value) {
      updateFormValue("medical", field, value);

      set({ hasSavedMedicalStep: false });

      if (field === "chiefComplaint" || field === "otherComplaint") {
        set({ medicalStepErrors: {} });
      }
    },

    setDocumentsField(field, value) {
      updateFormValue("documents", field, value);
      set({ hasSavedDocumentsStep: false });
    },

    /* ── UI toggles ──────────────────────────────────── */
    toggleShowPassword() {
      set((s) => ({ showPassword: !s.showPassword }));
    },

    toggleShowConfirmPassword() {
      set((s) => ({ showConfirmPassword: !s.showConfirmPassword }));
    },

    /* ── validation ──────────────────────────────────── */
    validateCurrentStep(): boolean {
      const config = getCurrentConfig();
      const { formValues } = get();
      const acc = formValues.account;
      const prof = formValues.profile;
      const med = formValues.medical;
      const currentValues = (formValues as Record<string, unknown>)[config.key];

      if (config.key === "account") {
        const errors = validateAccountStep(acc, config, currentValues);
        set({ stepFieldErrors: errors });
        return Object.keys(errors).length === 0;
      }

      if (config.key === "profile") {
        const errors = validateProfileStep(prof);
        set({ profileFieldErrors: errors });
        return Object.keys(errors).length === 0;
      }

      if (config.key === "medical") {
        const errors = validateMedicalStep(med);
        if (errors) {
          set({ medicalStepErrors: errors });
          return false;
        }
        set({ medicalStepErrors: {} });
        return true;
      }

      if (!REGISTER_VALIDATION_ENABLED) {
        set({ stepFieldErrors: {} });
        return true;
      }

      if (!config.schema) return true;

      const result = config.schema.safeParse(currentValues);
      return result.success;
    },

    /* ── testing helpers ─────────────────────────────── */
    fillTestingData() {
      const { formValues } = get();
      set({
        formValues: {
          ...formValues,
          profile: buildRegisterTestingProfileValues(),
          medical: buildRegisterTestingMedicalValues(),
        },
        profileFieldErrors: {},
        medicalStepErrors: {},
        serverErrorMessage: null,
        hasSavedProfileStep: false,
        hasSavedMedicalStep: false,
      });
    },

    /* ── submission ──────────────────────────────────── */
    submitForm() {
      const { formValues, hasRegisteredAccount } = get();
      if (hasRegisteredAccount) {
        set({
          isSuccess: true,
          successMessage: "Registration submitted. Account and profile are saved.",
        });
        return;
      }
      void doSubmit(formValues.account);
    },
  };
});
