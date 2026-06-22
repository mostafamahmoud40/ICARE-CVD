import { apiClient } from "@/lib/api-client"
import { fetchPatientAccount } from "../account/patientAccount.api"
import { fetchPatientLabOrders } from "../lab-orders/labOrders.api"
import type {
  Appointment,
  CareTimelineItem,
  Medication,
  MedicationTime,
  PatientDashboardData,
  Vital,
} from "./dashboard.types"
import type { CurrentVitalsSnapshot } from "../vitals/vitals.types"

type AppointmentApiRow = {
  id: string
  scheduledAt: string
  department: string
  clinician: string
  location: string
  status: string
}

type MedicationApiRow = {
  id: string
  name: string
  dose: string
  frequency: string
  status: "active" | "paused" | "discontinued"
  timeOfDay: ("morning" | "afternoon" | "evening")[]
}

type DoseLogApiRow = {
  id: string
  medicationId: string
  takenAt: string
  skipped: boolean
}

type VitalsOverviewApiResponse = {
  current: CurrentVitalsSnapshot
  summary: { title: string; body: string } | null
}

const TIME_OF_DAY_LABELS: Record<"morning" | "afternoon" | "evening", MedicationTime> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
}

function startOfDay(date = new Date()) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function mapAppointmentStatus(status: string, scheduledAt: string): Appointment["status"] {
  if (status === "confirmed") return "confirmed"
  if (status === "completed") return "completed"
  const scheduled = new Date(scheduledAt)
  return scheduled.getTime() < Date.now() ? "scheduled" : "scheduled"
}

function mapAppointments(rows: AppointmentApiRow[]): Appointment[] {
  return rows
    .filter((row) => row.status !== "cancelled")
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      scheduledAt: row.scheduledAt,
      department: row.department,
      clinician: row.clinician,
      location: row.location,
      status: mapAppointmentStatus(row.status, row.scheduledAt),
    }))
}

function buildAdherenceHistory(medicationId: string, logs: DoseLogApiRow[]): boolean[] {
  const history: boolean[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayStart = startOfDay()
    dayStart.setDate(dayStart.getDate() - offset)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const taken = logs.some(
      (log) =>
        log.medicationId === medicationId &&
        !log.skipped &&
        new Date(log.takenAt) >= dayStart &&
        new Date(log.takenAt) < dayEnd,
    )
    history.push(taken)
  }
  return history
}

function mapMedications(rows: MedicationApiRow[], logs: DoseLogApiRow[]): Medication[] {
  const todayStart = startOfDay()

  return rows
    .filter((row) => row.status === "active")
    .slice(0, 6)
    .map((row) => {
      const adherenceHistory = buildAdherenceHistory(row.id, logs)
      const takenToday = logs.some(
        (log) =>
          log.medicationId === row.id &&
          !log.skipped &&
          new Date(log.takenAt) >= todayStart,
      )
      const lastTaken = logs
        .filter((log) => log.medicationId === row.id && !log.skipped)
        .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))[0]

      const timeOfDay = row.timeOfDay[0] ?? "morning"

      return {
        id: row.id,
        name: row.name,
        dosage: row.dose,
        frequency: row.frequency,
        timeOfDay: TIME_OF_DAY_LABELS[timeOfDay],
        lastTakenAt: lastTaken?.takenAt,
        status: takenToday ? "taken" : "due",
        adherenceHistory,
      }
    })
}

function mapVitals(
  current: CurrentVitalsSnapshot,
  measuredAt: string,
): { vitals: Vital[]; lastVitalsAt: string } {
  const vitals: Vital[] = []

  if (current.heartRate.value != null) {
    vitals.push({
      id: "heart_rate",
      label: "Heart Rate",
      value: String(current.heartRate.value),
      unit: "bpm",
      reference: "60–100",
      lastMeasuredAt: measuredAt,
    })
  }

  if (current.bloodPressure.systolic != null && current.bloodPressure.diastolic != null) {
    vitals.push({
      id: "blood_pressure",
      label: "Blood Pressure",
      value: `${current.bloodPressure.systolic}/${current.bloodPressure.diastolic}`,
      reference: "< 120/80",
      lastMeasuredAt: measuredAt,
    })
  }

  if (current.spo2.value != null) {
    vitals.push({
      id: "spo2",
      label: "SpO₂",
      value: String(current.spo2.value),
      unit: "%",
      reference: "95–100",
      lastMeasuredAt: measuredAt,
    })
  }

  if (current.weight.value != null) {
    vitals.push({
      id: "weight",
      label: "Weight",
      value: String(current.weight.value),
      unit: "kg",
      lastMeasuredAt: measuredAt,
    })
  }

  return {
    vitals,
    lastVitalsAt: measuredAt,
  }
}

