import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppointmentModule } from '../appointment/appointment.module';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';

import { AssistantController } from './assistant.controller';
import { AssistantGuard } from './assistant.guard';
import { AssistantService } from './assistant.service';
import { AssistantAppointmentController } from './assistant-appointment.controller';
import { AssistantAppointmentService } from './assistant-appointment.service';
import { AssistantPatientQueueController } from './assistant-patient-queue.controller';
import { AssistantPatientQueueService } from './assistant-patient-queue.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    AppointmentModule,
  ],
  controllers: [
    AssistantController,
    AssistantAppointmentController,
    AssistantPatientQueueController,
  ],
  providers: [
    AssistantService,
    AssistantAppointmentService,
    AssistantPatientQueueService,
    AssistantGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class AssistantModule {}
