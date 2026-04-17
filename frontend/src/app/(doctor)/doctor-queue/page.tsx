"use client"

import { DoctorQueue } from "./DoctorQueue"
import { mockQueuePatients, mockQueueStats } from "./doctorQueue.mock"

export default function DoctorQueuePage() {
  return <DoctorQueue patients={mockQueuePatients} stats={mockQueueStats} />
}
