import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const GENDERS = ['male', 'female', 'other'] as const;
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const;
const SMOKING_STATUSES = [
  'never',
  'former-5',
  'former-10',
  'former-15',
  'former-20',
  'current-5',
  'current-10',
  'current-15',
  'current-20',
] as const;

export class UpdateDoctorPatientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: (typeof GENDERS)[number];

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsIn(BLOOD_TYPES)
  bloodType?: (typeof BLOOD_TYPES)[number] | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsIn(MARITAL_STATUSES)
  maritalStatus?: (typeof MARITAL_STATUSES)[number] | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsIn(SMOKING_STATUSES)
  smokingStatus?: (typeof SMOKING_STATUSES)[number] | null;
}
