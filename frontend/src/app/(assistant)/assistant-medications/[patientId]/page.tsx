import type { Metadata } from "next";

import { AssistantMedicationsPatientDetail } from "../AssistantMedicationsPatientDetail";

export const metadata: Metadata = {
  title: "Patient medications | ICARE-CVD",
  description: "Medication adherence, flags, and follow-up for this patient.",
};

export default function AssistantMedicationsPatientPage() {
  return <AssistantMedicationsPatientDetail />;
}
