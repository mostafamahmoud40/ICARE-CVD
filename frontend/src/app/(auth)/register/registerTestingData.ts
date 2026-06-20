"use client";

import type { RegisterProfileValues } from "./register.types";

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
