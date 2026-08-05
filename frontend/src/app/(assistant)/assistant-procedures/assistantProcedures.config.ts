import type { ProcedureOrderStatus, ProcedurePriority } from "./assistantProcedures.types"

/** Status labels — badge colors live in `StatusBadge` (medications-style solid chips). */
export const STATUS_CONFIG: Record<ProcedureOrderStatus, { label: string }> = {
  pending: { label: "Pending" },
  "in-progress": { label: "Active" },
  completed: { label: "Verified" },
}

export const PRIORITY_CONFIG: Record<
  ProcedurePriority,
  { label: string; style: string; dot?: string }
> = {
  normal: { 
    label: "Normal", 
    style: "bg-[#F9F8F5] text-[#6B7870] border-[#E8E6E0]" 
  },
  urgent: {
    label: "Urgent",
    style: "bg-[#FFF8E7] text-[#B8860B] border-[#B8860B]/20",
    dot: "bg-[#B8860B]",
  },
  emergency: {
    label: "Emergency",
    style: "bg-[#FEF2F2] text-[#991B1B] border-[#991B1B]/20",
    dot: "bg-[#991B1B]",
  },
}
