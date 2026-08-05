"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { getPaginationPageItems } from "./appointments.utils"

type AppointmentsListPaginationProps = {
  page: number
  totalPages: number
  totalCount: number
  rangeStart: number
  rangeEnd: number
  onPageChange: (page: number) => void
  className?: string
}

export function AppointmentsListPagination({
  page,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
  onPageChange,
  className,
}: AppointmentsListPaginationProps) {
  const pageItems = getPaginationPageItems(page, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/95 px-5 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
    >
      <p className="text-[12px] font-medium text-muted-foreground">
        Showing{" "}
        <span className="font-bold tabular-nums text-[#1A1F1E]">{rangeStart}</span> to{" "}
        <span className="font-bold tabular-nums text-[#1A1F1E]">{rangeEnd}</span> of{" "}
        <span className="font-bold tabular-nums text-[#1A1F1E]">
          {totalCount.toLocaleString()}
        </span>{" "}
        appointments
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 rounded-md border-transparent text-muted-foreground shadow-none hover:bg-slate-50 hover:text-[#1A1F1E]"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
          </Button>

          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-[12px] text-muted-foreground/60"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={page === item ? "default" : "outline"}
                size="icon"
                className={cn(
                  "size-7 rounded-md text-[12px] font-bold transition-all shadow-none",
                  page === item
                    ? "border-0 bg-[#1A5345] text-white hover:bg-[#133F34] hover:text-white"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]",
                )}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={page === item ? "page" : undefined}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 rounded-md border-transparent text-muted-foreground shadow-none hover:bg-slate-50 hover:text-[#1A1F1E]"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
