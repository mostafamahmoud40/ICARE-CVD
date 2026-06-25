import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DocumentsController } from './documents.controller';
import { AuthService } from './auth.service';
import { DocumentService } from './document.service';
import { MailModule } from '../../shared/mail/mail.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { AuthCoreModule } from './auth-core.module';

@Module({
  imports: [AuthCoreModule, MailModule, MinioModule],
  controllers: [AuthController, DocumentsController],
  providers: [AuthService, DocumentService],
  exports: [AuthService],
})
export class AuthModule {}
