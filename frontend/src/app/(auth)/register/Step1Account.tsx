"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, Lock, Mail, Phone, RefreshCw, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { RegisterValues } from "./register.types";

type Step1AccountProps = {
  values: RegisterValues;
  errors: Partial<Record<keyof RegisterValues, string>>;
  isPending: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onFieldChange: <K extends keyof RegisterValues>(field: K, value: RegisterValues[K]) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
};

export function Step1Account({
  values,
  errors,
  isPending,
  showPassword,
  showConfirmPassword,
  onFieldChange,
  onTogglePassword,
  onToggleConfirmPassword,
}: Step1AccountProps) {
  const [generatedPassword, setGeneratedPassword] = useState("");

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    onFieldChange("password", password);
    onFieldChange("confirmPassword", password);
  }

  async function copyPassword() {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
    }
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="register-full-name" className="text-sm font-medium text-foreground">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="register-full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={values.fullName}
            onChange={(e) => onFieldChange("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
            disabled={isPending}
            className="h-12 rounded-xl border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        {errors.fullName ? (
          <p id="register-full-name-error" className="text-sm text-destructive" role="alert">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-sm font-medium text-foreground">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            list="register-email-suggestions"
            placeholder="your@email.com"
            value={values.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            disabled={isPending}
            className="h-12 rounded-xl border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
          />
          <datalist id="register-email-suggestions">
            <option value="patient1@test.com" />
          </datalist>
        </div>
        {errors.email ? (
          <p id="register-email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-phone-number" className="text-sm font-medium text-foreground">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="register-phone-number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            list="register-phone-suggestions"
            placeholder="+1 234 567 890"
            value={values.phoneNumber}
            onChange={(e) => onFieldChange("phoneNumber", e.target.value)}
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? "register-phone-number-error" : undefined}
            disabled={isPending}
            className="h-12 rounded-xl border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
          />
          <datalist id="register-phone-suggestions">
            <option value="+20 123 456 7890" />
          </datalist>
        </div>
        {errors.phoneNumber ? (
          <p id="register-phone-number-error" className="text-sm text-destructive" role="alert">
            {errors.phoneNumber}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Password <span className="text-red-500">*</span>
            {generatedPassword && (
              <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
                ({generatedPassword})
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-4 w-4 p-0 hover:bg-muted"
                  onClick={copyPassword}
                  disabled={isPending}
                  title="Copy password"
                >
                  <Copy className="size-3" />
                </Button>
              </span>
            )}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={generatePassword}
            disabled={isPending}
          >
            <RefreshCw className="mr-1 size-3" />
            Generate
          </Button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={values.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            disabled={isPending}
            className="h-12 rounded-xl border-input bg-background pl-9 pr-10 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={onTogglePassword}
            disabled={isPending}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {errors.password ? (
          <p id="register-password-error" className="text-sm text-destructive" role="alert">
            {errors.password}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Must be at least 8 characters</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password" className="text-sm font-medium text-foreground">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={values.confirmPassword}
            onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-password-error" : undefined
            }
            disabled={isPending}
            className="h-12 rounded-xl border-input bg-background pl-9 pr-10 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={onToggleConfirmPassword}
            disabled={isPending}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {errors.confirmPassword ? (
          <p id="register-confirm-password-error" className="text-sm text-destructive" role="alert">
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>
    </div>
  );
}
