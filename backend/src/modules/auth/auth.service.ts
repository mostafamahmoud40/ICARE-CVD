import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthJwtService } from './jwt';
import { hashPassword } from './password';
import { RegisterDto } from './dto/register.dto';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { user } from '../../database/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly authJwtService: AuthJwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.db.query.user.findFirst({
      where: eq(user.email, dto.email.toLowerCase().trim()),
    });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const inserted = await this.db
      .insert(user)
      .values({
        name: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phoneNumber.trim(),
        password: passwordHash,
        role: 'patient',
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

    const createdUser = inserted[0];
    if (!createdUser) {
      throw new UnauthorizedException('Failed to create user');
    }

    const payload = {
      sub: createdUser.id,
      role: createdUser.role,
      email: createdUser.email,
    };

    const accessToken = await this.authJwtService.signAccessToken(payload);
    const refreshToken = await this.authJwtService.signRefreshToken(payload);
    const refreshTokenHash = await hashPassword(refreshToken);

    await this.db
      .update(user)
      .set({
        refreshTokenHash,
        refreshTokenExpiresAt: new Date(
          Date.now() +
            this.parseDurationMs(process.env.JWT_REFRESH_TTL ?? '7d'),
        ),
      })
      .where(eq(user.id, createdUser.id));

    return {
      accessToken,
      refreshToken,
      user: createdUser,
    };
  }

  private parseDurationMs(input: string): number {
    const m = input.match(/^(\d+)([smhd])$/);
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(m[1]);
    const unit = m[2];
    const factor =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
    return amount * factor;
  }
}
