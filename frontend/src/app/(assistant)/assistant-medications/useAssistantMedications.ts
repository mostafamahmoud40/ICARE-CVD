"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  showIcareErrorToast,
  showIcareSuccessToast,
  showIcareToast,
} from "@/components/shared/icare-toast";
import type {
  DoctorEscalationPriority,
  FollowUpItem,
  MedicationFlagSeverity,
  PatientMedicationProfile,
  MedicationReminderChannel,
} from "./assistantMedications.types";
import {
  createAssistantMedicationContact,
  createAssistantMedicationEscalation,
  createAssistantMedicationFlag,
  dismissAssistantMedicationInsight,
  fetchAssistantMedicationProfiles,
  resolveAssistantMedicationFlag,
  updateAssistantMedicationInstructions,
} from "./assistantMedications.api";
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

function daysUntil(dateValue: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function priorityFor(
  profile: PatientMedicationProfile,
  base: DoctorEscalationPriority,
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

  const { data: profiles = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAssistantMedicationProfiles,
    staleTime: 30_000,
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
      const numberHit = p.patientNumber?.toLowerCase().includes(term) ?? false;
      return (
        p.fullName.toLowerCase().includes(term) ||
        medsHit ||
        numberHit ||
        (p.phone?.includes(term) ?? false)
      );
    });
  }, [profiles, searchTerm, listFilters]);

  const followUpItems = useMemo(() => buildFollowUpItems(profiles), [profiles]);

  const selectedPatientId = useMemo(() => {
    if (routePatientId != null && routePatientId !== "") {
      const byId = profiles.find((p) => p.id === routePatientId);
      if (byId) return byId.id;
      const byNumber = profiles.find(
        (p) => p.patientNumber?.toLowerCase() === routePatientId.toLowerCase(),
      );
      if (byNumber) return byNumber.id;
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
  }, [routePatientId, filteredProfiles, listSelectedPatientId, profiles]);

  const selectedProfile =
    profiles.find(
      (p) =>
        p.id === selectedPatientId ||
        p.patientNumber?.toLowerCase() === selectedPatientId?.toLowerCase(),
    ) ?? null;

  const selectedFollowUpItems = useMemo(
    () => followUpItems.filter((item) => item.patientId === selectedPatientId),
    [followUpItems, selectedPatientId],
  );

  const invalidateProfiles = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const flagMedicationMutation = useMutation({
    mutationFn: (payload: {
      patientId: string;
      medicationLineId: string;
      severity: MedicationFlagSeverity;
      reason: string;
    }) =>
      createAssistantMedicationFlag({
        patientId: payload.patientId,
        medicationId: payload.medicationLineId,
        severity: payload.severity,
        reason: payload.reason,
      }),
    onSuccess: () => {
      void invalidateProfiles();
      showIcareSuccessToast("Flag saved on medication chart");
    },
    onError: () => showIcareErrorToast("Could not save flag"),
  });

  const resolveFlagMutation = useMutation({
    mutationFn: ({ flagId }: { patientId: string; flagId: string }) =>
      resolveAssistantMedicationFlag(flagId),
    onSuccess: () => {
      void invalidateProfiles();
      showIcareSuccessToast("Flag marked resolved");
    },
    onError: () => showIcareErrorToast("Could not clear flag"),
  });

  const updateInstructionsMutation = useMutation({
    mutationFn: (payload: {
      patientId: string;
      medicationLineId: string;
      dosageInstructions: string;
    }) =>
      updateAssistantMedicationInstructions(
        payload.medicationLineId,
        payload.dosageInstructions,
      ),
    onSuccess: () => {
      void invalidateProfiles();
      showIcareSuccessToast("Care note updated");
    },
    onError: () => showIcareErrorToast("Could not update instructions"),
  });

  const sendReminderMutation = useMutation({
    mutationFn: (payload: {
      patientId: string;
      channel: MedicationReminderChannel;
      message: string;
      medicationSummary?: string | null;
      templateLabel?: string;
    }) =>
      createAssistantMedicationContact({
        patientId: payload.patientId,
        channel: payload.channel,
        summary: payload.medicationSummary
          ? `Reminder: ${payload.medicationSummary}`
          : (payload.templateLabel ?? "Medication reminder"),
        messagePreview: payload.message.slice(0, 140),
      }),
    onSuccess: (_, payload) => {
      void invalidateProfiles();
      if (payload.channel === "sms") {
        showIcareSuccessToast("SMS queued for delivery");
      } else {
        showIcareSuccessToast("Push notification queued");
      }
    },
    onError: () => showIcareErrorToast("Could not queue reminder"),
  });

  const escalateToDoctorMutation = useMutation({
    mutationFn: (payload: {
      patientId: string;
      medicationLineId: string | null;
      priority: DoctorEscalationPriority;
      reason: string;
      note: string;
    }) =>
      createAssistantMedicationEscalation({
        patientId: payload.patientId,
        medicationId: payload.medicationLineId,
        priority: payload.priority,
        reason: payload.reason,
        note: payload.note,
      }),
    onSuccess: () => {
      void invalidateProfiles();
      showIcareSuccessToast("Doctor escalation queued");
    },
    onError: () => showIcareErrorToast("Could not queue escalation"),
  });

  const dismissInsightMutation = useMutation({
    mutationFn: (payload: { patientId: string; insightId: string }) =>
      dismissAssistantMedicationInsight(payload.patientId, payload.insightId),
    onSuccess: () => {
      void invalidateProfiles();
      showIcareToast({ title: "Insight dismissed" });
    },
    onError: () => showIcareErrorToast("Could not dismiss insight"),
  });

  return {
    allProfiles: profiles,
    profiles: filteredProfiles,
    followUpItems,
    selectedFollowUpItems,
    isLoading,
    isError,
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
