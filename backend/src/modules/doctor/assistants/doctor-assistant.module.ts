import { Module } from '@nestjs/common';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { MailModule } from '../../../shared/mail/mail.module';
import { MinioModule } from '../../../shared/storage/minio.module';
import { DoctorAssistantController } from './doctor-assistant.controller';
import { DoctorAssistantService } from './doctor-assistant.service';

@Module({
  imports: [DoctorVerifierModule, MailModule, MinioModule],
  controllers: [DoctorAssistantController],
  providers: [DoctorAssistantService],
})
export class DoctorAssistantModule {}
