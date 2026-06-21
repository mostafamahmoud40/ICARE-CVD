export type RiskTier = "low" | "medium" | "high";

export type MedicationFlagSeverity = "info" | "watch" | "critical";

export type AiInsightKind = "adherence" | "interaction" | "refill" | "education";

export type MedicationReminderChannel = "sms" | "push";

export type ContactHistoryChannel = MedicationReminderChannel | "call";

export type ContactHistoryStatus = "queued" | "delivered" | "failed" | "replied";

export type DoctorEscalationPriority = "routine" | "urgent" | "critical";

export type MedicationType = "pill" | "injection" | "solution";

export type MedicationLine = {
  id: string;
  name: string;
  strength: string;
  type?: MedicationType;
  dosageInstructions: string;
  frequencyLabel: string;
  adherencePct7d: number;
  missedLast7d: number;
  nextRefillDue: string | null;
  adherenceHistory7d: boolean[];
};

export type MedicationFlag = {
  id: string;
  medicationLineId: string;
  patientId: string;
  reason: string;
  severity: MedicationFlagSeverity;
  createdAt: string;
  createdByLabel: string;
  status: "open" | "resolved";
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

export type AiInsight = {
  id: string;
  patientId: string;
  kind: AiInsightKind;
  title: string;
  detail: string;
  confidencePct: number;
};

export type PatientMedicationProfile = {
  id: string;
  patientNumber?: string;
  fullName: string;
  age: number;
  phone: string | null;
  avatarUrl?: string | null;
  riskTier: RiskTier;
  overallAdherencePct: number;
  medications: MedicationLine[];
  flags: MedicationFlag[];
  aiInsights: AiInsight[];
  contactHistory: ContactHistoryEvent[];
  escalations: DoctorEscalation[];
  pastMedications?: {
    id: string;
    name: string;
    strength: string;
    dosageInstructions: string;
    statusLabel: string;
  }[];
};

export type ContactHistoryEvent = {
  id: string;
  patientId: string;
  channel: ContactHistoryChannel;
  status: ContactHistoryStatus;
  summary: string;
  messagePreview: string;
  createdAt: string;
  createdByLabel: string;
};

export type DoctorEscalation = {
  id: string;
  patientId: string;
  medicationLineId: string | null;
  priority: DoctorEscalationPriority;
  reason: string;
  note: string;
  status: "waiting_review" | "reviewed";
  createdAt: string;
  createdByLabel: string;
};

export type FollowUpReason =
  | "critical_flag"
  | "low_adherence"
  | "missed_doses"
  | "refill_due"
  | "missing_refill";

export type FollowUpItem = {
  id: string;
  patientId: string;
  patientName: string;
  medicationLineId: string | null;
  medicationLabel: string;
  reason: FollowUpReason;
  priority: DoctorEscalationPriority;
  title: string;
  detail: string;
};
