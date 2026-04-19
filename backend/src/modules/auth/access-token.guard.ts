import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { eq } from 'drizzle-orm';
import { AuthJwtService, type TokenPayload } from './jwt';
import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import { user } from '../../database/schema';

type AuthenticatedRequest = Request & {
  user?: TokenPayload;
  headers: {
    authorization?: string;
  };
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly authJwtService: AuthJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const payload = await this.authJwtService.verifyAccessToken(token);
    const userRecord = await this.db.query.user.findFirst({
      where: eq(user.id, payload.sub),
    });

    if (!userRecord || !userRecord.isActive) {
      throw new UnauthorizedException(
        'Your registration session is no longer valid. Please start again.',
      );
    }

    request.user = payload;
    return true;
  }
}
