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

export class UpdateDoctorAccountDto {
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
  specialty!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  clinicName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  clinicLocation!: string;

  @IsString()
  @MaxLength(600)
  about!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsInt()
  @Min(0)
  @Max(100_000)
  clinicConsultationFee!: number;

  @IsInt()
  @Min(0)
  @Max(100_000)
  onlineConsultationFee!: number;
}
