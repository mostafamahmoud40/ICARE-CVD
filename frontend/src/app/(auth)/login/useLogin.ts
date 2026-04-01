"use client";

import { useState } from "react";
import type { LoginFormValues } from "./login.types";

const initialState: LoginFormValues = {
  email: "",
  password: "",
};

export function useLogin() {
  const [values, setValues] = useState<LoginFormValues>(initialState);

  const onChange = (field: keyof LoginFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = () => {
    // TODO: connect to backend auth endpoint.
    return values;
  };

  return { values, onChange, onSubmit };
}
