import type { ProcedureOrder } from "./assistantProcedures.types"
import type { ScheduledOperation } from "./assistantProcedures.types"

export type ProcedureTeamMember = {
  roleKey:
    | "leadSurgeon"
    | "assistantSurgeon"
    | "anesthesiologist"
    | "scrubNurse"
    | "circulatingNurse"
    | "perfusionist"
  name: string
}

export type PreOpProcedureItem = {
  id: string
  title: string
  completedAt: string
  completedBy?: string
}

export type IntraoperativeComplicationKey =
  | "none"
  | "excessiveBleeding"
  | "arrhythmia"
  | "cardiacArrest"

export type ImmediatePostOpStatus = {
  consciousnessLevel: string
  bloodPressure: string
  heartRate: string
  oxygenSaturation: string
  ventilatorStatus: string
}

export type IcuMonitoring = {
  admissionDate: string
  stayDuration: string
}

export type PostOpMedicationCategory =
  | "antibiotics"
  | "anticoagulants"
  | "painManagement"
  | "cardiacMedications"

export type PostOpMedication = {
  category: PostOpMedicationCategory
  items: string[]
}

export type PostOpComplicationKey =
  | "infection"
  | "bleeding"
  | "stroke"
  | "arrhythmias"
  | "heartFailure"

export type PostOpComplicationStatus = {
  key: PostOpComplicationKey
  present: boolean
}

export type RecoveryStatusKey = "excellent" | "good" | "fair" | "poor"

export type AiRecoveryPrediction = {
  recoveryRiskScore: string
  expectedRecoveryTime: string
  readmissionRisk: string
  infectionRisk: string
  recommendedMonitoringLevel: string
  recoveryProbability: string
}

export type DischargeSummary = {
  dischargeDate: string
  finalCondition: string
  dischargeInstructions: string
}

export type FollowUpPlan = {
  followUpDate: string
  requiredTests: string[]
  currentMedications: string[]
}

export type ProcedureReportData = {
  procedureDate: string
  duration: string
  preOpDiagnosis: string
  operativeFindings: string[]
  procedureDetails: string
  complications: IntraoperativeComplicationKey[]
  postOpStatus: ImmediatePostOpStatus
  icuMonitoring: IcuMonitoring
  postOpMedications: PostOpMedication[]
  postOpComplications: PostOpComplicationStatus[]
  recoveryStatus: RecoveryStatusKey
  aiRecoveryPrediction: AiRecoveryPrediction
  dischargeSummary: DischargeSummary
  followUpPlan: FollowUpPlan
  surgicalTeam: ProcedureTeamMember[]
  preOpProcedures: PreOpProcedureItem[]
}

const DEFAULT_POST_OP: ImmediatePostOpStatus = {
  consciousnessLevel: "Alert and oriented",
  bloodPressure: "118/72 mmHg",
  heartRate: "76 bpm",
  oxygenSaturation: "98% on room air",
  ventilatorStatus: "Not intubated",
}

const DEFAULT_ICU: IcuMonitoring = {
  admissionDate: "",
  stayDuration: "—",
}

const NO_COMPLICATIONS: IntraoperativeComplicationKey[] = ["none"]

const POST_OP_COMPLICATION_KEYS: PostOpComplicationKey[] = [
  "infection",
  "bleeding",
  "stroke",
  "arrhythmias",
  "heartFailure",
]

function postOpComplications(
  overrides: Partial<Record<PostOpComplicationKey, boolean>> = {},
): PostOpComplicationStatus[] {
  return POST_OP_COMPLICATION_KEYS.map((key) => ({
    key,
    present: overrides[key] ?? false,
  }))
}

type PostOpCareSlice = Pick<
  ProcedureReportData,
  | "postOpMedications"
  | "postOpComplications"
  | "recoveryStatus"
  | "aiRecoveryPrediction"
  | "dischargeSummary"
  | "followUpPlan"
>

