import { Body, Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { RegisterStep2Dto } from './dto/register-step-2.dto';
import { AuthJwtService } from './jwt';
import { RegisterStep3Dto } from './dto/register-step-3.dto';
import { RegisterStep4Dto } from './dto/register-step-4.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authJwtService: AuthJwtService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/step-2')
  async registerStep2(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RegisterStep2Dto,
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const payload = await this.authJwtService.verifyAccessToken(token);
    return this.authService.registerStep2(payload.sub, dto);
  }

  @Post('register/step-3')
  async registerStep3(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RegisterStep3Dto,
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const payload = await this.authJwtService.verifyAccessToken(token);
    return this.authService.registerStep3(payload.sub, dto);
  }

  @Post('register/step-4')
  async registerStep4(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: RegisterStep4Dto,
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const payload = await this.authJwtService.verifyAccessToken(token);
    return this.authService.registerStep4(payload.sub, dto);
  }
}
