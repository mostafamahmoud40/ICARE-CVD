import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { chiefComplaints } from '../../auth/dto/register-step-3.dto';

const genders = ['male', 'female'] as const;

const medicationTypes = [
  'antihypertensives',
  'antiplatelets',
  'anticoagulants',
  'statins',
  'antiarrhythmics',
  'diuretics',
  'diabetes_medications',
] as const;

const allergyCategories = ['drug', 'food', 'other'] as const;

export class CreatePatientMedicationDto {
  /** Ignored by the server; allowed so the client can send stable row keys. */
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(100)
  dose!: string;

  @IsString()
  @MaxLength(50)
  frequency!: string;

  @IsIn(medicationTypes)
  type!: (typeof medicationTypes)[number];

  @IsOptional()
  @IsIn(['good', 'poor'])
  compliance?: 'good' | 'poor';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sideEffects?: string;
}

export class CreatePatientAllergyDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(allergyCategories)
  category!: (typeof allergyCategories)[number];

  @IsString()
  @MaxLength(150)
  allergen!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reaction?: string;
}

export class CreatePatientDto {
  @IsString()
  @MaxLength(200)
  fullName!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MaxLength(30)
  phoneNumber!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsIn(genders)
  gender!: (typeof genders)[number];

  @IsString()
  @MaxLength(50)
  nationalId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  smokingStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  alcoholConsumption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  exerciseFrequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stressLevel?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsIn(chiefComplaints)
  chiefComplaint?: (typeof chiefComplaints)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  otherChiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  medicalHistoryNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePatientMedicationDto)
  medications?: CreatePatientMedicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePatientAllergyDto)
  allergies?: CreatePatientAllergyDto[];
}
