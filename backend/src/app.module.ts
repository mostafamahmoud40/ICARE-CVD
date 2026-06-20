import { Module } from '@nestjs/common';

import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { DoctorScheduleModule } from './modules/doctor/schedule/doctor-schedule.module';
import { DoctorQueueModule } from './modules/doctor/queue/doctor-queue.module';
import { S3Module } from './shared/storage/s3.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ChatModule } from './modules/chat/chat.module';
import { MedicationModule } from './modules/medication/medication.module';
import { AiModule } from './modules/ai/ai.module';
import { DoctorPatientModule } from './modules/doctor/patients/doctor-patient.module';
import { DoctorAssistantModule } from './modules/doctor/assistants/doctor-assistant.module';
import { DoctorAccountModule } from './modules/doctor/account/doctor-account.module';
import { VitalsModule } from './modules/vitals/vitals.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LabModule } from './modules/lab/lab.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { PatientQueueModule } from './modules/patient/queue/patient-queue.module';
import { PatientConsultationModule } from './modules/patient/consultations/patient-consultation.module';
import { PatientAccountModule } from './modules/patient/account/patient-account.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    AdminModule,
    AssistantModule,
    DoctorScheduleModule,
    DoctorQueueModule,
    S3Module,
    AppointmentModule,
    ChatModule,
    MedicationModule,
    AiModule,
    DoctorPatientModule,
    DoctorAssistantModule,
    DoctorAccountModule,
    VitalsModule,
    DiagnosisModule,
    DocumentsModule,
    LabModule,
    ConsultationModule,
    PatientQueueModule,
    PatientConsultationModule,
    PatientAccountModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
