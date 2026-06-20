import type { Metadata } from "next"

import { PatientAccountPageContainer } from "./PatientAccountPageContainer"

export const metadata: Metadata = {
  title: "My account | ICARE-CVD",
  description: "Patient profile and account settings.",
}

export default function PatientAccountPage() {
  return <PatientAccountPageContainer />
}
