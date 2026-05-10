import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAssistantAppointmentDto {
  @IsUUID()
  patientId!: string;

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
}

export class UpdateAppointmentStatusDto {
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
  status!: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

/** Partial update for reschedule, clinician/visit edits, reason, and assistant notes. */
export class PatchAssistantAppointmentDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsIn(['clinic', 'virtual'])
  visitType?: 'clinic' | 'virtual';

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
