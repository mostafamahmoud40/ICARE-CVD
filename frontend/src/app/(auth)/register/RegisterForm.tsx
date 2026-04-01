"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegistration } from "./useRegistration";

export function RegisterForm() {
  const { values, onChange, onSubmit } = useRegistration();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="w-full max-w-sm space-y-6">
      <div className="grid grid-cols-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <LogIn className="h-4 w-4" />
          Login
        </Link>
        <span className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <UserPlus className="h-4 w-4" />
          Sign Up
        </span>
      </div>

      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <ShieldCheck className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Create account
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Fill your details to create a new account.
        </p>
      </div>

      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="register-full-name">Full Name</Label>
          <Input
            id="register-full-name"
            type="text"
            placeholder="Your full name"
            className="h-11"
            value={values.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="name@example.com"
            className="h-11"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            placeholder="********"
            className="h-11"
            value={values.password}
            onChange={(event) => onChange("password", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="register-confirm-password">Confirm Password</Label>
          <Input
            id="register-confirm-password"
            type="password"
            placeholder="********"
            className="h-11"
            value={values.confirmPassword}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
          />
        </div>
        <Button className="h-11 w-full text-base" type="submit">
          Register
        </Button>
      </form>
    </section>
  );
}
