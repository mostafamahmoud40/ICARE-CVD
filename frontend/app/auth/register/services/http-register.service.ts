import type { RegisterCredentials } from "./credentials";
import { toRegisterPayload } from "./credentials";
import type { RegisterPort, RegisterResult } from "./register.port";

type CreateHttpRegisterOptions = {
  baseUrl?: string;
  registerPath?: string;
};

export function createHttpRegisterService(
  options: CreateHttpRegisterOptions = {},
): RegisterPort {
  const baseUrl = options.baseUrl ?? "";
  const registerPath = options.registerPath ?? "/api/auth/register";

  return {
    async register(credentials: RegisterCredentials): Promise<RegisterResult> {
      try {
        const path = registerPath.startsWith("/")
          ? registerPath
          : `/${registerPath}`;
        const url = `${baseUrl.replace(/\/$/, "")}${path}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toRegisterPayload(credentials)),
        });

        if (!response.ok) {
          let message = "Registration failed";
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
