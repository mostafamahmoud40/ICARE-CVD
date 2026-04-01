"use client";

import { useState } from "react";
import type { RegistrationFormValues } from "./registration.types";

const initialState: RegistrationFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function useRegistration() {
  const [values, setValues] = useState<RegistrationFormValues>(initialState);

  const onChange = (field: keyof RegistrationFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = () => {
    // TODO: connect to backend register endpoint.
    return values;
  };

  return { values, onChange, onSubmit };
}
