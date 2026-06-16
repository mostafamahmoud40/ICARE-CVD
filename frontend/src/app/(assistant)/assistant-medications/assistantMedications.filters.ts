import type { RiskTier } from "./assistantMedications.types";

export type MedicationAdherenceFilter = "all" | "low" | "moderate" | "good";

export type MedicationListFilters = {
  riskTier: "all" | RiskTier;
  adherence: MedicationAdherenceFilter;
  flaggedOnly: boolean;
  followUpOnly: boolean;
  aiInsightsOnly: boolean;
};

export const DEFAULT_MEDICATION_LIST_FILTERS: MedicationListFilters = {
  riskTier: "all",
  adherence: "all",
  flaggedOnly: false,
  followUpOnly: false,
  aiInsightsOnly: false,
};

export function hasActiveMedicationListFilters(filters: MedicationListFilters) {
  return (
    filters.riskTier !== "all" ||
    filters.adherence !== "all" ||
    filters.flaggedOnly ||
    filters.followUpOnly ||
    filters.aiInsightsOnly
  );
}

export function countActiveMedicationListFilters(filters: MedicationListFilters) {
  let count = 0;
  if (filters.riskTier !== "all") count += 1;
  if (filters.adherence !== "all") count += 1;
  if (filters.flaggedOnly) count += 1;
  if (filters.followUpOnly) count += 1;
  if (filters.aiInsightsOnly) count += 1;
  return count;
}

export function matchesAdherenceFilter(
  overallAdherencePct: number,
  adherence: MedicationAdherenceFilter,
) {
  if (adherence === "all") return true;
  if (adherence === "low") return overallAdherencePct < 65;
  if (adherence === "moderate") return overallAdherencePct >= 65 && overallAdherencePct < 85;
  return overallAdherencePct >= 85;
}