const DEFAULT_POST_OP_CARE: PostOpCareSlice = {
  postOpMedications: [
    { category: "antibiotics", items: ["Cefazolin 1 g IV q8h × 24 h"] },
    { category: "anticoagulants", items: ["Aspirin 81 mg daily"] },
    { category: "painManagement", items: ["Paracetamol 1 g q6h PRN"] },
    { category: "cardiacMedications", items: ["Metoprolol 25 mg BID"] },
  ],
  postOpComplications: postOpComplications(),
  recoveryStatus: "good",
  aiRecoveryPrediction: {
    recoveryRiskScore: "Low (18%)",
    expectedRecoveryTime: "4–6 weeks",
    readmissionRisk: "8%",
    infectionRisk: "3%",
    recommendedMonitoringLevel: "Standard cardiology follow-up",
    recoveryProbability: "87%",
  },
  dischargeSummary: {
    dischargeDate: "2026-05-14T10:00:00",
    finalCondition: "Stable, ambulating independently",
    dischargeInstructions:
      "Wound care daily. No heavy lifting >5 kg for 6 weeks. Return to ED for fever, chest pain, or wound drainage.",
  },
  followUpPlan: {
    followUpDate: "2026-05-28T09:00:00",
    requiredTests: ["Post-op ECG", "Chest X-ray"],
    currentMedications: ["Aspirin 81 mg daily", "Metoprolol 25 mg BID"],
  },
}

