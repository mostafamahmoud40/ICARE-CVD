"use client";

import { useState } from "react";

import {
  CalendarDays,
  Cigarette,
  Clock,
  Coffee,
  Flag,
  Heart,
  HeartPulse,
  IdCard,
  ListOrdered,
  Ruler,
  Scale,
  Smile,
  UserRound,
  Waves,
  Wine,
  Zap,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RegisterProfileValues } from "./register.types";
import {
  ageInYearsFromIsoDate,
  CaffeineStepper,
  CompactSelect,
  ExerciseTypeChips,
  FormCardSection,
  IconInputShell,
  ProfileRow,
  ProfileSection,
  RowSelect,
  syncDietaryHabits,
} from "./profileUi";

type Step2ProfileProps = {
  profileValues: RegisterProfileValues;
  profileFieldErrors: Partial<Record<keyof RegisterProfileValues, string>>;
  onFieldChange: <K extends keyof RegisterProfileValues>(field: K, value: RegisterProfileValues[K]) => void;
  isPending: boolean;
};

export function Step2Profile({ profileValues, profileFieldErrors, onFieldChange, isPending }: Step2ProfileProps) {
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
            <DateOfBirthPicker
              value={profileValues.dateOfBirth}
              onChange={(date) => onFieldChange("dateOfBirth", date)}
              disabled={isPending}
              error={Boolean(profileFieldErrors.dateOfBirth)}
            />
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
              onChange={(e) => onFieldChange("nationalId", e.target.value)}
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
              onChange={(v) => onFieldChange("gender", v)}
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
            onChange={(v) => onFieldChange("bloodType", v)}
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
            onChange={(e) => onFieldChange("address", e.target.value)}
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
                  onChange={(e) => onFieldChange("heightCm", e.target.value)}
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
                  onChange={(e) => onFieldChange("weightKg", e.target.value)}
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
            onChange={(v) => onFieldChange("maritalStatus", v)}
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
              onChange={(e) => onFieldChange("occupation", e.target.value)}
              disabled={isPending}
              className="h-11 rounded-lg border-zinc-200 dark:border-zinc-700"
            />
          </div>
        </div>
      </FormCardSection>

      <div className="space-y-4">
        <ProfileSection title="Lifestyle habits">
          <ProfileRow icon={<Cigarette aria-hidden="true" />} label="Smoking">
            <div className="w-full">
              <RowSelect
                id="profile-smoking"
                value={profileValues.smokingStatus}
                onChange={(v) => onFieldChange("smokingStatus", v)}
                disabled={isPending}
                options={[
                  { value: "never", label: "Never" },
                  { value: "former-5", label: "Former - 5 pack-years" },
                  { value: "former-10", label: "Former - 10 pack-years" },
                  { value: "former-15", label: "Former - 15 pack-years" },
                  { value: "former-20", label: "Former - 20+ pack-years" },
                  { value: "current-5", label: "Current - 5 pack-years" },
                  { value: "current-10", label: "Current - 10 pack-years" },
                  { value: "current-15", label: "Current - 15 pack-years" },
                  { value: "current-20", label: "Current - 20+ pack-years" },
                ]}
              />
            </div>
          </ProfileRow>
          <ProfileRow icon={<Wine aria-hidden="true" />} label="Alcohol consumption">
            <RowSelect
              id="profile-alcohol"
              value={profileValues.alcoholConsumption}
              onChange={(v) => onFieldChange("alcoholConsumption", v)}
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
              onChange={(v) => onFieldChange("caffeineIntake", v)}
              disabled={isPending}
            />
          </ProfileRow>
          <ProfileRow icon={<Smile aria-hidden="true" />} label="Recreational drug use">
            <RowSelect
              id="profile-drugs"
              value={profileValues.recreationalDrugUse}
              onChange={(v) => onFieldChange("recreationalDrugUse", v)}
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
              onChange={(v) => onFieldChange("exerciseFrequency", v)}
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
              onChange={(v) => onFieldChange("exerciseDuration", v)}
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
                  onChange={(v) => onFieldChange("exerciseType", v)}
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
              onChange={(v) => onFieldChange("physicalActivityLevel", v)}
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
              onChange={(v) => syncDietaryHabits(v, onFieldChange)}
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
            onChange={(v) => onFieldChange("stressLevel", v)}
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

import { format, parseISO } from "date-fns";

type DateOfBirthPickerProps = {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  error?: boolean;
};

function DateOfBirthPicker({ value, onChange, disabled, error }: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false);

  const date = value ? parseISO(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 px-3",
            !value && "text-muted-foreground",
            error && "border-destructive",
            "border-zinc-200 dark:border-zinc-700"
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? format(parseISO(value), "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  );
}
