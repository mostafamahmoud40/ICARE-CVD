"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RegisterMedicalValues, RegisterProfileValues, RegisterValues } from "./register.types";

type RegistrationAnalysisInput = {
  accountValues: RegisterValues;
  profileValues: RegisterProfileValues;
  medicalValues: RegisterMedicalValues;
};

type RegistrationAnalyzeRequest = {
  account: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  profile: {
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    smokingStatus: string;
    alcoholConsumption: string;
    physicalActivityLevel: string;
    stressLevel: string;
    heightCm: string;
    weightKg: string;
  };
  medical: {
    chiefComplaint: string;
    otherComplaint: string;
    hpiData?: Record<string, unknown>;
    pastCardiacHistory?: Record<string, unknown>;
    pastNonCardiacHistory?: Record<string, unknown>;
    cardiovascularRiskFactors?: Record<string, unknown>;
  };
};

type RegistrationAnalyzeResponse = {
  analysis: string;
};

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function buildRequest(input: RegistrationAnalysisInput): RegistrationAnalyzeRequest {
  return {
    account: {
      fullName: input.accountValues.fullName,
      email: input.accountValues.email,
      phoneNumber: input.accountValues.phoneNumber,
    },
    profile: {
      dateOfBirth: input.profileValues.dateOfBirth,
      gender: input.profileValues.gender,
      bloodType: input.profileValues.bloodType,
      smokingStatus: input.profileValues.smokingStatus,
      alcoholConsumption: input.profileValues.alcoholConsumption,
      physicalActivityLevel: input.profileValues.physicalActivityLevel,
      stressLevel: input.profileValues.stressLevel,
      heightCm: input.profileValues.heightCm,
      weightKg: input.profileValues.weightKg,
    },
    medical: {
      chiefComplaint: typeof input.medicalValues.chiefComplaint === "string" ? input.medicalValues.chiefComplaint : "",
      otherComplaint: typeof input.medicalValues.otherComplaint === "string" ? input.medicalValues.otherComplaint : "",
      hpiData: toRecord(input.medicalValues.hpiData),
      pastCardiacHistory: toRecord(input.medicalValues.pastCardiacHistory),
      pastNonCardiacHistory: toRecord(input.medicalValues.pastNonCardiacHistory),
      cardiovascularRiskFactors: toRecord(input.medicalValues.cardiovascularRiskFactors),
    },
  };
}

export function useRegistrationAnalysis(input: RegistrationAnalysisInput) {
  const payload = buildRequest(input);

  return useQuery({
    queryKey: ["registration-analysis", payload],
    queryFn: () =>
      apiClient
        .post<RegistrationAnalyzeResponse>("/ai/registration-analyze", payload)
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
