"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = {
  newPassword: string;
  confirmPassword: string;
};

const initialValues: FormValues = {
  newPassword: "",
  confirmPassword: "",
};

export default function CreateNewPasswordPage() {
  const [values, setValues] = useState<FormValues>(initialValues);

  const onChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: connect reset password endpoint.
    console.log(values);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-10 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 3a4 4 0 0 0-4 4v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a4 4 0 0 0-4-4Zm-2 6V7a2 2 0 1 1 4 0v2h-4Z"
                  className="fill-zinc-700 dark:fill-zinc-200"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Create new password</CardTitle>
            <CardDescription>Your OTP is verified. Set your new password.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={values.newPassword}
                onChange={(event) => onChange("newPassword", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={values.confirmPassword}
                onChange={(event) => onChange("confirmPassword", event.target.value)}
              />
            </div>

            <Button className="w-full" type="submit">
              Update password
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
