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
    <div className="rounded-2xl border border-dashed border-[#A8C4BC]/60 bg-[#F9F8F5] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-left">
          <p className="text-sm font-bold text-[#1A5345]">Testing shortcut</p>
          <p className="text-sm text-[#6B7870]">
            One click fills profile and medical test values. Refreshing the page clears them again.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleFillTestingData}
          disabled={isPending}
          className="h-10 shrink-0 rounded-xl border-[#E8E6E0] bg-white px-4 text-sm font-semibold text-[#1A5345] hover:bg-[#F4F3ED]"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          Fill test data
        </Button>
      </div>
    </div>
  );
}
