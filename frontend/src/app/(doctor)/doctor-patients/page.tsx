"use client"

import { DoctorPatients } from "./DoctorPatients"
import { mockDoctorPatientsData } from "./doctorPatients.mock"

export default function DoctorPatientsPage() {
  return (
    <DoctorPatients
      patients={mockDoctorPatientsData.patients}
      stats={mockDoctorPatientsData.stats}
    />
  )
}
