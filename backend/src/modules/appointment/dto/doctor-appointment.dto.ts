import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDoctorAppointmentDto {
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  reason?: string;
}
