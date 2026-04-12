import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { S3Module } from './shared/storage/s3.module';

@Module({
  imports: [DrizzleModule, AuthModule, AdminModule, AssistantModule, S3Module],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
