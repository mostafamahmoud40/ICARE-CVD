"use client";

import type { RegisterMedicalValues, RegisterProfileValues } from "./register.types";
import { buildInitialAllValues } from "./useRegisterSteps";

export function buildRegisterTestingProfileValues(): RegisterProfileValues {
  return {
    dateOfBirth: "1988-06-15",
    nationalId: "28806151234567",
    gender: "male",
    bloodType: "o+",
    address: "12 Nile Corniche, Dokki, Giza",
    heightCm: "178",
    weightKg: "84",
    maritalStatus: "married",
    occupation: "QA Engineer",
    smokingStatus: "former-10",
    smokingPackYears: "10",
    alcoholConsumption: "rarely",
    caffeineIntake: "2",
    exerciseFrequency: "3-4",
    exerciseDuration: "30-60",
    exerciseType: "walking",
    recreationalDrugUse: "no",
    physicalActivityLevel: "moderate",
    dietaryHabits: "balanced",
    highSaltDiet: false,
    highFatDiet: false,
    stressLevel: "moderate",
  };
}

export function buildRegisterTestingMedicalValues(): RegisterMedicalValues {
  const baseMedicalValues = buildInitialAllValues().medical;

  return {
    ...baseMedicalValues,
    chiefComplaint: "chest-pain",
    chestPainOnsetDate: "2026-04-10",
    chestPainOnsetType: "gradual",
    chestPainProvoking: ["exertion", "stress"],
    chestPainQuality: ["pressure", "tightness"],
    chestPainRadiation: "left_arm",
    chestPainSeverity: "7",
    chestPainTimingPattern: "intermittent",
    chestPainTimingDuration: "15 minutes",
    chestPainRelieving: ["rest"],
    chestPainAssociated: ["dyspnea", "palpitations"],
    noCardiacHistory: false,
    noNonCardiacHistory: false,
    pastHypertension: "Yes",
    pastMI: "No",
    pastHeartFailure: "No",
    pastCardiomyopathy: "No",
    pastValvular: "No",
    pastArrhythmias: "Not sure",
    pastStroke: "No",
    pastEndocarditis: "No",
    pastRheumatic: "No",
    pastPulmonaryHypertension: "No",
    pastCKD: "No",
    pastLungDisease: "No",
    pastThyroid: "No",
    pastLiver: "No",
    pastAnemia: "No",
    pastAutoimmune: "No",
    pastMalignancy: "No",
    pastSleepApnea: "No",
    riskHypertension: "Yes",
    riskDiabetes: "No",
    riskDyslipidemia: "Yes",
    riskObesity: "No",
    riskSedentary: "No",
    hasFamilyHistory: true,
    familyHistory: [
      {
        id: "test-family-father",
        relationship: "Father",
        condition: "Hypertension",
        details: "Diagnosed in his 50s",
      },
      {
        id: "test-family-mother",
        relationship: "Mother",
        condition: "Diabetes",
        details: "Controlled on oral medications",
      },
    ],
    medications: [
      {
        id: "test-med-aspirin",
        name: "Aspirin",
        dose: "81 mg",
        frequency: "once-daily",
        type: "antiplatelets",
        compliance: "good",
        sideEffects: "",
        category: "",
      },
      {
        id: "test-med-atorvastatin",
        name: "Atorvastatin",
        dose: "20 mg",
        frequency: "once-daily",
        type: "statins",
        compliance: "good",
        sideEffects: "Mild muscle ache occasionally",
        category: "",
      },
      {
        id: "test-med-bisoprolol",
        name: "Bisoprolol",
        dose: "5 mg",
        frequency: "once-daily",
        type: "antiarrhythmics",
        compliance: "good",
        sideEffects: "",
        category: "",
      },
    ],
    drugAllergies: [
      {
        id: "test-drug-allergy-penicillin",
        allergen: "Penicillin",
        reaction: "Skin rash",
      },
    ],
    foodAllergies: [
      {
        id: "test-food-allergy-shellfish",
        allergen: "Shellfish",
        reaction: "Itching",
      },
    ],
    otherAllergies: [
      {
        id: "test-other-allergy-dust",
        allergen: "Dust",
        reaction: "Sneezing",
      },
    ],
    pastInterventions: {
      selected: ["pci"],
      details: {
        pci: {
          dateMy: "03/2024",
          vessel: "LAD",
        },
      },
      otherText: "",
    },
  };
}
