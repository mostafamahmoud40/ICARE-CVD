import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAssistantAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department!: string;

  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
