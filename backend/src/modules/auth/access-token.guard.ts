import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthJwtService, type TokenPayload } from './jwt';

type AuthenticatedRequest = Request & {
  user?: TokenPayload;
  headers: {
    authorization?: string;
  };
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authJwtService: AuthJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    request.user = await this.authJwtService.verifyAccessToken(token);
    return true;
  }
}
