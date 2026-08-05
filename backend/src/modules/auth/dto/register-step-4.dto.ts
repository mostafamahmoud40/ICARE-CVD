import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  Allow,
} from 'class-validator';

export const DOCUMENT_CATEGORIES = [
  'lab_report',
  'imaging',
  'ecg',
  'prescription',
  'referral',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
import { Type } from 'class-transformer';

/**
 * Document file metadata - sent from frontend after S3 upload completes
 * SOLID: Single responsibility - represents document data structure
 * Flexible: Accepts both 'name'/'fileName' and 'size'/'fileSize' field names
 */
export class DocumentFileDto {
  @Allow()
  @IsOptional()
  id?: string; // Unique file ID

  @Allow()
  @IsOptional()
  name?: string; // Original file name (preferred)

  @Allow()
  @IsOptional()
  fileName?: string; // Alternative field name

  @Allow()
  @IsOptional()
  size?: number; // File size in bytes (preferred)

  @Allow()
  @IsOptional()
  fileSize?: number; // Alternative field name

  @IsEnum(DOCUMENT_CATEGORIES)
  @IsOptional()
  category?: DocumentCategory;

  @Allow()
  @IsOptional()
  s3Key?: string; // S3 object key

  @Allow()
  @IsOptional()
  s3Url?: string; // Public S3 URL

  @Allow()
  @IsOptional()
  mimeType?: string; // MIME type
}

/**
 * Step 4 DTO - Document upload completion
 * Expects: Files already uploaded to S3, this validates and saves metadata
 * SOLID: Interface Segregation - focused on document registration
 */
export class RegisterStep4Dto {
  @IsString()
  @IsOptional()
  documentCategory?: string; // Document category from form (optional - category is per file)
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentFileDto)
  files?: DocumentFileDto[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string; // Shared notes for all documents
}
