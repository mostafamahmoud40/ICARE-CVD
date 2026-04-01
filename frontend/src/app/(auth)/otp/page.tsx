"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function OtpPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-10 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <ShieldCheck className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Verify OTP</CardTitle>
            <CardDescription>Enter the 6-character OTP code sent to your email.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full"
            type="button"
            onClick={() => router.push("/create-new-password")}
          >
            Continue
          </Button>

          <div className="flex justify-center">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