const MOCK_POST_OP_CARE: Record<string, PostOpCareSlice> = {
  "hist-1": {
    postOpMedications: [
      { category: "antibiotics", items: ["Vancomycin + Cefepime (48 h)", "Cefazolin 1 g q8h thereafter"] },
      { category: "anticoagulants", items: ["Aspirin 81 mg daily", "Heparin infusion → warfarin bridge"] },
      { category: "painManagement", items: ["Morphine PCA × 24 h", "Paracetamol 1 g q6h", "Tramadol 50 mg PRN"] },
      { category: "cardiacMedications", items: ["Metoprolol 25 mg BID", "Atorvastatin 40 mg nightly", "Lisinopril 5 mg daily"] },
    ],
    postOpComplications: postOpComplications({ arrhythmias: true }),
    recoveryStatus: "good",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Moderate (34%)",
      expectedRecoveryTime: "8–12 weeks",
      readmissionRisk: "14%",
      infectionRisk: "5%",
      recommendedMonitoringLevel: "ICU step-down → cardiac rehab",
      recoveryProbability: "79%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-14T11:00:00",
      finalCondition: "Hemodynamically stable, sternal wound clean and dry",
      dischargeInstructions:
        "Cardiac rehab referral. Sternal precautions for 6 weeks. Daily weight monitoring. Report weight gain >2 kg in 48 h.",
    },
    followUpPlan: {
      followUpDate: "2026-05-21T09:00:00",
      requiredTests: ["INR", "Post-op ECG", "Chest X-ray", "Lipid panel"],
      currentMedications: ["Warfarin (INR target 2–3)", "Metoprolol 50 mg BID", "Atorvastatin 40 mg", "Aspirin 81 mg"],
    },
  },
  "hist-2": {
    postOpMedications: [
      { category: "antibiotics", items: ["Cefazolin 2 g pre-procedure", "Amoxicillin 2 g prophylaxis × 3 days"] },
      { category: "anticoagulants", items: ["Aspirin 81 mg + Clopidogrel 75 mg (DAPT)"] },
      { category: "painManagement", items: ["Paracetamol 1 g q6h", "Ibuprofen 400 mg PRN"] },
      { category: "cardiacMedications", items: ["Metoprolol 12.5 mg daily"] },
    ],
    postOpComplications: postOpComplications(),
    recoveryStatus: "excellent",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Low (12%)",
      expectedRecoveryTime: "2–4 weeks",
      readmissionRisk: "5%",
      infectionRisk: "2%",
      recommendedMonitoringLevel: "Outpatient cardiology at 2 weeks",
      recoveryProbability: "93%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-10T14:00:00",
      finalCondition: "Ambulatory, groin access site without hematoma",
      dischargeInstructions: "Groin site care. Continue DAPT. No driving for 1 week.",
    },
    followUpPlan: {
      followUpDate: "2026-05-23T10:00:00",
      requiredTests: ["Echocardiogram", "ECG"],
      currentMedications: ["Aspirin 81 mg", "Clopidogrel 75 mg", "Metoprolol 12.5 mg"],
    },
  },
  "hist-3": {
    postOpMedications: [
      { category: "antibiotics", items: ["No ongoing antibiotics"] },
      { category: "anticoagulants", items: ["Aspirin 81 mg", "Ticagrelor 90 mg BID × 12 months"] },
      { category: "painManagement", items: ["Paracetamol 1 g q6h PRN"] },
      { category: "cardiacMedications", items: ["Metoprolol 25 mg BID", "Atorvastatin 80 mg"] },
    ],
    postOpComplications: postOpComplications({ arrhythmias: true }),
    recoveryStatus: "fair",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Moderate (41%)",
      expectedRecoveryTime: "6–8 weeks",
      readmissionRisk: "18%",
      infectionRisk: "4%",
      recommendedMonitoringLevel: "Close cardiology monitoring × 2 weeks",
      recoveryProbability: "72%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-13T09:00:00",
      finalCondition: "Stable on dual antiplatelet therapy, no recurrent ischemia",
      dischargeInstructions: "Strict DAPT adherence. Activity as tolerated. Urgent return for chest pain or dyspnea.",
    },
    followUpPlan: {
      followUpDate: "2026-05-17T08:30:00",
      requiredTests: ["ECG", "Troponin trend", "Echocardiogram at 4 weeks"],
      currentMedications: ["Aspirin 81 mg", "Ticagrelor 90 mg BID", "Metoprolol 25 mg BID", "Atorvastatin 80 mg"],
    },
  },
  "hist-4": {
    postOpMedications: [
      { category: "antibiotics", items: ["Cefazolin 1 g q8h × 48 h post-op"] },
      { category: "anticoagulants", items: ["Heparin bridge", "Warfarin to INR 2–3"] },
      { category: "painManagement", items: ["Morphine PCA", "Paracetamol 1 g q6h"] },
      { category: "cardiacMedications", items: ["Metoprolol 25 mg BID", "Furosemide 20 mg daily"] },
    ],
    postOpComplications: postOpComplications({ bleeding: true }),
    recoveryStatus: "fair",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Moderate–High (48%)",
      expectedRecoveryTime: "10–14 weeks",
      readmissionRisk: "22%",
      infectionRisk: "6%",
      recommendedMonitoringLevel: "Extended ICU → step-down unit",
      recoveryProbability: "68%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-16T10:00:00",
      finalCondition: "Compensated, on oral anticoagulation, trace MR on echo",
      dischargeInstructions: "Anticoagulation clinic follow-up. Valve education. Endocarditis prophylaxis counseling.",
    },
    followUpPlan: {
      followUpDate: "2026-05-24T09:00:00",
      requiredTests: ["INR", "TEE at 6 weeks", "CBC", "BMP"],
      currentMedications: ["Warfarin", "Metoprolol 50 mg BID", "Furosemide 20 mg", "Potassium supplement PRN"],
    },
  },
  "hist-5": {
    postOpMedications: [
      { category: "antibiotics", items: ["Cefazolin 1 g IV pre-incision only"] },
      { category: "anticoagulants", items: ["None — resume aspirin if previously prescribed"] },
      { category: "painManagement", items: ["Paracetamol 1 g q6h", "Ibuprofen 400 mg PRN × 5 days"] },
      { category: "cardiacMedications", items: ["Continue home beta-blocker if applicable"] },
    ],
    postOpComplications: postOpComplications(),
    recoveryStatus: "excellent",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Low (9%)",
      expectedRecoveryTime: "1–2 weeks",
      readmissionRisk: "3%",
      infectionRisk: "1%",
      recommendedMonitoringLevel: "Device clinic check at 2 weeks",
      recoveryProbability: "96%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-11T18:00:00",
      finalCondition: "Pocket dry, device parameters within range, ambulatory",
      dischargeInstructions: "Keep incision dry × 7 days. No raising arm above shoulder on implant side × 4 weeks. Device ID card provided.",
    },
    followUpPlan: {
      followUpDate: "2026-05-25T10:00:00",
      requiredTests: ["Device interrogation", "Chest X-ray"],
      currentMedications: ["Paracetamol PRN only — resume home meds as directed"],
    },
  },
  "hist-6": {
    postOpMedications: [
      { category: "antibiotics", items: ["Cefazolin 1 g q8h × 48 h"] },
      { category: "anticoagulants", items: ["Aspirin 81 mg daily"] },
      { category: "painManagement", items: ["Paracetamol 1 g q6h", "Oxycodone 5 mg PRN × 5 days"] },
      { category: "cardiacMedications", items: ["Metoprolol 25 mg BID", "Lisinopril 10 mg daily"] },
    ],
    postOpComplications: postOpComplications(),
    recoveryStatus: "good",
    aiRecoveryPrediction: {
      recoveryRiskScore: "Low–Moderate (24%)",
      expectedRecoveryTime: "6–8 weeks",
      readmissionRisk: "10%",
      infectionRisk: "3%",
      recommendedMonitoringLevel: "Cardiac surgery clinic at 2 weeks",
      recoveryProbability: "85%",
    },
    dischargeSummary: {
      dischargeDate: "2026-05-17T11:00:00",
      finalCondition: "Stable, NYHA class II, well-healing incision",
      dischargeInstructions: "Sternal precautions. Gradual activity increase. Endocarditis prophylaxis for dental procedures.",
    },
    followUpPlan: {
      followUpDate: "2026-05-26T09:00:00",
      requiredTests: ["Echocardiogram", "ECG", "BMP"],
      currentMedications: ["Aspirin 81 mg", "Metoprolol 25 mg BID", "Lisinopril 10 mg", "Atorvastatin 40 mg"],
    },
  },
  "proc-003": DEFAULT_POST_OP_CARE,
}

