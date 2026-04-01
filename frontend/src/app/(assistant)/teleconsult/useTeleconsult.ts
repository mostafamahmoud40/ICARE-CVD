"use client";

import { useState } from "react";
import type { TeleconsultFormValues } from "./teleconsult.types";

const initialState: TeleconsultFormValues = {
  patientId: "",
  roomTopic: "",
};

export function useTeleconsult() {
  const [values, setValues] = useState<TeleconsultFormValues>(initialState);

  const onChange = (field: keyof TeleconsultFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = () => {
    // TODO: connect to backend teleconsult endpoint.
    return values;
  };

  return { values, onChange, onSubmit };
}
