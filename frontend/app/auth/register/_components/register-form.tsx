"use client";

import Link from "next/link";
import type {
  RegisterCredentials,
  RegisterFieldErrors,
} from "../services/credentials";
import { Button } from "@/components/ui/button";

const inputClassName =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20";

const labelClassName = "text-sm font-medium text-zinc-800 dark:text-zinc-200";

export type RegisterFormProps = {
  credentials: RegisterCredentials;
  fieldErrors: RegisterFieldErrors;
  formError: string | null;
  isPending: boolean;
  onFieldChange: <K extends keyof RegisterCredentials>(
    field: K,
    value: RegisterCredentials[K],
  ) => void;
  onSubmit: () => void;
};

export function RegisterForm({
  credentials,
  fieldErrors,
  formError,
  isPending,
  onFieldChange,
  onSubmit,
}: RegisterFormProps) {
  return (
    <main className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Create account
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Share your details and create a password to get started.
        </p>
      </div>

      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <label htmlFor="register-first-name" className={labelClassName}>
            First name
          </label>
          <input
            id="register-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={credentials.firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.firstName)}
            aria-describedby={
              fieldErrors.firstName ? "register-first-name-error" : undefined
            }
          />
          {fieldErrors.firstName ? (
            <p
              id="register-first-name-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.firstName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className={labelClassName}>
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={credentials.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "register-email-error" : undefined
            }
          />
          {fieldErrors.email ? (
            <p
              id="register-email-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="register-phone-number" className={labelClassName}>
            Phone number
          </label>
          <input
            id="register-phone-number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={credentials.phoneNumber}
            onChange={(e) => onFieldChange("phoneNumber", e.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.phoneNumber)}
            aria-describedby={
              fieldErrors.phoneNumber
                ? "register-phone-number-error"
                : undefined
            }
          />
          {fieldErrors.phoneNumber ? (
            <p
              id="register-phone-number-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.phoneNumber}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className={labelClassName}>
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={credentials.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "register-password-error" : undefined
            }
          />
          {fieldErrors.password ? (
            <p
              id="register-password-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="register-confirm" className={labelClassName}>
            Confirm password
          </label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={credentials.confirmPassword}
            onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={
              fieldErrors.confirmPassword
                ? "register-confirm-error"
                : undefined
            }
          />
          {fieldErrors.confirmPassword ? (
            <p
              id="register-confirm-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-10 w-full"
          size="lg"
          disabled={isPending}
        >
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
      <p className="text-center text-sm text-zinc-500">
        <Link
          href="/"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Back to home
        </Link>
      </p>
    </main>
  );
}
