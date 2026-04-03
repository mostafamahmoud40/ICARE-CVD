import type { Metadata } from "next";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | ICARE-CVD",
  description: "Register a new ICARE-CVD account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
