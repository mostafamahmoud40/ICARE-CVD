import { Inject, Injectable, OnModuleDestroy, Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/** Inject with `@Inject(DRIZZLE) db: Database` */
export const DRIZZLE = Symbol('DRIZZLE');

export const PG_POOL = Symbol('PG_POOL');

export type Database = NodePgDatabase<typeof schema>;

export const poolProvider: Provider = {
  provide: PG_POOL,
  useFactory: (): Pool =>
    new Pool({ connectionString: process.env.DATABASE_URL }),
};

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [PG_POOL],
  useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
};

@Injectable()
export class PoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
