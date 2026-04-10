import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const chiefComplaints = [
  'chest-pain',
  'dyspnea',
  'palpitations',
  'syncope',
  'leg-swelling',
  'fatigue',
  'constitutional-infective',
  'peripheral-vascular',
  'hepatic-congestion',
  'jaundice',
  'cyanosis',
  'systemic-embolization',
  'neurological',
  'other',
] as const;

type ChiefComplaint = (typeof chiefComplaints)[number];

type JsonRecord = Record<string, unknown>;

type FamilyHistoryItem = {
  relationship: string;
  condition: string;
  details?: string;
};

type MedicationItem = {
  name: string;
  dose: string;
  frequency: string;
  type: string;
  compliance?: string;
  sideEffects?: string;
};

type AllergyItem = {
  allergen: string;
  reaction?: string;
};

export class RegisterStep3Dto {
  @IsIn(chiefComplaints)
  chiefComplaint!: ChiefComplaint;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chiefComplaintOtherText?: string;

  @IsOptional()
  @IsObject()
  hpiData?: JsonRecord;

  @IsOptional()
  @IsBoolean()
  noCardiacHistory?: boolean;

  @IsOptional()
  @IsObject()
  pastCardiacHistory?: JsonRecord;

  @IsOptional()
  @IsBoolean()
  noNonCardiacHistory?: boolean;

  @IsOptional()
  @IsObject()
  pastNonCardiacHistory?: JsonRecord;

  @IsOptional()
  @IsObject()
  cardiovascularRiskFactors?: JsonRecord;

  @IsOptional()
  @IsBoolean()
  hasFamilyHistory?: boolean;

  @IsOptional()
  @IsArray()
  familyHistory?: FamilyHistoryItem[];

  @IsOptional()
  @IsArray()
  medications?: MedicationItem[];

  @IsOptional()
  @IsArray()
  drugAllergies?: AllergyItem[];

  @IsOptional()
  @IsArray()
  foodAllergies?: AllergyItem[];

  @IsOptional()
  @IsArray()
  otherAllergies?: AllergyItem[];
}
