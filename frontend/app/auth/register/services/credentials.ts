export type RegisterUploadedDocument = {
  id: string;
  name: string;
  category: string;
  mimeType: string;
  sizeInBytes: number;
};

export type RegisterCredentials = {
  firstName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  nationalId: string;
  medicalRecordNumber: string;
  referringPhysician: string;
  dateOfVisit: string;
  gender: string;
  bloodType: string;
  address: string;
  heightCm: string;
  weightKg: string;
  maritalStatus: string;
  occupation: string;
  smokingStatus: string;
  alcoholConsumption: string;
  caffeineIntake: string;
  exerciseFrequency: string;
  exerciseDuration: string;
  exerciseType: string;
  recreationalDrugUse: string;
  physicalActivityLevel: string;
  dietaryHabits: string[];
  stressLevel: string;
  diagnosedConditions: string[];
  currentSymptoms: string[];
  currentMedications: string;
  allergies: string;
  previousProcedures: string;
  familyCardiacHistory: string;
  cardiacHospitalization: string;
  additionalMedicalNotes: string;
  documentCategory: string;
  uploadedDocuments: RegisterUploadedDocument[];
  documentNotes: string;
};

export type RegisterField = keyof RegisterCredentials;

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterCredentials, string>
>;

export function validateRegisterCredentials(
  credentials: RegisterCredentials,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const normalizedFullName = credentials.firstName.trim();
  const normalizedEmail = credentials.email.trim();
  const normalizedPhoneNumber = credentials.phoneNumber.trim();
  const normalizedHeight = credentials.heightCm.trim();
  const normalizedWeight = credentials.weightKg.trim();
  const phoneDigits = normalizedPhoneNumber.replace(/\D/g, "");
  const dateOfBirth = credentials.dateOfBirth
    ? new Date(credentials.dateOfBirth)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!normalizedFullName) {
    errors.firstName = "Full name is required";
  } else if (normalizedFullName.length < 2) {
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

  if (!credentials.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  } else if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) {
    errors.dateOfBirth = "Enter a valid date of birth";
  } else if (dateOfBirth > today) {
    errors.dateOfBirth = "Date of birth cannot be in the future";
  }

  if (!credentials.gender) {
    errors.gender = "Gender is required";
  }

  if (!normalizedHeight) {
    errors.heightCm = "Height is required";
  } else if (Number.isNaN(Number(normalizedHeight)) || Number(normalizedHeight) <= 0) {
    errors.heightCm = "Enter a valid height";
  }

  if (!normalizedWeight) {
    errors.weightKg = "Weight is required";
  } else if (Number.isNaN(Number(normalizedWeight)) || Number(normalizedWeight) <= 0) {
    errors.weightKg = "Enter a valid weight";
  }

  if (!credentials.smokingStatus) {
    errors.smokingStatus = "Select your smoking status";
  }

  if (!credentials.exerciseFrequency) {
    errors.exerciseFrequency = "Select your exercise frequency";
  }

  if (!credentials.exerciseDuration) {
    errors.exerciseDuration = "Select your exercise duration";
  }

  if (!credentials.exerciseType) {
    errors.exerciseType = "Select your exercise type";
  }

  return errors;
}

export function hasRegisterFieldErrors(errors: RegisterFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateRegisterStep(
  credentials: RegisterCredentials,
  fields: readonly RegisterField[],
): RegisterFieldErrors {
  const errors = validateRegisterCredentials(credentials);
  const stepErrors: RegisterFieldErrors = {};

  for (const field of fields) {
    const error = errors[field];
    if (error) stepErrors[field] = error;
  }

  return stepErrors;
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
