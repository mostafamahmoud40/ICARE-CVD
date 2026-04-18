import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum DiagnosisType {
  Primary = 'primary',
  Secondary = 'secondary',
  Differential = 'differential',
}

export enum DiagnosisSeverity {
  Mild = 'mild',
  Moderate = 'moderate',
  Severe = 'severe',
  Critical = 'critical',
}

export enum DiagnosisConfirmation {
  Confirmed = 'confirmed',
  Unconfirmed = 'unconfirmed',
  Presumed = 'presumed',
}

export enum DiagnosisStatus {
  Active = 'active',
  Resolved = 'resolved',
  Chronic = 'chronic',
}

export enum LateralityType {
  Unspecified = 'unspecified',
  Left = 'left',
  Right = 'right',
  Bilateral = 'bilateral',
  Other = 'other',
}

export class CreateDiagnosisDto {
  @IsString()
  @MaxLength(20)
  icdCode!: string;

  @IsString()
  description!: string;

  @IsEnum(DiagnosisType)
  type!: DiagnosisType;

  @IsEnum(DiagnosisSeverity)
  severity!: DiagnosisSeverity;

  @IsEnum(DiagnosisConfirmation)
  confirmation!: DiagnosisConfirmation;

  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @IsOptional()
  @IsEnum(DiagnosisStatus)
  status?: DiagnosisStatus;

  @IsOptional()
  @IsEnum(LateralityType)
  laterality?: LateralityType;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  nyhaClass?: string;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class UpdateDiagnosisDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icdCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DiagnosisType)
  type?: DiagnosisType;

  @IsOptional()
  @IsEnum(DiagnosisSeverity)
  severity?: DiagnosisSeverity;

  @IsOptional()
  @IsEnum(DiagnosisConfirmation)
  confirmation?: DiagnosisConfirmation;

  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @IsOptional()
  @IsEnum(DiagnosisStatus)
  status?: DiagnosisStatus;

  @IsOptional()
  @IsEnum(LateralityType)
  laterality?: LateralityType;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  nyhaClass?: string;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}
