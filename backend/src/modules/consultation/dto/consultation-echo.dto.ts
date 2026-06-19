import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class EchoUploadIntentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}

export class EchoChartDataDto {
  @IsArray()
  areas!: number[];

  @IsNumber()
  es_frame!: number;

  @IsNumber()
  ed_frame!: number;

  @IsArray()
  systole_frames!: number[];
}

export class SaveConsultationEchoAnalysisDto {
  @IsUUID()
  videoDocumentId!: string;

  @IsUUID()
  overlayGifDocumentId!: string;

  @IsUUID()
  frameVizDocumentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsNumber()
  ef!: number;

  @IsString()
  label!: string;

  @IsNumber()
  es_frame!: number;

  @IsNumber()
  ed_frame!: number;

  @IsNumber()
  es_area!: number;

  @IsNumber()
  ed_area!: number;

  @IsNumber()
  total_frames!: number;

  @IsString()
  device!: string;

  @IsObject()
  chart_data!: EchoChartDataDto;
}

export class UpdateConsultationEchoReportDto {
  @IsString()
  aiReport!: string;
}
