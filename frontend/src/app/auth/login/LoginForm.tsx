"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLogin } from "./useLogin";

const inputClassName =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20";

const labelClassName = "text-sm font-medium text-zinc-800 dark:text-zinc-200";

export function LoginForm() {
  const router = useRouter();
  const { credentials, fieldErrors, formError, isPending, setField, submit } =
    useLogin({
      onSuccess: () => {
        toast.success("Welcome back!", {
          id: "login-status",
          description: "You have successfully logged in.",
        });
        router.push("/");
      },
    });

  useEffect(() => {
    if (!formError) return;

    toast.error("Sign in failed", {
      id: "login-status",
      description:
        formError === "Sign in failed"
          ? "Please check your email and password and try again."
          : formError,
    });
  }, [formError]);

  return (
    <main className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your credentials to continue.
        </p>
      </div>

      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-2">
          <label htmlFor="login-email" className={labelClassName}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={credentials.email}
            onChange={(event) => setField("email", event.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "login-email-error" : undefined
            }
          />
          {fieldErrors.email ? (
            <p
              id="login-email-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className={labelClassName}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={(event) => setField("password", event.target.value)}
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
          />
          {fieldErrors.password ? (
            <p
              id="login-password-error"
              role="alert"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-10 w-full"
          size="lg"
          disabled={isPending}
        >
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Register
        </Link>
      </p>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
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
