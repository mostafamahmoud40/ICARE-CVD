import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const SHIFT_STATUSES = ['active', 'half-day', 'holiday'] as const;

export class AssistantWeeklyShiftDayDto {
  @IsString()
  @IsIn(WEEKDAYS)
  weekday!: (typeof WEEKDAYS)[number];

  @IsString()
  @IsIn(SHIFT_STATUSES)
  status!: (typeof SHIFT_STATUSES)[number];

  @ValidateIf((row: AssistantWeeklyShiftDayDto) => row.status !== 'holiday')
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string | null;

  @ValidateIf((row: AssistantWeeklyShiftDayDto) => row.status !== 'holiday')
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class UpdateDoctorAssistantShiftsDto {
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => AssistantWeeklyShiftDayDto)
  days!: AssistantWeeklyShiftDayDto[];
}
