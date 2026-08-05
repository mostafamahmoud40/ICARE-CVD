import { IsString, MaxLength } from 'class-validator';

export class PatientAvatarUploadIntentDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(100)
  contentType!: string;
}

export class SetPatientAvatarDto {
  @IsString()
  @MaxLength(500)
  s3Key!: string;
}
