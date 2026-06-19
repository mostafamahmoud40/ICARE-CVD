import type { ConsultationData } from "./consultation.types"

export const mockAiSuggestions: ConsultationData["aiSuggestions"] = [
  {
    id: "ai1",
    type: "diagnosis",
    title: "Uncontrolled Hypertension",
    content:
      "Based on the patient's history of Stage II hypertension, current medications (Amlodipine 5mg), and family history of MI, consider escalating anti-hypertensive therapy. Current BP target for diabetic patients: <130/80 mmHg.",
    confidence: 0.87,
    accepted: null,
  },
  {
    id: "ai2",
    type: "risk_assessment",
    title: "High CVD Risk Profile",
    content:
      "10-year ASCVD risk estimated at 22%. Key risk factors: hypertension, T2DM, dyslipidemia, family history of premature MI, former smoker, obesity (BMI 31.2). Recommend aggressive risk factor modification.",
    confidence: 0.91,
    accepted: null,
  },
  {
    id: "ai3",
    type: "prescription",
    title: "Consider ACE Inhibitor Addition",
    content:
      "Adding an ACE inhibitor (e.g., Lisinopril 10mg) would benefit both hypertension control and diabetic nephropathy prevention. No contraindications identified with current medication list. Note: Patient has Penicillin allergy — no cross-reactivity concern.",
    confidence: 0.82,
    accepted: null,
  },
  {
    id: "ai4",
    type: "interaction_warning",
    title: "Monitor: Statin + Potential Interaction",
    content:
      "If prescribing any CYP3A4 inhibitors, Atorvastatin dose may need adjustment. Current Atorvastatin 20mg is within safe range. No current interactions detected with existing medications.",
    confidence: 0.95,
    accepted: null,
  },
  {
    id: "ai5",
    type: "note",
    title: "Suggested Assessment Draft",
    content:
      "58-year-old male with history of essential hypertension (Stage II), T2DM, and dyslipidemia presenting for routine follow-up. Patient reports adequate medication compliance. Exam findings pending. Plan: Assess BP control, review labs, adjust medications as needed, reinforce lifestyle modifications.",
    confidence: 0.78,
    accepted: null,
  },
]
