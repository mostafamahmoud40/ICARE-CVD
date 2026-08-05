"use client";

import {
  Droplet,
  User,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { RegisterProfileValues } from "./register.types";

/* ----- style tokens ----- */

export const triggerRowClass =
  "h-10 w-full min-w-0 rounded-lg border-input bg-background text-foreground shadow-sm sm:min-w-[11rem]";

export const triggerLabeledClass =
  "h-11 w-full rounded-xl border-input bg-background text-foreground shadow-sm";

/* ----- layout primitives ----- */

export function FormCardSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-[1.125rem]">
          {icon}
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/90 bg-muted/30 p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/80">{children}</div>
    </div>
  );
}

export function ProfileRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-[1.125rem]">
          {icon}
        </div>
        <span className="text-sm font-normal text-foreground">{label}</span>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,14rem)] sm:min-w-[11rem]">{children}</div>
    </div>
  );
}

export function IconInputShell({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
        {icon}
      </span>
      {children}
    </div>
  );
}

/* ----- select components ----- */

export function RowSelect({
  id,
  value,
  onChange,
  disabled,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn(triggerRowClass)}>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent
        align="end"
        sideOffset={6}
        className="min-w-[var(--radix-select-trigger-width)] rounded-xl border border-border bg-popover shadow-lg"
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="cursor-pointer rounded-lg py-2 pl-2">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GenderOptionIcon({ value }: { value: string }) {
  switch (value) {
    case "male":
      return (
        <User className="size-4 shrink-0 text-sky-600 dark:text-sky-400" strokeWidth={2.25} aria-hidden />
      );
    case "female":
      return (
        <UserRound
          className="size-4 shrink-0 text-rose-600 dark:text-rose-400"
          strokeWidth={2.25}
          aria-hidden
        />
      );
    case "other":
      return (
        <Users className="size-4 shrink-0 text-violet-600 dark:text-violet-400" strokeWidth={2.25} aria-hidden />
      );
    default:
      return null;
  }
}

export function CompactSelect({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  variant = "default",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled: boolean;
  variant?: "default" | "blood" | "gender";
  required?: boolean;
}) {
  const richMenuItemClass =
    "cursor-pointer rounded-lg border-2 border-transparent py-2.5 pl-2 text-foreground data-[highlighted]:border-foreground data-[highlighted]:bg-rose-50 data-[state=checked]:border-foreground data-[state=checked]:bg-rose-50 dark:data-[highlighted]:bg-rose-950/35 dark:data-[state=checked]:bg-rose-950/35";

  const useRichMenu = variant === "blood" || variant === "gender";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className={cn(triggerLabeledClass)}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent
          sideOffset={6}
          className="max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className={cn(
                useRichMenu ? richMenuItemClass : "cursor-pointer rounded-lg py-2 pl-2"
              )}
            >
              {variant === "blood" ? (
                <span className="flex items-center gap-2.5">
                  <Droplet
                    className="size-4 shrink-0 text-red-600 dark:text-red-400"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>{o.label}</span>
                </span>
              ) : variant === "gender" ? (
                <span className="flex items-center gap-2.5">
                  <GenderOptionIcon value={o.value} />
                  <span>{o.label}</span>
                </span>
              ) : (
                o.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ----- interactive widgets ----- */

export function CaffeineStepper({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const n = Math.max(0, Math.min(20, Number.parseInt(value, 10) || 0));

  function set(next: number) {
    onChange(String(Math.max(0, Math.min(20, next))));
  }

  return (
    <div
      className={cn(
        "flex h-10 w-full min-w-[9.5rem] items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-sm sm:min-w-[11rem]"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || n <= 0}
        onClick={() => set(n - 1)}
        className="h-10 w-10 shrink-0 rounded-none border-r border-input text-muted-foreground hover:bg-muted"
        aria-label="Decrease cups per day"
      >
        −
      </Button>
      <span className="flex flex-1 items-center justify-center text-sm font-medium tabular-nums text-foreground">
        {n}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || n >= 20}
        onClick={() => set(n + 1)}
        className="h-10 w-10 shrink-0 rounded-none border-l border-input text-muted-foreground hover:bg-muted"
        aria-label="Increase cups per day"
      >
        +
      </Button>
    </div>
  );
}

const EXERCISE_TYPES: Array<{ value: string; label: string }> = [
  { value: "walking", label: "Walking" },
  { value: "gym", label: "Gym" },
  { value: "swimming", label: "Swimming" },
  { value: "cycling", label: "Cycling" },
  { value: "other", label: "Other" },
];

export function ExerciseTypeChips({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXERCISE_TYPES.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ----- utility functions ----- */

export function syncDietaryHabits(
  value: string,
  onProfileFieldChange: <K extends keyof RegisterProfileValues>(
    field: K,
    v: RegisterProfileValues[K]
  ) => void
) {
  onProfileFieldChange("dietaryHabits", value);
  if (value === "balanced") {
    onProfileFieldChange("highSaltDiet", false);
    onProfileFieldChange("highFatDiet", false);
    return;
  }
  if (value === "high_salt") {
    onProfileFieldChange("highSaltDiet", true);
    onProfileFieldChange("highFatDiet", false);
    return;
  }
  if (value === "high_fat") {
    onProfileFieldChange("highSaltDiet", false);
    onProfileFieldChange("highFatDiet", true);
    return;
  }
  if (value === "high_both") {
    onProfileFieldChange("highSaltDiet", true);
    onProfileFieldChange("highFatDiet", true);
    return;
  }
  onProfileFieldChange("highSaltDiet", false);
  onProfileFieldChange("highFatDiet", false);
}

export function ageInYearsFromIsoDate(isoDate: string): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}
