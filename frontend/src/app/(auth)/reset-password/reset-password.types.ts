export type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type ResetPasswordResponse = {
  message?: string;
};