function postOpCareFor(procedureId: string): PostOpCareSlice {
  return MOCK_POST_OP_CARE[procedureId] ?? DEFAULT_POST_OP_CARE
}

const DEFAULT_TEAM: ProcedureTeamMember[] = [
  { roleKey: "leadSurgeon", name: "Dr. Mahmoud Ali" },
  { roleKey: "assistantSurgeon", name: "Dr. Hana Farid" },
  { roleKey: "anesthesiologist", name: "Dr. Omar Nabil" },
  { roleKey: "scrubNurse", name: "Nurse Sara Mostafa" },
  { roleKey: "circulatingNurse", name: "Nurse Laila Hassan" },
  { roleKey: "perfusionist", name: "Eng. Youssef Kamal" },
]

type MockReportCore = Omit<ProcedureReportData, keyof PostOpCareSlice>

const MOCK_REPORTS: Record<string, MockReportCore> = {
  "hist-1": {
    procedureDate: "2026-05-08T07:30:00",
    duration: "2h 15m",
    preOpDiagnosis: "Triple-vessel coronary artery disease with left main involvement and unstable angina.",
    operativeFindings: [
      "Triple vessel disease",
      "Severe left coronary artery stenosis",
      "Calcified ascending aorta — partial clamp avoided",
    ],
    procedureDetails:
      "Off-pump CABG performed. LIMA grafted to LAD; SVG to obtuse marginal and posterior descending artery. Hemostasis achieved. Patient transferred to ICU in stable condition.",
    complications: NO_COMPLICATIONS,
    postOpStatus: {
      consciousnessLevel: "Sedated, responsive to stimuli",
      bloodPressure: "105/62 mmHg on norepinephrine",
      heartRate: "88 bpm",
      oxygenSaturation: "99% on FiO₂ 50%",
      ventilatorStatus: "Mechanically ventilated",
    },
    icuMonitoring: {
      admissionDate: "2026-05-08T10:00:00",
      stayDuration: "3 days",
    },
    surgicalTeam: [
      { roleKey: "leadSurgeon", name: "Dr. Mahmoud Ali" },
      { roleKey: "assistantSurgeon", name: "Dr. Karim Saleh" },
      { roleKey: "anesthesiologist", name: "Dr. Nadia Farouk" },
      { roleKey: "scrubNurse", name: "Nurse Mona El-Sayed" },
      { roleKey: "circulatingNurse", name: "Nurse Hala Ibrahim" },
      { roleKey: "perfusionist", name: "Eng. Ahmed Rashid" },
    ],
    preOpProcedures: [
      { id: "pre-1", title: "CBC, coagulation panel, and type & screen", completedAt: "2026-05-06T10:00:00Z", completedBy: "Lab desk" },
      { id: "pre-2", title: "Chest X-ray and resting ECG", completedAt: "2026-05-06T14:30:00Z", completedBy: "Radiology" },
      { id: "pre-3", title: "Cardiac catheterization review", completedAt: "2026-05-07T09:15:00Z", completedBy: "Dr. Mahmoud Ali" },
      { id: "pre-4", title: "Surgical consent and anesthesia assessment", completedAt: "2026-05-07T11:00:00Z", completedBy: "Dr. Nadia Farouk" },
      { id: "pre-5", title: "NPO confirmation and skin prep", completedAt: "2026-05-08T06:45:00Z", completedBy: "OR nursing" },
    ],
  },
  "hist-2": {
    procedureDate: "2026-05-09T10:00:00",
    duration: "1h 30m",
    preOpDiagnosis: "Severe symptomatic aortic stenosis, suitable for transfemoral TAVI.",
    operativeFindings: [
      "Heavily calcified bicuspid aortic valve",
      "Moderate iliofemoral tortuosity — access via right femoral artery",
      "No paravalvular leak on final angiography",
    ],
    procedureDetails:
      "Transfemoral TAVI with 26 mm self-expanding valve. Valve deployed under rapid pacing with good expansion and position. Groin access closed with Perclose. No complications.",
    complications: NO_COMPLICATIONS,
    postOpStatus: {
      consciousnessLevel: "Alert and oriented",
      bloodPressure: "122/68 mmHg",
      heartRate: "74 bpm",
      oxygenSaturation: "97% on 2 L/min nasal cannula",
      ventilatorStatus: "Not intubated",
    },
    icuMonitoring: {
      admissionDate: "2026-05-09T12:00:00",
      stayDuration: "1 day",
    },
    surgicalTeam: [
      { roleKey: "leadSurgeon", name: "Dr. Hana Farid" },
      { roleKey: "assistantSurgeon", name: "Dr. Youssef Kamal" },
      { roleKey: "anesthesiologist", name: "Dr. Laila Farouk" },
      { roleKey: "scrubNurse", name: "Nurse Rania Adel" },
      { roleKey: "circulatingNurse", name: "Nurse Dina Mohsen" },
      { roleKey: "perfusionist", name: "Eng. Khaled Mostafa" },
    ],
    preOpProcedures: [
      { id: "pre-1", title: "CT angiography and valve sizing", completedAt: "2026-05-05T08:00:00Z" },
      { id: "pre-2", title: "Dental clearance", completedAt: "2026-05-06T12:00:00Z" },
      { id: "pre-3", title: "TAVI consent and groin access planning", completedAt: "2026-05-08T15:00:00Z" },
      { id: "pre-4", title: "Antibiotic prophylaxis administered", completedAt: "2026-05-09T09:30:00Z" },
    ],
  },
  "hist-3": {
    procedureDate: "2026-05-10T14:00:00",
    duration: "2h 15m",
    preOpDiagnosis: "Acute left main coronary artery stenosis with hemodynamic instability.",
    operativeFindings: [
      "Critical left main stenosis (95%)",
      "Diffuse disease in proximal LAD and circumflex",
      "TIMI 2 flow pre-intervention",
    ],
    procedureDetails:
      "Emergency PCI of left main with drug-eluting stent (3.5 × 18 mm). Post-dilatation with NC balloon. Final TIMI 3 flow. No dissection or perforation.",
    complications: ["arrhythmia"],
    postOpStatus: {
      consciousnessLevel: "Alert and oriented",
      bloodPressure: "98/58 mmHg",
      heartRate: "102 bpm",
      oxygenSaturation: "96% on room air",
      ventilatorStatus: "Not intubated",
    },
    icuMonitoring: {
      admissionDate: "2026-05-10T16:30:00",
      stayDuration: "2 days",
    },
    surgicalTeam: DEFAULT_TEAM,
    preOpProcedures: [
      { id: "pre-1", title: "Emergency labs and renal function panel", completedAt: "2026-05-10T12:00:00Z" },
      { id: "pre-2", title: "Dual antiplatelet loading dose", completedAt: "2026-05-10T12:30:00Z" },
      { id: "pre-3", title: "Groin access site prep", completedAt: "2026-05-10T13:30:00Z" },
    ],
  },
  "hist-4": {
    procedureDate: "2026-05-07T09:00:00",
    duration: "3h 30m",
    preOpDiagnosis: "Severe mitral regurgitation with complex valvular anatomy.",
    operativeFindings: [
      "Posterior leaflet prolapse with flail segment",
      "Annular dilatation — 32 mm ring size selected",
      "Preserved left ventricular function",
    ],
    procedureDetails:
      "Mitral valve repair with triangular resection of P2 segment and 32 mm annuloplasty ring. Intraoperative TEE confirmed trace residual MR. Cardiopulmonary bypass weaned without difficulty.",
    complications: ["excessiveBleeding"],
    postOpStatus: {
      consciousnessLevel: "Sedated, opens eyes to voice",
      bloodPressure: "110/65 mmHg",
      heartRate: "92 bpm",
      oxygenSaturation: "98% on FiO₂ 40%",
      ventilatorStatus: "Mechanically ventilated",
    },
    icuMonitoring: {
      admissionDate: "2026-05-07T12:45:00",
      stayDuration: "4 days",
    },
    surgicalTeam: DEFAULT_TEAM,
    preOpProcedures: [
      { id: "pre-1", title: "Transesophageal echo baseline", completedAt: "2026-05-05T10:00:00Z" },
      { id: "pre-2", title: "Blood products cross-matched", completedAt: "2026-05-06T09:00:00Z" },
      { id: "pre-3", title: "ICU bed reserved post-op", completedAt: "2026-05-06T16:00:00Z" },
    ],
  },
  "hist-5": {
    procedureDate: "2026-05-11T08:00:00",
    duration: "1h 45m",
    preOpDiagnosis: "Symptomatic bradycardia with indication for permanent pacemaker implantation.",
    operativeFindings: [
      "Sinus node dysfunction with intermittent AV block",
      "Adequate subclavian venous access on left side",
      "Normal ventricular thresholds on testing",
    ],
    procedureDetails:
      "Dual-chamber pacemaker implanted via left subclavian approach. Active fixation leads placed in right atrium and right ventricle. Device programmed DDD mode. Pocket hemostasis achieved.",
    complications: NO_COMPLICATIONS,
    postOpStatus: {
      consciousnessLevel: "Alert and oriented",
      bloodPressure: "120/74 mmHg",
      heartRate: "72 bpm (paced)",
      oxygenSaturation: "99% on room air",
      ventilatorStatus: "Not intubated",
    },
    icuMonitoring: {
      admissionDate: "",
      stayDuration: "Observation — 6 hours (ward)",
    },
    surgicalTeam: [
      { roleKey: "leadSurgeon", name: "Dr. Hana Farid" },
      { roleKey: "assistantSurgeon", name: "Dr. Omar Nabil" },
      { roleKey: "anesthesiologist", name: "Dr. Sara Ahmed" },
      { roleKey: "scrubNurse", name: "Nurse Fatima Ali" },
      { roleKey: "circulatingNurse", name: "Nurse Nour Hassan" },
      { roleKey: "perfusionist", name: "—" },
    ],
    preOpProcedures: [
      { id: "pre-1", title: "Device inventory verified", completedAt: "2026-05-10T14:00:00Z" },
      { id: "pre-2", title: "Chest prep and antibiotic prophylaxis", completedAt: "2026-05-11T07:30:00Z" },
    ],
  },
  "hist-6": {
    procedureDate: "2026-05-12T11:00:00",
    duration: "2h 30m",
    preOpDiagnosis: "Critical aortic stenosis with declining ventricular function.",
    operativeFindings: [
      "Tricuspid aortic valve with severe calcification",
      "Left ventricular hypertrophy with moderate dysfunction",
      "No significant coronary disease on intra-op inspection",
    ],
    procedureDetails:
      "Surgical aortic valve replacement with 23 mm bioprosthetic valve. Aortic cross-clamp time 78 minutes. Valve seated well with no paravalvular leak. Patient extubated in OR.",
    complications: NO_COMPLICATIONS,
    postOpStatus: {
      consciousnessLevel: "Alert and oriented",
      bloodPressure: "115/70 mmHg",
      heartRate: "80 bpm",
      oxygenSaturation: "97% on 4 L/min mask",
      ventilatorStatus: "Not intubated",
    },
    icuMonitoring: {
      admissionDate: "2026-05-12T14:00:00",
      stayDuration: "2 days",
    },
    surgicalTeam: DEFAULT_TEAM,
    preOpProcedures: [
      { id: "pre-1", title: "Pre-op echo and coronary angiography review", completedAt: "2026-05-09T11:00:00Z" },
      { id: "pre-2", title: "Surgical and anesthesia consent", completedAt: "2026-05-10T10:00:00Z" },
      { id: "pre-3", title: "NPO and medication reconciliation", completedAt: "2026-05-12T06:00:00Z" },
    ],
  },
  "proc-003": {
    procedureDate: "2026-05-08T08:00:00",
    duration: "1h 45m",
    preOpDiagnosis: "Symptomatic bradycardia; dual-chamber pacemaker indicated.",
    operativeFindings: [
      "Sinus node dysfunction with intermittent AV block",
      "Adequate subclavian venous access on left side",
    ],
    procedureDetails:
      "Dual-chamber pacemaker implanted via left subclavian approach with active fixation leads in RA and RV. Device tested and programmed DDD.",
    complications: NO_COMPLICATIONS,
    postOpStatus: DEFAULT_POST_OP,
    icuMonitoring: DEFAULT_ICU,
    surgicalTeam: DEFAULT_TEAM,
    preOpProcedures: [],
  },
}

