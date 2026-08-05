import { IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
