import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum StaffRole {
  Doctor = 'doctor',
  Assistant = 'assistant',
}

/** Which appointment visit types a doctor accepts. */
export enum DoctorAcceptedVisitModes {
  Clinic = 'clinic',
  Virtual = 'virtual',
  Both = 'both',
}

export class AddStaffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsString()
  @IsNotEmpty()
  avatarUrl!: string;

  @IsEnum(StaffRole)
  role!: StaffRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialty?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  /** Required when role is doctor; ignored for assistants. */
  @IsOptional()
  @IsEnum(DoctorAcceptedVisitModes)
  acceptedVisitModes?: DoctorAcceptedVisitModes;
}
