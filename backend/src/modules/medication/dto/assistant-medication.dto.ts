import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMedicationFlagDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  medicationId!: string;

  @IsEnum({ info: 'info', watch: 'watch', critical: 'critical' })
  severity!: 'info' | 'watch' | 'critical';

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ResolveMedicationFlagDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNote?: string;
}

export class UpdateMedicationInstructionsDto {
  @IsString()
  @MaxLength(1000)
  instructions!: string;
}

export class CreateMedicationContactDto {
  @IsUUID()
  patientId!: string;

  @IsEnum({ sms: 'sms', push: 'push', call: 'call' })
  channel!: 'sms' | 'push' | 'call';

  @IsString()
  @MaxLength(200)
  summary!: string;

  @IsString()
  @MaxLength(500)
  messagePreview!: string;
}

export class CreateMedicationEscalationDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  medicationId?: string | null;

  @IsEnum({ routine: 'routine', urgent: 'urgent', critical: 'critical' })
  priority!: 'routine' | 'urgent' | 'critical';

  @IsString()
  @MaxLength(200)
  reason!: string;

  @IsString()
  @MaxLength(1000)
  note!: string;
}

export class DismissMedicationInsightDto {
  @IsUUID()
  patientId!: string;
}
