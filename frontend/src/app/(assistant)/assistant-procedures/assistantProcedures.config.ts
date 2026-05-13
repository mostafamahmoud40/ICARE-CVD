import type { ProcedureOrderStatus, ProcedurePriority } from "./assistantProcedures.types"

/** Matches assistant-queue “cream + forest green” palette — no generic blue/emerald chips. */
export const STATUS_CONFIG: Record<ProcedureOrderStatus, { label: string; style: string; dot: string }> = {
  pending: {
    label: "Pending",
    style: "bg-[#FFF8E7] text-[#B8860B] border-[#B8860B]/20 shadow-sm",
    dot: "bg-[#B8860B]",
  },
  "in-progress": {
    label: "Active",
    style: "bg-[#E8F0EE] text-[#1A5345] border-[#1A5345]/20 shadow-sm",
    dot: "bg-[#1A5345] animate-pulse",
  },
  completed: {
    label: "Verified",
    style: "bg-[#F0FDF4] text-[#166534] border-[#166534]/20 shadow-sm",
    dot: "bg-[#166534]",
  },
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
