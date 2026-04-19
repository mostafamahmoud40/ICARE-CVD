"use client";

import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useRegisterStore } from "./useRegisterStore";

export function RegisterTestingActions() {
  const step = useRegisterStore((state) => state.step);
  const isPending = useRegisterStore((state) => state.isPending);
  const fillTestingData = useRegisterStore((state) => state.fillTestingData);

  if (step !== 2 && step !== 3) return null;

  function handleFillTestingData() {
    fillTestingData();
    toast.success("Test data filled", {
      description: "Profile and medical fields were filled for this test run.",
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-left">
          <p className="text-sm font-semibold text-foreground">Testing shortcut</p>
          <p className="text-sm text-muted-foreground">
            One click fills profile and medical test values. Refreshing the page clears them again.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleFillTestingData}
          disabled={isPending}
          className="h-10 rounded-xl px-4 text-sm font-semibold sm:shrink-0"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          Fill Test Data
        </Button>
      </div>
    </div>
  );
}
