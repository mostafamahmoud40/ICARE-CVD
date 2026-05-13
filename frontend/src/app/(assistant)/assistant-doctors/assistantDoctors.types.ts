export type DoctorStatus = "available" | "in-consultation" | "away"
export type LoadLevel = "optimal" | "moderate" | "high" | "inactive"

export type DoctorProfile = {
  id: string
  name: string
  specialty: string
  status: DoctorStatus
  patientsWaiting: number
  loadLevel: LoadLevel
  avatarUrl?: string
  room?: string
  estTimeRemainingMins?: number
  avgWaitTimeMins?: number
  shiftStart?: string
  shiftEnd?: string
  patientsSeen?: number
  totalPatients?: number
  tags?: string[]
}
