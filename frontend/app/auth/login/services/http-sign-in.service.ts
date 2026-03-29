import type { LoginCredentials } from "./credentials";
import type { SignInPort, SignInResult } from "./sign-in.port";

type CreateHttpSignInOptions = {
  /** e.g. process.env.NEXT_PUBLIC_API_URL — defaults to same origin */
  baseUrl?: string;
  loginPath?: string;
};

export function createHttpSignInService(
  options: CreateHttpSignInOptions = {},
): SignInPort {
  const baseUrl = options.baseUrl ?? "";
  const loginPath = options.loginPath ?? "/api/auth/login";

  return {
    async signIn(credentials: LoginCredentials): Promise<SignInResult> {
      try {
        const url = `${baseUrl.replace(/\/$/, "")}${loginPath.startsWith("/") ? "" : "/"}${loginPath}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          let message = "Sign in failed";
          try {
            const body = (await response.json()) as { message?: string };
            if (body.message) message = body.message;
          } catch {
            /* ignore */
          }
          return { ok: false, message };
        }

        return { ok: true };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
  };
}
