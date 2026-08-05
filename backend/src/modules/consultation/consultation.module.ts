import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationXrayService } from './consultation-xray.service';
import { ConsultationEchoService } from './consultation-echo.service';
import { ConsultationEcgService } from './consultation-ecg.service';
import { ConsultationCineMriService } from './consultation-cine-mri.service';
import { ConsultationCtService } from './consultation-ct.service';
import { ConsultationEcgClsService } from './consultation-ecg-cls.service';
import { DoctorConsultationController } from './doctor-consultation.controller';
import { DoctorConsultationXrayController } from './doctor-consultation-xray.controller';
import { DoctorConsultationEchoController } from './doctor-consultation-echo.controller';
import { DoctorConsultationEcgController } from './doctor-consultation-ecg.controller';
import { DoctorConsultationCineMriController } from './doctor-consultation-cine-mri.controller';
import { DoctorConsultationCtController } from './doctor-consultation-ct.controller';
import { DoctorConsultationEcgClsController } from './doctor-consultation-ecg-cls.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProcedureModule } from '../procedure/procedure.module';

@Module({
  imports: [
    DoctorVerifierModule,
    MinioModule,
    NotificationsModule,
    ProcedureModule,
  ],
  controllers: [
    DoctorConsultationController,
    DoctorConsultationXrayController,
    DoctorConsultationEchoController,
    DoctorConsultationEcgController,
    DoctorConsultationCineMriController,
    DoctorConsultationCtController,
    DoctorConsultationEcgClsController,
  ],
  providers: [
    ConsultationService,
    ConsultationXrayService,
    ConsultationEchoService,
    ConsultationEcgService,
    ConsultationCineMriService,
    ConsultationCtService,
    ConsultationEcgClsService,
  ],
  exports: [ConsultationService],
})
export class ConsultationModule {}
