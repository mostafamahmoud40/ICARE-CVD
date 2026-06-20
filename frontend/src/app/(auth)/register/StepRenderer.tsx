"use client";

import { Step1Account } from "./Step1Account";
import { Step2Profile } from "./Step2Profile";
import { StepReview } from "./StepReview";
import { StepDocumentsUpload } from "./StepDocumentsUpload";
import { StepVerifyEmail } from "./StepVerifyEmail";
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
  const formValues = useRegisterStore((s) => s.formValues);
  const accountFieldErrors = useRegisterStore((s) => s.accountFieldErrors);
  const stepFieldErrors = useRegisterStore((s) => s.stepFieldErrors);
  const profileFieldErrors = useRegisterStore((s) => s.profileFieldErrors);
  const isPending = useRegisterStore((s) => s.isPending);
  const showPassword = useRegisterStore((s) => s.showPassword);
  const showConfirmPassword = useRegisterStore((s) => s.showConfirmPassword);

  const setAccountField = useRegisterStore((s) => s.setAccountField);
  const setProfileField = useRegisterStore((s) => s.setProfileField);
  const setDocumentsField = useRegisterStore((s) => s.setDocumentsField);
  const toggleShowPassword = useRegisterStore((s) => s.toggleShowPassword);
  const toggleShowConfirmPassword = useRegisterStore((s) => s.toggleShowConfirmPassword);

  const pendingVerificationEmail = useRegisterStore((s) => s.pendingVerificationEmail);

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
    const email =
      pendingVerificationEmail?.trim() || formValues.account.email.trim();
    return <StepVerifyEmail email={email} isPending={isPending} />;
  }

  if (step === 3) {
    return (
      <Step2Profile
        profileValues={formValues.profile}
        profileFieldErrors={profileFieldErrors}
        onFieldChange={setProfileField}
        isPending={isPending}
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
