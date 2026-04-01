"use client";

import { FormEvent } from "react";
import { AuthFormCard } from "@/components/shared/AuthFormCard";
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
    <AuthFormCard title="Login" description="Enter your credentials to continue.">
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="********"
            value={values.password}
            onChange={(event) => onChange("password", event.target.value)}
          />
        </div>
        <Button className="w-full" type="submit">
          Login
        </Button>
      </form>
    </AuthFormCard>
  );
}
