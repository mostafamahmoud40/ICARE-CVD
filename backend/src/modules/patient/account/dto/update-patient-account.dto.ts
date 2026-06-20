import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const;

export class UpdatePatientAccountDto {
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
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsIn(MARITAL_STATUSES)
  maritalStatus?: (typeof MARITAL_STATUSES)[number] | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;
}
