import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patientDocument, patient, doctor } from '../../database/schema';
import { S3Service } from '../../shared/storage/s3.service';
import type { CreateDocumentDto } from './dto/documents.dto';

@Injectable()
export class DoctorDocumentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly s3Service: S3Service,
  ) {}

  async listDocuments(doctorUserId: number, patientId: string) {
    await this.verifyDoctor(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.patientDocument.findMany({
      where: eq(patientDocument.patientId, patientId),
      orderBy: desc(patientDocument.createdAt),
    });
  }

  async createDocument(
    doctorUserId: number,
    patientId: string,
    dto: CreateDocumentDto,
  ) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    let s3Key: string | undefined = dto.s3Key;
    if (!s3Key) {
      const intent = await this.s3Service.createUploadIntent({
        category: dto.category as never,
        fileName: dto.fileName,
        contentType: dto.contentType,
      });
      s3Key = intent.key;
    }

    const [doc] = await this.db
      .insert(patientDocument)
      .values({
        userId: patientRow.userId,
        patientId,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.fileSize,
        category: dto.category,
        title: dto.title,
        uploadedByUserId: doctorRow.userId,
        s3Key,
      })
      .returning();

    return doc;
  }

  async deleteDocument(doctorUserId: number, documentId: string) {
    await this.verifyDoctor(doctorUserId);

    const doc = await this.db.query.patientDocument.findFirst({
      where: eq(patientDocument.id, documentId),
    });
    if (!doc) throw new NotFoundException('Document not found');

    await this.s3Service.deleteObject({ key: doc.s3Key });
    await this.db
      .delete(patientDocument)
      .where(eq(patientDocument.id, documentId));

    return { success: true };
  }

  private async verifyDoctor(userId: number) {
    const row = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!row) throw new NotFoundException('Doctor profile not found');
    return row;
  }
}
