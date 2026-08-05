import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | ICARE-CVD",
  description: "Register a new ICARE-CVD account",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-[#F9F8F5]" />}>
      <RegisterForm />
    </Suspense>
  );
}
