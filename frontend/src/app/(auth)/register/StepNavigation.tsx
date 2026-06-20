"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type StepNavigationProps = {
  step: number;
  isPending: boolean;
  isAnalysisPending?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
};

export function StepNavigation({ step, isPending, isAnalysisPending, onNext, onPrevious, onSubmit }: StepNavigationProps) {
  if (step === 2) return null;

  const isLastStep = step === 5;
  const canGoBack = step > 1;
  const busy = isPending || (isAnalysisPending ?? false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {canGoBack ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending || (isAnalysisPending ?? false)}
          onClick={onPrevious}
          className="h-12 w-full rounded-xl border border-[#E8E6E0] bg-white text-sm font-semibold text-[#1A5345] hover:bg-[#F9F8F5] sm:w-auto sm:min-w-40"
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
        disabled={busy}
        size="lg"
        className="h-12 w-full rounded-xl bg-[#1A5345] text-sm font-semibold text-white shadow-sm hover:bg-[#154434] focus-visible:ring-[#1A5345]/40 sm:w-auto sm:min-w-56"
      >
        {isLastStep
          ? busy
            ? isPending
              ? "Creating..."
              : "Generating AI summary..."
              : "Create account"
          : "Continue"}
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
