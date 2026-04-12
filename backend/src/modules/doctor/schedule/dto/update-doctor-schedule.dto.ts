import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TimeBlockDto {
  @IsString()
  id!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class DayAvailabilityDto {
  @IsString()
  weekday!: string;

  @IsString()
  label!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  periods!: TimeBlockDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  unavailableBlocks!: TimeBlockDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxAppointmentsPerDay?: number | null;
}

export class UpdateDoctorScheduleDto {
  @IsNumber()
  @Min(10)
  @Max(120)
  slotDurationMinutes!: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  bufferBetweenSlotsMinutes!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAvailabilityDto)
  days!: DayAvailabilityDto[];
}
