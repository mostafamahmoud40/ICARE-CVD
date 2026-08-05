"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RegisterProfileValues, RegisterValues } from "./register.types";

type RegistrationAnalysisInput = {
  accountValues: RegisterValues;
  profileValues: RegisterProfileValues;
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
  };
};

type RegistrationAnalyzeResponse = {
  analysis: string;
};

type PersistRegistrationSummaryResponse = {
  saved: boolean;
  summary: string | null;
};

export type UseRegistrationAnalysisOptions = {
  /** When true (e.g. review step), the first non-empty analysis is POSTed to persist text + embedding server-side. */
  persistToPatientRecord?: boolean;
};

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
      chiefComplaint: "",
      otherComplaint: "",
    },
  };
}

export function useRegistrationAnalysis(
  input: RegistrationAnalysisInput,
  options?: UseRegistrationAnalysisOptions,
) {
  const persistToPatientRecord = options?.persistToPatientRecord ?? false;
  const persistAttemptedRef = useRef(false);

  const payload = buildRequest(input);

  const analysisQuery = useQuery({
    queryKey: ["registration-analysis", payload],
    queryFn: () =>
      apiClient
        .post<RegistrationAnalyzeResponse>("/ai/registration-analyze", payload)
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { mutate: persistSummary, isSuccess: persistSucceeded } = useMutation({
    mutationFn: (analysis: string) =>
      apiClient
        .post<PersistRegistrationSummaryResponse>("/ai/registration-summary", { analysis })
        .then((response) => response.data),
  });

  const live = (analysisQuery.data?.analysis ?? "").trim();

  useEffect(() => {
    if (!persistToPatientRecord || !live) return;
    if (persistAttemptedRef.current) return;
    persistAttemptedRef.current = true;
    persistSummary(live, {
      onError: () => {
        persistAttemptedRef.current = false;
      },
    });
  }, [live, persistSummary, persistToPatientRecord]);

  const summarySavedToRecord = persistSucceeded;

  return {
    data: live ? { analysis: live } : undefined,
    isLoading: analysisQuery.isLoading,
    isFetching: analysisQuery.isFetching,
    isError: analysisQuery.isError,
    refetch: analysisQuery.refetch,
    canRefresh: !summarySavedToRecord,
  };
}
