"use client";

import { useLogin } from "./useLogin";
import { LoginForm } from "./LoginForm";

export function LoginPageContainer() {
  const loginProps = useLogin();
  return <LoginForm {...loginProps} />;
}
