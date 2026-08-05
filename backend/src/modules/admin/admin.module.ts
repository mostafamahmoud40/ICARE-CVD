import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { AuthJwtService } from '../auth/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, AuthJwtService, AccessTokenGuard],
})
export class AdminModule {}
