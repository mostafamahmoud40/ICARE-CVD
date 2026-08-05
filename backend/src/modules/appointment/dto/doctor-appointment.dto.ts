import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDoctorAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  patientId!: string;

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
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateDoctorAppointmentDto {
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  reason?: string;
}
