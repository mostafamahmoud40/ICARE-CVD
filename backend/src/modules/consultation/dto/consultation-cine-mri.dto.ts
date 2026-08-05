import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CineMriUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}

export class SaveConsultationCineMriAnalysisDto {
  @IsUUID()
  edDocumentId!: string;

  @IsUUID()
  esDocumentId!: string;

  @IsUUID()
  rawGifDocumentId!: string;

  @IsUUID()
  segGifDocumentId!: string;

  @IsUUID()
  segGridEdDocumentId!: string;

  @IsUUID()
  segGridEsDocumentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  @MaxLength(8)
  diagnosisClass!: string;

  @IsNumber()
  elapsedSec!: number;

  @IsObject()
  clinicalFeatures!: Record<string, number>;
}
