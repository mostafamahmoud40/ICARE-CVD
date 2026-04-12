"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
      <Label className="text-sm font-medium text-[#1A1A2E]">NYHA class</Label>
      <div
        className="inline-flex flex-wrap rounded-xl border border-blue-200/80 bg-white p-1 shadow-sm"
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
                on ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50"
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
  accent = "violet",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly { value: string; label: string }[];
  ariaLabel?: string;
  accent?: "violet" | "blue" | "pink" | "orange" | "teal" | "amber";
}) {
  const active =
    accent === "blue"
      ? "bg-blue-600 text-white shadow-sm"
      : accent === "pink"
        ? "bg-pink-600 text-white shadow-sm"
        : accent === "orange"
          ? "bg-orange-600 text-white shadow-sm"
          : accent === "teal"
            ? "bg-primary text-primary-foreground shadow-sm"
            : accent === "amber"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-violet-600 text-white shadow-sm";
  const border =
    accent === "blue"
      ? "border-blue-200/80"
      : accent === "pink"
        ? "border-pink-200/80"
        : accent === "orange"
          ? "border-orange-200/80"
          : accent === "teal"
            ? "border-primary/25"
            : accent === "amber"
              ? "border-amber-200/80"
              : "border-violet-200/80";
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#1A1A2E]">{label}</Label>
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
                on ? active : "text-slate-600 hover:bg-slate-50"
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
      <Label className="text-sm font-medium text-[#1A1A2E]">{label}</Label>
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
                    ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                    : "border-slate-300 bg-slate-100 text-slate-800"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
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
    <div className="space-y-2 rounded-lg border border-blue-200/60 bg-white/80 p-3">
      <Label className="text-sm font-medium text-[#1A1A2E]">Number of pillows</Label>
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
                on ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
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
      <Label className="text-sm font-medium text-[#1A1A2E]">Severity (0–10)</Label>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 11 }, (_, i) => {
          const isOn = safe === i;
          const baseTone =
            i <= 3
              ? "border-emerald-400/80 bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-600"
              : i <= 6
                ? "border-amber-400/80 bg-amber-500/90 text-white shadow-sm hover:bg-amber-600"
                : "border-red-400/80 bg-red-500/90 text-white shadow-sm hover:bg-red-600";
          const offTone = "border-muted-foreground/25 bg-muted/40 text-muted-foreground hover:bg-muted/70";
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
                isOn ? `${baseTone} scale-110 ring-2 ring-white/90 ring-offset-2 ring-offset-transparent shadow-md` : offTone
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
  tone = "red",
}: {
  label: string;
  field: string;
  options: readonly { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (field: string, id: string) => void;
  tone?: "red" | "blue" | "pink" | "violet" | "teal" | "orange" | "amber";
}) {
  const active =
    tone === "blue"
      ? "border-blue-500 bg-blue-100 text-blue-900"
      : tone === "pink"
        ? "border-pink-500 bg-pink-100 text-pink-900"
        : tone === "violet"
          ? "border-violet-500 bg-violet-100 text-violet-900"
          : tone === "teal"
            ? "border-primary bg-primary/15 text-primary"
            : tone === "orange"
              ? "border-orange-500 bg-orange-100 text-orange-900"
              : tone === "amber"
                ? "border-amber-500 bg-amber-100 text-amber-900"
                : "border-red-400 bg-red-100 text-red-800";
  const inactive =
    tone === "blue"
      ? "border-gray-200 bg-white text-gray-600 hover:border-blue-200"
      : tone === "pink"
        ? "border-gray-200 bg-white text-gray-600 hover:border-pink-200"
        : tone === "violet"
          ? "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
          : tone === "teal"
            ? "border-border bg-background text-muted-foreground hover:border-primary/30"
            : tone === "orange"
              ? "border-gray-200 bg-white text-gray-600 hover:border-orange-200"
              : tone === "amber"
                ? "border-gray-200 bg-white text-gray-600 hover:border-amber-200"
                : "border-gray-200 bg-white text-gray-600 hover:border-red-200";
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#1A1A2E]">{label}</Label>
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
      className={[
        "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className ?? "",
      ].join(" ")}
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

