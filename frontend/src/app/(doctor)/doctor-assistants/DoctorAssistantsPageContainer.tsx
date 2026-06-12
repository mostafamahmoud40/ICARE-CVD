"use client"

import { DoctorAssistants } from "./DoctorAssistants"
import { useDoctorAssistants } from "./useDoctorAssistants"

export function DoctorAssistantsPageContainer() {
  const state = useDoctorAssistants()
  return <DoctorAssistants {...state} />
}
