"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { KeyRound, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "./useLogin";

export function LoginForm() {
  const { values, onChange, onSubmit } = useLogin();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="w-full max-w-sm space-y-6">
      <div className="grid grid-cols-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <LogIn className="h-4 w-4" />
          Login
        </span>
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <ShieldCheck className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome!
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Please enter your details to login.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="Enter your email address"
            className="h-11"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            className="h-11"
            value={values.password}
            onChange={(event) => onChange("password", event.target.value)}
          />
        </div>
        <Button className="h-11 w-full text-base" type="submit">
          Log In
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-100 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              Or
            </span>
          </div>
        </div>

        <Button className="h-11 w-full" variant="outline" type="button">
          <KeyRound className="h-4 w-4" />
          Continue with Google
        </Button>
      </form>

      <p className="pt-10 text-center text-base text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-semibold text-zinc-900 underline dark:text-zinc-100">
          Sign up
        </Link>
      </p>
    </section>
  );
}
