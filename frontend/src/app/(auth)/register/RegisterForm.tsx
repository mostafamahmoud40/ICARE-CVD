"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Heart, HeartPulse, Sparkles, Stethoscope, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { StepNavigation } from "./StepNavigation";
import { RegisterTestingActions } from "./RegisterTestingActions";
import { StepRenderer } from "./StepRenderer";
import { useRegisterStore } from "./useRegisterStore";

const STEP_BY_KEY = {
  account: 1,
  profile: 2,
  medical: 3,
  documents: 4,
  review: 5,
} as const;

const KEY_BY_STEP: Record<number, keyof typeof STEP_BY_KEY> = {
  1: "account",
  2: "profile",
  3: "medical",
  4: "documents",
  5: "review",
};

export function RegisterForm() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── individual scalar selectors (SSR-safe — each returns a stable ref) ── */
  const step = useRegisterStore((s) => s.step);
  const isSuccess = useRegisterStore((s) => s.isSuccess);
  const successMessage = useRegisterStore((s) => s.successMessage);
  const serverErrorMessage = useRegisterStore((s) => s.serverErrorMessage);
  const goToStep = useRegisterStore((s) => s.goToStep);
  const isPending = useRegisterStore((s) => s.isPending);
  const onNext = useRegisterStore((s) => s.nextStep);
  const onPrevious = useRegisterStore((s) => s.previousStep);
  const onSubmit = useRegisterStore((s) => s.submitForm);

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

  useEffect(() => {
    const stepFromQuery = searchParams.get("step");
    if (!stepFromQuery) return;
    if (!(stepFromQuery in STEP_BY_KEY)) return;

    const targetStep = STEP_BY_KEY[stepFromQuery as keyof typeof STEP_BY_KEY];
    if (targetStep !== step) {
      goToStep(targetStep);
    }
  }, [goToStep, searchParams, step]);

  useEffect(() => {
    const stepKey = KEY_BY_STEP[step] ?? "account";
    const expectedPath = `/auth/register/${stepKey}`;
    if (pathname !== expectedPath) {
      router.replace(expectedPath);
    }
  }, [pathname, router, step]);

  return (
    <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <StepIcon className="size-8" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
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
          <RegisterTestingActions />

          <StepRenderer step={step} />

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
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{serverErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <StepNavigation
            step={step}
            isPending={isPending}
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={onSubmit}
          />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/90"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </form>
    </Card>
  );
}
