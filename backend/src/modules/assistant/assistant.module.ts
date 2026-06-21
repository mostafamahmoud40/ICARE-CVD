import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppointmentModule } from '../appointment/appointment.module';
import { DoctorScheduleModule } from '../doctor/schedule/doctor-schedule.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { MailModule } from '../../shared/mail/mail.module';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';

import { AssistantController } from './assistant.controller';
import { AssistantGuard } from './assistant.guard';
import { AssistantService } from './assistant.service';
import { AssistantPatientRecordService } from './assistant-patient-record.service';
import { AssistantAppointmentController } from './assistant-appointment.controller';
import { AssistantAppointmentService } from './assistant-appointment.service';
import { AssistantPatientQueueController } from './assistant-patient-queue.controller';
import { AssistantPatientQueueService } from './assistant-patient-queue.service';
import { AssistantDoctorScheduleController } from './assistant-doctor-schedule.controller';
import { AssistantDoctorScheduleService } from './assistant-doctor-schedule.service';
import { AssistantDoctorsService } from './assistant-doctors.service';
import { AssistantAccountController } from './account/assistant-account.controller';
import { AssistantAccountService } from './account/assistant-account.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    AppointmentModule,
    DoctorScheduleModule,
    MinioModule,
    MailModule,
  ],
  controllers: [
    AssistantController,
    AssistantAppointmentController,
    AssistantPatientQueueController,
    AssistantDoctorScheduleController,
    AssistantAccountController,
  ],
  providers: [
    AssistantService,
    AssistantPatientRecordService,
    AssistantAppointmentService,
    AssistantPatientQueueService,
    AssistantDoctorScheduleService,
    AssistantDoctorsService,
    AssistantAccountService,
    AssistantGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class AssistantModule {}
