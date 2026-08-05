"use client";

import { REGISTER_VALIDATION_ENABLED } from "./register.schema";
import type {
  RegisterMedicalValues,
  RegisterProfileValues,
  RegisterValues,
} from "./register.types";
import type { StepConfig, StepKey } from "./useRegisterSteps";

/**
 * Validate the account step. Returns a partial error record
 * (empty object means valid).
 */
export function validateAccountStep(
  acc: RegisterValues,
  config: StepConfig<StepKey>,
  currentValues: unknown
): Partial<Record<keyof RegisterValues, string>> {
  if (REGISTER_VALIDATION_ENABLED && config.schema) {
    const result = config.schema.safeParse(currentValues);
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
      return next;
    }
    return {};
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
  return next;
}

/**
 * Validate the profile step. Returns a partial error record.
 */
export function validateProfileStep(
  prof: RegisterProfileValues
): Partial<Record<keyof RegisterProfileValues, string>> {
  const next: Partial<Record<keyof RegisterProfileValues, string>> = {};
  if (!String(prof.dateOfBirth ?? "").trim()) {
    next.dateOfBirth = "Date of birth is required.";
  }
  if (!String(prof.gender ?? "").trim()) {
    next.gender = "Sex is required.";
  }
  return next;
}

/**
 * Validate the medical step chief complaint.
 * Returns an error object or null.
 */
export function validateMedicalStep(
  med: RegisterMedicalValues
): { chiefComplaint?: string } | null {
  const cc = String(med.chiefComplaint ?? "").trim();
  if (!cc) {
    return { chiefComplaint: "Select a chief complaint." };
  }
  if (cc === "other" && !String(med.otherComplaint ?? "").trim()) {
    return { chiefComplaint: "Describe your complaint." };
  }
  return null;
}
