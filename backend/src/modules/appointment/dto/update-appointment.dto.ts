import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

  @IsOptional()
  @IsIn(['clinic', 'virtual'])
  visitType?: 'clinic' | 'virtual';

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;
}
