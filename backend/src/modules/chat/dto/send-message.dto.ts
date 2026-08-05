import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatAttachmentInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  sizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  s3Key!: string;

  @IsIn(['image', 'file'])
  attachmentType!: 'image' | 'file';
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  message?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentInputDto)
  attachments?: ChatAttachmentInputDto[];
}

export class ChatUploadIntentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contentType!: string;

  @IsIn(['image', 'file'])
  attachmentType!: 'image' | 'file';
}
