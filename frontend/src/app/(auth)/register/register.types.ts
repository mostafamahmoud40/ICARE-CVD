export type RegisterValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type RegisterResponse = {
  message?: string;
};
