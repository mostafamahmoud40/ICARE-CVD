"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Heart, Lock, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email, password });
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-0 pt-7 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="size-8 fill-current" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to your CareSmart account
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5 px-8 pb-0 pt-5">
          <div className="space-y-2">
            <Label
              htmlFor="login-email"
              className="text-left text-sm font-medium text-foreground"
            >
              Email Address
            </Label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                disabled={isPending}
                className="h-12 rounded-xl border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
              />
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
              className="text-left text-sm font-medium text-foreground"
            >
              Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                className="h-12 rounded-xl border-input bg-background pl-9 pr-10 text-foreground placeholder:text-muted-foreground"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1/2 -translate-y-1/2"
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
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href="/forgot-password">Forgot password?</Link>
            </Button>
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={isPending}
            size="lg"
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-none focus-visible:ring-primary/40"
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
        </CardContent>

        <CardFooter className="flex-col gap-6 border-t-0 bg-transparent p-0 px-8 pb-8 pt-6">
          <div className="relative w-full">
            <Separator />
            <span className="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-sm">
              Don&apos;t have an account?
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-xl border-primary/30 bg-transparent text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:hover:bg-primary/15"
          >
            <Link href="/register">Create Account</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
