import type { ProcedureOrderStatus, ProcedurePriority } from "./assistantProcedures.types"

/** Matches assistant-queue “cream + forest green” palette — no generic blue/emerald chips. */
export const STATUS_CONFIG: Record<ProcedureOrderStatus, { label: string; style: string; dot: string }> = {
  pending: {
    label: "Pending",
    /** Gold fill; label matches dot hue (#C98810) */
    style: "bg-[#F4E8CD] text-[#C98810] font-semibold ring-1 ring-[#E2CFA0]/70",
    dot: "bg-[#C98810]",
  },
  "in-progress": {
    label: "In Progress",
    /** Light mint wash; label matches dot (#1A5345), same pattern as Pending / Completed */
    style: "bg-[#EFF6F3] text-[#1A5345] font-semibold ring-1 ring-[#BFD9CC]/75",
    dot: "bg-[#1A5345] animate-pulse",
  },
  completed: {
    label: "Completed",
    /** Light sage wash; label matches dot (#5E8F7B), same pattern as Pending */
    style: "bg-[#F2FAF7] text-[#5E8F7B] font-semibold ring-1 ring-[#C5D9D0]/70",
    dot: "bg-[#5E8F7B]",
  },
}

/** Optional `dot` classes — label text should match dot fill (same pattern as StatusBadge Pending). */
export const PRIORITY_CONFIG: Record<
  ProcedurePriority,
  { label: string; style: string; dot?: string }
> = {
  normal: { label: "Normal", style: "bg-[#E8F0EE] text-[#1A5345]" },
  urgent: {
    label: "Urgent",
    style: "bg-[#FDF6EA] text-[#C07818] font-semibold ring-1 ring-[#E8CFAC]/75",
    dot: "bg-[#C07818]",
  },
  emergency: {
    label: "Emergency",
    style: "bg-[#FCEAE9] text-[#D94848] font-semibold ring-1 ring-[#ECB8B8]/75",
    dot: "bg-[#D94848]",
  },
}
