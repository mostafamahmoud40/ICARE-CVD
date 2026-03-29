export type RegisterCredentials = {
  firstName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterCredentials, string>
>;

export function validateRegisterCredentials(
  credentials: RegisterCredentials,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const normalizedFirstName = credentials.firstName.trim();
  const normalizedEmail = credentials.email.trim();
  const normalizedPhoneNumber = credentials.phoneNumber.trim();
  const phoneDigits = normalizedPhoneNumber.replace(/\D/g, "");

  if (!normalizedFirstName) {
    errors.firstName = "First name is required";
  } else if (normalizedFirstName.length < 2) {
    errors.firstName = "Enter at least 2 characters";
  }

  if (!normalizedEmail) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Enter a valid email";
  }

  if (!normalizedPhoneNumber) {
    errors.phoneNumber = "Phone number is required";
  } else if (
    !/^\+?[0-9()\s-]+$/.test(normalizedPhoneNumber) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    errors.phoneNumber = "Enter a valid phone number";
  }

  if (!credentials.password) {
    errors.password = "Password is required";
  } else if (credentials.password.length < 8) {
    errors.password = "Use at least 8 characters";
  }

  if (!credentials.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (credentials.confirmPassword !== credentials.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function hasRegisterFieldErrors(errors: RegisterFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Payload sent to the API (confirmPassword is client-only). */
export function toRegisterPayload(credentials: RegisterCredentials): {
  firstName: string;
  email: string;
  phoneNumber: string;
  password: string;
} {
  return {
    firstName: credentials.firstName.trim(),
    email: credentials.email.trim(),
    phoneNumber: credentials.phoneNumber.trim(),
    password: credentials.password,
  };
}
