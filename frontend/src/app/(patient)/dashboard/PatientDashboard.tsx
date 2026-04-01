"use client";

import { HealthSummaryCard } from "./HealthSummaryCard";
import { UpcomingReminders } from "./UpcomingReminders";
import { usePatientDashboard } from "./usePatientDashboard";

export function PatientDashboard() {
  const data = usePatientDashboard();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <HealthSummaryCard patientName={data.patientName} nextAppointment={data.nextAppointment} />
      <UpcomingReminders reminders={data.reminders} />
    </div>
  );
}
