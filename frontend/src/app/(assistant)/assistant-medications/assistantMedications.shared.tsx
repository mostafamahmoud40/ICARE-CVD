"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PatientMedicationProfile } from "./assistantMedications.types";

export function AdherencePill({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, pct));
  const color = safe >= 85 ? "bg-emerald-500" : safe >= 65 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#E8E6E0]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${safe}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{safe}%</span>
    </div>
  );
}

export function MedicationDots({ history }: { history: boolean[] }) {
  return (
    <div className="flex items-center gap-1">
      {history.map((taken, i) => (
        <div
          key={i}
          className={cn(
            "size-2.5 rounded-full border",
            taken ? "border-emerald-600 bg-emerald-500" : "border-rose-200 bg-rose-50",
          )}
          title={taken ? "Taken" : "Missed"}
        />
      ))}
    </div>
  );
}

export function RiskBadge({ tier }: { tier: PatientMedicationProfile["riskTier"] }) {
  const cfg = {
    high: "border-0 bg-rose-500 text-white hover:bg-rose-500",
    medium: "border-0 bg-amber-500 text-white hover:bg-amber-500",
    low: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
  }[tier];

  return (
    <Badge variant="default" className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", cfg)}>
      {tier} risk
    </Badge>
  );
}

export function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(dateValue),
  );
}

export function formatDateTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateValue));
}

export function medicationsScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `;
}
