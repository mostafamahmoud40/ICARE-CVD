import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class EcgClsUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}

export class SaveConsultationEcgClsAnalysisDto {
  @IsIn(['image', 'wfdb'])
  inputSource!: 'image' | 'wfdb';

  @IsOptional()
  @IsUUID()
  imageDocumentId?: string;

  @IsOptional()
  @IsUUID()
  heaDocumentId?: string;

  @IsOptional()
  @IsUUID()
  datDocumentId?: string;

  @IsOptional()
  @IsUUID()
  previewDocumentId?: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsObject()
  classification!: Record<string, unknown>;
}
