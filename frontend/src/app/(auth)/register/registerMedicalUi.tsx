"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { REGISTER_INPUT, REGISTER_LABEL } from "./registerSectionUi";

export const NYHA_OPTIONS = [
  { value: "i", label: "I" },
  { value: "ii", label: "II" },
  { value: "iii", label: "III" },
  { value: "iv", label: "IV" },
] as const;

export function NyhaSegmented({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className={REGISTER_LABEL}>NYHA class</Label>
      <div
        className="inline-flex flex-wrap rounded-xl border border-[#E8E6E0] bg-white p-1 shadow-sm"
        role="group"
        aria-label="NYHA functional class"
      >
        {NYHA_OPTIONS.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "min-w-[2.75rem] rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                on ? "bg-[#1A5345] text-white shadow-sm" : "text-[#6B7870] hover:bg-[#F9F8F5]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SegmentedField({
  label,
  value,
  onChange,
  options,
  ariaLabel,
  accent = "green",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly { value: string; label: string }[];
  ariaLabel?: string;
  accent?: "green" | "orange" | "amber" | "blue" | "pink" | "violet" | "teal";
}) {
  const active =
    accent === "orange"
      ? "bg-[#E89042] text-white shadow-sm"
      : accent === "amber"
        ? "bg-amber-600 text-white shadow-sm"
        : "bg-[#1A5345] text-white shadow-sm";
  const border = "border-[#E8E6E0]";
  return (
    <div className="space-y-2">
      <Label className={REGISTER_LABEL}>{label}</Label>
      <div
        className={cn("inline-flex max-w-full flex-wrap rounded-xl border bg-white p-1 shadow-sm", border)}
        role="group"
        aria-label={ariaLabel ?? label}
      >
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-9 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm",
                on ? active : "text-[#6B7870] hover:bg-[#F9F8F5]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YesNoToggle({
  label,
  value,
  onChange,
  name,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  name: string;
}) {
  const sel = value.toLowerCase();
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <Label className={REGISTER_LABEL}>{label}</Label>
      <div className="flex shrink-0 gap-2" role="group" aria-label={label}>
        {(["yes", "no"] as const).map((opt) => {
          const active = sel === opt;
          return (
            <button
              key={opt}
              type="button"
              name={`${name}-${opt}`}
              onClick={() => onChange(opt)}
              className={cn(
                "min-w-[4rem] rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors",
                active
                  ? opt === "yes"
                    ? "border-[#1A5345] bg-[#1A5345] text-white shadow-sm"
                    : "border-[#E8E6E0] bg-[#F4F3ED] text-[#1A1F1E]"
                  : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC]",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PillowStepper({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const levels = ["1", "2", "3", "4", "5", "5plus"] as const;
  return (
    <div className="space-y-2 rounded-xl border border-[#E8E6E0] bg-white p-3">
      <Label className={REGISTER_LABEL}>Number of pillows</Label>
      <div className="flex flex-wrap gap-1.5">
        {levels.map((lvl) => {
          const on = value === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(lvl)}
              className={cn(
                "h-9 min-w-[2.5rem] rounded-md border px-2 text-xs font-semibold transition-colors",
                on
                  ? "border-[#1A5345] bg-[#1A5345] text-white shadow-sm"
                  : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC]",
              )}
            >
              {lvl === "5plus" ? "5+" : lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SeverityDotScale({
  value,
  onChange,
  idPrefix,
}: {
  value: string;
  onChange: (next: string) => void;
  idPrefix: string;
}) {
  const selected = value === "" ? -1 : Number.parseInt(value, 10);
  const safe = Number.isFinite(selected) ? selected : -1;

  return (
    <div className="space-y-2">
      <Label className={REGISTER_LABEL}>Severity (0–10)</Label>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 11 }, (_, i) => {
          const isOn = safe === i;
          const baseTone =
            i <= 3
              ? "border-emerald-400/80 bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-600"
              : i <= 6
                ? "border-amber-400/80 bg-amber-500/90 text-white shadow-sm hover:bg-amber-600"
                : "border-red-400/80 bg-red-500/90 text-white shadow-sm hover:bg-red-600";
          const offTone = "border-[#E8E6E0] bg-[#F9F8F5] text-[#6B7870] hover:bg-[#F4F3ED]";
          return (
            <button
              key={i}
              type="button"
              id={`${idPrefix}-sev-${i}`}
              aria-pressed={isOn}
              aria-label={`Severity ${i} of 10`}
              onClick={() => onChange(String(i))}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-transform",
                isOn ? `${baseTone} scale-110 ring-2 ring-white/90 ring-offset-2 ring-offset-transparent shadow-md` : offTone,
              )}
            >
              {i}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChipMultiField({
  label,
  field,
  options,
  selectedIds,
  onToggle,
  tone = "green",
}: {
  label: string;
  field: string;
  options: readonly { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (field: string, id: string) => void;
  tone?: "green" | "orange" | "amber" | "red" | "blue" | "pink" | "violet" | "teal";
}) {
  const active =
    tone === "orange"
      ? "border-[#E89042] bg-[#E8904218] text-[#1A1F1E]"
      : tone === "amber"
        ? "border-amber-500 bg-amber-50 text-amber-900"
        : "border-[#1A5345] bg-[#1A534518] text-[#1A5345]";
  const inactive = "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC] hover:bg-[#F9F8F5]";
  return (
    <div className="space-y-2">
      <Label className={REGISTER_LABEL}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(field, opt.id)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", on ? active : inactive)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MedicalNativeSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
  id,
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      aria-invalid={ariaInvalid}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        REGISTER_INPUT,
        "w-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5345]/20",
        ariaInvalid ? "border-[#E15C5C]" : "",
        className,
      )}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
