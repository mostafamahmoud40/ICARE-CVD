"use client";

import { Step1Account } from "./Step1Account";
import { Step2Profile } from "./Step2Profile";
import { Step3Something } from "./Step3Something";
import { Step4MedicalHistory } from "./Step4MedicalHistory";
import { StepDocumentsUpload } from "./StepDocumentsUpload";
import { useRegisterContext } from "./register.context";

export function StepRenderer() {
  const { step } = useRegisterContext();
  if (step === 1) {
    return <Step1Account />;
  }

  if (step === 2) {
    return <Step2Profile />;
  }

  if (step === 3) {
    return <Step4MedicalHistory />;
  }

  if (step === 4) {
    return <StepDocumentsUpload />;
  }

  return <Step3Something />;
}
