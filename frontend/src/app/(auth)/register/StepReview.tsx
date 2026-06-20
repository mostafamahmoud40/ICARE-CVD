"use client";

import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RegistrationAnalysisCard } from "./RegistrationAnalysisCard";
import type { RegisterDocumentsValues, RegisterProfileValues, RegisterValues } from "./register.types";
import type { StepValuesMap } from "./useRegisterSteps";

type StepReviewProps = {
  accountValues: RegisterValues;
  profileValues: RegisterProfileValues;
  documentsValues: RegisterDocumentsValues;
  allValues: StepValuesMap;
  analysis?: string;
  isAnalysisLoading: boolean;
  isAnalysisFetching: boolean;
  isAnalysisError: boolean;
  canRefreshAnalysis: boolean;
  onRefreshAnalysis: () => void;
};

export function StepReview({
  accountValues,
  profileValues,
  documentsValues,
  allValues,
  analysis,
  isAnalysisLoading,
  isAnalysisFetching,
  isAnalysisError,
  canRefreshAnalysis,
  onRefreshAnalysis,
}: StepReviewProps) {
  const docs = documentsValues ?? { files: [], notes: "" };
  const fileCount = Array.isArray(docs.files) ? docs.files.length : 0;

  const reviewPayload = {
    account: {
      fullName: accountValues.fullName,
      email: accountValues.email,
      phoneNumber: accountValues.phoneNumber,
      password: "••••••••",
      confirmPassword: "••••••••",
    },
    profile: allValues.profile,
    documents: allValues.documents,
  };

  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5 text-foreground dark:border-primary/40 dark:bg-primary/10">
        <CheckCircle2 className="mt-0.5 size-4" />
        <AlertTitle>Review your details</AlertTitle>
        <AlertDescription>
          Read-only summary of your answers. Go back to any step to make changes before you submit.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-card/80 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Account</p>
          <p className="text-sm text-muted-foreground">Name: {accountValues.fullName || "—"}</p>
          <p className="text-sm text-muted-foreground">Email: {accountValues.email || "—"}</p>
          <p className="text-sm text-muted-foreground">Phone: {accountValues.phoneNumber || "—"}</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/80 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Profile</p>
          <p className="text-sm text-muted-foreground">DOB: {profileValues.dateOfBirth || "—"}</p>
          <p className="text-sm text-muted-foreground">Sex: {profileValues.gender || "—"}</p>
          <p className="text-sm text-muted-foreground">Blood type: {profileValues.bloodType || "—"}</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/80 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Documents</p>
          <p className="text-sm text-muted-foreground">Files attached: {fileCount}</p>
          <p className="text-sm text-muted-foreground">
            Notes: {docs.notes?.trim() ? "Provided" : "—"}
          </p>
        </div>
      </div>

      <RegistrationAnalysisCard
        analysis={analysis}
        isLoading={isAnalysisLoading}
        isFetching={isAnalysisFetching}
        isError={isAnalysisError}
        canRefresh={canRefreshAnalysis}
        onRefresh={onRefreshAnalysis}
      />

      <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Full registration payload (read-only)</p>
        <pre className="max-h-[min(28rem,55vh)] overflow-auto rounded-lg border border-border bg-card p-3 text-left text-[11px] leading-relaxed text-foreground">
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
