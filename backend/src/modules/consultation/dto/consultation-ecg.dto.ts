import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class EcgUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

export class SaveConsultationEcgAnalysisDto {
  @IsUUID()
  heaDocumentId!: string;

  @IsUUID()
  datDocumentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recordName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsObject()
  analysis!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  aiReport?: Record<string, unknown>;
}

export class UpdateConsultationEcgReportDto {
  @IsObject()
  aiReport!: Record<string, unknown>;
}
