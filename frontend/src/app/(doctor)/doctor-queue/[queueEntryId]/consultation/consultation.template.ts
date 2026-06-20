import type { ConsultationData, PatientSummary } from "./consultation.types"
import { mockAiSuggestions } from "./consultation.ai.mock"
import { emptyChiefComplaintStructured } from "./consultationChiefComplaint.utils"
import { emptyVitalSigns } from "./consultationVitals.utils"

const emptyMedicalHistory: ConsultationData["medicalHistory"] = {
  noCardiacHistory: false,
  cardiacAnswers: {},
  cardiacNotes: "",
  cardiacReviewed: false,
  noNonCardiacHistory: false,
  nonCardiacAnswers: {},
  nonCardiacNotes: "",
  nonCardiacReviewed: false,
  noKnownAllergies: false,
  noChronicConditions: false,
}

const emptyProcedureDetails: ConsultationData["procedureDetails"] = {
  procedureType: "",
  surgicalSpecialty: "general_surgery",
  surgeryDate: "",
  startTime: "09:00",
  operatingRoom: "OR-1",
  anesthesiaType: "general",
  asaClassification: "ASA_I",
  estimatedDurationMin: 90,
  priority: "elective",
  clinicalNotes: "",
}

const emptyPhysicalExam: ConsultationData["physicalExam"] = {
  heartSounds: "",
  murmurs: "",
  jvp: "",
  peripheralEdema: "",
  lungAuscultation: "",
  additionalFindings: "",
}

export function createConsultationDataFromPatient(
  patientId: string,
  patientSummary: PatientSummary,
): ConsultationData {
  return {
    patientId,
    patientSummary,
    medicalHistory: {
      ...emptyMedicalHistory,
      noKnownAllergies: patientSummary.allergies.length === 0,
      noChronicConditions: patientSummary.existingConditions.length === 0,
    },
    procedureDetails: { ...emptyProcedureDetails },
    vitals: emptyVitalSigns(),
    lastVitalReading: null,
    chiefComplaint: "",
    structuredComplaint: "",
    chiefComplaintStructured: emptyChiefComplaintStructured(),
    physicalExam: { ...emptyPhysicalExam },
    diagnoses: [],
    prescriptions: [],
    testOrders: [],
    homeMeasurements: [],
    clinicalNotes: "",
    assessmentAndPlan: "",
    followUpDate: "",
    followUpNotes: "",
    aiSuggestions: mockAiSuggestions.map((suggestion) => ({ ...suggestion })),
  }
}