function preOpFromOrder(order: ProcedureOrder): PreOpProcedureItem[] {
  return order.requirements
    .filter((r) => r.isDone)
    .map((r) => ({
      id: r.id,
      title: r.description ?? r.title,
      completedAt: r.completedAt ?? order.createdAt,
      completedBy: order.doctorName,
    }))
}

export function resolveProcedureReport(
  procedureId: string,
  order: ProcedureOrder | null,
  history: ScheduledOperation | null,
): ProcedureReportData | null {
  const mock = MOCK_REPORTS[procedureId]

  if (mock) {
    const fromOrder = order ? preOpFromOrder(order) : []
    const preOpProcedures = fromOrder.length > 0 ? fromOrder : mock.preOpProcedures

    return {
      procedureDate: order?.scheduledAt ?? mock.procedureDate,
      duration: history?.duration ?? mock.duration,
      preOpDiagnosis: mock.preOpDiagnosis,
      operativeFindings: mock.operativeFindings,
      procedureDetails: mock.procedureDetails,
      complications: mock.complications,
      postOpStatus: mock.postOpStatus,
      icuMonitoring: mock.icuMonitoring,
      ...postOpCareFor(procedureId),
      surgicalTeam: mock.surgicalTeam,
      preOpProcedures,
    }
  }

  if (order) {
    return {
      procedureDate: order.scheduledAt ?? order.createdAt,
      duration: history?.duration ?? "—",
      preOpDiagnosis: order.notes ?? "",
      operativeFindings: [],
      procedureDetails: "",
      complications: NO_COMPLICATIONS,
      postOpStatus: DEFAULT_POST_OP,
      icuMonitoring: DEFAULT_ICU,
      ...DEFAULT_POST_OP_CARE,
      surgicalTeam: DEFAULT_TEAM,
      preOpProcedures: preOpFromOrder(order),
    }
  }

  if (history) {
    return {
      procedureDate: new Date().toISOString(),
      duration: history.duration,
      preOpDiagnosis: history.notes ?? "",
      operativeFindings: [],
      procedureDetails: "",
      complications: NO_COMPLICATIONS,
      postOpStatus: DEFAULT_POST_OP,
      icuMonitoring: DEFAULT_ICU,
      ...postOpCareFor(procedureId),
      surgicalTeam: DEFAULT_TEAM,
      preOpProcedures: [],
    }
  }

  return null
}
