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
          className="h-12 w-full rounded-xl border-primary/30 bg-transparent text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:hover:bg-primary/15 sm:w-auto sm:min-w-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
      ) : (
        <div className="hidden sm:block sm:min-w-40" aria-hidden="true" />
      )}

      <Button
        type="button"
        variant="default"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={isPending}
        size="lg"
        className="h-12 w-full rounded-xl text-sm font-semibold shadow-none focus-visible:ring-primary/40 sm:w-auto sm:min-w-56"
      >
        {isLastStep ? (isPending ? "Creating..." : "Create account") : "Continue"}
        {!isPending ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
      </Button>
    </div>
  );
}
