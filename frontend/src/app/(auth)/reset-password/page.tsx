import type { Metadata } from "next";

import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Create New Password | ICARE-CVD",
  description: "Set a new password for your ICARE-CVD account",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
