"use client"

/** Toolbar search — styled for the procedure orders list header (matches medications list). */
export const proceduresListSearchInputClassName =
  "h-10 w-full rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] pl-10 pr-4 text-[13px] font-medium text-[#1A1F1E] shadow-none transition-[border-color,background-color,box-shadow] placeholder:font-medium placeholder:text-muted-foreground/55 focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-11 sm:pl-11 sm:text-[14px]"

export function proceduresScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `
}
