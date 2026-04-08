import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const genders = ['male', 'female', 'other'] as const;
type Gender = (typeof genders)[number];

export class RegisterStep2Dto {
  @IsDateString()
  dateOfBirth!: string;

  @IsIn(genders)
  gender!: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @Min(30)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @Min(2)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  smokingStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alcoholConsumption?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  caffeineIntake?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  recreationalDrugUse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  exerciseFrequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  exerciseDuration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  exerciseType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  physicalActivityLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dietaryHabits?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stressLevel?: string;
}

