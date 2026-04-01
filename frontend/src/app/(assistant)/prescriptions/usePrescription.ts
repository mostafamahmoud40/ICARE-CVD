"use client";

import { useState } from "react";
import type { PrescriptionFormValues } from "./prescription.types";

const initialState: PrescriptionFormValues = {
  patientId: "",
  medication: "",
  dosage: "",
};

export function usePrescription() {
  const [values, setValues] = useState<PrescriptionFormValues>(initialState);

  const onChange = (field: keyof PrescriptionFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = () => {
    // TODO: connect to backend prescription endpoint.
    return values;
  };

  return { values, onChange, onSubmit };
}
