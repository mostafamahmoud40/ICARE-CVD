import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