function buildCareTimeline(
  appointments: Appointment[],
  labOrders: Awaited<ReturnType<typeof fetchPatientLabOrders>>,
): CareTimelineItem[] {
  const items: CareTimelineItem[] = []

  for (const order of labOrders) {
    if (order.status === "cancelled" || order.status === "uploaded") continue
    items.push({
      id: `lab-${order.id}`,
      kind: "lab_order",
      title: order.title,
      detail:
        order.notes?.trim() ||
        `${order.tests.join(", ")} — upload your report when ready`,
      dueAt: order.dueAt,
      status: order.status === "missing" ? "missing" : "pending",
      doctorName: order.doctorName,
      href: "/lab-orders",
      urgent: order.priority === "urgent" || order.priority === "stat",
    })
  }

  for (const appointment of appointments) {
    if (appointment.status === "completed") continue
    items.push({
      id: `appt-${appointment.id}`,
      kind: "appointment",
      title: appointment.department,
      detail: appointment.location,
      dueAt: appointment.scheduledAt,
      status: "scheduled",
      doctorName: appointment.clinician,
      href: "/appointments",
    })
  }

  return items.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
}

export async function fetchPatientDashboard(): Promise<PatientDashboardData> {
  const [accountResult, appointmentsResult, vitalsResult, medicationsResult, labOrdersResult] =
    await Promise.allSettled([
      fetchPatientAccount(),
      apiClient.get<AppointmentApiRow[]>("/patient/appointments"),
      apiClient.get<VitalsOverviewApiResponse>("/patient/vitals"),
      apiClient.get<MedicationApiRow[]>("/patient/medications"),
      fetchPatientLabOrders(),
    ])

  if (accountResult.status === "rejected") {
    throw accountResult.reason
  }

  const account = accountResult.value.profile
  const appointments =
    appointmentsResult.status === "fulfilled"
      ? mapAppointments(appointmentsResult.value.data)
      : []

  const vitalsPayload =
    vitalsResult.status === "fulfilled" ? vitalsResult.value.data : null
  const measuredAt = new Date().toISOString()
  const { vitals, lastVitalsAt } = vitalsPayload
    ? mapVitals(vitalsPayload.current, measuredAt)
    : { vitals: [], lastVitalsAt: measuredAt }

  let medications: Medication[] = []
  if (medicationsResult.status === "fulfilled") {
    const medRows = medicationsResult.value.data
    const logResults = await Promise.allSettled(
      medRows.map((row) =>
        apiClient.get<DoseLogApiRow[]>(`/patient/medications/${row.id}/logs`),
      ),
    )
    const logs = logResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value.data : [],
    )
    medications = mapMedications(medRows, logs)
  }

  const labOrders = labOrdersResult.status === "fulfilled" ? labOrdersResult.value : []
  const careTimeline = buildCareTimeline(appointments, labOrders)

  const nextAppointment = appointments.find((appt) => new Date(appt.scheduledAt) >= new Date())

  return {
    patient: {
      id: account.id,
      fullName: account.fullName,
      age: account.age,
    },
    lastVitalsAt,
    vitals,
    upcomingAppointments: appointments,
    medications,
    careSummary: {
      lastCheckUpAt: account.memberSince,
      nextFollowUpAt: nextAppointment?.scheduledAt ?? account.memberSince,
      planNote:
        vitalsPayload?.summary?.body ??
        "Keep monitoring your vitals and medications between visits.",
    },
    careTimeline,
  }
}
