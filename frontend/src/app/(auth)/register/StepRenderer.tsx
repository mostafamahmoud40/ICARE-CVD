"use client";

import { Step1Account } from "./Step1Account";
import { Step2Profile } from "./Step2Profile";
import { StepReview } from "./StepReview";
import { Step4MedicalHistory } from "./Step4MedicalHistory";
import { StepDocumentsUpload } from "./StepDocumentsUpload";
import { useRegisterStore } from "./useRegisterStore";

type StepRendererProps = {
  step: number;
  analysis?: string;
  isAnalysisLoading: boolean;
  isAnalysisFetching: boolean;
  isAnalysisError: boolean;
  canRefreshAnalysis: boolean;
  onRefreshAnalysis: () => void;
};

export function StepRenderer({ step, analysis, isAnalysisLoading, isAnalysisFetching, isAnalysisError, canRefreshAnalysis, onRefreshAnalysis }: StepRendererProps) {
  /* ── individual scalar selectors (SSR-safe) ── */
  const formValues = useRegisterStore((s) => s.formValues);
  const accountFieldErrors = useRegisterStore((s) => s.accountFieldErrors);
  const stepFieldErrors = useRegisterStore((s) => s.stepFieldErrors);
  const profileFieldErrors = useRegisterStore((s) => s.profileFieldErrors);
  const medicalStepErrors = useRegisterStore((s) => s.medicalStepErrors);
  const isPending = useRegisterStore((s) => s.isPending);
  const showPassword = useRegisterStore((s) => s.showPassword);
  const showConfirmPassword = useRegisterStore((s) => s.showConfirmPassword);

  const setAccountField = useRegisterStore((s) => s.setAccountField);
  const setProfileField = useRegisterStore((s) => s.setProfileField);
  const setMedicalField = useRegisterStore((s) => s.setMedicalField);
  const setDocumentsField = useRegisterStore((s) => s.setDocumentsField);
  const toggleShowPassword = useRegisterStore((s) => s.toggleShowPassword);
  const toggleShowConfirmPassword = useRegisterStore((s) => s.toggleShowConfirmPassword);
  const nextStep = useRegisterStore((s) => s.nextStep);
  const previousStep = useRegisterStore((s) => s.previousStep);

  if (step === 1) {
    return (
      <Step1Account
        values={formValues.account}
        errors={{ ...accountFieldErrors, ...stepFieldErrors }}
        isPending={isPending}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onFieldChange={setAccountField}
        onTogglePassword={toggleShowPassword}
        onToggleConfirmPassword={toggleShowConfirmPassword}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2Profile
        profileValues={formValues.profile}
        profileFieldErrors={profileFieldErrors}
        onFieldChange={setProfileField}
        isPending={isPending}
      />
    );
  }

  if (step === 3) {
    return (
      <Step4MedicalHistory
        medicalValues={formValues.medical}
        medicalStepErrors={medicalStepErrors}
        onFieldChange={setMedicalField}
        onPrevious={previousStep}
        onNext={nextStep}
      />
    );
  }

  if (step === 4) {
    return (
      <StepDocumentsUpload
        documentsValues={formValues.documents}
        onFieldChange={setDocumentsField}
        isPending={isPending}
      />
    );
  }

  return (
    <StepReview
      accountValues={formValues.account}
      profileValues={formValues.profile}
      medicalValues={formValues.medical}
      documentsValues={formValues.documents}
      allValues={formValues}
      analysis={analysis}
      isAnalysisLoading={isAnalysisLoading}
      isAnalysisFetching={isAnalysisFetching}
      isAnalysisError={isAnalysisError}
      canRefreshAnalysis={canRefreshAnalysis}
      onRefreshAnalysis={onRefreshAnalysis}
    />
  );
}
