import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { S3Module } from '../../shared/storage/s3.module';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { DoctorDocumentService } from './doctor-documents.service';
import { DoctorDocumentsController } from './doctor-documents.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    S3Module,
    DoctorVerifierModule,
  ],
  controllers: [DoctorDocumentsController],
  providers: [
    DoctorDocumentService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class DocumentsModule {}
