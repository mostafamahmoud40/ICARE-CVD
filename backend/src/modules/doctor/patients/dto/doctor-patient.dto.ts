import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignPatientDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  isPrimary?: boolean;
}
