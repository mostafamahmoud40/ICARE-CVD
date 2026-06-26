import { Module } from '@nestjs/common';
import { MinioModule } from '../../shared/storage/minio.module';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { DoctorDocumentService } from './doctor-documents.service';
import { DoctorDocumentsController } from './doctor-documents.controller';

@Module({
  imports: [MinioModule, DoctorVerifierModule],
  controllers: [DoctorDocumentsController],
  providers: [DoctorDocumentService],
})
export class DocumentsModule {}
