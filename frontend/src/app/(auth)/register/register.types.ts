export type RegisterValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

export type RegisterProfileValues = {
  dateOfBirth: string;
  nationalId: string;
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
  /** Single-select UI; `highSaltDiet` / `highFatDiet` stay in sync when possible */
  dietaryHabits: string;
  highSaltDiet: boolean;
  highFatDiet: boolean;
  stressLevel: string;
};

/** Past cardiac procedures — multi-select with per-item details (see `PastInterventionsSection`). */
export type PastInterventionProcedureKey =
  | "catheterization"
  | "pci"
  | "cabg"
  | "valve"
  | "pacemaker"
  | "ablation"
  | "transplant";

export type PastInterventionSelection = PastInterventionProcedureKey | "none";

export type PastInterventionDetails = {
  catheterization: { dateMy: string; result: string };
  pci: { dateMy: string; vessel: string };
  cabg: { dateMy: string; grafts: string };
  valve: { dateMy: string; valve: string; procedureType: string; notes: string };
  pacemaker: {
    dateImplantedMy: string;
    deviceType: string;
    stillActive: string;
    lastCheckMy: string;
  };
  ablation: { dateMy: string; arrhythmiaType: string };
  transplant: { dateMy: string; center: string };
};

/** Per-procedure detail bag; keys are independent (not a single merged object). */
export type PastInterventionsDetailsState = {
  [K in PastInterventionProcedureKey]?: PastInterventionDetails[K];
};

export type PastInterventionsState = {
  selected: PastInterventionSelection[];
  details: PastInterventionsDetailsState;
};

export type RegisterMedicalValues = Record<string, unknown>;

/** Client-side metadata only until upload API exists */
export type RegisterDocumentFileMeta = {
  id: string;
  name: string;
  size: number;
  category: string;
};

export type RegisterDocumentsValues = {
  documentCategory: string;
  notes: string;
  files: RegisterDocumentFileMeta[];
};

export type RegisterStep = number;

export type RegisterPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type RegisterResponse = {
  message?: string;
};
