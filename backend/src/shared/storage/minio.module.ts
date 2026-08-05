import { Module } from '@nestjs/common';
import { AvatarUrlResolver } from './avatar-url.resolver';
import { MinioService } from './minio.service';

@Module({
  providers: [MinioService, AvatarUrlResolver],
  exports: [MinioService, AvatarUrlResolver],
})
export class MinioModule {}
