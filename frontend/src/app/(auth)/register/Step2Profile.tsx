"use client";

import {
  CalendarDays,
  Cigarette,
  Clock,
  Coffee,
  Droplet,
  Flag,
  Heart,
  HeartPulse,
  IdCard,
  ListOrdered,
  Ruler,
  Scale,
  Smile,
  User,
  UserRound,
  Users,
  Waves,
  Wine,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useRegisterContext } from "./register.context";
import type { RegisterProfileValues } from "./register.types";

const triggerRowClass =
  "h-10 w-full min-w-0 rounded-lg border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 sm:min-w-[11rem]";

const triggerLabeledClass =
  "h-11 w-full rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function FormCardSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 [&>svg]:size-[1.125rem]">
          {icon}
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-400">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/40 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">{children}</div>
    </div>
  );
}

function ProfileRow({
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
        <div className="flex size-9 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 [&>svg]:size-[1.125rem]">
          {icon}
        </div>
        <span className="text-sm font-normal text-zinc-800 dark:text-zinc-200">{label}</span>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,14rem)] sm:min-w-[11rem]">{children}</div>
    </div>
  );
}

function RowSelect({
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
        className="min-w-[var(--radix-select-trigger-width)] rounded-xl border border-zinc-200/90 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
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

function CaffeineStepper({
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
        "flex h-10 w-full min-w-[9.5rem] items-stretch overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950 sm:min-w-[11rem]"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || n <= 0}
        onClick={() => set(n - 1)}
        className="h-10 w-10 shrink-0 rounded-none border-r border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        aria-label="Decrease cups per day"
      >
        −
      </Button>
      <span className="flex flex-1 items-center justify-center text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
        {n}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || n >= 20}
        onClick={() => set(n + 1)}
        className="h-10 w-10 shrink-0 rounded-none border-l border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
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

function ExerciseTypeChips({
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
                ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500/70 dark:bg-teal-950/40 dark:text-teal-100"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/50"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function IconInputShell({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 [&>svg]:size-4">
        {icon}
      </span>
      {children}
    </div>
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

function syncDietaryHabits(
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

function ageInYearsFromIsoDate(isoDate: string): number | null {
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

function CompactSelect({
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
  /** Matches blood-type style: pink fill + dark border on hover and when selected; checkmark from SelectItem. */
  const richMenuItemClass =
    "cursor-pointer rounded-lg border-2 border-transparent py-2.5 pl-2 text-zinc-900 data-[highlighted]:border-zinc-900 data-[highlighted]:bg-rose-50 data-[state=checked]:border-zinc-900 data-[state=checked]:bg-rose-50 dark:text-zinc-50 dark:data-[highlighted]:border-zinc-100 dark:data-[highlighted]:bg-rose-950/35 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:bg-rose-950/35";

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
          className="max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-xl border border-zinc-200/90 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
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

export function Step2Profile() {
  const { profileValues, profileFieldErrors, onProfileFieldChange, isPending } = useRegisterContext();
  const computedAge = ageInYearsFromIsoDate(profileValues.dateOfBirth);

  const heightCm = Number.parseFloat(profileValues.heightCm);
  const weightKg = Number.parseFloat(profileValues.weightKg);
  const bmi =
    Number.isFinite(heightCm) && Number.isFinite(weightKg) && heightCm > 0
      ? weightKg / Math.pow(heightCm / 100, 2)
      : null;

  const bmiCategory =
    bmi === null
      ? null
      : bmi < 18.5
        ? "Underweight"
        : bmi < 25
          ? "Normal"
          : bmi < 30
            ? "Overweight"
            : "Obese";

  const bmiStyles =
    bmiCategory === "Normal"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
      : bmiCategory === "Underweight"
        ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        : bmiCategory === "Overweight"
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
          : bmiCategory === "Obese"
            ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
            : "border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100";

  return (
    <div className="space-y-6">
      <FormCardSection icon={<CalendarDays className="text-zinc-600" aria-hidden />} title="Basic information">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-date-of-birth">
              Date of birth<span className="text-red-500"> *</span>
              {computedAge !== null ? (
                <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">(Age {computedAge} years)</span>
              ) : null}
            </Label>
            <IconInputShell icon={<CalendarDays aria-hidden="true" />}>
              <Input
                id="profile-date-of-birth"
                type="date"
                value={profileValues.dateOfBirth}
                onChange={(e) => onProfileFieldChange("dateOfBirth", e.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(profileFieldErrors.dateOfBirth)}
                className="h-11 rounded-lg border-zinc-200 pl-9 dark:border-zinc-700"
              />
            </IconInputShell>
            {profileFieldErrors.dateOfBirth ? (
              <p className="text-sm text-destructive" role="alert">
                {profileFieldErrors.dateOfBirth}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-national-id">National ID</Label>
            <Input
              id="profile-national-id"
              placeholder="e.g. 29801011234567"
              value={profileValues.nationalId}
              onChange={(e) => onProfileFieldChange("nationalId", e.target.value)}
              disabled={isPending}
              className="h-11 rounded-lg border-zinc-200 dark:border-zinc-700"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <CompactSelect
              id="profile-gender"
              label="Sex"
              required
              variant="gender"
              value={profileValues.gender}
              onChange={(v) => onProfileFieldChange("gender", v)}
              disabled={isPending}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
            {profileFieldErrors.gender ? (
              <p className="text-sm text-destructive" role="alert">
                {profileFieldErrors.gender}
              </p>
            ) : null}
          </div>

          <CompactSelect
            id="profile-blood-type"
            label="Blood type"
            variant="blood"
            value={profileValues.bloodType}
            onChange={(v) => onProfileFieldChange("bloodType", v)}
            disabled={isPending}
            options={[
              { value: "a+", label: "A+" },
              { value: "a-", label: "A-" },
              { value: "b+", label: "B+" },
              { value: "b-", label: "B-" },
              { value: "ab+", label: "AB+" },
              { value: "ab-", label: "AB-" },
              { value: "o+", label: "O+" },
              { value: "o-", label: "O-" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-address">Address</Label>
          <Input
            id="profile-address"
            placeholder="Enter your full address"
            value={profileValues.address}
            onChange={(e) => onProfileFieldChange("address", e.target.value)}
            disabled={isPending}
            className="h-11 rounded-lg border-zinc-200 dark:border-zinc-700"
          />
        </div>
      </FormCardSection>

      <FormCardSection icon={<Heart className="text-zinc-600" aria-hidden />} title="Body measurements">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="profile-height">Height (cm)</Label>
              <IconInputShell icon={<Ruler aria-hidden="true" />}>
                <Input
                  id="profile-height"
                  type="number"
                  min="0"
                  placeholder="cm"
                  value={profileValues.heightCm}
                  onChange={(e) => onProfileFieldChange("heightCm", e.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-lg border-zinc-200 pl-9 dark:border-zinc-700"
                />
              </IconInputShell>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-weight">Weight (kg)</Label>
              <IconInputShell icon={<Scale aria-hidden="true" />}>
                <Input
                  id="profile-weight"
                  type="number"
                  min="0"
                  placeholder="kg"
                  value={profileValues.weightKg}
                  onChange={(e) => onProfileFieldChange("weightKg", e.target.value)}
                  disabled={isPending}
                  className="h-11 rounded-lg border-zinc-200 pl-9 dark:border-zinc-700"
                />
              </IconInputShell>
            </div>
          </div>

          <div className={cn("flex flex-col justify-center rounded-xl border p-4 lg:min-h-[8.5rem]", bmiStyles)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">BMI</p>
                <div className="mt-2 h-px w-10 max-w-full bg-current opacity-40" aria-hidden />
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{bmi ? bmi.toFixed(1) : "—"}</p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    bmiCategory
                      ? "opacity-90"
                      : "font-medium text-amber-900/90 dark:text-amber-200/90"
                  )}
                >
                  {bmiCategory ?? "Enter height & weight"}
                </p>
              </div>
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200"
                aria-hidden
              >
                <HeartPulse className="size-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </FormCardSection>

      <FormCardSection icon={<IdCard className="text-zinc-600" aria-hidden />} title="Personal details">
        <div className="grid gap-4 md:grid-cols-2">
          <CompactSelect
            id="profile-marital-status"
            label="Marital Status"
            value={profileValues.maritalStatus}
            onChange={(v) => onProfileFieldChange("maritalStatus", v)}
            disabled={isPending}
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "divorced", label: "Divorced" },
              { value: "widowed", label: "Widowed" },
            ]}
          />

          <div className="space-y-2">
            <Label htmlFor="profile-occupation">Occupation</Label>
            <Input
              id="profile-occupation"
              placeholder="Your occupation"
              value={profileValues.occupation}
              onChange={(e) => onProfileFieldChange("occupation", e.target.value)}
              disabled={isPending}
              className="h-11 rounded-lg border-zinc-200 dark:border-zinc-700"
            />
          </div>
        </div>
      </FormCardSection>

      <div className="space-y-4">
        <ProfileSection title="Lifestyle habits">
          <ProfileRow icon={<Cigarette aria-hidden="true" />} label="Smoking">
            <RowSelect
              id="profile-smoking"
              value={profileValues.smokingStatus}
              onChange={(v) => onProfileFieldChange("smokingStatus", v)}
              disabled={isPending}
              options={[
                { value: "never", label: "Never" },
                { value: "former", label: "Former" },
                { value: "current", label: "Current" },
              ]}
            />
          </ProfileRow>
          <ProfileRow icon={<Wine aria-hidden="true" />} label="Alcohol consumption">
            <RowSelect
              id="profile-alcohol"
              value={profileValues.alcoholConsumption}
              onChange={(v) => onProfileFieldChange("alcoholConsumption", v)}
              disabled={isPending}
              options={[
                { value: "none", label: "None" },
                { value: "rarely", label: "Rarely" },
                { value: "weekly", label: "Weekly" },
                { value: "daily", label: "Daily" },
              ]}
            />
          </ProfileRow>
          <ProfileRow icon={<Coffee aria-hidden="true" />} label="Caffeine (cups/day)">
            <CaffeineStepper
              value={profileValues.caffeineIntake || "0"}
              onChange={(v) => onProfileFieldChange("caffeineIntake", v)}
              disabled={isPending}
            />
          </ProfileRow>
          <ProfileRow icon={<Smile aria-hidden="true" />} label="Recreational drug use">
            <RowSelect
              id="profile-drugs"
              value={profileValues.recreationalDrugUse}
              onChange={(v) => onProfileFieldChange("recreationalDrugUse", v)}
              disabled={isPending}
              options={[
                { value: "no", label: "No" },
                { value: "sometimes", label: "Sometimes" },
                { value: "yes", label: "Yes" },
              ]}
            />
          </ProfileRow>
        </ProfileSection>

        <ProfileSection title="Exercise details">
          <ProfileRow icon={<Zap aria-hidden="true" />} label="Frequency (times/week)">
            <RowSelect
              id="profile-ex-frequency"
              value={profileValues.exerciseFrequency}
              onChange={(v) => onProfileFieldChange("exerciseFrequency", v)}
              disabled={isPending}
              options={[
                { value: "none", label: "None" },
                { value: "1-2", label: "1–2 times" },
                { value: "3-4", label: "3–4 times" },
                { value: "5+", label: "5+ times" },
              ]}
            />
          </ProfileRow>
          <ProfileRow icon={<Clock aria-hidden="true" />} label="Duration (min/session)">
            <RowSelect
              id="profile-ex-duration"
              value={profileValues.exerciseDuration}
              onChange={(v) => onProfileFieldChange("exerciseDuration", v)}
              disabled={isPending}
              options={[
                { value: "under-30", label: "Less than 30" },
                { value: "30-60", label: "30 – 60" },
                { value: "over-60", label: "More than 60" },
              ]}
            />
          </ProfileRow>
          <div className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center text-zinc-500 dark:text-zinc-400 [&>svg]:size-[1.125rem]">
                  <Flag aria-hidden="true" />
                </div>
                <span className="text-sm font-normal text-zinc-800 dark:text-zinc-200">Type of exercise</span>
              </div>
              <div className="w-full min-w-0 sm:flex-1">
                <ExerciseTypeChips
                  value={profileValues.exerciseType}
                  onChange={(v) => onProfileFieldChange("exerciseType", v)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="General">
          <ProfileRow icon={<UserRound aria-hidden="true" />} label="Physical activity level">
            <RowSelect
              id="profile-activity-level"
              value={profileValues.physicalActivityLevel}
              onChange={(v) => onProfileFieldChange("physicalActivityLevel", v)}
              disabled={isPending}
              options={[
                { value: "low", label: "Low" },
                { value: "moderate", label: "Moderate" },
                { value: "high", label: "High" },
              ]}
            />
          </ProfileRow>
          <ProfileRow icon={<ListOrdered aria-hidden="true" />} label="Dietary habits">
            <RowSelect
              id="profile-dietary"
              value={profileValues.dietaryHabits}
              onChange={(v) => syncDietaryHabits(v, onProfileFieldChange)}
              disabled={isPending}
              options={[
                { value: "balanced", label: "Balanced" },
                { value: "high_salt", label: "Prefer higher salt" },
                { value: "high_fat", label: "Prefer higher fat" },
                { value: "high_both", label: "Higher salt & fat" },
                { value: "other", label: "Other" },
              ]}
            />
          </ProfileRow>
        </ProfileSection>
      </div>

      <ProfileSection title="Stress">
        <ProfileRow icon={<Waves aria-hidden="true" />} label="Stress level">
          <RowSelect
            id="profile-stress"
            value={profileValues.stressLevel}
            onChange={(v) => onProfileFieldChange("stressLevel", v)}
            disabled={isPending}
            options={[
              { value: "low", label: "Low" },
              { value: "moderate", label: "Moderate" },
              { value: "high", label: "High" },
            ]}
          />
        </ProfileRow>
      </ProfileSection>
    </div>
  );
}
