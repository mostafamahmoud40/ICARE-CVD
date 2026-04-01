"use client";

import { FormEvent } from "react";
import { AuthFormCard } from "@/components/shared/AuthFormCard";
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
    <AuthFormCard title="Create Account" description="Fill the form below to register.">
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="register-full-name">Full Name</Label>
          <Input
            id="register-full-name"
            type="text"
            placeholder="Your full name"
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
            value={values.confirmPassword}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
          />
        </div>
        <Button className="w-full" type="submit">
          Register
        </Button>
      </form>
    </AuthFormCard>
  );
}
