import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AttachmentDto {
  @IsUUID()
  documentId!: string;

  @IsString()
  @MaxLength(100)
  category!: string;
}

export class CreateAppointmentDto {
  @IsUUID()
  doctorId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsIn(['clinic', 'virtual'])
  visitType!: 'clinic' | 'virtual';

  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  symptoms?: string;

  @IsOptional()
  @IsArray()
  attachments?: AttachmentDto[];
}
