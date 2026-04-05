"use client";

import Link from "next/link";
import { CheckCircle2, Heart, HeartPulse, InfoIcon, Sparkles, Stethoscope, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { StepNavigation } from "./StepNavigation";
import { StepRenderer } from "./StepRenderer";
import { RegisterProvider, useRegisterContext } from "./register.context";

function RegisterFormContent() {
  const { step, isSuccess, successMessage, serverErrorMessage, goToStep } = useRegisterContext();
  const StepIcon =
    step === 1
      ? Heart
      : step === 2
        ? Stethoscope
        : step === 3
          ? HeartPulse
          : step === 4
            ? Upload
            : Sparkles;
  const title =
    step === 1
      ? "Create Your Account"
      : step === 2
        ? "Complete Your Health Profile"
        : step === 3
          ? "Medical History"
          : step === 4
            ? "Document & Lab Upload"
            : "Final Review";
  const description =
    step === 1
      ? "Start your journey to better heart health"
      : step === 2
        ? "Help us provide personalized cardiac care"
        : step === 3
          ? "Share your medical background for safer and smarter care"
          : step === 4
            ? "Add lab reports, imaging, ECG files, prescriptions, or any additional files"
            : "Review your information before creating your account";

  return (
    <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-600/10 text-teal-700 dark:text-teal-300">
          <StepIcon className="size-8" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</CardTitle>
          <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">{description}</CardDescription>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Step {step} of 5
        </p>

        {/* Step Indicator - Fast Navigation */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { num: 1, label: "Account" },
            { num: 2, label: "Profile" },
            { num: 3, label: "Medical" },
            { num: 4, label: "Documents" },
            { num: 5, label: "Review" },
          ].map(({ num, label }) => (
            <button
              key={num}
              type="button"
              onClick={() => goToStep(num)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                step === num
                  ? "bg-teal-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              )}
            >
              {num}. {label}
            </button>
          ))}
        </div>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        noValidate
      >
        <CardContent className="space-y-5 px-8 pb-8 pt-5">
          <StepRenderer />

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

          <StepNavigation />

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

export function RegisterForm() {
  return (
    <RegisterProvider>
      <RegisterFormContent />
    </RegisterProvider>
  );
}
