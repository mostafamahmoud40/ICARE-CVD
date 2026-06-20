import { IsString, MinLength } from 'class-validator';

export class ResetPasswordWithTokenDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(8)
  password: string;
}
