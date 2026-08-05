"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  showIcareErrorToast,
  showIcareSuccessToast,
  showIcareToast,
} from "@/components/shared/icare-toast";
import type {
  DoctorEscalation,
  DoctorEscalationPriority,
  FollowUpItem,
  MedicationFlag,
  MedicationFlagSeverity,
  PatientMedicationProfile,
  MedicationReminderChannel,
} from "./assistantMedications.types";
import { MOCK_MEDICATION_PROFILES } from "./assistantMedications.mock";
import {
  DEFAULT_MEDICATION_LIST_FILTERS,
  hasActiveMedicationListFilters,
  matchesAdherenceFilter,
  type MedicationListFilters,
} from "./assistantMedications.filters";

const QUERY_KEY = ["assistant", "medication-adherence"] as const;
const REFILL_LOOKAHEAD_DAYS = 7;

function getOpenFlags(profile: PatientMedicationProfile) {
  return profile.flags.filter((flag) => flag.status === "open");
}

function cloneProfiles(profiles: PatientMedicationProfile[]): PatientMedicationProfile[] {
  return profiles.map((p) => ({
    ...p,
    medications: p.medications.map((m) => ({ ...m })),
    flags: p.flags.map((f) => ({ ...f })),
    aiInsights: p.aiInsights.map((i) => ({ ...i })),
    contactHistory: p.contactHistory.map((event) => ({ ...event })),
    escalations: p.escalations.map((event) => ({ ...event })),
  }));
}

