"use client";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CHIEF_COMPLAINT_LABELS } from "./MedicalHpiBlocks";
import type { RegisterDocumentsValues, RegisterMedicalValues, RegisterProfileValues, RegisterValues } from "./register.types";
import type { StepValuesMap } from "./useRegisterSteps";
import { useRegistrationAnalysis } from "./useRegistrationAnalysis";

type StepReviewProps = {
  accountValues: RegisterValues;
  profileValues: RegisterProfileValues;
  medicalValues: RegisterMedicalValues;
  documentsValues: RegisterDocumentsValues;
  allValues: StepValuesMap;
};

export function StepReview({ accountValues, profileValues, medicalValues, documentsValues, allValues }: StepReviewProps) {
  const med = (medicalValues ?? {}) as Record<string, unknown>;
  const docs = (documentsValues ?? { files: [], notes: "" }) as RegisterDocumentsValues;
  const fileCount = Array.isArray(docs.files) ? docs.files.length : 0;

  const cc = String(med.chiefComplaint ?? "");
  const chiefLabel = CHIEF_COMPLAINT_LABELS[cc] ?? (cc || "—");

  const reviewPayload = {
    account: {
      fullName: accountValues.fullName,
      email: accountValues.email,
      phoneNumber: accountValues.phoneNumber,
      password: "••••••••",
      confirmPassword: "••••••••",
    },
    profile: allValues.profile,
    medical: allValues.medical,
    documents: allValues.documents,
  };
  const analysisQuery = useRegistrationAnalysis({
    accountValues,
    profileValues,
    medicalValues,
  });

  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5 text-foreground dark:border-primary/40 dark:bg-primary/10">
        <CheckCircle2 className="mt-0.5 size-4" />
        <AlertTitle>Review your details</AlertTitle>
        <AlertDescription>
          Read-only summary of your answers. Go back to any step to make changes before you submit.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <p className="mb-2 text-sm font-semibold text-foreground">Medical</p>
          <p className="text-sm text-muted-foreground">Chief complaint: {chiefLabel}</p>
          <p className="text-sm text-muted-foreground">
            Cardiac history: {med.noCardiacHistory ? "None reported" : "Details provided"}
          </p>
          <p className="text-sm text-muted-foreground">
            Non-cardiac history: {med.noNonCardiacHistory ? "None reported" : "Details provided"}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/80 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Documents</p>
          <p className="text-sm text-muted-foreground">Files attached: {fileCount}</p>
          <p className="text-sm text-muted-foreground">
            Notes: {docs.notes?.trim() ? "Provided" : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">AI registration analysis</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              void analysisQuery.refetch();
            }}
            disabled={analysisQuery.isFetching}
          >
            <RefreshCw className={`mr-1 size-3.5 ${analysisQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {analysisQuery.isLoading ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Generating clinical note from your registration data...
            </div>
          </div>
        ) : null}

        {analysisQuery.isError ? (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="mt-0.5 size-4" />
            <AlertTitle>AI unavailable</AlertTitle>
            <AlertDescription>The local AI model is not available right now. Please ensure Ollama is running and try again.</AlertDescription>
          </Alert>
        ) : null}

        {analysisQuery.data?.analysis ? (
          <pre className="max-h-[min(28rem,55vh)] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-left text-[12px] leading-relaxed text-foreground">
            {analysisQuery.data.analysis}
          </pre>
        ) : null}
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Full registration payload (read-only)</p>
        <pre className="max-h-[min(28rem,55vh)] overflow-auto rounded-lg border border-border bg-card p-3 text-left text-[11px] leading-relaxed text-foreground">
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
