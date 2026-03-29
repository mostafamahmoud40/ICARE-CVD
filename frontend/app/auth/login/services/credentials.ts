export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginFieldErrors = Partial<
  Record<keyof LoginCredentials, string>
>;

export function validateLoginCredentials(
  credentials: LoginCredentials,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!credentials.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (!credentials.password) {
    errors.password = "Password is required";
  } else if (credentials.password.length < 8) {
    errors.password = "Use at least 8 characters";
  }

  return errors;
}

export function hasFieldErrors(errors: LoginFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
