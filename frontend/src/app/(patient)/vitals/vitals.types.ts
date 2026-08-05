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

export type VitalTrend = "up" | "down" | "stable"

export type CurrentVitalsSnapshot = {
  bloodPressure: {
    systolic: number | null
    diastolic: number | null
    trend: VitalTrend
    trendValue: string
  }
  heartRate: {
    value: number | null
    trend: VitalTrend
    trendValue: string
  }
  spo2: {
    value: number | null
    trend: VitalTrend
    trendValue: string
  }
  weight: {
    value: number | null
    trend: VitalTrend
    trendValue: string
  }
}

export type VitalsKpiBadges = {
  bloodPressure: string | null
  heartRate: string | null
  spo2: string | null
  weight: string | null
}

export type VitalsSummary = {
  title: string
  body: string
}

export type VitalsPageData = {
  history: VitalHistoryRecord[]
  current: CurrentVitalsSnapshot
  alert: string | null
  summary: VitalsSummary | null
  aiAnalysis: Array<{
    id: string
    title: string
    description: string
    action?: { label: string }
  }>
  kpiBadges: VitalsKpiBadges
}

export type CreateVitalReadingInput = {
  systolicBp?: number
  diastolicBp?: number
  heartRate?: number
  oxygenSaturation?: number
  temperature?: number
  weight?: number
}

export const emptyCurrentVitals: CurrentVitalsSnapshot = {
  bloodPressure: {
    systolic: null,
    diastolic: null,
    trend: "stable",
    trendValue: "—",
  },
  heartRate: {
    value: null,
    trend: "stable",
    trendValue: "—",
  },
  spo2: {
    value: null,
    trend: "stable",
    trendValue: "—",
  },
  weight: {
    value: null,
    trend: "stable",
    trendValue: "—",
  },
}
