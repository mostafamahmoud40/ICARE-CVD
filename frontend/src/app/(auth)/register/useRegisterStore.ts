"use client";

import { create } from "zustand";

import { REGISTER_VALIDATION_ENABLED, registerSchema } from "./register.schema";
import type {
  RegisterDocumentsValues,
  RegisterMedicalValues,
  RegisterPayload,
  RegisterProfileValues,
  RegisterResponse,
  RegisterStep,
  RegisterValues,
} from "./register.types";
import { setAuthTokens } from "@/lib/auth-tokens";

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

  /* ── submission ────────────────────────────────────── */
  submitForm: () => void;
};

export type RegisterStore = RegisterStoreState & RegisterStoreActions;

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

  function getFieldPath(stepKey: string, field: string): string {
    return `${stepKey}.${field}`;
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

  return {
    /* ── initial state ───────────────────────────────── */
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
    isSuccess: false,
    successMessage: "",
    serverErrorMessage: null,

    /* ── step navigation ─────────────────────────────── */
    nextStep() {
      const { step, hasRegisteredAccount, formValues } = get();

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
      }));
    },

    setMedicalField(field, value) {
      updateFormValue("medical", field, value);

      if (field === "chiefComplaint" || field === "otherComplaint") {
        set({ medicalStepErrors: {} });
      }
    },

    setDocumentsField(field, value) {
      updateFormValue("documents", field, value);
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

    /* ── submission ──────────────────────────────────── */
    submitForm() {
      const { formValues, hasRegisteredAccount } = get();
      if (hasRegisteredAccount) {
        set({
          isSuccess: true,
          successMessage:
            "Your account is saved. Health profile steps are stored in this session until backend profile APIs are connected.",
        });
        return;
      }
      void doSubmit(formValues.account);
    },
  };
});
