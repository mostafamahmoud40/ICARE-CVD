"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Heart, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { LoginValues } from "./login.types";

export type LoginFormProps = {
  submit: (values: LoginValues) => void;
  fieldErrors: Partial<Record<keyof LoginValues, string>>;
  isPending: boolean;
};

export function LoginForm({ submit, fieldErrors, isPending }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailPasswordMap: Record<string, string> = {
    "admin@icare-cvd.local": "Admin123456",
    "haidiqadri9@gmail.com": "haidiqadri9",
    "doctor@gmail.com": "doctor@23",
    "assistant@gmail.com": "assistant@23",
  };

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailPasswordMap[newEmail]) {
      setPassword(emailPasswordMap[newEmail]);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email, password });
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#E5EEEA] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] sm:max-w-lg sm:p-8">
      <div className="space-y-4 pb-2 pt-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#E8F0EE] text-[#1A5345]">
          <Heart className="size-7 fill-current" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h1 className="font-serif text-[26px] font-bold tracking-tight text-[#1A1F1E] sm:text-[28px]">
            Welcome Back
          </h1>
          <p className="text-[13px] font-medium text-[#6B7870]">
            Sign in to your ICARE-CVD Portal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-left text-[13px] font-semibold text-[#102F27]"
            >
              Email Address
            </Label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/60" />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                list="login-email-suggestions"
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                disabled={isPending}
                className="h-11 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] pl-10 text-[14px] text-[#152a24] placeholder:text-muted-foreground/60 hover:border-[#d9e5e1] focus-visible:border-[#d9e5e1] focus-visible:ring-1 focus-visible:ring-[#1A5345]/30 focus-visible:ring-offset-0"
              />
              <datalist id="login-email-suggestions">
                <option value="assistant@gmail.com" />
                <option value="doctor@gmail.com" />
                <option value="haidiqadri9@gmail.com" />
                <option value="admin@icare-cvd.local" />
              </datalist>
            </div>

            {fieldErrors.email ? (
              <p id="login-email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="login-password"
              className="text-left text-[13px] font-semibold text-[#102F27]"
            >
              Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/60" />
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                disabled={isPending}
                className="h-11 rounded-xl border-[#E8E6E0] bg-[#FAFAF8] pl-10 pr-10 text-[14px] text-[#152a24] placeholder:text-muted-foreground/60 hover:border-[#d9e5e1] focus-visible:border-[#d9e5e1] focus-visible:ring-1 focus-visible:ring-[#1A5345]/30 focus-visible:ring-offset-0"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:bg-transparent hover:text-[#1A5345]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>

            {fieldErrors.password ? (
              <p id="login-password-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[13px] font-bold text-[#1A5345] hover:text-[#133F34] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-[#1A5345] hover:bg-[#133F34] text-white text-[14px] font-bold transition-all shadow-[0_2px_10px_rgba(26,83,69,0.15)] hover:shadow-[0_4px_14px_rgba(26,83,69,0.2)] border-0"
          >
            {isPending ? (
              <>
                <span
                  className="mr-2 size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
                  aria-hidden="true"
                />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="relative w-full pt-4 pb-2">
            <div className="h-px w-full bg-[#E8E6E0]/60" />
            <span className="bg-white text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[12px] font-medium whitespace-nowrap">
              Don&apos;t have an account?
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 w-full rounded-xl border-[#1A5345]/30 bg-transparent text-[14px] font-bold text-[#1A5345] hover:bg-[#1A5345]/5 hover:text-[#1A5345]"
          >
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
