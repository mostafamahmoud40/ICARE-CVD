export interface BeatProbs {
  N: number
  S: number
  V: number
  F: number
  Q: number
}

export interface BeatResult {
  beat: number
  class: string
  label: string
  color: string
  suspicious: boolean
  confidence: number
  probs: BeatProbs
  waveform: number[]
  waveform_min: number
  waveform_max: number
}

export interface SummaryEntry {
  class: string
  label: string
  color: string
  count: number
  pct: number
}

export interface EcgMeta {
  record: string
  fs: number
  leads: string[]
  used_lead: string
  total_samples: number
  duration_sec: number
  r_peaks_found: number
  valid_beats: number
  suspicious_beats: number
  normal_beats: number
}

export interface EcgResult {
  meta: EcgMeta
  beats: BeatResult[]
  summary: SummaryEntry[]
}

export interface EcgReport {
  overall_assessment: string
  risk_level: "Low" | "Moderate" | "High"
  findings: string[]
  recommendations: string[]
  clinical_notes: string
}
