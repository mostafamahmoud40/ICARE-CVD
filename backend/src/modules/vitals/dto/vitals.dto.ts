import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum VitalSource {
  Home = 'home',
  Clinic = 'clinic',
  Hospital = 'hospital',
}

export class CreateVitalReadingDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsEnum(VitalSource)
  source?: VitalSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(300)
  systolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(200)
  diastolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(220)
  heartRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(70)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(20)
  @Max(300)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(500)
  bloodSugar?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVitalReadingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(300)
  systolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(200)
  diastolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(220)
  heartRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(70)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(20)
  @Max(300)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(500)
  bloodSugar?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(VitalSource)
  source?: VitalSource;
}
