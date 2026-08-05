import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RegistrationAnalyzeAccountDto {
  @IsString()
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}

class RegistrationAnalyzeProfileDto {
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  smokingStatus?: string;

  @IsOptional()
  @IsString()
  alcoholConsumption?: string;

  @IsOptional()
  @IsString()
  physicalActivityLevel?: string;

  @IsOptional()
  @IsString()
  stressLevel?: string;

  @IsOptional()
  @IsString()
  heightCm?: string;

  @IsOptional()
  @IsString()
  weightKg?: string;
}

class RegistrationAnalyzeMedicalDto {
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  otherComplaint?: string;

  @IsOptional()
  @IsObject()
  hpiData?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pastCardiacHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pastNonCardiacHistory?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  cardiovascularRiskFactors?: Record<string, unknown>;
}

export class RegistrationAnalyzeDto {
  @ValidateNested()
  @Type(() => RegistrationAnalyzeAccountDto)
  account!: RegistrationAnalyzeAccountDto;

  @ValidateNested()
  @Type(() => RegistrationAnalyzeProfileDto)
  profile!: RegistrationAnalyzeProfileDto;

  @ValidateNested()
  @Type(() => RegistrationAnalyzeMedicalDto)
  medical!: RegistrationAnalyzeMedicalDto;
}
