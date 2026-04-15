export type VitalHistoryRecord = {
  date: string
  label: string
  systolic: number | null
  diastolic: number | null
  heartRate: number | null
  spo2: number | null
  weight: number | null
  temperature: number | null
  aiNote?: string
  aiNoteType?: "normal" | "alert" | "monitoring" | "info"
}

// Generate some mock history showing progression/improvement over time
// Some records have partial measurements (not all vitals measured each time)
export const mockVitalsHistory: VitalHistoryRecord[] = [
  // Full measurement
  { date: "2026-03-01", label: "Mar 1", systolic: 150, diastolic: 95, heartRate: 88, spo2: 96, weight: 85, temperature: 36.8, aiNote: "Treatment start", aiNoteType: "info" },
  // BP + HR only
  { date: "2026-03-05", label: "Mar 5", systolic: 145, diastolic: 92, heartRate: 85, spo2: null, weight: null, temperature: null },
  // Full measurement
  { date: "2026-03-10", label: "Mar 10", systolic: 138, diastolic: 88, heartRate: 76, spo2: 98, weight: 83, temperature: 37.0, aiNote: "Monitoring", aiNoteType: "monitoring" },
  // Weight only check
  { date: "2026-03-15", label: "Mar 15", systolic: null, diastolic: null, heartRate: null, spo2: null, weight: 83.5, temperature: null },
  // BP + HR + SpO2
  { date: "2026-03-20", label: "Mar 20", systolic: 158, diastolic: 98, heartRate: 82, spo2: 97, weight: 82, temperature: null, aiNote: "Alert sent", aiNoteType: "alert" },
  // Full measurement
  { date: "2026-03-25", label: "Mar 25", systolic: 130, diastolic: 82, heartRate: 75, spo2: 98, weight: 82.5, temperature: 36.8 },
  // Quick vitals check (BP, HR, Temp)
  { date: "2026-03-30", label: "Mar 30", systolic: 128, diastolic: 80, heartRate: 74, spo2: null, weight: null, temperature: 36.7 },
  // Full measurement
  { date: "2026-04-05", label: "Apr 5", systolic: 125, diastolic: 80, heartRate: 72, spo2: 99, weight: 81.5, temperature: 36.6 },
  // SpO2 only (oxygen check)
  { date: "2026-04-10", label: "Apr 10", systolic: null, diastolic: null, heartRate: null, spo2: 99, weight: null, temperature: null },
  // Full measurement
  { date: "2026-04-15", label: "Apr 15", systolic: 120, diastolic: 76, heartRate: 68, spo2: 99, weight: 80.5, temperature: 36.6, aiNote: "Normal", aiNoteType: "normal" },
]

export const currentVitals = {
  bloodPressure: {
    systolic: 120,
    diastolic: 76,
    status: "normal", // normal, warning, critical
    trend: "down", // up, down, stable
    trendValue: "-30 mmHg",
  },
  heartRate: {
    value: 68,
    status: "normal",
    trend: "down",
    trendValue: "-20 bpm",
  },
  spo2: {
    value: 99,
    status: "normal",
    trend: "up",
    trendValue: "+3 %",
  },
  weight: {
    value: 80.5,
    status: "normal",
    trend: "down",
    trendValue: "-4.5 kg",
  },
}
