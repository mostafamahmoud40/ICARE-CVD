import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { RegisterStep2Dto } from './dto/register-step-2.dto';
import type { TokenPayload } from './jwt';
import { RegisterStep3Dto } from './dto/register-step-3.dto';
import { RegisterStep4Dto } from './dto/register-step-4.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './access-token.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
