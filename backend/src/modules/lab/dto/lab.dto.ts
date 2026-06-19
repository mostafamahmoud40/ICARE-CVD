import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum LabOrderPriority {
  Routine = 'routine',
  Urgent = 'urgent',
  Stat = 'stat',
}

export enum LabOrderStatus {
  Draft = 'draft',
  Ordered = 'ordered',
  Collected = 'collected',
  Resulted = 'resulted',
  Cancelled = 'cancelled',
}

export enum LabResultStatus {
  Normal = 'normal',
  High = 'high',
  Low = 'low',
  Critical = 'critical',
}

export class CreateLabOrderItemDto {
  @IsString()
  @MaxLength(200)
  testName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  loincCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  panel?: string;
}

export class CreateLabOrderDto {
  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  items!: CreateLabOrderItemDto[];
}

export class UpdateLabOrderDto {
  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority;

  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateLabResultDto {
  @IsOptional()
  @IsUUID()
  labOrderItemId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsString()
  @MaxLength(200)
  testName!: string;

  @IsString()
  @MaxLength(100)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referenceRange?: string;

  @IsOptional()
  @IsEnum(LabResultStatus)
  status?: LabResultStatus;
}

export class ImportLabReportPanelDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  panelTitle?: string;

  @IsObject()
  analysis!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  orderedBy?: string;
}
