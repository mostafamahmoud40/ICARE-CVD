import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePatientClinicalNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

export class CreatePatientCareGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  metric!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  target!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  current?: string;

  @IsOptional()
  @IsIn(['on-track', 'off-track', 'achieved'])
  status?: 'on-track' | 'off-track' | 'achieved';
}

export class UpdatePatientCareGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  metric?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  target?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  current?: string | null;

  @IsOptional()
  @IsIn(['on-track', 'off-track', 'achieved'])
  status?: 'on-track' | 'off-track' | 'achieved';
}
