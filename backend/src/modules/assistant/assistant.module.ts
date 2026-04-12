import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';

import { AssistantController } from './assistant.controller';
import { AssistantGuard } from './assistant.guard';
import { AssistantService } from './assistant.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class AssistantModule {}
