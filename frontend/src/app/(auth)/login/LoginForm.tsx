"use client";

import { FormEvent } from "react";
import { useLogin } from "./useLogin";

export function LoginForm() {
  const { values, onChange, onSubmit } = useLogin();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        type="email"
        placeholder="Email"
        value={values.email}
        onChange={(event) => onChange("email", event.target.value)}
      />
      <input
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        type="password"
        placeholder="Password"
        value={values.password}
        onChange={(event) => onChange("password", event.target.value)}
      />
      <button className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-black" type="submit">
        Login
      </button>
    </form>
  );
}
