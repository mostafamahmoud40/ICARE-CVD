"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "./_components/register-form";
import { useRegisterFlow } from "./register-flow-provider";
import {
  getNextRegisterStep,
  getPreviousRegisterStep,
  getRegisterStepPath,
  registerStepFields,
  type RegisterStepId,
} from "./register-steps";

export type RegisterViewProps = {
  step: RegisterStepId;
};

export function RegisterView({ step }: RegisterViewProps) {
  const router = useRouter();
  const {
    credentials,
    fieldErrors,
    formError,
    isPending,
    setField,
    validateStep,
    submit,
  } = useRegisterFlow();
  const nextStep = getNextRegisterStep(step);
  const previousStep = getPreviousRegisterStep(step);

  const handleSubmit = async () => {
    if (nextStep) {
      if (validateStep(registerStepFields[step])) {
        router.push(getRegisterStepPath(nextStep));
      }
      return;
    }

    await submit({
      onSuccess: () => router.push("/auth/login"),
    });
  };

  return (
    <RegisterForm
      step={step}
      credentials={credentials}
      fieldErrors={fieldErrors}
      formError={formError}
      isPending={isPending}
      onFieldChange={setField}
      onBack={
        previousStep
          ? () => router.push(getRegisterStepPath(previousStep))
          : undefined
      }
      onSubmit={handleSubmit}
    />
  );
}
