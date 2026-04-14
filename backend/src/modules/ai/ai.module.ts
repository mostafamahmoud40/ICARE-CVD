import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [AiController],
  providers: [AiService, PatientGuard, AuthJwtService, AccessTokenGuard],
})
export class AiModule {}
