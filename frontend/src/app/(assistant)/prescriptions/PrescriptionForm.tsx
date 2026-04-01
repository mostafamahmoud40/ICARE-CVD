"use client";

import { FormEvent } from "react";
import { usePrescription } from "./usePrescription";

export function PrescriptionForm() {
  const { values, onChange, onSubmit } = usePrescription();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        placeholder="Patient ID"
        value={values.patientId}
        onChange={(event) => onChange("patientId", event.target.value)}
      />
      <input
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        placeholder="Medication"
        value={values.medication}
        onChange={(event) => onChange("medication", event.target.value)}
      />
      <input
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        placeholder="Dosage"
        value={values.dosage}
        onChange={(event) => onChange("dosage", event.target.value)}
      />
      <button className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black" type="submit">
        Save Prescription
      </button>
    </form>
  );
}
