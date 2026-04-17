import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DocumentCategory {
  LabReport = 'lab_report',
  Imaging = 'imaging',
  Ecg = 'ecg',
  Prescription = 'prescription',
  Referral = 'referral',
  Other = 'other',
}

export class CreateDocumentDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  s3Key?: string;

  @IsOptional()
  fileSize?: number;
}
