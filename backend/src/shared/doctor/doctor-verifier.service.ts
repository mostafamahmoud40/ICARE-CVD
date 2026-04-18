import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { doctor } from '../../database/schema';

@Injectable()
export class DoctorVerifierService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async verify(userId: number) {
    const row = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!row) throw new NotFoundException('Doctor profile not found');
    return row;
  }
}
