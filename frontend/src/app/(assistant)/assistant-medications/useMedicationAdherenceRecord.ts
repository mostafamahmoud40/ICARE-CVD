"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type MedicationAdherenceRecord = {
  medication: {
    id: string;
    name: string;
    dose: string;
    frequency: string;
    instructions: string | null;
    timeOfDay: string[];
    startDate: string | null;
    adherencePercent: number;
  };
  doseLogs: {
    id: string;
    takenAt: string;
    skipped: boolean;
  }[];
};

async function fetchMedicationAdherenceRecord(
  medicationId: string,
  apiPrefix: "assistant" | "doctor",
): Promise<MedicationAdherenceRecord> {
  const { data } = await apiClient.get<MedicationAdherenceRecord>(
    `/${apiPrefix}/medications/${medicationId}/adherence-record`,
  );
  return data;
}

export function useMedicationAdherenceRecord(
  medicationId: string | null | undefined,
  options?: { enabled?: boolean; apiPrefix?: "assistant" | "doctor" },
) {
  const apiPrefix = options?.apiPrefix ?? "assistant";
  const enabled = Boolean(medicationId) && (options?.enabled ?? true);

  return useQuery({
    queryKey: ["medication-adherence-record", apiPrefix, medicationId],
    queryFn: () => fetchMedicationAdherenceRecord(medicationId!, apiPrefix),
    enabled,
    staleTime: 30_000,
  });
}
