import { IsString, MaxLength, MinLength } from 'class-validator';

export class PersistRegistrationSummaryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32000)
  analysis!: string;
}
