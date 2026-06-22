import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { AssistantGuard } from '../assistant/assistant.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AssistantProcedureController,
  DoctorProcedureController,
} from './assistant-procedure.controller';
import { ProcedureService } from './procedure.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
    NotificationsModule,
  ],
  controllers: [AssistantProcedureController, DoctorProcedureController],
  providers: [
    ProcedureService,
    AssistantGuard,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
  exports: [ProcedureService],
})
export class ProcedureModule {}
