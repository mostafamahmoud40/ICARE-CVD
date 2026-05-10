import type { ConsultationData } from "./consultation.types"

export const mockConsultationData: ConsultationData = {
  patientId: "p-001",
  patientSummary: {
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
  },

  procedureDetails: {
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
  },

  vitals: {
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    heightCm: "",
    weightKg: "",
  },

  chiefComplaint: "",
  structuredComplaint: "",

  physicalExam: {
    heartSounds: "",
    murmurs: "",
    jvp: "",
    peripheralEdema: "",
    lungAuscultation: "",
    additionalFindings: "",
  },

  diagnoses: [],

  prescriptions: [],

  testOrders: [],

  homeMeasurements: [],

  clinicalNotes: "",

  assessmentAndPlan: "",

  followUpDate: "",

  followUpNotes: "",

  aiSuggestions: [
    {
      id: "ai1",
      type: "diagnosis",
      title: "Uncontrolled Hypertension",
      content: "Based on the patient's history of Stage II hypertension, current medications (Amlodipine 5mg), and family history of MI, consider escalating anti-hypertensive therapy. Current BP target for diabetic patients: <130/80 mmHg.",
      confidence: 0.87,
      accepted: null,
    },
    {
      id: "ai2",
      type: "risk_assessment",
      title: "High CVD Risk Profile",
      content: "10-year ASCVD risk estimated at 22%. Key risk factors: hypertension, T2DM, dyslipidemia, family history of premature MI, former smoker, obesity (BMI 31.2). Recommend aggressive risk factor modification.",
      confidence: 0.91,
      accepted: null,
    },
    {
      id: "ai3",
      type: "prescription",
      title: "Consider ACE Inhibitor Addition",
      content: "Adding an ACE inhibitor (e.g., Lisinopril 10mg) would benefit both hypertension control and diabetic nephropathy prevention. No contraindications identified with current medication list. Note: Patient has Penicillin allergy — no cross-reactivity concern.",
      confidence: 0.82,
      accepted: null,
    },
    {
      id: "ai4",
      type: "interaction_warning",
      title: "Monitor: Statin + Potential Interaction",
      content: "If prescribing any CYP3A4 inhibitors, Atorvastatin dose may need adjustment. Current Atorvastatin 20mg is within safe range. No current interactions detected with existing medications.",
      confidence: 0.95,
      accepted: null,
    },
    {
      id: "ai5",
      type: "note",
      title: "Suggested Assessment Draft",
      content: "58-year-old male with history of essential hypertension (Stage II), T2DM, and dyslipidemia presenting for routine follow-up. Patient reports adequate medication compliance. Exam findings pending. Plan: Assess BP control, review labs, adjust medications as needed, reinforce lifestyle modifications.",
      confidence: 0.78,
      accepted: null,
    },
  ],
}
