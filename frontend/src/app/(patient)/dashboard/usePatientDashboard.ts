"use client";

import { useMemo } from "react";
import type { PatientDashboardData } from "./dashboard.types";

export function usePatientDashboard(): PatientDashboardData {
  return useMemo(
    () => ({
      patientName: "Patient",
      nextAppointment: "No upcoming appointment",
      reminders: [
        { id: "1", title: "Take blood pressure reading", dueAt: "Today" },
        { id: "2", title: "Drink water", dueAt: "Every 2 hours" },
      ],
    }),
    []
  );
}
