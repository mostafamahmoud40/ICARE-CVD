export type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

export type ResetPasswordPayload = {
  resetToken: string;
  password: string;
};

export type ResetPasswordResponse = {
  message?: string;
};
