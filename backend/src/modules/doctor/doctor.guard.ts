import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import type { TokenPayload } from '../auth/jwt';

type AuthenticatedRequest = Request & {
  user?: TokenPayload;
};

@Injectable()
export class DoctorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new ForbiddenException('Access denied');
    }

    if (request.user.role !== 'doctor') {
      throw new ForbiddenException('Doctor access required');
    }

    return true;
  }
}
