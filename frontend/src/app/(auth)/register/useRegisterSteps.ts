"use client";

import type { z } from "zod";

import { MEDICAL_HPI_EXTENDED_DEFAULTS } from "./medicalHpiDefaults";
import { registerSchema } from "./register.schema";
import type {
  RegisterDocumentsValues,
  RegisterMedicalValues,
  RegisterProfileValues,
  RegisterValues,
} from "./register.types";

export type StepKey = "account" | "profile" | "medical" | "documents" | "review";

export type StepValuesMap = {
  account: RegisterValues;
  profile: RegisterProfileValues;
  medical: RegisterMedicalValues;
  documents: RegisterDocumentsValues;
  review: Record<string, never>;
};

export type StepConfig<K extends StepKey> = {
  step: number;
  key: K;
  initialValues: StepValuesMap[K];
  schema?: z.ZodTypeAny;
};

export const STEP_CONFIGS: Array<StepConfig<StepKey>> = [
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
      smokingPackYears: "",
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
        otherText: "",
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

export const FIRST_STEP = STEP_CONFIGS[0]?.step ?? 1;
export const LAST_STEP = STEP_CONFIGS.at(-1)?.step ?? 1;

export function getConfigByStep(step: number) {
  return STEP_CONFIGS.find((c) => c.step === step) ?? STEP_CONFIGS[0]!;
}

export function buildInitialAllValues(): StepValuesMap {
  const result = {} as StepValuesMap;
  for (const cfg of STEP_CONFIGS) {
    (result as Record<string, unknown>)[cfg.key] = cfg.initialValues;
  }
  return result;
}
