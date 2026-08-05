import { customType } from 'drizzle-orm/pg-core';

/** Pass the PostgreSQL column name (e.g. snake_case) as the second call: `vector(384)('notes_embedding')`. */
export const vector = (dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(',')}]`;
    },
    fromDriver(value: string) {
      return value.slice(1, -1).split(',').map(Number);
    },
  });
