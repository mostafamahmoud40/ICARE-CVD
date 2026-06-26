import { Module } from '@nestjs/common';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AssistantProcedureController,
  DoctorProcedureController,
} from './assistant-procedure.controller';
import { ProcedureService } from './procedure.service';

@Module({
  imports: [MinioModule, NotificationsModule],
  controllers: [AssistantProcedureController, DoctorProcedureController],
  providers: [ProcedureService],
  exports: [ProcedureService],
})
export class ProcedureModule {}
