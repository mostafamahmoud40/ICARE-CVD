import type { z } from "zod";

import { loginSchema } from "./login.schema";

export type LoginValues = z.infer<typeof loginSchema>;

/** Adjust when backend contract is finalized */
export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
};
