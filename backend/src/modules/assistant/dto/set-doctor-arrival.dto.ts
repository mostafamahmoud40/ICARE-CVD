import { IsOptional, IsString, Matches } from 'class-validator';

export class SetDoctorArrivalDto {
  @IsString()
  weekday!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'arrivalTime must be HH:mm' })
  arrivalTime?: string | null;
}
