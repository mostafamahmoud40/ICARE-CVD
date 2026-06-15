export const doctorPageCardClassName =
  "gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]"

export const doctorStatCellClassName =
  "flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

export function doctorAccountScrollbarCss() {
  return `
    .doctor-account-scrollbar::-webkit-scrollbar { width: 5px; }
    .doctor-account-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .doctor-account-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .doctor-account-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `
}

export function visitModesLabel(mode: "clinic" | "virtual" | "both") {
  if (mode === "clinic") return "Clinic only"
  if (mode === "virtual") return "Online only"
  return "Clinic & online"
}

export function formatConsultationFee(amount: number) {
  return `EGP ${amount.toLocaleString()}`
}
