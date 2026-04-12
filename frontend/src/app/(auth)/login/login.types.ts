import type { z } from "zod";

import { loginSchema } from "./login.schema";
import type { AuthUser } from "@/lib/auth-tokens";

export type LoginValues = z.infer<typeof loginSchema>;

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};
