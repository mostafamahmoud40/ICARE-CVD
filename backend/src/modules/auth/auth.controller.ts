import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { RegisterStep2Dto } from './dto/register-step-2.dto';
import type { TokenPayload } from './jwt';
import { RegisterStep3Dto } from './dto/register-step-3.dto';
import { RegisterStep4Dto } from './dto/register-step-4.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { ResendRegistrationOtpDto } from './dto/resend-registration-otp.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { AccessTokenGuard } from './access-token.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() currentUser: TokenPayload) {
    return this.authService.getMe(currentUser.sub);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register/step-2')
  @UseGuards(AccessTokenGuard)
  registerStep2(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: RegisterStep2Dto,
  ) {
    return this.authService.registerStep2(currentUser.sub, dto);
  }

  @Post('register/step-3')
  @UseGuards(AccessTokenGuard)
  registerStep3(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: RegisterStep3Dto,
  ) {
    return this.authService.registerStep3(currentUser.sub, dto);
  }

  @Post('register/step-4')
  @UseGuards(AccessTokenGuard)
  registerStep4(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: RegisterStep4Dto,
  ) {
    return this.authService.registerStep4(currentUser.sub, dto);
  }

  @Post('verify-registration-otp')
  verifyRegistrationOtp(@Body() dto: VerifyRegistrationOtpDto) {
    return this.authService.verifyRegistrationOtp(dto);
  }

  @Post('resend-registration-otp')
  resendRegistrationOtp(@Body() dto: ResendRegistrationOtpDto) {
    return this.authService.resendRegistrationOtp(dto);
  }

  // ─── Password Reset via OTP ───────────────────────────────────────────────

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password-with-token')
  resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    return this.authService.resetPasswordWithToken(dto);
  }
}
