import { Module } from '@nestjs/common';

import { ConsultationModule } from '../../consultation/consultation.module';
import { PatientConsultationController } from './patient-consultation.controller';

@Module({
  imports: [ConsultationModule],
  controllers: [PatientConsultationController],
})
export class PatientConsultationModule {}
