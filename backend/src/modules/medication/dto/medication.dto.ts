import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum MedicationType {
  Antihypertensives = 'antihypertensives',
  Antiplatelets = 'antiplatelets',
  Anticoagulants = 'anticoagulants',
  Statins = 'statins',
  Antiarrhythmics = 'antiarrhythmics',
  Diuretics = 'diuretics',
  DiabetesMedications = 'diabetes_medications',
}

export enum TimeOfDay {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export class CreateMedicationDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(100)
  dose!: string;

  @IsString()
  @MaxLength(50)
  frequency!: string;

  @IsEnum(MedicationType)
  type!: MedicationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sideEffects?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.split(',').map((s: string) => s.trim())
      : value,
  )
  timeOfDay?: TimeOfDay[];

  /** Duration in days. null = ongoing (no end date). Common values: 3, 7, 14, 30, 90, 180, 365 */
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number | null;

  /** When the medication starts. Defaults to today if omitted. */
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sideEffects?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsEnum(MedicationType)
  type?: MedicationType;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.split(',').map((s: string) => s.trim())
      : value,
  )
  timeOfDay?: TimeOfDay[];

  @IsOptional()
  @IsEnum(MedicationType)
  compliance?: 'good' | 'poor';

  /** Duration in days. null = ongoing (no end date). */
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number | null;
}

export class ChangeMedicationStatusDto {
  @IsEnum({ active: 'active', paused: 'paused', discontinued: 'discontinued' })
  status!: 'active' | 'paused' | 'discontinued';
}

export class CreateDoseLogDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  medicationId?: string;
}

export class CreateRefillDto {
  @IsInt()
  @Min(0)
  remainingRefills!: number;
}
