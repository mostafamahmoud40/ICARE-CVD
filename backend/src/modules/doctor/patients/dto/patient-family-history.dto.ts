import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePatientFamilyHistoryDto {
  @IsString()
  @MaxLength(50)
  relationship!: string;

  @IsString()
  @MaxLength(150)
  condition!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
