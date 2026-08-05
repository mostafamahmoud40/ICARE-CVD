import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ToggleProcedureRequirementDto {
  @IsBoolean()
  isDone!: boolean;
}

export class CreateProcedureRequirementDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsBoolean()
  allowsAttachment!: boolean;

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;
}

export class UpdateProcedureRequirementDto extends CreateProcedureRequirementDto {}

export class SaveProcedureConsentDto {
  @IsUUID()
  requirementId!: string;

  @IsIn(['patient', 'guardian'])
  signerType!: 'patient' | 'guardian';

  @IsString()
  @MaxLength(200)
  signerName!: string;

  @IsOptional()
  @IsString()
  guardianRelationship?: string | null;

  @IsIn(['signature', 'upload'])
  collectionMethod!: 'signature' | 'upload';

  @IsOptional()
  @IsString()
  signatureDataUrl?: string | null;

  @IsISO8601()
  signedAt!: string;
}
