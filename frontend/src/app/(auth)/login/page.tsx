import type { Metadata } from "next";

import { LoginPageContainer } from "./LoginPageContainer";

export const metadata: Metadata = {
  title: "Sign in | ICARE-CVD",
  description: "Sign in to your ICARE-CVD account",
};

export default function LoginPage() {
  return <LoginPageContainer />;
}
