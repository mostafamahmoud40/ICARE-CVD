import { Module } from '@nestjs/common';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { DoctorAssistantController } from './doctor-assistant.controller';
import { DoctorAssistantService } from './doctor-assistant.service';

@Module({
  imports: [DoctorVerifierModule],
  controllers: [DoctorAssistantController],
  providers: [DoctorAssistantService],
})
export class DoctorAssistantModule {}
