import type { LoginCredentials } from "./credentials";

export type SignInSuccess = { ok: true };

export type SignInFailure = { ok: false; message: string };

export type SignInResult = SignInSuccess | SignInFailure;

/** Application port — swap implementations (HTTP, mock, OAuth bridge) without changing UI. */
export interface SignInPort {
  signIn(credentials: LoginCredentials): Promise<SignInResult>;
}
