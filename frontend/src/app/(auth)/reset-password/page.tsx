import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordPageContainer } from "./ResetPasswordPageContainer";

export const metadata: Metadata = {
  title: "Create New Password | ICARE-CVD",
  description: "Set a new password for your ICARE-CVD account",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-[#F9F8F5]" />}>
      <ResetPasswordPageContainer />
    </Suspense>
  );
}

