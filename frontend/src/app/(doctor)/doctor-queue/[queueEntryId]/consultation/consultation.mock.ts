import type { ConsultationData, PatientSummary } from "./consultation.types"
import { mockAiSuggestions } from "./consultation.ai.mock"
import { createConsultationDataFromPatient } from "./consultation.template"

/** Demo patient summary for AI briefing mock content only. */
export const mockBriefingPatientSummary: PatientSummary = {
  demographics: {
    fullName: "Ahmed Al-Rashid",
    age: 58,
    gender: "male",
    bloodType: "A+",
    dateOfBirth: "1968-03-15",
    nationalId: "29901011234567",
    phone: "+20 100 123 4567",
    email: "ahmed.rashid@email.com",
    address: "12 Nasr City, Cairo, Egypt",
    occupation: "Retired Engineer",
    maritalStatus: "Married",
    avatarUrl: null,
  },
  allergies: [
    { id: "a1", category: "drug", allergen: "Penicillin", reaction: "Anaphylaxis" },
    { id: "a2", category: "drug", allergen: "Sulfonamides", reaction: "Skin rash" },
    { id: "a3", category: "food", allergen: "Shellfish", reaction: "Urticaria" },
  ],
  activeMedications: [
    { id: "m1", name: "Amlodipine", dose: "5 mg", frequency: "Once daily", status: "active" },
    { id: "m2", name: "Atorvastatin", dose: "20 mg", frequency: "Once daily", status: "active" },
    { id: "m3", name: "Metformin", dose: "500 mg", frequency: "Twice daily", status: "active" },
    { id: "m4", name: "Aspirin", dose: "81 mg", frequency: "Once daily", status: "active" },
  ],
  familyHistory: [
    { id: "fh1", relationship: "Father", condition: "Myocardial Infarction", details: "MI at age 52, fatal" },
    { id: "fh2", relationship: "Mother", condition: "Type 2 Diabetes", details: "Diagnosed at age 45" },
    { id: "fh3", relationship: "Brother", condition: "Hypertension", details: "On medication since age 40" },
  ],
  lifestyleFlags: [
    { label: "Smoking", value: "Former (quit 5 yrs ago, 20 pack-years)", riskLevel: "moderate" },
    { label: "Alcohol", value: "None", riskLevel: "low" },
    { label: "Exercise", value: "1-2 times/week, walking", riskLevel: "moderate" },
    { label: "Diet", value: "High salt", riskLevel: "high" },
    { label: "Stress", value: "High", riskLevel: "high" },
    { label: "BMI", value: "31.2 (Obese)", riskLevel: "high" },
  ],
  existingConditions: [
    { id: "ec1", name: "Essential Hypertension", details: "Diagnosed 2019, Stage II", diagnosedAt: "2019-06-10" },
    { id: "ec2", name: "Type 2 Diabetes Mellitus", details: "HbA1c 7.2%", diagnosedAt: "2020-02-20" },
    { id: "ec3", name: "Dyslipidemia", details: "LDL 160 mg/dL", diagnosedAt: "2019-06-10" },
  ],
}

export { mockAiSuggestions } from "./consultation.ai.mock"

/** Full mock consultation used by AI briefing demo only. */
export const mockConsultationData: ConsultationData = {
  ...createConsultationDataFromPatient("p-001", mockBriefingPatientSummary),
  medicalHistory: {
    noCardiacHistory: false,
    cardiacAnswers: {
      pastHypertension: "Yes",
      pastMI: "No",
      pastHeartFailure: "No",
      pastArrhythmias: "Not sure",
    },
    cardiacNotes: "",
    cardiacReviewed: false,
    noNonCardiacHistory: false,
    nonCardiacAnswers: {
      pastCKD: "No",
      pastLungDisease: "No",
    },
    nonCardiacNotes: "",
    nonCardiacReviewed: false,
    noKnownAllergies: false,
    noChronicConditions: false,
  },
  lastVitalReading: {
    id: "vr-latest",
    date: "2026-06-12",
    time: "07:45",
    source: "home",
    systolicBP: 142,
    diastolicBP: 88,
    heartRate: 74,
    oxygenSaturation: 98,
    temperature: 36.6,
    respiratoryRate: 16,
    weight: 87,
    heightCm: 172,
    bloodSugar: 128,
    notes: "Morning reading before breakfast",
  },
}
