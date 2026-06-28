import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDoctorAssistantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}

export class UpdateDoctorAssistantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}
