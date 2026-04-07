"use client";

import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CHIEF_COMPLAINT_LABELS } from "./MedicalHpiBlocks";
import type { RegisterDocumentsValues, RegisterMedicalValues, RegisterProfileValues, RegisterValues } from "./register.types";
import type { StepValuesMap } from "./useRegisterSteps";

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

  return (
    <div className="space-y-4">
      <Alert className="border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/60 dark:bg-teal-950/40 dark:text-teal-200">
        <CheckCircle2 className="mt-0.5 size-4" />
        <AlertTitle>Review your details</AlertTitle>
        <AlertDescription>
          Read-only summary of your answers. Go back to any step to make changes before you submit.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Account</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Name: {accountValues.fullName || "—"}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Email: {accountValues.email || "—"}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone: {accountValues.phoneNumber || "—"}</p>
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Profile</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">DOB: {profileValues.dateOfBirth || "—"}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Sex: {profileValues.gender || "—"}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Blood type: {profileValues.bloodType || "—"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Medical</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Chief complaint: {chiefLabel}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cardiac history: {med.noCardiacHistory ? "None reported" : "Details provided"}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Non-cardiac history: {med.noNonCardiacHistory ? "None reported" : "Details provided"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Files attached: {fileCount}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Notes: {docs.notes?.trim() ? "Provided" : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
        <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Full registration payload (read-only)</p>
        <pre className="max-h-[min(28rem,55vh)] overflow-auto rounded-lg border border-zinc-200 bg-white p-3 text-left text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
