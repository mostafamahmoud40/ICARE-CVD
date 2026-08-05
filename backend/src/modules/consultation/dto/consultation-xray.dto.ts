import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum XrayRiskLevel {
  High = 'high',
  Moderate = 'moderate',
  Normal = 'normal',
}

export class XrayUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}

export class SaveConsultationXrayAnalysisDto {
  @IsUUID()
  originalDocumentId!: string;

  @IsUUID()
  annotatedDocumentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsEnum(XrayRiskLevel)
  riskLevel!: XrayRiskLevel;

  @IsObject()
  findings!: Record<string, number>;

  @IsArray()
  @IsString({ each: true })
  interpretation!: string[];

  @IsNumber()
  totalDetections!: number;

  @IsNumber()
  inferenceTimeMs!: number;
}
