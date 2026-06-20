import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePatientAllergyDto {
  @IsEnum({ drug: 'drug', food: 'food', other: 'other' })
  category!: 'drug' | 'food' | 'other';

  @IsString()
  @MaxLength(150)
  allergen!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reaction?: string;
}
