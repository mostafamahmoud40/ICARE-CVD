import { redirect } from "next/navigation";

/** Route entry — sends the user into the multi-step register flow. */
export default function RegisterPage() {
  redirect("/auth/register/step1");
}
