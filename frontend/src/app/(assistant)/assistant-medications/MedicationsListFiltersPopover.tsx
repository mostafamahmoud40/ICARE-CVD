"use client";

import { FilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  countActiveMedicationListFilters,
  DEFAULT_MEDICATION_LIST_FILTERS,
  hasActiveMedicationListFilters,
  type MedicationListFilters,
} from "./assistantMedications.filters";

const FILTER_SELECT_ALL = "__all__";

type MedicationsListFiltersPopoverProps = {
  filters: MedicationListFilters;
  onChange: (filters: MedicationListFilters) => void;
};

export function MedicationsListFiltersPopover({
  filters,
  onChange,
}: MedicationsListFiltersPopoverProps) {
  const activeCount = countActiveMedicationListFilters(filters);
  const hasActive = hasActiveMedicationListFilters(filters);

  const setField = <K extends keyof MedicationListFilters>(
    key: K,
    value: MedicationListFilters[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange(DEFAULT_MEDICATION_LIST_FILTERS);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Filter view"
          aria-label={hasActive ? `Filter view (${activeCount} active)` : "Filter view"}
          className={cn(
            "relative size-8 shrink-0 rounded-lg border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-[#1A5345] sm:size-9",
            hasActive && "text-[#1A5345]",
          )}
        >
          <FilterIcon className="size-4" strokeWidth={hasActive ? 2.5 : 2} />
          {hasActive ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#1A5345] text-[9px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-0 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FilterIcon className="size-4 text-[#1A5345]" aria-hidden />
              <h4 className="font-serif text-[16px] font-bold text-[#1A1F1E]">Filter view</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasActive}
              className="h-7 rounded-md px-2 text-[13px] font-bold text-[#6B7870] transition-colors hover:bg-transparent hover:text-[#1A5345] disabled:opacity-40"
              onClick={resetFilters}
            >
              Reset all
            </Button>
          </div>
        </div>

        <div className="space-y-5 bg-white p-5 sm:p-6">
          <div className="space-y-2.5">
            <Label className="text-[14px] font-bold text-[#102F27]">Risk tier</Label>
            <Select
              value={filters.riskTier}
              onValueChange={(value) =>
                setField("riskTier", value as MedicationListFilters["riskTier"])
              }
            >
              <SelectTrigger className="!h-11 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] font-semibold text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:ring-0">
                <SelectValue placeholder="All risk levels" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                <SelectItem value="all" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  All risk levels
                </SelectItem>
                <SelectItem value="high" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  High risk only
                </SelectItem>
                <SelectItem value="medium" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  Medium risk only
                </SelectItem>
                <SelectItem value="low" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  Low risk only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label className="text-[14px] font-bold text-[#102F27]">Adherence (7-day)</Label>
            <Select
              value={filters.adherence === "all" ? FILTER_SELECT_ALL : filters.adherence}
              onValueChange={(value) =>
                setField(
                  "adherence",
                  value === FILTER_SELECT_ALL
                    ? "all"
                    : (value as MedicationListFilters["adherence"]),
                )
              }
            >
              <SelectTrigger className="!h-11 w-full rounded-lg border-[#cfd9d5] bg-white text-[14px] font-semibold text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:ring-0">
                <SelectValue placeholder="All adherence levels" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                <SelectItem value={FILTER_SELECT_ALL} className="h-11 text-[14px] font-semibold text-[#152a24]">
                  All adherence levels
                </SelectItem>
                <SelectItem value="low" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  Low — below 65%
                </SelectItem>
                <SelectItem value="moderate" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  Moderate — 65% to 84%
                </SelectItem>
                <SelectItem value="good" className="h-11 text-[14px] font-semibold text-[#152a24]">
                  Good — 85% or higher
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-[#E8E6E0]/60" />

          <div className="space-y-3.5">
            <p className="text-[14px] font-bold text-[#102F27]">Workflow</p>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-1 transition-colors hover:border-[#E8E6E0]/60 hover:bg-[#F9F8F5]/80">
              <Checkbox
                checked={filters.flaggedOnly}
                onCheckedChange={(checked) => setField("flaggedOnly", Boolean(checked))}
                className="mt-0.5 size-[18px] rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-snug text-[#1A1F1E]">Flagged only</span>
                <span className="mt-1 block text-[13px] font-medium leading-snug text-[#6B7870]">
                  Patients with at least one open medication flag.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-1 transition-colors hover:border-[#E8E6E0]/60 hover:bg-[#F9F8F5]/80">
              <Checkbox
                checked={filters.followUpOnly}
                onCheckedChange={(checked) => setField("followUpOnly", Boolean(checked))}
                className="mt-0.5 size-[18px] rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-snug text-[#1A1F1E]">Follow-up queue</span>
                <span className="mt-1 block text-[13px] font-medium leading-snug text-[#6B7870]">
                  Low adherence, missed doses, refills, or critical flags.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-1 transition-colors hover:border-[#E8E6E0]/60 hover:bg-[#F9F8F5]/80">
              <Checkbox
                checked={filters.aiInsightsOnly}
                onCheckedChange={(checked) => setField("aiInsightsOnly", Boolean(checked))}
                className="mt-0.5 size-[18px] rounded-md border-[#E8E6E0] data-[state=checked]:border-[#1A5345] data-[state=checked]:bg-[#1A5345]"
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-snug text-[#1A1F1E]">AI insights</span>
                <span className="mt-1 block text-[13px] font-medium leading-snug text-[#6B7870]">
                  Patients with active AI adherence suggestions.
                </span>
              </span>
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
