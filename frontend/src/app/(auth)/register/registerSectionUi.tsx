"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const REGISTER_SECTION_CARD =
  "space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm";

export const REGISTER_HPI_CARD =
  "space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5";

export const REGISTER_EMPTY_STATE =
  "flex items-center gap-2 rounded-xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-3 text-[#6B7870]";

export const REGISTER_LABEL = "text-sm font-medium text-[#374151]";

export const REGISTER_HEADING = "text-sm font-bold tracking-tight text-[#1A5345]";

export const REGISTER_INPUT =
  "h-10 rounded-xl border-gray-200 bg-white focus-visible:border-[#1A5345] focus-visible:ring-[#1A5345]/20";

export const REGISTER_PRIMARY_BTN =
  "h-12 flex-1 rounded-xl bg-[#1A5345] text-base font-semibold text-white transition-all hover:bg-[#154434]";

export const REGISTER_OUTLINE_BTN =
  "h-12 flex-1 rounded-xl border border-[#E8E6E0] bg-white text-base font-semibold text-[#1A5345] hover:bg-[#F9F8F5]";

type RegisterSectionHeaderProps = {
  icon: LucideIcon;
  label: string;
  accent?: "green" | "orange";
  action?: React.ReactNode;
  className?: string;
};

export function RegisterSectionHeader({
  icon: Icon,
  label,
  accent = "green",
  action,
  className,
}: RegisterSectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5", action ? "justify-between" : "", className)}>
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: accent === "orange" ? "#E8904218" : "#1A534518" }}
        >
          <Icon
            className="size-4"
            style={{ color: accent === "orange" ? "#E89042" : "#1A5345" }}
          />
        </div>
        <h3 className={REGISTER_HEADING}>{label}</h3>
      </div>
      {action}
    </div>
  );
}
