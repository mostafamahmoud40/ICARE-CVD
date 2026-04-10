import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type TokenPayload = {
  sub: number;
  role: string;
  email: string;
};

export type { TokenPayload };

@Injectable()
export class AuthJwtService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
    });
  }

  async signRefreshToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as never,
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token);
  }
}
