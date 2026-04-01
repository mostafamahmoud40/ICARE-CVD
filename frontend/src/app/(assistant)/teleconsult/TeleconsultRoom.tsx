"use client";

import { FormEvent } from "react";
import { useTeleconsult } from "./useTeleconsult";

export function TeleconsultRoom() {
  const { values, onChange, onSubmit } = useTeleconsult();

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
        placeholder="Consultation Topic"
        value={values.roomTopic}
        onChange={(event) => onChange("roomTopic", event.target.value)}
      />
      <button className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black" type="submit">
        Start Teleconsult
      </button>
    </form>
  );
}
