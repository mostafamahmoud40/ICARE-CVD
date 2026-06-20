import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CtUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}

export class SaveConsultationCtAnalysisDto {
  @IsUUID()
  sourceDocumentId!: string;

  @IsUUID()
  maskDocumentId!: string;

  @IsUUID()
  axialSliceDocumentId!: string;

  @IsUUID()
  coronalSliceDocumentId!: string;

  @IsUUID()
  sagittalSliceDocumentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsNumber()
  voxelCount!: number;

  @IsArray()
  predShape!: number[];

  @IsNumber()
  volumeMl!: number;

  @IsNumber()
  elapsedSec!: number;
}
