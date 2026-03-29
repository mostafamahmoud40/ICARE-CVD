import type { RegisterCredentials } from "./credentials";

export type RegisterSuccess = { ok: true };

export type RegisterFailure = { ok: false; message: string };

export type RegisterResult = RegisterSuccess | RegisterFailure;

export interface RegisterPort {
  register(credentials: RegisterCredentials): Promise<RegisterResult>;
}
