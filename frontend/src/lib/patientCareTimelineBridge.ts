import type { CareTimelineItem, CareTimelineTestType } from "@/app/(patient)/dashboard/dashboard.types"

const STORAGE_KEY = "icare-patient-care-tasks-v1"

/** Demo alias map until patient auth IDs match doctor chart IDs. */
const PATIENT_ID_ALIASES: Record<string, string[]> = {
  "PT-1842": ["PT-1842", "p-001"],
  "p-001": ["p-001", "PT-1842"],
}

type PatientCareTaskRecord = {
  patientId: string
  orderId: string
  item: CareTimelineItem
  updatedAt: string
}

export type ConsultationTestOrderInput = {
  id: string
  testType: CareTimelineTestType
  testName: string
  urgency: "routine" | "urgent" | "stat"
  notes: string
  location: string
  scheduledDate: string
  scheduledTime: string
  fastingRequired: boolean
}

const TEST_TYPE_LABELS: Record<CareTimelineTestType, string> = {
  blood: "Blood work",
  imaging: "Imaging",
  ecg: "ECG",
  echocardiogram: "Echocardiogram",
  stress_test: "Stress test",
  cardiac_catheterization: "Cardiac catheterization",
  pulmonary_function: "Pulmonary function test",
  urinalysis: "Urinalysis",
  other: "Clinical test",
}

function readRecords(): PatientCareTaskRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PatientCareTaskRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecords(records: PatientCareTaskRecord[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function patientIdsForViewer(patientId: string): Set<string> {
  const aliases = PATIENT_ID_ALIASES[patientId] ?? [patientId]
  return new Set(aliases)
}

function testOrderDueAt(order: ConsultationTestOrderInput): string {
  if (order.scheduledDate) {
    const time = order.scheduledTime?.trim() || "23:59"
    const parsed = new Date(`${order.scheduledDate}T${time}`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  const fallback = new Date()
  fallback.setDate(fallback.getDate() + 7)
  fallback.setHours(23, 59, 0, 0)
  return fallback.toISOString()
}

function buildTestOrderDetail(order: ConsultationTestOrderInput): string {
  const parts: string[] = []

  if (order.location.trim()) parts.push(order.location.trim())

  if (order.scheduledDate) {
    const timeSuffix = order.scheduledTime?.trim() ? ` at ${order.scheduledTime.trim()}` : ""
    parts.push(`Scheduled ${order.scheduledDate}${timeSuffix}`)
  } else {
    parts.push("Complete when you can — your care team is waiting for results")
  }

  if (order.fastingRequired) parts.push("Fasting required")
  if (order.notes.trim()) parts.push(order.notes.trim())

  return parts.join(" · ")
}

function isLabTestType(testType: CareTimelineTestType) {
  return testType === "blood" || testType === "urinalysis"
}

export function testOrderToCareTimelineItem(
  order: ConsultationTestOrderInput,
  doctorName: string,
): CareTimelineItem {
  const isLab = isLabTestType(order.testType)
  const title = order.testName.trim() || TEST_TYPE_LABELS[order.testType]

  return {
    id: `care-task-${order.id}`,
    kind: isLab ? "lab_order" : "test_order",
    testType: order.testType,
    title,
    detail: buildTestOrderDetail(order),
    dueAt: testOrderDueAt(order),
    status: "pending",
    doctorName,
    href: isLab ? "/lab-orders" : "/consultations",
    urgent: order.urgency === "urgent" || order.urgency === "stat",
  }
}

export function upsertPatientCareTaskFromTestOrder(params: {
  patientId: string
  doctorName: string
  order: ConsultationTestOrderInput
}) {
  const records = readRecords()
  const item = testOrderToCareTimelineItem(params.order, params.doctorName)
  const next: PatientCareTaskRecord = {
    patientId: params.patientId,
    orderId: params.order.id,
    item,
    updatedAt: new Date().toISOString(),
  }

  const without = records.filter((record) => record.orderId !== params.order.id)
  writeRecords([...without, next])
}

export function removePatientCareTaskByOrderId(orderId: string) {
  writeRecords(readRecords().filter((record) => record.orderId !== orderId))
}

export function syncConsultationTestOrders(params: {
  patientId: string
  doctorName: string
  orders: ConsultationTestOrderInput[]
}) {
  const otherPatients = readRecords().filter((record) => record.patientId !== params.patientId)
  const synced = params.orders.map((order) => ({
    patientId: params.patientId,
    orderId: order.id,
    item: testOrderToCareTimelineItem(order, params.doctorName),
    updatedAt: new Date().toISOString(),
  }))

  writeRecords([...otherPatients, ...synced])
}

export function listPatientCareTasks(patientId: string): CareTimelineItem[] {
  const ids = patientIdsForViewer(patientId)
  return readRecords()
    .filter((record) => ids.has(record.patientId))
    .map((record) => record.item)
}

export function mergeCareTimelineItems(
  base: CareTimelineItem[],
  added: CareTimelineItem[],
): CareTimelineItem[] {
  const byId = new Map(base.map((item) => [item.id, item]))
  for (const item of added) {
    byId.set(item.id, item)
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  )
}

export const PATIENT_CARE_TASKS_STORAGE_KEY = STORAGE_KEY
