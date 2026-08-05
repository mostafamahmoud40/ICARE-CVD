import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export type QueueStatus =
  | 'scheduled'
  | 'arrived'
  | 'waiting'
  | 'in-consultation'
  | 'report-pending'
  | 'completed'
  | 'no-show'
  | 'cancelled';

export type QueuePriority = 'normal' | 'urgent' | 'emergency';

export type QueueFilter = 'active' | 'scheduled' | 'completed' | 'no-show';

export class AddToQueueDto {
  @IsUUID()
  appointmentId!: string;

  @IsOptional()
  @IsIn(['normal', 'urgent', 'emergency'])
  priority?: QueuePriority;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  estimatedDurationMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;
}

export class UpdateQueueStatusDto {
  @IsIn([
    'scheduled',
    'arrived',
    'waiting',
    'in-consultation',
    'report-pending',
    'completed',
    'no-show',
    'cancelled',
  ])
  status!: QueueStatus;
}

export class UpdateQueueEntryDto {
  @IsOptional()
  @IsIn(['normal', 'urgent', 'emergency'])
  priority?: QueuePriority;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;

  @IsOptional()
  @IsInt()
  estimatedDurationMin?: number;
}
