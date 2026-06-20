"use client";

import { create } from "zustand";

import { REGISTER_VALIDATION_ENABLED, registerSchema } from "./register.schema";
import {
  buildRegisterTestingProfileValues,
} from "./registerTestingData";
import type {
  RegisterDocumentsValues,
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

  /* ── UI toggles ────────────────────────────────────── */
  showPassword: boolean;
  showConfirmPassword: boolean;

  /* ── submission ────────────────────────────────────── */
  isPending: boolean;
  /** Email awaiting OTP before account is created in DB */
  pendingVerificationEmail: string | null;
  /** True after email OTP verified and account activated */
  hasRegisteredAccount: boolean;
  /** True after `POST /auth/register/step-2` succeeds from step 2 */
  hasSavedProfileStep: boolean;
  /** True after `POST /auth/register/step-4` succeeds from step 3 */
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

  /** Called after registration OTP is verified */
  clearPendingVerificationEmail: () => void;

  completeEmailVerification: (data: RegisterResponse) => void;

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
    showPassword: false,
    showConfirmPassword: false,
    isPending: false,
    pendingVerificationEmail: null,
    hasRegisteredAccount: false,
    hasSavedProfileStep: false,
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

export const selectDocumentsProps = (s: RegisterStore) => ({
  documentsValues: s.formValues.documents,
  onFieldChange: s.setDocumentsField,
  isPending: s.isPending,
});

export const selectReviewProps = (s: RegisterStore) => ({
  accountValues: s.formValues.account,
  profileValues: s.formValues.profile,
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


  async function postRegisterStep4(values: RegisterDocumentsValues): Promise<void> {
    const { apiClient } = await import("@/lib/api-client");
    await apiClient.post("/auth/register/step-4", {
      documentCategory: values.documentCategory,
      notes: values.notes,
      files: values.files,
    });
  }

  /** Step 1 Continue: create pending user and request email OTP */
  async function registerAccountAndRequestOtp(values: RegisterValues) {
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
      if (!data.requiresEmailVerification || !data.email) {
        throw new Error("Unexpected registration response.");
      }
      set({
        isPending: false,
        pendingVerificationEmail: data.email,
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
    const { hasRegisteredAccount } = get();
    if (hasRegisteredAccount) {
      set({
        isSuccess: true,
        successMessage: "Registration submitted. Account and profile are saved.",
      });
      return;
    }
    void registerAccountAndRequestOtp(values);
  }

  /** Step 2 Continue: save profile row, then go to step 3 */
  async function saveProfileAndGoToStep3(values: RegisterProfileValues) {
    set({ isPending: true, serverErrorMessage: null });
    try {
      await postRegisterStep2(values);
      set({
        isPending: false,
        hasSavedProfileStep: true,
        step: 4 as RegisterStep,
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

  /** Step 3 Continue: save documents, then go to step 4 */
  async function saveDocumentsAndGoToReview(values: RegisterDocumentsValues) {
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
      let message = "Failed to save documents. Try again.";
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
        hasSavedDocumentsStep,
        formValues,
      } = get();

      if (step === 1) {
        if (!get().validateCurrentStep()) return;
        if (hasRegisteredAccount) {
          set({ step: 3 as RegisterStep });
          return;
        }
        void registerAccountAndRequestOtp(formValues.account);
        return;
      }

      if (step === 2) {
        return;
      }

      if (step === 3) {
        if (!get().validateCurrentStep()) return;
        if (!hasRegisteredAccount) return;
        if (hasSavedProfileStep) {
          set({ step: 4 as RegisterStep });
          return;
        }
        void saveProfileAndGoToStep3(formValues.profile);
        return;
      }

      if (step === 4) {
        if (!hasRegisteredAccount || !hasSavedProfileStep) return;
        if (hasSavedDocumentsStep) {
          set({ step: 5 as RegisterStep });
          return;
        }
        void saveDocumentsAndGoToReview(formValues.documents);
        return;
      }

      if (!get().validateCurrentStep()) return;
      set((s) => ({ step: (s.step < LAST_STEP ? s.step + 1 : s.step) as RegisterStep }));
    },

    previousStep() {
      const { step, hasRegisteredAccount } = get();
      if (step === 3 && !hasRegisteredAccount) {
        set({ step: 2 as RegisterStep });
        return;
      }
      set((s) => ({ step: (s.step > FIRST_STEP ? s.step - 1 : s.step) as RegisterStep }));
    },

    goToStep(target: number) {
      const { hasRegisteredAccount, pendingVerificationEmail } = get();
      if (target >= 3 && !hasRegisteredAccount) return;
      if (target === 2 && !pendingVerificationEmail && !hasRegisteredAccount) return;
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

    setDocumentsField(field, value) {
      updateFormValue("documents", field, value);
      set({ hasSavedDocumentsStep: false });
    },

    completeEmailVerification(data: RegisterResponse) {
      if (!data.accessToken || !data.refreshToken || !data.user) return;

      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          ...data.user,
          phone: data.user.phone ?? "",
          role: data.user.role as "patient",
        },
      });

      set({
        pendingVerificationEmail: null,
        hasRegisteredAccount: true,
        step: 3 as RegisterStep,
        serverErrorMessage: null,
      });
    },

    clearPendingVerificationEmail() {
      set({ pendingVerificationEmail: null });
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

      if (!REGISTER_VALIDATION_ENABLED) {
        set({ stepFieldErrors: {} });
        return true;
      }

      if (!config.schema) return true;

      const result = config.schema.safeParse(currentValues);
      return result.success;
    },

    fillTestingData() {
      const { formValues } = get();
      set({
        formValues: {
          ...formValues,
          profile: buildRegisterTestingProfileValues(),
        },
        profileFieldErrors: {},
        serverErrorMessage: null,
        hasSavedProfileStep: false,
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
