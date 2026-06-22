import { apiClient } from "@/lib/api-client"
import { fetchDoctorAccount } from "../doctor-account/doctorAccount.api"
import { fetchDoctorPatients } from "../doctor-patients/doctorPatients.api"
import type { DoctorSchedulePayload } from "../doctor-schedule/doctorSchedule.types"
import type {
  DoctorDashboardData,
  DoctorAppointment,
  VitalAlert,
  VitalSeverity,
  WeeklyWorkloadPoint,
} from "./doctorDashboard.types"

type ApiDoctorAppointment = {
  id: string
  scheduledAt: string
  department: string
  patient: { id: string; name: string; avatar: string | null }
  visitType: "clinic" | "virtual"
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
}

type ApiNotification = {
  id: string
  title?: string
  body: string
  createdAt: string
  read: boolean
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

function computeWeeklyClinicHours(schedule: DoctorSchedulePayload): number {
  let totalMinutes = 0
  for (const day of schedule.days) {
    if (!day.enabled) continue
    for (const period of day.periods) {
      const start = parseTimeToMinutes(period.startTime)
      const end = parseTimeToMinutes(period.endTime)
      if (end > start) totalMinutes += end - start
    }
  }
  return Math.round(totalMinutes / 60)
}

function mapAppointmentLocation(visitType: "clinic" | "virtual", clinicLocation: string) {
  if (visitType === "virtual") return "Virtual consult"
  return clinicLocation.trim() || "In clinic"
}

function mapAppointmentStatus(
  status: ApiDoctorAppointment["status"],
): DoctorAppointment["status"] {
  if (status === "confirmed") return "confirmed"
  if (status === "completed") return "completed"
  return "scheduled"
}

function buildPatientAlerts(
  patients: Awaited<ReturnType<typeof fetchDoctorPatients>>,
): VitalAlert[] {
  const alerts: VitalAlert[] = []

  for (const patient of patients) {
    if (patient.poorComplianceCount > 0) {
      alerts.push({
        id: `compliance-${patient.id}`,
        label: "Medication adherence",
        value: `${patient.poorComplianceCount} adherence flag(s)`,
        severity: "high",
        patientName: patient.fullName,
        at: patient.lastVisitDate ?? new Date().toISOString(),
      })
    }

    if (patient.riskLevel === "high") {
      alerts.push({
        id: `risk-${patient.id}`,
        label: "High-risk patient",
        value: patient.condition || "Requires clinical review",
        severity: "critical",
        patientName: patient.fullName,
        at: patient.lastVisitDate ?? new Date().toISOString(),
      })
    }
  }

  return alerts
}

function mapNotificationAlerts(notifications: ApiNotification[]): VitalAlert[] {
  return notifications
    .filter((item) => !item.read)
    .slice(0, 5)
    .map((item) => ({
      id: `notification-${item.id}`,
      label: item.title?.trim() || "Clinical notification",
      value: item.body,
      severity: "high" as VitalSeverity,
      patientName: "Patient",
      at: item.createdAt,
    }))
}

function mapWeeklyWorkload(
  weeklySnapshot: Awaited<ReturnType<typeof fetchDoctorAccount>>["weeklySnapshot"],
): WeeklyWorkloadPoint[] {
  return weeklySnapshot.map((point) => ({
    date: point.day,
    scheduled: point.appointments,
    completed: point.completed,
  }))
}

export async function fetchDoctorDashboard(): Promise<DoctorDashboardData> {
  const [accountResult, patientsResult, appointmentsResult, scheduleResult, notificationsResult] =
    await Promise.allSettled([
      fetchDoctorAccount(),
      fetchDoctorPatients(),
      apiClient.get<ApiDoctorAppointment[]>("/doctor/appointments"),
      apiClient.get<DoctorSchedulePayload>("/doctor/schedule"),
      apiClient.get<ApiNotification[]>("/notifications"),
    ])

  if (accountResult.status === "rejected") {
    throw accountResult.reason
  }

  const account = accountResult.value
  const patients =
    patientsResult.status === "fulfilled" ? patientsResult.value.slice(0, 6) : []
  const appointments =
    appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data : []
  const schedule =
    scheduleResult.status === "fulfilled" ? scheduleResult.value.data : null
  const notifications =
    notificationsResult.status === "fulfilled" ? notificationsResult.value.data : []

  const clinicLocation = account.profile.clinicLocation || "Main Center"
  const upcomingAppointments: DoctorAppointment[] = appointments
    .filter((appt) => appt.status !== "cancelled" && appt.status !== "completed")
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
    .slice(0, 12)
    .map((appt) => ({
      id: appt.id,
      scheduledAt: appt.scheduledAt,
      department: appt.department,
      patientName: appt.patient.name,
      patientAvatarUrl: appt.patient.avatar,
      location: mapAppointmentLocation(appt.visitType, clinicLocation),
      status: mapAppointmentStatus(appt.status),
    }))

  const patientAlerts = buildPatientAlerts(patients)
  const notificationAlerts = mapNotificationAlerts(notifications)
  const recentAlerts = [...patientAlerts, ...notificationAlerts].slice(0, 8)

  return {
    doctor: {
      id: account.profile.id,
      fullName: account.profile.fullName,
      department: account.profile.specialty,
    },
    assignedPatients: patients.map((patient) => ({
      id: patient.id,
      fullName: patient.fullName,
      condition: patient.condition || "General follow-up",
      lastSeenAt: patient.lastVisitDate ?? patient.patientSince,
      avatarUrl: patient.profileImageUrl,
    })),
    upcomingAppointments,
    recentAlerts,
    workload: {
      patientsPerWeek: account.practiceStats.appointmentsThisWeek,
      hoursAvailable: schedule ? computeWeeklyClinicHours(schedule) : 0,
    },
    weeklyWorkload: mapWeeklyWorkload(account.weeklySnapshot),
  }
}
