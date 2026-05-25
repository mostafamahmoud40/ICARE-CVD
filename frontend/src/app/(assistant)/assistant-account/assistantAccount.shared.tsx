"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/** Visual tokens aligned with `/assistant-medications` list & detail pages. */

/** Same shell + hover as queue `StatCell`. */
export const accountStatCellClassName =
  "flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md";

export function AccountStatCell({
  icon: Icon,
  value,
  label,
  iconColor,
}: {
  icon: ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  iconColor: string;
}) {
  return (
    <div className={accountStatCellClassName}>
      <div className="flex shrink-0 items-center justify-center">
        <Icon className={cn("size-5", iconColor)} aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">{value}</div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-[#6B7870]">{label}</div>
      </div>
    </div>
  );
}

export const accountPageCardClassName =
  "gap-0 py-0 ring-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]";

/** Section header icon — no tile background (matches medications page icons). */
export function AccountCardHeaderIcon({
  icon: Icon,
  iconClassName = "text-[#1A5345]",
}: {
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
}) {
  return <Icon className={cn("size-5 shrink-0 sm:size-5", iconClassName)} aria-hidden />;
}

export const accountSectionTitleClassName =
  "font-serif text-[15px] font-bold tracking-tight text-[#1A1F1E] sm:text-[16px]";

export const accountSectionDescClassName =
  "text-[11px] font-medium text-muted-foreground sm:text-[12px]";

/** Weekly performance metrics — same semantic colors as medication adherence UI. */
export const accountWeeklyMetrics = {
  patients: {
    label: "Patients",
    barClass: "bg-[#1A5345]",
    textClass: "text-[#1A5345]",
    dotClass: "bg-[#1A5345]",
  },
  appointments: {
    label: "Appointments",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
    dotClass: "bg-emerald-500",
  },
  tasks: {
    label: "Tasks",
    barClass: "bg-amber-500",
    textClass: "text-amber-600",
    dotClass: "bg-amber-500",
  },
} as const;

/** Work schedule row status — aligned with medication adherence semantic colors. */
export const accountShiftStatusStyles = {
  active: {
    label: "Active",
    dotClass: "bg-[#1A5345]",
    badgeClass: "border-0 bg-[#1A5345] text-white hover:bg-[#1A5345]",
    dayBadgeClass: "border-[#1A5345]/30 bg-[#E8F0EE] text-[#1A5345]",
    rowClass: "border-[#E8E6E0]/80 bg-[#FBFDFC]/50",
  },
  "half-day": {
    label: "Half day",
    dotClass: "bg-amber-500",
    badgeClass: "border-0 bg-amber-500 text-white hover:bg-amber-500",
    dayBadgeClass: "border-amber-200/80 bg-amber-50 text-amber-700",
    rowClass: "border-amber-200/60 bg-amber-50/40",
  },
  holiday: {
    label: "Day off",
    dotClass: "bg-muted-foreground/35",
    badgeClass: "border border-[#E8E6E0]/80 bg-[#F9F8F5] text-muted-foreground hover:bg-[#F9F8F5]",
    dayBadgeClass: "border-[#E8E6E0]/60 bg-[#F9F8F5] text-muted-foreground",
    rowClass: "border-[#E8E6E0]/60 bg-[#F9F8F5]/80",
  },
} as const;

export function assistantAccountScrollbarCss() {
  return `
    .account-custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .account-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .account-custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .account-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `;
}
