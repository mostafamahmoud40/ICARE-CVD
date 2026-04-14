import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { DoctorScheduleModule } from './modules/doctor/schedule/doctor-schedule.module';
import { S3Module } from './shared/storage/s3.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ChatModule } from './modules/chat/chat.module';
import { MedicationModule } from './modules/medication/medication.module';

@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    AdminModule,
    AssistantModule,
    DoctorScheduleModule,
    S3Module,
    AppointmentModule,
    ChatModule,
    MedicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
