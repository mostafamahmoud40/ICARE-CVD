import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { DocumentsController } from './documents.controller';
import { AuthService } from './auth.service';
import { AuthJwtService } from './jwt';
import { DocumentService } from './document.service';
import { MailModule } from '../../shared/mail/mail.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { AccessTokenGuard } from './access-token.guard';

@Module({
  imports: [
    MailModule,
    MinioModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [AuthController, DocumentsController],
  providers: [AuthService, AuthJwtService, DocumentService, AccessTokenGuard],
})
export class AuthModule {}
