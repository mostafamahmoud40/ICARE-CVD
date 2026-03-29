import { Global, Module } from '@nestjs/common';
import {
  DRIZZLE,
  drizzleProvider,
  poolProvider,
  PoolLifecycle,
} from './drizzle.provider';

@Global()
@Module({
  providers: [poolProvider, drizzleProvider, PoolLifecycle],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
