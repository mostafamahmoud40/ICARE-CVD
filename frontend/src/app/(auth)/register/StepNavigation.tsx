"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type StepNavigationProps = {
  step: number;
  isPending: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
};

export function StepNavigation({ step, isPending, onNext, onPrevious, onSubmit }: StepNavigationProps) {
  if (step === 3) return null;
  const isLastStep = step === 5;
  const canGoBack = step > 1;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {canGoBack ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          onClick={onPrevious}
          className="h-12 w-full rounded-xl border-teal-200 bg-transparent text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950 dark:hover:text-teal-200 sm:w-auto sm:min-w-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
      ) : (
        <div className="hidden sm:block sm:min-w-40" aria-hidden="true" />
      )}

      <Button
        type="button"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={isPending}
        size="lg"
        className="h-12 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-none hover:bg-teal-600 focus-visible:ring-teal-400/40 dark:bg-teal-600 dark:hover:bg-teal-500 sm:w-auto sm:min-w-56"
      >
        {isLastStep ? (isPending ? "Creating..." : "Create account") : "Continue"}
        {!isPending ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
      </Button>
    </div>
  );
}
