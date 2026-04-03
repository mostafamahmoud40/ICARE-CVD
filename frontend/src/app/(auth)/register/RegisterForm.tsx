"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  InfoIcon,
  Lock,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRegister } from "./useRegister";

export function RegisterForm() {
  const { submit, fieldErrors, isPending, isSuccess, successMessage, serverErrorMessage } =
    useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ fullName, email, phoneNumber, password, confirmPassword });
  }

  return (
    <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300">
          <Heart className="size-8 fill-current" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            Start your journey to better heart health
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-8 pt-5">
          <div className="space-y-2">
            <Label htmlFor="register-full-name" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="register-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? "register-full-name-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {fieldErrors.fullName ? (
              <p id="register-full-name-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.fullName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {fieldErrors.email ? (
              <p id="register-email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="register-phone-number"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="register-phone-number"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1 234 567 890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                aria-invalid={Boolean(fieldErrors.phoneNumber)}
                aria-describedby={fieldErrors.phoneNumber ? "register-phone-number-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {fieldErrors.phoneNumber ? (
              <p id="register-phone-number-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.phoneNumber}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 pr-10 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {fieldErrors.password ? (
              <p id="register-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Must be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="register-confirm-password"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? "register-confirm-password-error" : undefined
                }
                disabled={isPending}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-9 pr-10 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={isPending}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p id="register-confirm-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {isSuccess ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4" />
              <AlertTitle>Account created</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {serverErrorMessage ? (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-200"
            >
              <InfoIcon className="mt-0.5 size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="h-12 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-none hover:bg-teal-600 focus-visible:ring-teal-400/40 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {isPending ? "Creating..." : "Continue"}
            {!isPending ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
          </Button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-teal-700 underline underline-offset-4 transition-colors hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </form>
    </Card>
  );
}
