import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ConsultationVisitType {
  FollowUp = 'follow-up',
  New = 'new',
  WalkIn = 'walk-in',
  PostProcedure = 'post-procedure',
  Urgent = 'urgent',
}

export enum ConsultationStatus {
  InProgress = 'in-progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum ReferralUrgency {
  Routine = 'routine',
  Urgent = 'urgent',
}

export enum ReferralStatus {
  Pending = 'pending',
  Scheduled = 'scheduled',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export class CreateConsultationDto {
  @IsEnum(ConsultationVisitType)
  visitType!: ConsultationVisitType;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsString()
  physicalExam?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  followUpTimeframe?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes?: number;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsString()
  physicalExam?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  followUpTimeframe?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}

export class LinkDiagnosisDto {
  @IsUUID()
  diagnosisId!: string;

  @IsEnum({
    primary: 'primary',
    secondary: 'secondary',
    differential: 'differential',
  })
  type!: 'primary' | 'secondary' | 'differential';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LinkPrescriptionDto {
  @IsUUID()
  medicationId!: string;

  @IsOptional()
  isNew?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReferralDto {
  @IsString()
  @MaxLength(120)
  specialty!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsEnum(ReferralUrgency)
  urgency?: ReferralUrgency;

  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;
}
