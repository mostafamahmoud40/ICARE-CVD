import type { Metadata } from "next";

import { ForgotPasswordPageContainer } from "./ForgotPasswordPageContainer";

export const metadata: Metadata = {
  title: "Forgot Password | ICARE-CVD",
  description: "Request password reset instructions",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContainer />;
}