function daysUntil(dateValue: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function priorityFor(
  profile: PatientMedicationProfile,
  base: DoctorEscalationPriority
): DoctorEscalationPriority {
  if (profile.riskTier === "high" && base === "urgent") return "critical";
  if (profile.riskTier === "high" && base === "routine") return "urgent";
  return base;
}

function buildFollowUpItems(profiles: PatientMedicationProfile[]): FollowUpItem[] {
  return profiles.flatMap((profile) => {
    const items: FollowUpItem[] = [];

    getOpenFlags(profile)
      .filter((flag) => flag.severity === "critical")
      .forEach((flag) => {
        const med = profile.medications.find((m) => m.id === flag.medicationLineId);
        items.push({
          id: `${profile.id}-${flag.id}`,
          patientId: profile.id,
          patientName: profile.fullName,
          medicationLineId: flag.medicationLineId,
          medicationLabel: med ? `${med.name} ${med.strength}` : "Medication",
          reason: "critical_flag",
          priority: "critical",
          title: "Critical medication flag",
          detail: flag.reason,
        });
      });

    profile.medications.forEach((med) => {
      const medicationLabel = `${med.name} ${med.strength}`;
      if (med.adherencePct7d < 65) {
        items.push({
          id: `${profile.id}-${med.id}-low-adherence`,
          patientId: profile.id,
          patientName: profile.fullName,
          medicationLineId: med.id,
          medicationLabel,
          reason: "low_adherence",
          priority: priorityFor(profile, "urgent"),
          title: "Low 7-day adherence",
          detail: `${med.adherencePct7d}% adherence with ${med.missedLast7d} missed doses in the last 7 days.`,
        });
      } else if (med.missedLast7d >= 2) {
        items.push({
          id: `${profile.id}-${med.id}-missed`,
          patientId: profile.id,
          patientName: profile.fullName,
          medicationLineId: med.id,
          medicationLabel,
          reason: "missed_doses",
          priority: priorityFor(profile, "routine"),
          title: "Repeated missed doses",
          detail: `${med.missedLast7d} missed doses in the last 7 days.`,
        });
      }

      if (!med.nextRefillDue) {
        items.push({
          id: `${profile.id}-${med.id}-missing-refill`,
          patientId: profile.id,
          patientName: profile.fullName,
          medicationLineId: med.id,
          medicationLabel,
          reason: "missing_refill",
          priority: "routine",
          title: "Missing refill date",
          detail: "No refill date is recorded for this medication line.",
        });
      } else {
        const dueIn = daysUntil(med.nextRefillDue);
        if (dueIn <= REFILL_LOOKAHEAD_DAYS) {
          items.push({
            id: `${profile.id}-${med.id}-refill`,
            patientId: profile.id,
            patientName: profile.fullName,
            medicationLineId: med.id,
            medicationLabel,
            reason: "refill_due",
            priority: priorityFor(profile, "routine"),
            title: dueIn < 0 ? "Refill overdue" : "Refill due soon",
            detail:
              dueIn < 0
                ? `Refill is overdue by ${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? "" : "s"}.`
                : dueIn === 0
                  ? "Refill is due today."
                  : `Refill is due in ${dueIn} day${dueIn === 1 ? "" : "s"}.`,
          });
        }
      }
    });

    return items;
  });
}

export function useAssistantMedications(opts?: { routePatientId?: string | null }) {
  const routePatientId = opts?.routePatientId ?? null;
  const qc = useQueryClient();
  const [listSelectedPatientId, setListSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [listFilters, setListFilters] = useState<MedicationListFilters>(
    DEFAULT_MEDICATION_LIST_FILTERS,
  );

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<PatientMedicationProfile[]> =>
      new Promise((resolve) =>
        setTimeout(() => resolve(cloneProfiles(MOCK_MEDICATION_PROFILES)), 280)
      ),
    staleTime: 60 * 1000,
  });

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const followUpPatientIds = new Set(buildFollowUpItems(profiles).map((item) => item.patientId));
    return profiles.filter((p) => {
      if (listFilters.flaggedOnly && getOpenFlags(p).length === 0) return false;
      if (listFilters.followUpOnly && !followUpPatientIds.has(p.id)) return false;
      if (listFilters.riskTier !== "all" && p.riskTier !== listFilters.riskTier) return false;
      if (!matchesAdherenceFilter(p.overallAdherencePct, listFilters.adherence)) return false;
      if (listFilters.aiInsightsOnly && p.aiInsights.length === 0) return false;
      if (!term) return true;
      const medsHit = p.medications.some((m) => m.name.toLowerCase().includes(term));
      return (
        p.fullName.toLowerCase().includes(term) || medsHit || (p.phone?.includes(term) ?? false)
      );
    });
  }, [profiles, searchTerm, listFilters]);

  const followUpItems = useMemo(() => buildFollowUpItems(profiles), [profiles]);

  const selectedPatientId = useMemo(() => {
    if (routePatientId != null && routePatientId !== "") {
      return routePatientId;
    }
    if (filteredProfiles.length === 0) return null;
    if (
      listSelectedPatientId != null &&
      filteredProfiles.some((p) => p.id === listSelectedPatientId)
    ) {
      return listSelectedPatientId;
    }
    return null;
  }, [routePatientId, filteredProfiles, listSelectedPatientId]);

  const selectedProfile = profiles.find((p) => p.id === selectedPatientId) ?? null;

  const selectedFollowUpItems = useMemo(
    () => followUpItems.filter((item) => item.patientId === selectedPatientId),
    [followUpItems, selectedPatientId]
  );

  const flagMedicationMutation = useMutation({
    mutationFn: async (payload: {
      patientId: string;
      medicationLineId: string;
      severity: MedicationFlagSeverity;
      reason: string;
    }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 220));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        const flag: MedicationFlag = {
          id: `fl_${Date.now()}`,
          medicationLineId: payload.medicationLineId,
          patientId: payload.patientId,
          reason: payload.reason,
          severity: payload.severity,
          createdAt: new Date().toISOString(),
          createdByLabel: "Assistant",
          status: "open",
        };
        return old.map((p) =>
          p.id === payload.patientId ? { ...p, flags: [...p.flags, flag] } : p
        );
      });
      showIcareSuccessToast("Flag saved on medication chart");
    },
    onError: () => showIcareErrorToast("Could not save flag"),
  });

  const resolveFlagMutation = useMutation({
    mutationFn: async (payload: { patientId: string; flagId: string }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 180));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === payload.patientId
            ? {
                ...p,
                flags: p.flags.map((f) =>
                  f.id === payload.flagId
                    ? {
                        ...f,
                        status: "resolved",
                        resolvedAt: new Date().toISOString(),
                        resolutionNote: "Cleared from assistant workflow.",
                      }
                    : f
                ),
              }
            : p
        );
      });
      showIcareSuccessToast("Flag marked resolved");
    },
    onError: () => showIcareErrorToast("Could not clear flag"),
  });

  const updateInstructionsMutation = useMutation({
    mutationFn: async (payload: {
      patientId: string;
      medicationLineId: string;
      dosageInstructions: string;
    }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 200));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id !== payload.patientId
            ? p
            : {
                ...p,
                medications: p.medications.map((m) =>
                  m.id === payload.medicationLineId
                    ? { ...m, dosageInstructions: payload.dosageInstructions }
                    : m
                ),
              }
        );
      });
      showIcareSuccessToast("Care note updated");
    },
    onError: () => showIcareErrorToast("Could not update instructions"),
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (payload: {
      patientId: string;
      channel: MedicationReminderChannel;
      message: string;
      medicationSummary?: string | null;
      templateLabel?: string;
    }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 350));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === payload.patientId
            ? {
                ...p,
                contactHistory: [
                  {
                    id: `ch_${Date.now()}`,
                    patientId: payload.patientId,
                    channel: payload.channel,
                    status: "queued",
                    summary: payload.medicationSummary
                      ? `Reminder: ${payload.medicationSummary}`
                      : (payload.templateLabel ?? "Medication reminder"),
                    messagePreview: payload.message.slice(0, 140),
                    createdAt: new Date().toISOString(),
                    createdByLabel: "Assistant",
                  },
                  ...p.contactHistory,
                ],
              }
            : p
        );
      });
      if (payload.channel === "sms") {
        showIcareSuccessToast("SMS queued", "Demo — connects when messaging API is live.");
      } else {
        showIcareSuccessToast("Push notification queued", "(demo)");
      }
    },
    onError: () => showIcareErrorToast("Could not queue reminder"),
  });

  const escalateToDoctorMutation = useMutation({
    mutationFn: async (payload: {
      patientId: string;
      medicationLineId: string | null;
      priority: DoctorEscalationPriority;
      reason: string;
      note: string;
    }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 280));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        const escalation: DoctorEscalation = {
          id: `esc_${Date.now()}`,
          patientId: payload.patientId,
          medicationLineId: payload.medicationLineId,
          priority: payload.priority,
          reason: payload.reason,
          note: payload.note,
          status: "waiting_review",
          createdAt: new Date().toISOString(),
          createdByLabel: "Assistant",
        };
        return old.map((p) =>
          p.id === payload.patientId ? { ...p, escalations: [escalation, ...p.escalations] } : p
        );
      });
      showIcareSuccessToast("Doctor escalation queued");
    },
    onError: () => showIcareErrorToast("Could not queue escalation"),
  });

  const dismissInsightMutation = useMutation({
    mutationFn: async (payload: { patientId: string; insightId: string }) => {
      void payload;
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 150));
    },
    onSuccess(_, payload) {
      qc.setQueryData<PatientMedicationProfile[]>(QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === payload.patientId
            ? {
                ...p,
                aiInsights: p.aiInsights.filter((i) => i.id !== payload.insightId),
              }
            : p
        );
      });
      showIcareToast({ title: "Insight dismissed" });
    },
  });

  return {
    allProfiles: profiles,
    profiles: filteredProfiles,
    followUpItems,
    selectedFollowUpItems,
    isLoading,
    searchTerm,
    setSearchTerm,
    listFilters,
    setListFilters,
    hasActiveListFilters: hasActiveMedicationListFilters(listFilters),
    resetListFilters: () => setListFilters(DEFAULT_MEDICATION_LIST_FILTERS),
    selectedPatientId,
    selectPatient: setListSelectedPatientId,
    clearSelection: () => setListSelectedPatientId(null),
    selectedProfile,
    dismissInsightMutation,
    flagMedicationMutation,
    resolveFlagMutation,
    updateInstructionsMutation,
    sendReminderMutation,
    escalateToDoctorMutation,
  };
}
