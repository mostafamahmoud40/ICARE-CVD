"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RegisterCredentials } from "../services/credentials";

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

type RegisterFlowStore = {
  credentials: RegisterCredentials;
  resetCredentials: () => void;
  setField: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
};

export const useRegisterFlowStore = create<RegisterFlowStore>()(
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
        const nextState = persistedState as Partial<RegisterFlowStore> | undefined;

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
